//#region imports
import React, { useState, useEffect, useContext, useRef } from "react";
import {
    Box,
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
import useWindowDimensions from "../components/useWindowDimensions";
import i18n from "i18n/Localization";
import UserContext from "../components/UserContext";
import db from "../components/Firebase";
import axios from "axios";
import { getDayAndMonth, datesAreOnSameDay, log } from "../components/Helpers";
import { collection, onSnapshot, query, where, orderBy, limit, Timestamp } from "firebase/firestore";
import IsMobileContext from "../components/IsMobileContext";
import { CircleHeader, CirclePicture, routes, isConnected, defaultContentWidth, isMutuallyConnected, isMember } from "../components/Navigation";
import { HiOutlineEmojiHappy } from "react-icons/hi";
import { IoMdSend } from "react-icons/io";
import { BsReplyFill } from "react-icons/bs";
import { Routes, Route, Navigate, useNavigate, useParams, useSearchParams, useLocation, matchPath } from "react-router-dom";
import { MdDelete, MdModeEdit, MdOutlineClose } from "react-icons/md";
import { Scrollbars } from "react-custom-scrollbars-2";
import EmojiPicker from "../components/EmojiPicker";
import linkifyHtml from "linkify-html";
//#endregion

export const Chat = ({ circle, setCircle, onConnect, setChatCircle }) => {
    const isMobile = useContext(IsMobileContext);
    const user = useContext(UserContext);
    const [unfilteredChatMessages, setUnfilteredChatMessages] = useState([]);
    const [chatMessages, setChatMessages] = useState([]);
    const [message, setMessage] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [messageIndex, setMessageIndex] = useState(0);
    const [scrollToLast, setScrollToLast] = useState(true);
    const [scrollToLastSmooth, setScrollToLastSmooth] = useState(false);
    const [isLoadingMessages, setIsLoadingMessages] = useState(true);
    const scrollLastRef = useRef();
    const scrollbarsRef = useRef();
    const toast = useToast();
    const navigate = useNavigate();
    const [isAuthorized, setIsAuthorized] = useState(true);
    const [caretIndex, setCaretIndex] = useState(0);
    const textAreaRef = useRef();

    useEffect(() => {
        log("Chat.useEffect 1");
        setScrollToLastSmooth(false);
    }, []);

    useEffect(() => {
        setChatCircle(circle?.id);

        if (!user?.id) return;
        if (circle?.id) {
            // mark messages as read
            axios.put(`/chat_notifications`, { circle_id: circle?.id });
        }

        return () => {
            setChatCircle(null);
        };
    }, [user?.id, circle?.id, setChatCircle]);

    useEffect(() => {
        log("Chat.useEffect 2");
        let circleId = circle?.id;
        if (!circleId) {
            return;
        }

        // console.log("Showing chat messages for:", circleId);
        setIsLoadingMessages(true);
        const chatMessagesQuery = query(collection(db, "chat_messages"), where("circle_id", "==", circle.id), orderBy("sent_at", "desc"), limit(50));
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
            //chatMessagesUpdated(newChatMessages);
        });

        return () => {
            if (unsubscribeGetChatMessages) {
                unsubscribeGetChatMessages();
            }
        };
    }, [circle?.id, user?.id, isAuthorized]);

    useEffect(() => {
        let circleId = circle?.id;
        if (!circleId) {
            return;
        }
        // check if user is authorized to view chat
        if (!circle.chat_is_public && !isMember(user?.connections, circleId)) {
            setIsAuthorized(false);
            return;
        } else {
            setIsAuthorized(true);
        }
    }, [circle?.id, user?.id, user?.connections, setIsAuthorized, circle?.chat_is_public]);

    useEffect(() => {
        log("Chat.useEffect 3");
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
                let dateMessage = { id: message.sent_at, date, type: "date", isFirst: true, isLast: true };
                filteredChatMessages.push(dateMessage);
                if (previousMessage) {
                    filteredChatMessages[index - 1].isLast = true;
                }
                ++index;
                previousMessage = dateMessage;
            }

            const options = { target: "_blank" };
            let formattedMessage = message.has_links && !isMobile ? linkifyHtml(message.message, options) : message.message;
            let isSelf = message.user?.id === userId;

            if (previousMessage?.user?.id === message.user?.id) {
                if (previousMessage) {
                    filteredChatMessages[index - 1].isLast = false;
                }
                filteredChatMessages.push({ ...message, formattedMessage: formattedMessage, isFirst: false, isLast: true, type: "message", isSelf });
            } else {
                filteredChatMessages.push({ ...message, formattedMessage: formattedMessage, isFirst: true, isLast: true, type: "message", isSelf });
            }

            previousMessage = message;
            previousIndex = index;
            ++index;

            previousDate = message.sent_at;
        }

        setChatMessages(filteredChatMessages);
    }, [unfilteredChatMessages, user?.id, isMobile]);

    useEffect(() => {
        log("Chat.useEffect 4");
        if (scrollLastRef.current && scrollToLast && chatMessages.length > 0) {
            var behavior = scrollToLastSmooth ? "smooth" : "auto";
            scrollLastRef.current.scrollIntoView({ behavior: behavior, block: "nearest" });
            setScrollToLastSmooth((current) => true);
        }
    }, [chatMessages, scrollToLast, scrollToLastSmooth]);

    useEffect(() => {
        log("Chat.useEffect 5");
        let circleId = circle?.id;
        if (!user?.id || !circleId) return;
        if (circleId === "earth") return;

        log("Chat.seen", user?.id);

        updateSeen(circleId);
    }, [user?.id, circle?.id]);

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

    const handleMessageChange = (e) => {
        setMessage(e.target.value);
    };

    const sendMessage = async () => {
        if (!user?.id) {
            return;
        }

        // disable while sending
        setIsSending(true);

        // add message
        var newChatMessage = {
            id: messageIndex,
            user: { ...user },
            circle_id: circle.id,
            sent_at: Timestamp.now(),
            message: message,
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
        setMessage("");

        if (isEditingMessage) {
            setIsEditingMessage(false);
            setMessageToEdit(null);

            // send request to edit message
            let postMessageResult = await axios.put(`/chat_messages/${messageToEdit.id}`, {
                message: message,
            });

            if (postMessageResult.data?.error) {
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
                message: message,
            };
            if (isReplyingMessage) {
                req.replyToId = messageToReply?.id;
            }

            setIsReplyingMessage(false);
            setMessageToReply(null);

            // send request to send message
            let postMessageResult = await axios.post(`/chat_messages`, req);

            if (postMessageResult.data?.error) {
                // something went wrong
                //console.log(JSON.stringify(postMessageResult.data, null, 2));
                toast({
                    title: i18n.t("Couldn't send message"),
                    description: JSON.stringify(postMessageResult.data?.error, null, 2),
                    status: "error",
                    position: "top",
                    duration: 4500,
                    isClosable: true,
                });

                // TODO failed messages should still show up in messages list with some indicator that message wasn't sent
            }
        }
    };

    const handleMessageKeyDown = async (e) => {
        if (!isMobile && e.keyCode === 13 && !e.shiftKey) {
            e.preventDefault();
            await sendMessage();
            setIsSending(false);
        } else {
            return;
        }
    };

    const onMessageBlur = () => {
        setCaretIndex(textAreaRef.current.selectionEnd);
        //textAreaRef.current.setSelectionRange(cursorPosition, cursorPosition)}
    };

    const renderMetaData = (meta, i) => {
        switch (meta.type) {
            case "image":
                return (
                    <Box key={i} marginBottom="2px">
                        <Image src={meta.url} />
                    </Box>
                );
            default:
                return meta.title || meta.description ? (
                    <Box key={i} marginBottom="2px">
                        <Box fontSize="14px" borderLeft="3px solid #f15bee" paddingLeft="5px">
                            {meta.site_name &&
                                (!isMobile ? (
                                    <Link href={meta.url} target="_blank">
                                        <Text fontSize="12px" fontWeight="700" color="#872985">
                                            {meta.site_name}
                                        </Text>
                                    </Link>
                                ) : (
                                    <Text fontSize="12px" fontWeight="700" color="#872985">
                                        {meta.site_name}
                                    </Text>
                                ))}
                            <Text fontWeight="700">{meta.title}</Text>
                            <Text>{meta.description}</Text>
                            {meta.images?.map((img, j) => (
                                <Link href={meta.url} target="_blank">
                                    <Image src={img} />
                                </Link>
                            ))}
                        </Box>
                    </Box>
                ) : null;
        }
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
        let deleteMessageResult = await axios.delete(`/chat_messages/${messageToDelete.id}`);

        if (deleteMessageResult.data?.error) {
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

    const popoverBg = "#3f47796b";
    const iconColor = "#fdfdfd";

    const { isOpen: confirmDeleteMessageIsOpen, onOpen: confirmDeleteMessageOnOpen, onClose: confirmDeleteMessageOnClose } = useDisclosure();
    const confirmDeleteMessageInitialRef = useRef(null);

    const [isEditingMessage, setIsEditingMessage] = useState(false);
    const [messageToEdit, setMessageToEdit] = useState(null);
    const editChatMessage = (item) => {
        if (!item.isSelf) return;
        setMessage(item.message);
        setMessageToEdit(item);
        setIsEditingMessage(true);
        setIsReplyingMessage(false);
    };

    const closeEdit = () => {
        setMessage("");
        setIsEditingMessage(false);
        setMessageToEdit(null);
    };

    const [isReplyingMessage, setIsReplyingMessage] = useState(false);
    const [messageToReply, setMessageToReply] = useState(null);
    const replyChatMessage = (item) => {
        setMessageToReply(item);
        setIsReplyingMessage(true);
        setIsEditingMessage(false);
        setMessageToEdit(item);
    };

    const closeReply = () => {
        setIsReplyingMessage(false);
        setMessageToReply(null);
    };

    const { windowWidth } = useWindowDimensions();

    return (
        circle && (
            <>
                <CircleHeader circle={circle} setCircle={setCircle} onConnect={onConnect} title="chat" />
                <Flex
                    flexGrow="1"
                    width="100%"
                    height={isMobile ? "calc(100% - 74px)" : "calc(100% - 74px)"}
                    position="relative"
                    left="0px"
                    flexDirection={isMobile ? "column" : "row"}
                    top="0px"
                >
                    <Flex width={isMobile ? "100%" : "435px"} height="100%" overflow="hidden" flexDirection="column">
                        <Flex flexGrow="1" flexDirection="column" align="left" overflow="hidden">
                            {!isAuthorized && (
                                <Box marginTop="20px" spacing="0px" marginLeft="8px" marginRight="8px">
                                    <Text>{i18n.t(`You need to join the [${circle?.type}] to chat`)}</Text>
                                </Box>
                            )}

                            {isAuthorized && (
                                <>
                                    <Box flexGrow="1" overflow="hidden">
                                        <Scrollbars ref={scrollbarsRef} className="chatScrollbars" autoHide>
                                            <VStack align="left" spacing="0px" marginTop="30px" marginLeft="8px" marginRight="8px">
                                                {chatMessages?.map((item) => (
                                                    <>
                                                        {item.type === "date" && (
                                                            <Box key={`${item.id}.date`} alignSelf="center">
                                                                <Box backgroundColor="#848499" borderRadius="20px" marginTop="10px">
                                                                    <Text marginLeft="10px" marginRight="10px" fontSize="14px" color="#ffffff">
                                                                        {item.date}
                                                                    </Text>
                                                                </Box>
                                                            </Box>
                                                        )}

                                                        {item.type === "message" && (
                                                            <Box key={item.id}>
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
                                                                            <CirclePicture
                                                                                circle={item.user}
                                                                                size={33}
                                                                                hasPopover={true}
                                                                                onClick={() => navigate(routes.circle(item.user.id).home)}
                                                                            />
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
                                                                                {/* {item.user.id !== user.id && item.isFirst && (
                                                        <Box marginRight="auto">
                                                            <Text
                                                                className="circle-list-title"
                                                                paddingLeft="7px"
                                                                lineHeight="14px"
                                                                fontSize="14px"
                                                                fontWeight="700"
                                                            >
                                                                {item.user.name}
                                                            </Text>
                                                        </Box>
                                                    )} */}
                                                                                <Box
                                                                                    borderRadius={`${item.isFirst ? "10px" : "0px"} 10px 10px ${
                                                                                        item.isLast ? "10px" : "0px"
                                                                                    }`}
                                                                                    backgroundColor={!item.isSelf ? "#f5f5f5" : "#c6f3c0"}
                                                                                    color={item.user.id !== user?.id ? "black" : "black"}
                                                                                    marginRight="auto"
                                                                                    overflow="hidden"
                                                                                    maxWidth={isMobile ? `${windowWidth - 60}px` : "330px"}
                                                                                >
                                                                                    {item.reply_to && (
                                                                                        <Box padding="11px 11px 0px 11px">
                                                                                            <VStack
                                                                                                align="left"
                                                                                                spacing="0px"
                                                                                                flexGrow="1"
                                                                                                borderLeft="3px solid #f15bee"
                                                                                                paddingLeft="5px"
                                                                                            >
                                                                                                <Text fontSize="14px" color="#7880f8" fontWeight="700">
                                                                                                    {item.reply_to.user.name}
                                                                                                </Text>
                                                                                                <Text
                                                                                                    width={isMobile ? `${windowWidth - 100}px` : "335px"}
                                                                                                    isTruncated
                                                                                                >
                                                                                                    {item.reply_to.message}
                                                                                                </Text>
                                                                                            </VStack>
                                                                                        </Box>
                                                                                    )}

                                                                                    <Box
                                                                                        padding={`11px 11px ${item.isLast ? "0px" : "11px"} 11px`}
                                                                                        overflow="hidden"
                                                                                    >
                                                                                        <Text
                                                                                            className="circle-list-title"
                                                                                            paddingRight="10px"
                                                                                            lineHeight="20px"
                                                                                            fontSize="14px"
                                                                                        >
                                                                                            <div
                                                                                                className="embedChatHtmlContent"
                                                                                                dangerouslySetInnerHTML={{ __html: item.formattedMessage }}
                                                                                            />
                                                                                        </Text>

                                                                                        {item.meta_data?.map((meta, i) => renderMetaData(meta, i))}

                                                                                        {item.isLast && (
                                                                                            <Box paddingBottom="4px" paddingTop="2px">
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
                                                            </Box>
                                                        )}
                                                    </>
                                                ))}

                                                {!chatMessages?.length && !isLoadingMessages && <Text marginLeft="12px">{i18n.t("No messages")}</Text>}
                                                {isLoadingMessages && <Spinner marginLeft="12px" />}
                                            </VStack>
                                            {chatMessages.length > 0 && <Box ref={scrollLastRef} />}
                                        </Scrollbars>
                                    </Box>

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

                                            <VStack align="left" spacing="0px" flexGrow="1">
                                                <Text fontSize="14px" color="#7880f8" fontWeight="700">
                                                    {i18n.t("Edit message")}
                                                </Text>
                                                <Text width={isMobile ? `${windowWidth - 100}px` : "335px"} isTruncated>
                                                    {messageToEdit.message}
                                                </Text>
                                            </VStack>
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

                                            <VStack align="left" spacing="0px" flexGrow="1">
                                                <Text fontSize="14px" color="#7880f8" fontWeight="700">
                                                    {messageToReply.user.name}
                                                </Text>
                                                <Text width={isMobile ? `${windowWidth - 100}px` : "335px"} isTruncated>
                                                    {messageToReply.message}
                                                </Text>
                                            </VStack>
                                            <Box marginLeft="10px" marginRight="10px">
                                                <MdOutlineClose size="30px" color="#161616" onClick={closeReply} cursor="pointer" />
                                            </Box>
                                        </Flex>
                                    )}

                                    <Box
                                        align="flex-end"
                                        boxSizing="border-box"
                                        height="60px"
                                        paddingTop="10px"
                                        marginLeft="10px"
                                        marginRight="10px"
                                        marginTop="auto"
                                        position="relative"
                                    >
                                        <Textarea
                                            ref={textAreaRef}
                                            id="message"
                                            className="messageInput"
                                            width={isMobile ? "calc(100% - 80px)" : "calc(100% - 50px)"}
                                            value={message}
                                            onChange={handleMessageChange}
                                            onKeyDown={handleMessageKeyDown}
                                            resize="none"
                                            maxLength="650"
                                            rows="1"
                                            borderRadius="40px"
                                            placeholder={user?.id ? i18n.t("Message...") : i18n.t("Log in to chat")}
                                            onBlur={onMessageBlur}
                                            disabled={user?.id ? false : true}
                                        />
                                        <Popover trigger="click" gutter="0" enabled={false}>
                                            {user && (
                                                <PopoverTrigger>
                                                    <Box position="absolute" top="15px" right="10px" width="30px" height="30px" flexShrink="0" cursor="pointer">
                                                        <HiOutlineEmojiHappy size="30px" color={user ? "#7880f8" : "#e6e6e6"} />
                                                    </Box>
                                                </PopoverTrigger>
                                            )}
                                            {!user && (
                                                <Box position="absolute" top="15px" right="10px" width="30px" height="30px" flexShrink="0">
                                                    <HiOutlineEmojiHappy size="30px" color="#e6e6e6" />
                                                </Box>
                                            )}
                                            <PopoverContent backgroundColor="transparent" borderColor="transparent" width="352px" height="435px">
                                                <Box zIndex="100" width="352px" height="435px">
                                                    <PopoverArrow />
                                                    <EmojiPicker setMessage={setMessage} />
                                                </Box>
                                            </PopoverContent>
                                        </Popover>
                                        {isMobile && (
                                            <Box position="absolute" top="18px" right="50px" width="26px" height="26px" flexShrink="0" cursor="pointer">
                                                <IoMdSend size="26px" color={user ? "#7880f8" : "#e6e6e6"} onClick={sendMessage} />
                                            </Box>
                                        )}
                                    </Box>

                                    {circle?.chat_is_public && (
                                        <Box alignSelf="center" position="absolute">
                                            <Box backgroundColor="#8580ff" borderRadius="20px" marginTop="10px">
                                                <Text marginLeft="10px" marginRight="10px" fontSize="14px" color="#ffffff">
                                                    {i18n.t("This is a public chat, messages can be read by all")}
                                                </Text>
                                            </Box>
                                        </Box>
                                    )}
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
            </>
        )
    );
};

export default Chat;
