//#region imports
import React, { useState, useEffect, useRef, useMemo } from "react";
import {
    Box,
    Tooltip,
    IconButton,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    Flex,
    HStack,
    VStack,
    Text,
    Textarea,
    Spinner,
    Image,
    Icon,
    Link,
    Popover,
    PopoverTrigger,
    PopoverContent,
    Button,
    useDisclosure,
    PopoverArrow,
    useToast,
} from "@chakra-ui/react";
import useWindowDimensions from "@/components/useWindowDimensions";
import i18n from "@/i18n/Localization";
import db from "@/components/Firebase";
import axios from "axios";
import { getDayAndMonth, datesAreOnSameDay, log, isConnected, getSetId } from "@/components/Helpers";
import { collection, onSnapshot, query, where, orderBy, limit, Timestamp, documentId, doc } from "firebase/firestore";
import { CirclePicture, MetaData, NewSessionButton, AutoResizeTextarea } from "@/components/CircleElements";
import { HiOutlineEmojiHappy } from "react-icons/hi";
import { IoMdSend } from "react-icons/io";
import { AiOutlineUser } from "react-icons/ai";
import { BsReplyFill, BsFillCircleFill, BsGlobeAmericas } from "react-icons/bs";
import { useNavigate } from "react-router-dom";
import { MdDelete, MdModeEdit, MdOutlineClose } from "react-icons/md";
import { RiChatPrivateLine } from "react-icons/ri";
import { Scrollbars } from "react-custom-scrollbars-2";
import EmojiPicker from "@/components/EmojiPicker";
import { useAtom } from "jotai";
import {
    isMobileAtom,
    userAtom,
    userDataAtom,
    circleAtom,
    chatCircleAtom,
    circlesFilterAtom,
    toggleWidgetEventAtom,
    circlesAtom,
    signInStatusAtom,
    mentionedCirclesAtom,
} from "@/components/Atoms";
import Lottie from "react-lottie";
import talkdotsAnimation from "@/assets/lottie/talkdots.json";
import { AboutButton, CircleLink, CircleRichText } from "@/components/CircleElements";
import ReactMarkdown from "react-markdown";
import Linkify from "linkify-it";
import { CircleMention } from "@/components/CircleSearch";

const linkify = new Linkify();
linkify.tlds("earth", true);
//#endregion

const linkifyMarkdown = (input) => {
    const matches = linkify.match(input);

    if (!matches) return input;

    let offset = 0;
    let result = "";

    for (const match of matches) {
        // Check if the match is already part of a markdown link
        const precedingText = input.slice(Math.max(0, match.index - 50), match.index); // arbitrary lookbehind, adjust as necessary
        const followingText = input.slice(match.lastIndex, Math.min(input.length, match.lastIndex + 50)); // arbitrary lookahead, adjust as necessary
        const markdownPattern = new RegExp(`\\[[^\\]]+?\\]\\(${match.url}\\)`);

        if (markdownPattern.test(precedingText + match.url + followingText)) {
            // Already part of a markdown link, just append it as-is
            result += input.slice(offset, match.lastIndex);
        } else {
            // Append text before the match
            result += input.slice(offset, match.index);

            // Convert match to markdown format
            const displayUrl =
                match.url.startsWith("http://") || match.url.startsWith("https://")
                    ? match.url.split("://")[1]
                    : match.url;
            result += `[${displayUrl}](${match.url})`;
        }

        // Update the offset
        offset = match.lastIndex;
    }

    // Append any remaining text after the last match
    result += input.slice(offset);

    return result;
};

// gets target circle if relation-set
const getRelevantCircle = (user, circle) => {
    if (!circle) return null;
    if (circle?.type === "set") {
        return circle[circle.circle_ids[0]].id === user?.id
            ? circle[circle.circle_ids[1]]
            : circle[circle.circle_ids[0]];
    } else {
        return circle;
    }
};

export const CircleChatWidget = () => {
    const [circle] = useAtom(circleAtom);
    const [user] = useAtom(userAtom);
    const [signInStatus] = useAtom(signInStatusAtom);
    const [chatCircle, setChatCircle] = useState(null);
    const [chatCircles, setChatCircles] = useState([]);

    useEffect(() => {
        log("CircleChat.useEffect1", -1);
        if (chatCircle) {
            if (!chatCircles.find((x) => x.id === chatCircle.id)) {
                setChatCircle(circle);
            }
        } else if (chatCircle === null && circle) {
            log("Chat circle set to: " + JSON.stringify(circle, null, 2), 0, true);

            setChatCircle(circle);
        }
    }, [circle?.id, chatCircle, chatCircles]); // we only want to set chatCircle once when circle id changes hence warning

    useEffect(() => {
        log("CircleChat.useEffect2", -1);
        if (!user?.id || !signInStatus.signedIn) {
            return;
        }

        // if circle has more chat circles, fetch them
        if (circle?.chat_circle_ids?.length > 0) {
            // initiate relation-sets with chat circles
            axios
                .post(`/circles/init_sets`, {
                    circle_ids: circle.chat_circle_ids,
                })
                .catch((err) => {
                    console.error(err);
                });

            // get relation-set ids
            let relationSetIds = circle.chat_circle_ids.map((id) => getSetId(user.id, id));

            // subscribe to chat circles
            const chatCirclesQuery = query(collection(db, "circles"), where(documentId(), "in", relationSetIds));
            const unsubscribeGetChatCircles = onSnapshot(chatCirclesQuery, (snap) => {
                const circles = snap.docs.map((doc) => {
                    return {
                        id: doc.id,
                        ...doc.data(),
                    };
                });
                //log(JSON.stringify(circles, null, 2), 0, true);
                // set default chat circle if specified
                setChatCircles(circles);
                if (circle?.default_chat_id) {
                    let defaultSetId = getSetId(user.id, circle.default_chat_id);
                    setChatCircle(circles.find((x) => x.id === defaultSetId));
                }
            });

            return () => {
                if (unsubscribeGetChatCircles) {
                    unsubscribeGetChatCircles();
                    setChatCircles([]);
                    setChatCircle(null);
                }
            };
        } else {
            setChatCircles([]);
        }
    }, [user?.id, user?.show_ai, signInStatus.signedIn, circle?.id]); // we only want to set chatCircle once when circle id changes hence warning

    if (!circle?.id) return null;

    return (
        <Flex
            flexGrow="1"
            width="100%"
            height="100%"
            position="relative"
            overflow="hidden"
            pointerEvents="auto"
            flexDirection="column"
        >
            {/* top menu to switch between AI chat and member chat */}
            {chatCircles.length > 0 && (
                <Box pl={2} pointerEvents="auto" zIndex="10" marginBottom="5px">
                    <Tooltip label={`Chat with ${circle?.name} members`} aria-label="A tooltip">
                        <IconButton
                            aria-label="Members Chat"
                            icon={<CirclePicture circle={circle} size={35} disableClick={true} />}
                            isRound
                            ml={2}
                            colorScheme="transparent"
                            overflow="hidden"
                            borderWidth="2px"
                            borderColor={chatCircle?.id === circle?.id ? "#d6d4d6" : "transparent"}
                            onClick={() => setChatCircle(circle)}
                            size="35px"
                        />
                    </Tooltip>
                    {chatCircles.map((item) => (
                        <Tooltip
                            key={item.id}
                            label={`Chat with ${getRelevantCircle(user, item)?.name}`}
                            aria-label="A tooltip"
                        >
                            <IconButton
                                icon={
                                    <CirclePicture
                                        circle={getRelevantCircle(user, item)}
                                        size={35}
                                        disableClick={true}
                                    />
                                }
                                isRound
                                colorScheme="transparent"
                                borderWidth="2px"
                                overflow="hidden"
                                borderColor={chatCircle?.id === item?.id ? "#d6d4d6" : "transparent"}
                                onClick={() => setChatCircle(item)}
                                size="35px"
                                marginLeft="5px"
                            />
                        </Tooltip>
                    ))}
                </Box>
            )}

            <CircleChat circle={chatCircle} />
        </Flex>
    );
};

const ChatMessages = ({ messages, onRenderComplete, replyChatMessage, deleteChatMessage, editChatMessage }) => {
    const [isMobile] = useAtom(isMobileAtom);
    const { windowWidth, windowHeight } = useWindowDimensions();
    const [user] = useAtom(userAtom);
    const popoverBg = "#3f47796b";
    const iconColor = "#fdfdfd";

    useEffect(() => {
        log("ChatMessages.useEffect 1", -1, true);
        if (onRenderComplete) {
            onRenderComplete();
        }
    }, [messages]); //adding onRenderComplete causes this to render unnecessarily hence warning

    return (
        <>
            {messages?.map((item) => (
                <Box key={item.id} alignSelf={item.type === "date" ? "center" : "auto"}>
                    {item.type === "date" && (
                        <Box backgroundColor="#3c3d42" borderRadius="20px" marginTop="10px">
                            <Text marginLeft="10px" marginRight="10px" fontSize="14px" color="#ffffff">
                                {item.date}
                            </Text>
                        </Box>
                    )}

                    {item.type === "message" && (
                        <Flex
                            flexDirection="row"
                            align="end"
                            borderRadius="50px"
                            role="group"
                            color="black"
                            spacing="12px"
                            bg="transparent"
                            marginTop={item.isFirst ? "10px" : "0px"}
                            marginBottom={!item.isLast ? "2px" : "0px"}
                        >
                            {item.isLast ? (
                                <Box align="top" width="33px" height="37.5px" flexShrink="0">
                                    <CirclePicture circle={item.user} size={33} hasPopover={true} inChat={true} />
                                </Box>
                            ) : (
                                <Box className="circle-chat-picture" flexShrink="0" />
                            )}

                            <Popover
                                isLazy
                                trigger={isMobile ? "click" : "hover"}
                                gutter="0"
                                //placement="center-end"
                                placement="bottom-start"
                                closeOnBlur={true}
                            >
                                <PopoverTrigger>
                                    <VStack
                                        align="left"
                                        marginLeft="10px"
                                        flexGrow="1"
                                        spacing="4px"
                                        maxWidth={isMobile ? `${windowWidth - 60}px` : "330px"}
                                        overflow="hidden"
                                    >
                                        <Box
                                            borderRadius={`${item.isFirst ? "10px" : "2px"} 10px 10px ${
                                                item.isLast ? "10px" : "2px"
                                            }`}
                                            // bgGradient={
                                            //     item.isSelf
                                            //         ? "linear(to-r,#d3d1d3,#ffffff)"
                                            //         : "linear(to-r,#d3d1d3,#ffffff)"
                                            // }
                                            backgroundColor={item.isSelf ? "#90ffb3" : "#ffffff"}
                                            color={item.user.id !== user?.id ? "black" : "black"}
                                            marginRight="auto"
                                            overflow="hidden"
                                            maxWidth={isMobile ? `${windowWidth - 60}px` : "330px"}
                                        >
                                            {item.reply_to && (
                                                <Box padding="11px 11px 0px 11px" overflow="hidden">
                                                    <VStack
                                                        align="left"
                                                        spacing="0px"
                                                        flexGrow="1"
                                                        borderLeft="3px solid #7179a9"
                                                        paddingLeft="5px"
                                                        maxWidth="290px"
                                                    >
                                                        <Text fontSize="14px" color="#7880f8" fontWeight="700">
                                                            {item.reply_to.user.name}
                                                        </Text>
                                                        <Text fontSize="14px" noOfLines={1}>
                                                            {item.reply_to.message}
                                                        </Text>
                                                    </VStack>
                                                </Box>
                                            )}

                                            <Box
                                                padding={`11px 11px ${item.isLast ? "0px" : "11px"} 11px`}
                                                overflow="hidden"
                                            >
                                                {/* Render chat message */}
                                                {!item.is_ai_prompt && (
                                                    <Box lineHeight="20px" fontSize="14px" maxWidth="290px">
                                                        <CircleRichText mentions={item.mentions}>
                                                            {item.formattedMessage}
                                                        </CircleRichText>
                                                    </Box>
                                                )}

                                                {item.awaits_response && (
                                                    <Lottie
                                                        options={{
                                                            loop: true,
                                                            autoplay: true,
                                                            animationData: talkdotsAnimation,
                                                            rendererSettings: {
                                                                preserveAspectRatio: "xMidYMid slice",
                                                            },
                                                        }}
                                                        height={50}
                                                        width={50}
                                                    />
                                                )}

                                                <MetaData data={item.meta_data} />

                                                {item.is_ai_prompt && (
                                                    <Box paddingRight="10px" lineHeight="20px" fontSize="14px">
                                                        <Text>
                                                            <b>/ai</b> {item.message}
                                                        </Text>

                                                        {item.openai_response?.choices?.[0]?.text && (
                                                            <Box
                                                                fontSize="14px"
                                                                borderLeft="3px solid #7179a9"
                                                                paddingLeft="5px"
                                                            >
                                                                <CircleRichText mentions={item.mentions}>
                                                                    {item.openai_response?.choices?.[0]?.text}
                                                                </CircleRichText>
                                                            </Box>
                                                        )}
                                                    </Box>
                                                )}

                                                {item.isLast && (
                                                    <Box paddingBottom="4px" paddingTop="2px">
                                                        {!item.awaits_response && (
                                                            <Text
                                                                align="right"
                                                                className="circle-list-title"
                                                                paddingRight="0px"
                                                                lineHeight="10px"
                                                                fontSize="10px"
                                                                color={!item.isSelf ? "#9f9f9f" : "#818181"}
                                                            >
                                                                {item.sent_at.toDate().toLocaleString([], {
                                                                    hour: "2-digit",
                                                                    minute: "2-digit",
                                                                })}
                                                            </Text>
                                                        )}
                                                    </Box>
                                                )}
                                            </Box>
                                        </Box>
                                    </VStack>
                                </PopoverTrigger>

                                <PopoverContent
                                    backgroundColor="transparent"
                                    borderColor="transparent"
                                    boxShadow="none"
                                >
                                    <Box
                                        zIndex="160"
                                        height="12px"
                                        backgroundColor="transparent"
                                        align="center"
                                        position="relative"
                                    >
                                        <HStack
                                            align="center"
                                            position="absolute"
                                            top="-14px"
                                            left="10px"
                                            paddingLeft="5px"
                                            paddingRight="5px"
                                            paddingTop="3px"
                                            paddingBottom="3px"
                                            backgroundColor={popoverBg}
                                            borderRadius="50px"
                                        >
                                            {!item.isSelf && (
                                                <Icon
                                                    width="18px"
                                                    height="18px"
                                                    color={iconColor}
                                                    as={BsReplyFill}
                                                    cursor="pointer"
                                                    onClick={() => replyChatMessage(item)}
                                                />
                                            )}

                                            {item.isSelf && (
                                                <>
                                                    <Icon
                                                        width="18px"
                                                        height="18px"
                                                        color={iconColor}
                                                        as={MdDelete}
                                                        cursor="pointer"
                                                        onClick={() => deleteChatMessage(item)}
                                                    />
                                                    <Icon
                                                        width="18px"
                                                        height="18px"
                                                        color={iconColor}
                                                        as={MdModeEdit}
                                                        cursor="pointer"
                                                        onClick={() => editChatMessage(item)}
                                                    />
                                                </>
                                            )}

                                            {/* {!item.isSelf && (
                                                <Icon
                                                    width="18px"
                                                    height="18px"
                                                    color={iconColor}
                                                    as={MdAddReaction}
                                                    cursor="pointer"
                                                />
                                            )} */}
                                        </HStack>
                                    </Box>
                                </PopoverContent>
                            </Popover>
                        </Flex>
                    )}
                </Box>
            ))}
        </>
    );
};

const MessageInputBox = ({
    sendMessage,
    onNewMention,
    messages,
    isEditingMessage,
    isReplyingMessage,
    messageToEdit,
    messageToReply,
    onCloseEdit,
    onCloseReply,
}) => {
    const [isMobile] = useAtom(isMobileAtom);
    const textAreaRef = useRef();
    const [isMentioning, setIsMentioning] = useState(false); // is user currently mentioning someone
    const [mentionQuery, setMentionQuery] = useState(""); // current mention query in user input message
    const [message, setMessage] = useState("");
    const [user] = useAtom(userAtom);
    const { windowWidth, windowHeight } = useWindowDimensions();
    const [, setCaretIndex] = useState(0);

    useEffect(() => {
        if (isEditingMessage) {
            setMessage(messageToEdit?.message);
        }
    }, [isEditingMessage, messageToEdit?.message]);

    const handleMessageChange = (e) => {
        setMessage(e.target.value);

        if (isMentioning) {
            const queryMatch = e.target.value.match(/(?:^|\s)@(\w*)$/); // This regex matches "@" only if it's at the start or after a space
            if (queryMatch) {
                setMentionQuery(queryMatch[1]);
            }
        }

        if (e.target.value.match(/(?:^|\s)@$/)) {
            log("mentioning", 0, true);
            setIsMentioning(true);
        } else if (e.target.value.endsWith(" ") || e.target.value.endsWith("\n")) {
            log("not mentioning", 0, true);
            setIsMentioning(false);
        }
    };

    const handleMessageKeyDown = async (e) => {
        if (!isMobile && e.keyCode === 13 && !e.shiftKey) {
            e.preventDefault();
            let messageValue = message;
            setMessage("");
            await sendMessage(messageValue);
        } else {
            return;
        }
    };

    const onMessageBlur = () => {
        setCaretIndex(textAreaRef.current.selectionEnd);
        //textAreaRef.current.setSelectionRange(cursorPosition, cursorPosition)}
    };

    const closeEdit = () => {
        setMessage("");
        onCloseEdit();
    };

    const closeReply = () => {
        onCloseReply();
    };

    const onMention = (mentionedCircle) => {
        log("mentioning circle: " + mentionedCircle.name, 0, true);
        const updatedMessage = message.replace(`@${mentionQuery}`, `@${mentionedCircle.name} `);
        setMessage(updatedMessage);

        // add the mentioned circle to the mentions list
        const newMention = {
            id: mentionedCircle.objectID,
            name: `@${mentionedCircle.name}`,
            picture: mentionedCircle.picture,
        };

        onNewMention(newMention);

        setIsMentioning(false);
        setMentionQuery("");

        // Set focus back to the textarea and set cursor position
        const newPosition = updatedMessage.length; // Get the length of the updated message
        textAreaRef.current.focus(); // Focus the textarea
        textAreaRef.current.setSelectionRange(newPosition, newPosition); // Set the cursor position to the end of the textarea content
    };

    return (
        <>
            {isEditingMessage && (
                <Flex
                    height="60px"
                    backgroundColor="#f9f9f9"
                    align="center"
                    boxSizing="border-box"
                    marginTop="auto"
                    position="relative"
                    flexDirection="row"
                    width="100%"
                    overflow="hidden"
                >
                    <Box marginLeft="10px" marginRight="10px">
                        <MdModeEdit size="30px" color="#7880f8" />
                    </Box>

                    <Flex align="left" spacing="0px" flexGrow="1" flexDirection="column">
                        <Text fontSize="14px" color="#7880f8" fontWeight="700">
                            {i18n.t("Edit message")}
                        </Text>
                        <Text noOfLines={1}>{messageToEdit.message}</Text>
                    </Flex>
                    <Box marginLeft="10px" marginRight="10px">
                        <MdOutlineClose size="30px" color="#161616" onClick={closeEdit} cursor="pointer" />
                    </Box>
                </Flex>
            )}

            {isReplyingMessage && (
                <Flex
                    height="60px"
                    backgroundColor="#f9f9f9"
                    align="center"
                    boxSizing="border-box"
                    marginTop="auto"
                    position="relative"
                    flexDirection="row"
                    width="100%"
                    overflow="hidden"
                >
                    <Box marginLeft="10px" marginRight="10px">
                        <BsReplyFill size="30px" color="#7880f8" />
                    </Box>

                    <Flex align="left" spacing="0px" flexGrow="1" flexDirection="column">
                        <Text fontSize="14px" color="#7880f8" fontWeight="700">
                            {messageToReply.user.name}
                        </Text>
                        <Text noOfLines={1}>{messageToReply.message}</Text>
                    </Flex>
                    <Box marginLeft="10px" marginRight="10px">
                        <MdOutlineClose size="30px" color="#161616" onClick={closeReply} cursor="pointer" />
                    </Box>
                </Flex>
            )}

            <Box
                align="flex-end"
                boxSizing="border-box"
                minH="60px"
                paddingTop="15px"
                paddingLeft="5px"
                paddingRight="50px"
                marginTop="auto"
                position="relative"
            >
                {isMentioning && (
                    <CircleMention onMention={onMention} query={mentionQuery} position="absolute" bottom="50px" />
                )}
                <AutoResizeTextarea
                    ref={textAreaRef}
                    id="message"
                    className="messageInput"
                    value={message}
                    onChange={handleMessageChange}
                    onKeyDown={handleMessageKeyDown}
                    resize="none"
                    maxLength="65000"
                    rows="1"
                    borderRadius="30px"
                    maxH={`${Math.max(windowHeight - 300, 60)}px`}
                    placeholder={user?.id ? i18n.t("Message...") : i18n.t("Log in to chat")}
                    onBlur={onMessageBlur}
                    disabled={user?.id ? false : true}
                    backgroundColor="white"
                />
                <Popover trigger="click" gutter="0" enabled={false}>
                    {user && (
                        <PopoverTrigger>
                            <Box
                                position="absolute"
                                top="18px"
                                right="10px"
                                width="30px"
                                height="30px"
                                flexShrink="0"
                                cursor="pointer"
                            >
                                <HiOutlineEmojiHappy size="30px" color={"#6e6e6e"} />
                            </Box>
                        </PopoverTrigger>
                    )}
                    {!user && (
                        <Box position="absolute" top="18px" right="10px" width="30px" height="30px" flexShrink="0">
                            <HiOutlineEmojiHappy size="30px" color="#6e6e6e" />
                        </Box>
                    )}
                    <PopoverContent
                        backgroundColor="transparent"
                        borderColor="transparent"
                        width="352px"
                        height="435px"
                    >
                        <Box zIndex="100" width="352px" height="435px">
                            <PopoverArrow />
                            <EmojiPicker setMessage={setMessage} />
                        </Box>
                    </PopoverContent>
                </Popover>
                {isMobile && (
                    <Box
                        position="absolute"
                        top="21px"
                        right="50px"
                        width="26px"
                        height="26px"
                        flexShrink="0"
                        cursor="pointer"
                    >
                        <IoMdSend size="26px" color={user ? "#7880f8" : "#e6e6e6"} onClick={sendMessage} />
                    </Box>
                )}
            </Box>
        </>
    );
};

export const CircleChat = ({ circle }) => {
    const [isMobile] = useAtom(isMobileAtom);
    const [user] = useAtom(userAtom);
    const [userData] = useAtom(userDataAtom);
    const [, setChatCircle] = useAtom(chatCircleAtom);
    const [unfilteredChatMessages, setUnfilteredChatMessages] = useState([]);
    const [mentionedCircles, setMentionedCircles] = useAtom(mentionedCirclesAtom);
    const [chatMessages, setChatMessages] = useState([]);
    const [, setIsSending] = useState(false);
    const [messageIndex, setMessageIndex] = useState(0);
    const [scrollToLast, setScrollToLast] = useState(true);
    const [scrollToLastSmooth, setScrollToLastSmooth] = useState(false);
    const [isLoadingMessages, setIsLoadingMessages] = useState(true);
    const scrollLastRef = useRef();
    const scrollbarsRef = useRef();
    const toast = useToast();
    const [isAuthorized, setIsAuthorized] = useState(true);

    const textAreaRef = useRef();
    const [circles] = useAtom(circlesAtom);
    const [signInStatus] = useAtom(signInStatusAtom);
    const [chatData, setChatData] = useState(null);
    const chatSession = useMemo(() => chatData?.sessions[chatData?.sessions.length - 1], [chatData]);
    const [mentionsList, setMentionsList] = useState([]); // list of mentions in user input message
    const [, setToggleWidgetEvent] = useAtom(toggleWidgetEventAtom);
    const [circlesFilter, setCirclesFilter] = useAtom(circlesFilterAtom);

    //SCROLL123
    // useEffect(() => {
    //     log("Chat.useEffect 1", -1);
    //     setScrollToLastSmooth(false);
    //     window.scrollTo(0, document.body.scrollHeight);
    // }, []);

    const onNewSession = () => {
        setChatMessages([]);
        setIsLoadingMessages(true);
        axios.post(`/chat_session`, { circle_id: circle.id }).catch((err) => {
            console.error(err);
        });
    };

    const onNewMention = (newMention) => {
        setMentionsList((prevMentions) => [...prevMentions, newMention]);
    };

    const isAiRelationSet = useMemo(() => {
        // check if circle is a relation-set with user and AI as members
        if (!circle) return false;
        if (circle.type !== "set") return false;
        if (circle.circle_ids.length !== 2) return false;
        if (circle[circle.circle_ids[0]].type !== "ai_agent" && circle[circle.circle_ids[1]].type !== "ai_agent")
            return false;
        return true;
    }, [circle]);

    useEffect(() => {
        log("CircleChat.useEffect 1", -1);
        if (!circle?.id) return;
        if (!isAiRelationSet) return;

        // subscribe to meta data about chat
        log("subscribing to chat", 0, true);
        let unsubscribeGetChat = onSnapshot(doc(db, "chat", circle.id), (doc) => {
            var newChatData = doc.data();
            if (!doc.exists || !newChatData) {
                // create new chat session
                log("creating new chat session", 0, true);
                axios.post(`/chat_session`, { circle_id: circle.id }).catch((err) => {
                    console.error(err);
                });
                return;
            }
            newChatData.id = doc.id;
            setChatData(newChatData);
        });

        return () => {
            if (unsubscribeGetChat) {
                unsubscribeGetChat();
            }
        };
    }, [circle?.id, setChatData, isAiRelationSet]);

    useEffect(() => {
        setChatCircle(circle?.id);
        log("CircleChat.useEffect 2", -1);

        if (!user?.id) return;
        if (!signInStatus.signedIn) return;

        if (circle?.id) {
            // mark messages as read
            axios.put(`/chat_notifications`, { circle_id: circle?.id }).catch((err) => {
                console.error(err);
            });
        }

        return () => {
            setChatCircle(null);
        };
    }, [user?.id, circle?.id, setChatCircle, signInStatus.signedIn]);

    useEffect(() => {
        log("CircleChat.useEffect 3", -1);
        let circleId = circle?.id;
        if (!circleId) {
            return;
        }

        //log("Getting chat messages from circle: " + circleId, 0, true);

        // console.log("Showing chat messages for:", circleId);
        let chatMessagesQuery = null;
        if (isAiRelationSet) {
            if (!chatSession) {
                return;
            }
            chatMessagesQuery = query(
                collection(db, "chat_messages"),
                where("circle_id", "==", circle.id),
                where("session_id", "==", chatSession?.id),
                orderBy("sent_at", "desc"),
                limit(50)
            );
        } else {
            chatMessagesQuery = query(
                collection(db, "chat_messages"),
                where("circle_id", "==", circle.id),
                orderBy("sent_at", "desc"),
                limit(50)
            );
        }

        setIsLoadingMessages(true);
        const unsubscribeGetChatMessages = onSnapshot(chatMessagesQuery, (snap) => {
            const newChatMessages = snap.docs.map((doc) => {
                return {
                    id: doc.id,
                    ...doc.data(),
                };
            });
            setUnfilteredChatMessages(newChatMessages.reverse());
            setIsLoadingMessages(false);
            if (user?.id) {
                updateSeen(circleId);
            }

            // update mentioned circles list with new mentions
            const allMentions = newChatMessages
                .filter((x) => x.has_mentions)
                .map((message) => message.mentions)
                .flat();

            const newMentions = allMentions.filter((mention) => !mentionedCircles.find((x) => x.id === mention.id));

            // if there are new mentions and last message is from AI then open the discover tab with the new mentions
            if (newMentions.length > 0) {
                setMentionedCircles([...mentionedCircles, ...newMentions]);

                // if last message is from AI open discover panel
                const lastMessage = newChatMessages[newChatMessages.length - 1];
                if (lastMessage.user?.type === "ai_agent") {
                    // open discover in mentioned category
                    setCirclesFilter({
                        ...circlesFilter,
                        categories: ["mentioned"],
                    });
                    setToggleWidgetEvent({ name: "discover", value: true });
                }
            }
            //chatMessagesUpdated(newChatMessages);
        });

        return () => {
            if (unsubscribeGetChatMessages) {
                unsubscribeGetChatMessages();
            }
        };
    }, [circle?.id, user?.id, isAuthorized, chatSession, isAiRelationSet, setMentionedCircles]);

    useEffect(() => {
        log("CircleChat.useEffect 4", -1);
        let circleId = circle?.id;
        if (!circleId) {
            return;
        }

        if (circle.type === "set" && circle.circle_ids.includes(user.id)) {
            setIsAuthorized(true);
            return;
        }

        // check if user is authorized to view chat
        if (!circle.is_public && !isConnected(userData, circleId, ["connected_mutually_to"])) {
            setIsAuthorized(false);
            return;
        } else {
            setIsAuthorized(true);
        }
    }, [circle?.id, setIsAuthorized, circle?.is_public, userData, user?.id, circle?.circle_ids, circle?.type]);

    useEffect(() => {
        log("CircleChat.useEffect 5", -1);
        if (!unfilteredChatMessages) {
            setChatMessages([]);
            return;
        }

        let userId = user?.id;
        let previousDate = null;
        let filteredChatMessages = [];
        let previousMessage = null;
        let previousIndex = 0;
        let index = 0;
        for (var message of unfilteredChatMessages) {
            // see if date is changed
            if (!datesAreOnSameDay(previousDate, message.sent_at)) {
                // add date message
                let date = getDayAndMonth(message.sent_at);
                let dateMessage = {
                    id: message.id + ".date",
                    date,
                    type: "date",
                    isFirst: true,
                    isLast: true,
                };
                filteredChatMessages.push(dateMessage);
                if (previousMessage) {
                    filteredChatMessages[index - 1].isLast = true;
                }
                ++index;
                previousMessage = dateMessage;
            }

            let formattedMessage = message.has_links ? linkifyMarkdown(message.message) : message.message;
            let isSelf = message.user?.id === userId;

            // get fresh user data
            if (isSelf) {
                message.user = user;
            } else {
                let messageUserId = message.user?.id;
                let onlineUser = circles?.find((c) => c.id === messageUserId);
                if (onlineUser) {
                    message.user = onlineUser;
                }
            }

            if (previousMessage?.user?.id === message.user?.id) {
                if (previousMessage) {
                    filteredChatMessages[index - 1].isLast = false;
                }
                filteredChatMessages.push({
                    ...message,
                    formattedMessage: formattedMessage,
                    isFirst: false,
                    isLast: true,
                    type: "message",
                    isSelf,
                });
            } else {
                filteredChatMessages.push({
                    ...message,
                    formattedMessage: formattedMessage,
                    isFirst: true,
                    isLast: true,
                    type: "message",
                    isSelf,
                });
            }

            previousMessage = message;
            previousIndex = index;
            ++index;

            previousDate = message.sent_at;
        }

        setChatMessages(filteredChatMessages);
    }, [unfilteredChatMessages, user?.id, isMobile]);

    //SCROLL123
    // useEffect(() => {
    //     log("Chat.useEffect 4", -1);
    //     if (scrollLastRef.current && scrollToLast && chatMessages.length > 0) {
    //         requestAnimationFrame(() => {
    //             var behavior = scrollToLastSmooth ? "smooth" : "auto";
    //             scrollLastRef.current.scrollIntoView({ behavior: behavior, block: "nearest" });
    //         });

    //         // var behavior = scrollToLastSmooth ? "smooth" : "auto";
    //         // scrollLastRef.current.scrollIntoView({ behavior: behavior, block: "end" });
    //         //setScrollToLastSmooth((current) => true);
    //     }
    // }, [chatMessages, scrollToLast, scrollToLastSmooth]);

    useEffect(() => {
        log("CircleChat.useEffect 6", -1);
        let circleId = circle?.id;
        if (!user?.id || !circleId) return;
        if (!signInStatus.signedIn) return;

        updateSeen(circleId);
    }, [user?.id, circle?.id, signInStatus.signedIn]);

    const updateSeen = (circleId) => {
        // mark circles as seen
        axios
            .post(`/seen`, {
                category: "chat",
                circleId: circleId,
            })
            .then((x) => {})
            .catch((error) => {});
    };

    const sendMessage = async (messageValue) => {
        if (!user?.id) {
            return;
        }

        // disable while sending
        setIsSending(true);

        let formattedMessage = transformMessageWithMentions(messageValue);

        // add message
        var newChatMessage = {
            id: messageIndex,
            user: { ...user },
            circle_id: circle.id,
            sent_at: Timestamp.now(),
            message: formattedMessage,
            session_id: chatSession?.id,
        };

        setScrollToLast(true);
        if (isReplyingMessage) {
            newChatMessage.reply_to = messageToReply;
        }

        if (!isEditingMessage) {
            setUnfilteredChatMessages([...unfilteredChatMessages, newChatMessage]);
            setMessageIndex(messageIndex + 1);
        }

        //console.log("Sending message: " + message);

        // clear message
        setMentionsList([]);

        if (isEditingMessage) {
            setIsEditingMessage(false);
            setMessageToEdit(null);

            // send request to edit message
            let postMessageResult = null;
            try {
                postMessageResult = await axios.put(`/chat_messages/${messageToEdit.id}`, {
                    message: formattedMessage,
                });
            } catch (err) {
                console.error(err);
            }

            if (!postMessageResult || postMessageResult.data?.error) {
                // something went wrong
                //console.log(JSON.stringify(postMessageResult.data, null, 2));
                toast({
                    title: i18n.t("Couldn't edit message"),
                    status: "error",
                    position: "top",
                    duration: 4500,
                    isClosable: true,
                });
            }
        } else {
            let req = {
                circle_id: circle.id,
                message: formattedMessage,
                session_id: chatSession?.id,
            };
            if (isReplyingMessage) {
                req.replyToId = messageToReply?.id;
            }

            setIsReplyingMessage(false);
            setMessageToReply(null);

            // send request to send message
            let postMessageResult = null;
            try {
                postMessageResult = await axios.post(`/chat_messages`, req);
            } catch (err) {
                console.error(err);
            }

            if (!postMessageResult || postMessageResult.data?.error) {
                // something went wrong
                //console.log(JSON.stringify(postMessageResult.data, null, 2));
                toast({
                    title: i18n.t("Couldn't send message"),
                    description: JSON.stringify(postMessageResult?.data?.error, null, 2),
                    status: "error",
                    position: "top",
                    duration: 4500,
                    isClosable: true,
                });

                // TODO failed messages should still show up in messages list with some indicator that message wasn't sent
            }
        }

        setIsSending(false);
    };

    const [messageToDelete, setMessageToDelete] = useState(null);
    const deleteChatMessage = (item) => {
        if (!item.isSelf) return;
        setMessageToDelete(item);
        confirmDeleteMessageOnOpen();
    };

    const confirmDeleteMessage = async () => {
        confirmDeleteMessageOnClose();

        // send request to send message
        let deleteMessageResult = null;
        try {
            deleteMessageResult = await axios.delete(`/chat_messages/${messageToDelete.id}`);
        } catch (err) {
            console.error(err);
        }

        if (!deleteMessageResult || deleteMessageResult.data?.error) {
            // something went wrong
            //console.log(JSON.stringify(postMessageResult.data, null, 2));
            toast({
                title: i18n.t("Couldn't delete message"),
                status: "error",
                position: "top",
                duration: 4500,
                isClosable: true,
            });
        }
    };

    const {
        isOpen: confirmDeleteMessageIsOpen,
        onOpen: confirmDeleteMessageOnOpen,
        onClose: confirmDeleteMessageOnClose,
    } = useDisclosure();
    const confirmDeleteMessageInitialRef = useRef(null);

    const [isEditingMessage, setIsEditingMessage] = useState(false);
    const [messageToEdit, setMessageToEdit] = useState(null);
    const editChatMessage = (item) => {
        if (!item.isSelf) return;
        setMessageToEdit(item);
        setIsEditingMessage(true);
        setIsReplyingMessage(false);
    };

    const [isReplyingMessage, setIsReplyingMessage] = useState(false);
    const [messageToReply, setMessageToReply] = useState(null);
    const replyChatMessage = (item) => {
        setMessageToReply(item);
        setIsReplyingMessage(true);
        setIsEditingMessage(false);
        setMessageToEdit(item);
    };

    const transformMessageWithMentions = (rawMessage) => {
        let transformedMessage = rawMessage;

        mentionsList.forEach((mention) => {
            const markdownLink = `[${mention.name.slice(1)}](codo.earth/circles/${mention.id})`; // remove the '@' from the mention name
            transformedMessage = transformedMessage.replace(mention.name, markdownLink);
        });

        return transformedMessage;
    };

    const onMessagesRenderComplete = () => {
        if (scrollbarsRef.current) {
            scrollbarsRef.current.scrollToBottom();
        }
    };

    const onCloseEdit = () => {
        setIsEditingMessage(false);
        setMessageToEdit(null);
    };

    const onCloseReply = () => {
        setIsReplyingMessage(false);
        setMessageToReply(null);
    };

    const circleChatBackgroundColor = "#ededed"; // "#e3e3e3";

    if (!circle) return null;

    return (
        <Flex
            flexGrow="1"
            backgroundColor={circleChatBackgroundColor}
            width="100%"
            height="100%"
            position="relative"
            overflow="hidden"
            pointerEvents="auto"
        >
            <Flex width="100%" height="100%" overflow="hidden" flexDirection="column">
                <Flex flexGrow="1" flexDirection="column" align="left" overflow="hidden">
                    {!isAuthorized && (
                        <Box marginTop="20px" spacing="0px" marginLeft="8px" marginRight="8px" color="#333">
                            <Text>{i18n.t(`You need to join the [${circle?.type}] to chat`)}</Text>
                        </Box>
                    )}
                    {!circle?.is_public && (
                        <Flex borderRadius="5px" width="100%" align="center" marginBottom="5px">
                            {isAiRelationSet && (
                                <NewSessionButton circle={circle} onClick={onNewSession} marginLeft="10px" />
                            )}
                            <Box flexGrow="1" />
                            <AboutButton circle={getRelevantCircle(user, circle)} />
                            <Tooltip
                                label={
                                    "This is a private chat" +
                                    (isAiRelationSet
                                        ? ". Your interactions can be used to train and improve the AI."
                                        : "")
                                }
                                aria-label="A tooltip"
                            >
                                <Box>
                                    <RiChatPrivateLine color="#333" size="20px" />
                                </Box>
                            </Tooltip>
                        </Flex>
                    )}

                    {isAuthorized && (
                        <>
                            <Box flexGrow="1" overflow="hidden" marginBottom="-1px">
                                <Scrollbars ref={scrollbarsRef} className="chatScrollbars" autoHide>
                                    <VStack
                                        align="left"
                                        spacing="0px"
                                        marginTop="30px"
                                        marginLeft="18px"
                                        marginRight="8px"
                                    >
                                        <ChatMessages
                                            messages={chatMessages}
                                            onRenderComplete={onMessagesRenderComplete}
                                            replyChatMessage={replyChatMessage}
                                            deleteChatMessage={deleteChatMessage}
                                            editChatMessage={editChatMessage}
                                        />

                                        {!chatMessages?.length && !isLoadingMessages && (
                                            <Text color="#333" marginLeft="12px">
                                                {i18n.t("No messages")}
                                            </Text>
                                        )}
                                        {isLoadingMessages && <Spinner marginLeft="12px" color="#333" />}
                                    </VStack>
                                    {chatMessages.length > 0 && <Box ref={scrollLastRef} marginTop="10px" />}
                                </Scrollbars>
                            </Box>

                            <MessageInputBox
                                sendMessage={sendMessage}
                                onNewMention={onNewMention}
                                messages={chatMessages}
                                isEditingMessage={isEditingMessage}
                                isReplyingMessage={isReplyingMessage}
                                messageToEdit={messageToEdit}
                                messageToReply={messageToReply}
                                onCloseEdit={onCloseEdit}
                                onCloseReply={onCloseReply}
                            />
                        </>
                    )}
                </Flex>

                {/* Modal popup - delete message */}
                <Modal
                    initialFocusRef={confirmDeleteMessageInitialRef}
                    isOpen={confirmDeleteMessageIsOpen}
                    onClose={confirmDeleteMessageOnClose}
                    size="lg"
                >
                    <ModalOverlay />
                    <ModalContent borderRadius="25px">
                        <ModalHeader>{i18n.t("Delete the message")}</ModalHeader>
                        <ModalCloseButton />
                        <ModalBody>
                            <Text fontSize="18px">{i18n.t("Do you want to delete the message?")}</Text>
                        </ModalBody>

                        <ModalFooter>
                            <Button colorScheme="blue" mr={3} borderRadius="25px" onClick={confirmDeleteMessage}>
                                {i18n.t("Yes")}
                            </Button>
                            <Button
                                ref={confirmDeleteMessageInitialRef}
                                colorScheme="blue"
                                mr={3}
                                borderRadius="25px"
                                onClick={confirmDeleteMessageOnClose}
                            >
                                {i18n.t("Cancel")}
                            </Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            </Flex>
        </Flex>
    );
};

export default CircleChat;
