//#region imports
import React, { useState, useEffect, useRef, useMemo } from "react";
import {
    Box,
    Tooltip,
    IconButton,
    Textarea,
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
import { getDayAndMonth, datesAreOnSameDay, log, isConnected, getSetId, fromFsDate } from "@/components/Helpers";
import { collection, onSnapshot, query, where, orderBy, limit, Timestamp, documentId, doc } from "firebase/firestore";
import { CirclePicture, MetaData, NewSessionButton } from "@/components/CircleElements";
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

const MessageInputBox = ({ sendMessage, onNewMention, messages }) => {
    const [isMobile] = useAtom(isMobileAtom);
    const [, setCaretIndex] = useState(0);
    const textAreaRef = useRef();
    const [isMentioning, setIsMentioning] = useState(false); // is user currently mentioning someone
    const [mentionQuery, setMentionQuery] = useState(""); // current mention query in user input message
    const [message, setMessage] = useState("");
    const [user] = useAtom(userAtom);
    const awaitsResponse = useMemo(() => {
        // get last message
        if (!messages) return null;
        let lastMessage = messages[messages.length - 1];
        if (!lastMessage) return false;

        if (lastMessage.user?.id === user?.id) {
            return true;
        } else {
            return lastMessage.awaits_response;
        }
    }, [messages, user?.id]);

    const handleMessageChange = (e) => {
        setMessage(e.target.value);
        if (isMentioning) {
            const queryMatch = e.target.value.match(/(?:^|\s)@(\w*)$/); // This regex matches "@" only if it's at the start or after a space
            if (queryMatch) {
                setMentionQuery(queryMatch[1]);
            }
        }
        // check if user is mentioning someone
        let value = e.target.value;
        let newMention = value.endsWith("@") && (value === "@" || value[value.length - 2] === " ");
        if (newMention) {
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

    if (awaitsResponse || !user?.id) return <Box paddingTop="45px" height="50px" width="500px" />;

    return (
        <Box
            align="flex-end"
            boxSizing="border-box"
            height="100px"
            paddingTop="45px"
            marginTop="auto"
            position="relative"
            width="100%"
            maxWidth="500px"
            alignSelf="center"
        >
            {isMentioning && (
                <CircleMention onMention={onMention} query={mentionQuery} position="absolute" bottom="50px" />
            )}
            <Textarea
                ref={textAreaRef}
                id="message"
                className="messageInput"
                width={"100%"}
                height="50px"
                value={message}
                onChange={handleMessageChange}
                onKeyDown={handleMessageKeyDown}
                resize="none"
                maxLength="6500"
                rows="1"
                borderRadius="12px"
                placeholder={user?.id ? i18n.t("I fight for...") : i18n.t("Log in to chat")}
                onBlur={onMessageBlur}
                disabled={!awaitsResponse && user?.id ? false : true}
                // backgroundColor="#393939"
                backgroundColor="#dfdfdf"
                paddingTop="13px"
                color="black"
            />
            <Box
                position="absolute"
                bottom="17px"
                right="17px"
                width="26px"
                height="26px"
                flexShrink="0"
                cursor="pointer"
                zIndex="5"
            >
                <IoMdSend size="26px" color={"#493030"} onClick={sendMessage} />
                {/* #376739 */}
            </Box>
        </Box>
    );
};

const ChatMessages = ({ messages, onRenderComplete, width }) => {
    const [isMobile] = useAtom(isMobileAtom);
    const { windowWidth, windowHeight } = useWindowDimensions();
    const [user] = useAtom(userAtom);
    const message = useMemo(() => {
        // get last message that isn't from the user
        if (!messages) return null;
        messages.find((x) => x.user?.id !== user?.id && x.type === "message");
        for (let i = messages.length - 1; i >= 0; i--) {
            let item = messages[i];
            if (item.user?.id !== user?.id && item.type === "message") {
                return item;
            }
        }
        return null;
    }, [messages, user?.id]);

    const popoverBg = "#3f47796b";
    const iconColor = "#fdfdfd";

    const getFontSize = (message) => {
        if (!message) return "18px";
        let length = message.length;
        if (length < 30) {
            return "68px";
        } else {
            return "24px";
        }
    };

    const getFontPadding = (message) => {
        if (!message) return "0px";
        let length = message.length;
        if (length < 30) {
            return "0px 20px 0px 20px";
        } else {
            return "5px 10px 5px 10px";
        }
    };

    useEffect(() => {
        log("ChatMessages.useEffect 1", -1, true);
        if (onRenderComplete) {
            onRenderComplete();
        }
    }, [messages]); //adding onRenderComplete causes this to render unnecessarily hence warning

    return (
        <Box
            minHeight="92px"
            //        maxWidth={} // should adjust to the size of the message
        >
            {message && (
                <Flex
                    flexDirection="row"
                    align="center"
                    borderRadius="50px"
                    role="group"
                    color="black"
                    spacing="12px"
                    bg="transparent"
                >
                    {/* <Box alignSelf="center" width="80px" height="60px" flexShrink="0">
                        <CirclePicture circle={message.user} size={60} hasPopover={true} inChat={true} />
                    </Box> */}
                    <Box
                        borderRadius="12px"
                        color="white"
                        overflow="hidden"
                        bg={"#ff7676"}
                        padding={getFontPadding(message.formattedMessage)}
                        maxWidth="900px"
                    >
                        {/* #088b4f */}
                        {/* #8b0808 */}
                        {/* #e9ff76 + black text*/}
                        {/* borderRadius="28px" */}
                        {/* bgGradient={"linear(to-r,#ebebeb,#ffffff)"} */}
                        <Box overflow="hidden">
                            {/* Render chat message */}
                            <Box
                                fontSize={getFontSize(message.formattedMessage)}
                                // textShadow="-2px -2px 0 #000,
                                //     0   -2px 0 #000,
                                //     2px -2px 0 #000,
                                //     2px  0   0 #000,
                                //     2px  2px 0 #000,
                                //     0    2px 0 #000,
                                //    -2px  2px 0 #000,
                                //    -2px  0   0 #000"
                            >
                                <CircleRichText mentions={message.mentions}>{message.formattedMessage}</CircleRichText>
                            </Box>

                            {message.awaits_response && (
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
                        </Box>
                    </Box>
                </Flex>
            )}
        </Box>
    );
};

export const AiChat = ({ circle }) => {
    const [isMobile] = useAtom(isMobileAtom);
    const [user] = useAtom(userAtom);
    const [userData] = useAtom(userDataAtom);
    const [, setChatCircle] = useAtom(chatCircleAtom);
    const [unfilteredChatMessages, setUnfilteredChatMessages] = useState([]);
    const [mentionedCircles, setMentionedCircles] = useAtom(mentionedCirclesAtom);
    const [chatMessages, setChatMessages] = useState([]);
    const [, setIsSending] = useState(false);
    const [messageIndex, setMessageIndex] = useState(0);
    const [, setScrollToLast] = useState(true);
    const [isLoadingMessages, setIsLoadingMessages] = useState(true);
    const scrollLastRef = useRef();
    const scrollbarsRef = useRef();
    const toast = useToast();
    const [isAuthorized, setIsAuthorized] = useState(true);

    const [circles] = useAtom(circlesAtom);
    const [signInStatus] = useAtom(signInStatusAtom);
    const [chatData, setChatData] = useState(null);
    const chatSession = useMemo(() => {
        // get latest session created (created_at)
        if (!chatData?.sessions) return null;
        return chatData.sessions.sort((a, b) => fromFsDate(b.created_at) - fromFsDate(a.created_at))[0];
    }, [chatData]);
    const [mentionsList, setMentionsList] = useState([]); // list of mentions in user input message
    const [, setToggleWidgetEvent] = useAtom(toggleWidgetEventAtom);
    const [circlesFilter, setCirclesFilter] = useAtom(circlesFilterAtom);

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

    useEffect(() => {
        log("AiChat.useEffect 1", -1);
        if (!circle?.id) return;

        // create new chat session
        setChatMessages([]);
        setIsLoadingMessages(true);

        // TODO don't create new session unless certain conditions are met
        log("Creating new chat session ***", 0, true);
        axios.post(`/chat_session`, { circle_id: circle.id, trigger_ai: true }).catch((err) => {
            console.error(err);
        });
    }, [circle?.id]);

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
                log("###### creating new chat session ######", 0, true);
                axios.post(`/chat_session`, { circle_id: circle.id }).catch((err) => {
                    console.error(err);
                });
                return;
            }
            log("creating new chat data: " + JSON.stringify(newChatData, null, 2), 0, true);
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

            log("listening to chat messages,session: " + chatSession?.id + ", circle_id: " + circle.id, 0, true);
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
                    setCirclesFilter({ ...circlesFilter, categories: ["mentioned"] });
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
                let dateMessage = { id: message.id + ".date", date, type: "date", isFirst: true, isLast: true };
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

    const sendMessage = async (message) => {
        if (!user?.id) {
            return;
        }

        // disable while sending
        setIsSending(true);

        let formattedMessage = transformMessageWithMentions(message);

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
        setUnfilteredChatMessages([...unfilteredChatMessages, newChatMessage]);
        setMessageIndex(messageIndex + 1);
        //console.log("Sending message: " + message);

        // clear message
        setMentionsList([]);

        let req = {
            circle_id: circle.id,
            message: formattedMessage,
            session_id: chatSession?.id,
        };

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

        setIsSending(false);
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

    const chatWidth = 700;
    const chatWidthPx = chatWidth + "px";

    if (!circle) return null;
    if (!isAuthorized) return null;

    return (
        <Flex width="100%" position="relative" pointerEvents="auto">
            <Flex width="100%" height="100%" overflow="hidden" flexDirection="column">
                <Flex flexGrow="1" flexDirection="column" align="left" overflow="hidden">
                    <Box flexGrow="1">
                        <VStack align="center" spacing="0px">
                            <ChatMessages messages={chatMessages} onRenderComplete={onMessagesRenderComplete} />
                        </VStack>
                        {chatMessages.length > 0 && <Box ref={scrollLastRef} marginTop="10px" />}
                    </Box>

                    <MessageInputBox sendMessage={sendMessage} onNewMention={onNewMention} messages={chatMessages} />
                </Flex>
            </Flex>
        </Flex>
    );
};

export default AiChat;
