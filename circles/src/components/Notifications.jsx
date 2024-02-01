//#region imports
import React, { useState, useEffect, useRef } from "react";
import {
    Flex,
    Box,
    Text,
    Image,
    Icon,
    Button,
    useToast,
    HStack,
    VStack,
    useDisclosure,
    useOutsideClick,
    Fade,
    Tooltip,
} from "@chakra-ui/react";
import db from "@/components/Firebase";
import axios from "axios";
import { collection, limit, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { useNavigateNoUpdates } from "@/components/RouterUtils";
import i18n from "@/i18n/Localization";
import { FaBell, FaRegBell } from "react-icons/fa";
import Scrollbars from "react-custom-scrollbars-2";
import { IoPersonAdd } from "react-icons/io5";
import { HiCheck, HiX } from "react-icons/hi";
import {
    timeSince,
    fromFsDate,
    toastError,
    toastSuccess,
    getDateAndTimeLong,
    log,
    getImageKitUrl,
    getDefaultCirclePicture,
} from "@/components/Helpers";
import { openCircle } from "@/components/Navigation";
import { useAtom } from "jotai";
import { userAtom, isMobileAtom } from "@/components/Atoms";
import { buttonHighlight } from "@/components/CircleElements";
//#endregion

export const ConnectionNotification = ({
    date,
    onClick,
    connectionId,
    connectionType,
    source,
    target,
    requestStatus,
    requestUpdatedAt,
    isSentRequests,
}) => {
    const [user] = useAtom(userAtom);

    const ApproveDenyButtons = () => {
        const [isUpdating, setIsUpdating] = useState(false);
        const [hasUpdated, setHasUpdated] = useState(false);
        const toast = useToast();

        const onApprove = async () => {
            log("onApprove");
            setIsUpdating(true);
            setHasUpdated(true);
            axios
                .post(`/connections/${connectionId}/approve`, {
                    connectionType,
                })
                .then((x) => {
                    let result = x.data;
                    if (result.error) {
                        setHasUpdated(false);
                        toastError(toast, "Unable to approve request", result.error);
                    } else {
                        setHasUpdated(true);
                    }
                    setIsUpdating(false);
                })
                .catch((error) => {
                    setHasUpdated(false);
                    toastError(toast, "Unable to approve request");
                    setIsUpdating(false);
                });
        };
        const onDeny = async () => {
            setIsUpdating(true);
            setHasUpdated(true);
            if (isSentRequests) {
                let errorMessage = `${i18n.t("Unable to disconnect from")} ${target.name}`;
                axios
                    .delete(`/circles/${source.id}/connections`, {
                        data: {
                            targetId: target.id,
                            type: connectionType,
                        },
                    })
                    .then((x) => {
                        let result = x.data;
                        if (result.error) {
                            setHasUpdated(false);
                            toastError(toast, errorMessage, JSON.stringify(result.error, null, 2));
                        } else {
                            toastSuccess(toast, `${i18n.t(`Disconnected from [${target.type}]`)} ${target.name}`);
                            setHasUpdated(true);
                        }
                        setIsUpdating(false);
                    })
                    .catch((error) => {
                        setHasUpdated(false);
                        toastError(toast, errorMessage, JSON.stringify(error, null, 2));
                        setIsUpdating(false);
                    });
            } else {
                axios
                    .post(`/connections/${connectionId}/deny`, { connectionType })
                    .then((x) => {
                        let result = x.data;
                        if (result.error) {
                            setHasUpdated(false);
                            toastError(toast, "Unable to deny request", JSON.stringify(result.error, null, 2));
                        } else {
                            setHasUpdated(true);
                        }
                        setIsUpdating(false);
                    })
                    .catch((error) => {
                        setHasUpdated(false);
                        toastError(toast, "Unable to deny request", JSON.stringify(error, null, 2));
                        setIsUpdating(false);
                    });
            }
        };

        return (
            user &&
            connectionId &&
            (!isSentRequests ? (
                <>
                    {requestStatus && (
                        <Text fontSize="12px" color="#a1a1a1" textAlign="start">
                            {i18n.t(`[${requestStatus}]`)} {getDateAndTimeLong(requestUpdatedAt)}
                        </Text>
                    )}
                    {!requestStatus && !hasUpdated && (
                        <HStack paddingTop="5px">
                            <Button
                                width="120px"
                                height="25px"
                                colorScheme="blue"
                                borderRadius="25px"
                                lineHeight="0"
                                backgroundColor="#389bf8"
                                color="white"
                                isDisabled={isUpdating}
                                onClick={(event) => {
                                    event.stopPropagation();
                                    onApprove();
                                }}
                                position="relative"
                            >
                                <HStack marginRight="13px">
                                    <HiCheck size="12px" />
                                    <Text>{i18n.t(target.id === user.id ? "Accept" : "Approve")}</Text>
                                </HStack>
                            </Button>
                            <Button
                                width="100px"
                                height="25px"
                                colorScheme="blue"
                                borderRadius="25px"
                                lineHeight="0"
                                backgroundColor="#389bf8"
                                color="white"
                                isDisabled={isUpdating}
                                onClick={(event) => {
                                    event.stopPropagation();
                                    onDeny();
                                }}
                                position="relative"
                            >
                                <HStack marginRight="13px">
                                    <HiX size="12px" />
                                    <Text>{i18n.t(target.id === user.id ? "Dismiss" : "Deny")}</Text>
                                </HStack>
                            </Button>
                        </HStack>
                    )}
                </>
            ) : (
                <>
                    {!hasUpdated && (
                        <HStack paddingTop="5px">
                            <Button
                                width="160px"
                                height="25px"
                                colorScheme="blue"
                                borderRadius="25px"
                                lineHeight="0"
                                backgroundColor="#389bf8"
                                color="white"
                                isDisabled={isUpdating}
                                onClick={(event) => {
                                    event.stopPropagation();
                                    onDeny();
                                }}
                                position="relative"
                            >
                                <HStack marginRight="13px">
                                    <HiX size="12px" />
                                    <Text>{i18n.t(`Remove request [${target.type}]`)}</Text>
                                </HStack>
                            </Button>
                        </HStack>
                    )}
                </>
            ))
        );
    };

    const getNotificationContent = () => {
        switch (connectionType) {
            default:
            case "connected_to":
                // source has followed target:
                // (someone else) source follows target
                // (you) source follows you
                return (
                    <Text className="circle-list-title" lineHeight="20px" fontSize="16px" align="left">
                        <strong>{source.name}</strong> {i18n.t("follows")}{" "}
                        <strong>{target.id === user.id ? i18n.t("you") : target.name}</strong>
                    </Text>
                );
            case "connected_mutually_to":
                // [user->circle] source is now connected to target
                // [user->user] source is now connected to target / source has accepted your invitation to connect
                // [circle->circle] source is now connected to target
                // [circle->user] source is now connected to target / your request to connect to source has been approved

                if (target.id === user.id) {
                    if (source.type === "user") {
                        return (
                            <Text className="circle-list-title" lineHeight="20px" fontSize="16px" align="left">
                                <strong>{source.name}</strong> {i18n.t(`has accepted your invitation to connect`)}
                            </Text>
                        );
                    } else {
                        return (
                            <Text className="circle-list-title" lineHeight="20px" fontSize="16px" align="left">
                                {i18n.t(`Your request to connect to [${source.type}]`)} <strong>{source.name}</strong>{" "}
                                {i18n.t(`has been approved`)}
                            </Text>
                        );
                    }
                } else {
                    if (source.type === "user") {
                        return (
                            <Text className="circle-list-title" lineHeight="20px" fontSize="16px" align="left">
                                <strong>{source.name}</strong>{" "}
                                {i18n.t(`[user] is now connected to the [${target.type}]`)}{" "}
                                <strong>{target.name}</strong>
                            </Text>
                        );
                    } else {
                        return (
                            <Text className="circle-list-title" lineHeight="20px" fontSize="16px" align="left">
                                <strong>{source.name}</strong> {i18n.t(`is now connected to the`)} {i18n.t(target.type)}{" "}
                                <strong>{target.name}</strong>
                            </Text>
                        );
                    }
                }

            case "connected_mutually_to_request":
                // [user->circle] source has requested to [connect] to target
                // [user->user] source has invited target to connect
                // [circle->circle] source has invited target to connect
                // [circle->user] source has invited target to connect
                if (source.type === "user" && target.type !== "user") {
                    return (
                        <>
                            <Text className="circle-list-title" lineHeight="20px" fontSize="16px" align="left">
                                <strong>{source.name}</strong>{" "}
                                {i18n.t(`[user] has requested to connect to [${target.type}]`)}{" "}
                                <strong>{target.name}</strong>
                            </Text>
                            <ApproveDenyButtons />
                        </>
                    );
                } else {
                    if (target.id === user.id) {
                        return (
                            <>
                                <Text className="circle-list-title" lineHeight="20px" fontSize="16px" align="left">
                                    <strong>{source.name}</strong> {i18n.t(`wants to connect with you`)}
                                </Text>
                                <ApproveDenyButtons />
                            </>
                        );
                    } else {
                        return (
                            <>
                                <Text className="circle-list-title" lineHeight="20px" fontSize="16px" align="left">
                                    <strong>{source.name}</strong> {i18n.t(`has invited`)}{" "}
                                    <strong>{target.name}</strong> {i18n.t("to [do]")}{" "}
                                    {i18n.t(`connect [${target.type}]`)}
                                </Text>
                                <ApproveDenyButtons />
                            </>
                        );
                    }
                }

            case "admin_by_request":
                // [user->circle] not implemented - source has requested to be admin of circle
                // [user->user] not implemented
                // [circle->circle] source has invited target to be admin
                // [circle->user] source has invited target to be admin
                if (source.type === "user" && target.type !== "user") {
                    return (
                        <>
                            <Text className="circle-list-title" lineHeight="20px" fontSize="16px" align="left">
                                <strong>{source.name}</strong>{" "}
                                {i18n.t(`[user] has requested to be admin of [${target.type}]`)}{" "}
                                <strong>{target.name}</strong>
                            </Text>
                            <ApproveDenyButtons />
                        </>
                    );
                } else {
                    if (target.id === user.id) {
                        return (
                            <>
                                <Text className="circle-list-title" lineHeight="20px" fontSize="16px" align="left">
                                    {i18n.t(`You've been invited to administrate the ${source.type}`)}{" "}
                                    <strong>{source.name}</strong>
                                </Text>
                                <ApproveDenyButtons />
                            </>
                        );
                    } else {
                        return (
                            <>
                                <Text className="circle-list-title" lineHeight="20px" fontSize="16px" align="left">
                                    <strong>{target.name}</strong> {i18n.t(`has been invited to administrate`)}{" "}
                                    <strong>{source.name}</strong>
                                </Text>
                                <ApproveDenyButtons />
                            </>
                        );
                    }
                }
        }
    };

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
                <Box position="relative" width="64px" height="70px" minWidth="64px" minHeight="70px">
                    {source.picture && (
                        <Image
                            className="notification-picture1"
                            src={getImageKitUrl(source.picture, 38, 38)}
                            fallbackSrc={getImageKitUrl(getDefaultCirclePicture(source.type), 38, 38)}
                            alt="Logo"
                        />
                    )}
                    {target.picture && (
                        <Image
                            className="notification-picture2"
                            src={getImageKitUrl(target.picture, 38, 38)}
                            fallbackSrc={getImageKitUrl(getDefaultCirclePicture(target.type), 38, 38)}
                            alt="Logo"
                        />
                    )}
                    <Image
                        as={IoPersonAdd}
                        width="16px"
                        height="16px"
                        position="absolute"
                        color="#5bcf7f"
                        top="13px"
                        left="42px"
                    />
                </Box>

                <VStack align="left" spacing="0px" paddingTop="2px">
                    {getNotificationContent()}
                    <Text className="circle-list-title" fontSize="12px" align="left" paddingTop="5px">
                        {timeSince(fromFsDate(date))} {i18n.t("ago")}
                    </Text>
                </VStack>
            </HStack>
        )
    );
};

const Notifications = () => {
    const [user] = useAtom(userAtom);
    const [isMobile] = useAtom(isMobileAtom);
    const navigate = useNavigateNoUpdates();
    const [notifications, setNotifications] = useState([]);
    const { isOpen: notificationsIsOpen, onOpen: notificationsOnOpen, onClose: notificationsOnClose } = useDisclosure();
    const iconSize = isMobile ? 18 : 18;
    const iconSizePx = iconSize + "px";

    const notificationsBoxRef = useRef(null);

    useOutsideClick({
        ref: notificationsBoxRef,
        handler: () => notificationsOnClose(),
    });

    const openNotifications = async () => {
        notificationsOnOpen();

        // if any unread notification
        if (notifications?.find((x) => !x.is_read)) {
            // fire request to mark notifications as read
            try {
                await axios.put(`/notifications`);
            } catch (err) {
                console.error(err);
            }
        }
    };

    const hasUnreadNotifications = (notifications) => {
        return notifications.find((x) => !x.is_read);
    };

    const unreadNotificationsCount = (notifications) => {
        return notifications.filter((x) => !x.is_read).length;
    };

    useEffect(() => {
        log("Notifications.useEffect", -1);
        if (!user?.id) return;

        //console.log("querying for notifications", user.id);

        // subscribe to notifications
        const notificationsQuery = query(
            collection(db, "notifications"),
            where("user_id", "==", user.id),
            orderBy("date", "desc"),
            limit(25)
        );
        const unsubscribeGetNotifications = onSnapshot(notificationsQuery, (snap) => {
            const newNotifications = snap.docs.map((doc) => {
                var notification = doc.data();
                return {
                    id: doc.id,
                    ...notification,
                };
            });
            setNotifications(newNotifications);
        });
        return () => {
            if (unsubscribeGetNotifications) {
                unsubscribeGetNotifications();
            }
        };
    }, [user?.id]);

    const Notification = ({ notification }) => {
        switch (notification.type) {
            case "connection":
                return (
                    <ConnectionNotification
                        date={notification.date}
                        connectionId={notification.connection_id}
                        connectionType={notification.connection_type}
                        source={notification.source}
                        target={notification.target}
                        requestStatus={notification.request_status}
                        requestUpdatedAt={notification.request_updated_at}
                        onClick={() => {
                            notificationsOnClose();
                            openCircle(navigate, notification.source);
                        }}
                    />
                );
            default:
                return null;
        }
    };

    if (!user?.id) return null;

    return (
        <>
            <Tooltip label={i18n.t("Notifications")} placement="bottom">
                <Box position="relative">
                    <Flex
                        position="relative"
                        width={iconSize + 8 + "px"}
                        height={iconSize + 8 + "px"}
                        _hover={{ color: "#e6e6e6", transform: "scale(1.1)" }}
                        _active={{ transform: "scale(0.98)" }}
                        borderRadius="50%"
                        justifyContent="center"
                        alignItems="center"
                        onClick={openNotifications}
                        cursor="pointer"
                    >
                        <Icon width={iconSizePx} height={iconSizePx} color={"black"} as={FaRegBell} cursor="pointer" />
                    </Flex>
                    {hasUnreadNotifications(notifications) && (
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
                                {unreadNotificationsCount(notifications)}
                            </Text>
                        </Box>
                    )}
                </Box>
            </Tooltip>

            {notificationsIsOpen && (
                <Box
                    className="notificationsBoxParent"
                    ref={notificationsBoxRef}
                    zIndex="55"
                    position="absolute"
                    display={notificationsIsOpen ? "flex" : "none"}
                    borderRadius={{ base: "20px", md: "20px" }}
                    overflow="hidden"
                    top={{ base: "43", md: "83px" }}
                    right={{ base: "0px", md: "5px" }}
                    width={{ base: "100%", md: "400px" }}
                    height="calc(100vh - 88px)"
                >
                    <Scrollbars autoHide>
                        <Fade in={notificationsIsOpen} height="100%" width="100%">
                            <Box className="notificationsBox" height="100%" width="100%">
                                <Flex flexDirection="column" marginLeft="10px" marginRight="10px" marginTop="10px">
                                    {/* {notifications.length <= 0 && ( */}
                                    <Text fontWeight="500" fontSize="20px" marginBottom="10px">
                                        {i18n.t("notifications")}
                                    </Text>
                                    {/* )} */}

                                    {notifications.length <= 0 && <Text>{i18n.t("no notifications")}</Text>}

                                    {notifications.map((notification) => (
                                        <Notification key={notification.id} notification={notification} />
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

export default Notifications;
