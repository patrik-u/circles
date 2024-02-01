//#region imports
import React, { useState, useEffect, useRef } from "react";
import { Flex, Box, Text, Icon, HStack, VStack, useDisclosure, useOutsideClick, Fade, Tooltip } from "@chakra-ui/react";
import axios from "axios";
import { collection, limit, onSnapshot, orderBy, query, where } from "firebase/firestore";
import i18n from "@/i18n/Localization";
import Scrollbars from "react-custom-scrollbars-2";
import { AiOutlineMessage } from "react-icons/ai";
import { timeSince, fromFsDate, log, singleLineEllipsisStyle } from "@/components/Helpers";
import { openCircle } from "@/components/Navigation";
import { CirclePicture, buttonHighlight } from "@/components/CircleElements";
import { useAtom } from "jotai";
import { isMobileAtom, userAtom, chatCircleAtom, signInStatusAtom, toggleWidgetEventAtom } from "@/components/Atoms";
import db from "@/components/Firebase";
import { useNavigateNoUpdates } from "@/components/RouterUtils";
//#endregion

export const MessageNotification = ({ notification, onClick }) => {
    const [user] = useAtom(userAtom);

    return (
        user && (
            <HStack
                flexDirection="row"
                align="center"
                borderRadius="10px"
                role="group"
                color="black"
                cursor={onClick ? "pointer" : "auto"}
                bg="transparent"
                _hover={
                    onClick
                        ? {
                              bg: "#f5f4f8",
                              color: "black",
                          }
                        : {}
                }
                onClick={() => onClick()}
                marginBottom="4px"
                minHeight="70px"
                spacing="12px"
                paddingBottom="1px"
                paddingTop="1px"
            >
                <Box margin="10px" minWidth="50px" minHeight="50px" position="relative">
                    <CirclePicture circle={notification.circle} size={50} disableClick={true} />

                    {notification.unread_messages > 0 && (
                        <Box
                            backgroundColor="#ff6499"
                            borderRadius="20px"
                            position="absolute"
                            right="-5px"
                            top={{ base: "-4px", md: "-5px" }}
                            cursor="pointer"
                            pointerEvents="none"
                            minWidth="17px"
                        >
                            <Text
                                fontWeight="500"
                                color="white"
                                fontSize={{ base: "12px", md: "16px" }}
                                lineHeight={{ base: "18px", md: "20px" }}
                                marginLeft="4px"
                                marginRight="4px"
                            >
                                {notification.unread_messages}
                            </Text>
                        </Box>
                    )}
                </Box>

                {/* <Box position="relative" width="64px" height="70px" minWidth="64px" minHeight="70px">
                    <CirclePicture circle={notification.circle} size={60} />
                </Box> */}

                <VStack align="left" spacing="0px" paddingTop="2px">
                    <Text style={singleLineEllipsisStyle} textAlign="left">
                        <b>{notification.last_message.user.name}:</b> {notification.last_message.message}
                    </Text>
                    <Text className="circle-list-title" fontSize="12px" align="left" paddingTop="5px">
                        {timeSince(fromFsDate(notification.last_message.sent_at))} {i18n.t("ago")}
                    </Text>
                </VStack>
            </HStack>
        )
    );
};

const Messages = () => {
    const [chatCircle] = useAtom(chatCircleAtom);
    const [user] = useAtom(userAtom);
    const [isMobile] = useAtom(isMobileAtom);
    const navigate = useNavigateNoUpdates();
    const [messages, setMessages] = useState([]);
    const { isOpen: messagesIsOpen, onOpen: messagesOnOpen, onClose: messagesOnClose } = useDisclosure();
    const iconSize = 18;
    const iconSizePx = iconSize + "px";
    const messagesBoxRef = useRef(null);
    const [signInStatus] = useAtom(signInStatusAtom);
    const [, setToggleWidgetEvent] = useAtom(toggleWidgetEventAtom);

    useOutsideClick({
        ref: messagesBoxRef,
        handler: () => messagesOnClose(),
    });

    const openMessages = async () => {
        messagesOnOpen();

        // if any unread message
        if (messages?.find((x) => !x.is_seen)) {
            // fire request to mark messages as read
            try {
                await axios.put(`/chat_notifications`);
            } catch (err) {
                console.error(err);
            }
        }
    };

    const hasUnreadMessages = (messages) => {
        return messages.find((x) => !x.is_seen);
    };

    const unreadMessagesCount = (messages) => {
        return messages.filter((x) => !x.is_seen).length;
    };

    useEffect(() => {
        log("Messages.useEffect", -1);
        if (!signInStatus.signedIn) return;
        if (!user?.id) return;

        //console.log("querying for messages", user.id);

        // subscribe to messages
        const messagesQuery = query(
            collection(db, "chat_notifications"),
            where("user_id", "==", user.id),
            orderBy("date", "desc"),
            limit(25)
        );
        const unsubscribeGetMessages = onSnapshot(messagesQuery, (snap) => {
            const newMessages = snap.docs.map((doc) => {
                var message = doc.data();
                return {
                    id: doc.id,
                    ...message,
                };
            });

            // auto mark message as read if user is currently viewing chat
            if (chatCircle) {
                // mark messages as read
                let currentChatCircleMessage = newMessages.find((x) => x.circle_id === chatCircle);
                if (currentChatCircleMessage) {
                    currentChatCircleMessage.is_seen = true;
                    // mark new message as seen
                    axios.put(`/chat_notifications`, { notification_id: currentChatCircleMessage.id }).catch((err) => {
                        console.error(err);
                    });
                }
            }

            setMessages(newMessages);
        });
        return () => {
            if (unsubscribeGetMessages) {
                unsubscribeGetMessages();
            }
        };
    }, [signInStatus.signedIn, user?.id, chatCircle]);

    if (!user?.id) return null;

    return (
        <>
            <Tooltip label={i18n.t("Chat messages")} placement="bottom">
                <Box position="relative">
                    <Flex
                        position="relative"
                        width={iconSize + 8 + "px"}
                        height={iconSize + 8 + "px"}
                        // _hover={{ backgroundColor: buttonHighlight }}
                        _hover={{ color: "#e6e6e6", transform: "scale(1.1)" }}
                        _active={{ transform: "scale(0.98)" }}
                        borderRadius="50%"
                        justifyContent="center"
                        alignItems="center"
                        onClick={openMessages}
                        cursor="pointer"
                    >
                        <Icon
                            width={iconSizePx}
                            height={iconSizePx}
                            color={"black"}
                            as={AiOutlineMessage}
                            cursor="pointer"
                        />
                    </Flex>
                    {hasUnreadMessages(messages) && (
                        <Box
                            backgroundColor="#ff6499"
                            borderRadius="20px"
                            position="absolute"
                            right="-5px"
                            top={{ base: "-4px", md: "-5px" }}
                            cursor="pointer"
                            pointerEvents="none"
                            minWidth="17px"
                        >
                            <Text
                                fontWeight="500"
                                color="white"
                                fontSize={{ base: "12px", md: "16px" }}
                                lineHeight={{ base: "18px", md: "20px" }}
                                marginLeft="4px"
                                marginRight="4px"
                            >
                                {unreadMessagesCount(messages)}
                            </Text>
                        </Box>
                    )}
                </Box>
            </Tooltip>
            {messagesIsOpen && (
                <Box
                    className="messagesBoxParent"
                    ref={messagesBoxRef}
                    zIndex="255"
                    position="absolute"
                    display={messagesIsOpen ? "flex" : "none"}
                    borderRadius={{ base: "20px", md: "20px" }}
                    overflow="hidden"
                    top={{ base: "43", md: "83px" }}
                    right={{ base: "0px", md: "5px" }}
                    width={{ base: "100%", md: "400px" }}
                    height="calc(100vh - 88px)"
                >
                    <Scrollbars autoHide>
                        <Fade in={messagesIsOpen} height="100%" width="100%">
                            <Box className="messagesBox" height="100%" width="100%">
                                <Flex flexDirection="column" marginLeft="10px" marginRight="10px" marginTop="10px">
                                    {/* {messages.length <= 0 && ( */}
                                    <Text fontWeight="500" fontSize="20px" marginBottom="10px">
                                        {i18n.t("Messages")}
                                    </Text>
                                    {/* )} */}

                                    {messages.length <= 0 && <Text>{i18n.t("no messages")}</Text>}

                                    {messages.map((message) => (
                                        <MessageNotification
                                            key={message.id}
                                            notification={message}
                                            onClick={() => {
                                                messagesOnClose();
                                                openCircle(
                                                    navigate,
                                                    { id: message.circle_id, host: "circles" },
                                                    "chat"
                                                );
                                                setToggleWidgetEvent({ name: "chat", value: true });
                                            }}
                                        />
                                    ))}
                                </Flex>
                            </Box>
                        </Fade>
                    </Scrollbars>
                </Box>
            )}
        </>
    );
};

export default Messages;
