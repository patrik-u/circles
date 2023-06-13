//#region imports
import React, { useState, useEffect } from "react";
import { Box, Flex, HStack, VStack, Text, Icon, Link } from "@chakra-ui/react";
import { getDistanceString, getDateAndTimeLong, getDateLong, singleLineEllipsisStyle, isPastEvent, getEventTime, isConnected } from "components/Helpers";
import { CirclePicture, CircleTags, ConnectButton, CircleCover, FavoriteButton, ShareButtonMenu, NotificationsBell } from "components/CircleElements";
import { HiClock } from "react-icons/hi";
import { RiMapPinFill } from "react-icons/ri";
import { useLocationNoUpdates } from "components/RouterUtils";
import { useAtom } from "jotai";
import { isMobileAtom, userDataAtom, userAtom, focusOnMapItemAtom } from "components/Atoms";
import { AiOutlineHeart, AiFillHeart } from "react-icons/ai";
import { BsChatText, BsChatTextFill, BsChatFill, BsChat, BsLockFill } from "react-icons/bs";
import { CircleChat } from "components/CircleChat";
import axios from "axios";
import linkifyHtml from "linkify-html";
//#endregion

export const CircleListItem = ({ item, isDark, onClick, inSelect, inNav, ...props }) => {
    const location = useLocationNoUpdates();
    const [showChat, setShowChat] = useState(false);
    const [, setFocusOnMapItem] = useAtom(focusOnMapItemAtom);

    const onChatToggle = (showChat) => {
        setShowChat(showChat);
    };

    if (!item) return null;

    return (
        <Flex
            key={item.id}
            align="left"
            role="group"
            color={isDark ? "white" : "black"}
            borderBottom={isDark ? "1px solid #333333" : "1px solid #ebebeb"}
            overflow="hidden"
            position="relative"
            flexDirection="row"
            flexGrow="0"
            flexShrink="0"
            paddingBottom="10px"
            cursor={inSelect ? "pointer" : "default"}
            onClick={inSelect ? onClick : null}
            {...props}
        >
            <Box margin="10px" minWidth="60px" minHeight="60px" position="relative">
                <CirclePicture circle={item.type === "post" ? item.creator : item} size={60} hasPopover={true} />
            </Box>

            <VStack
                flexGrow="1"
                align="left"
                justifyContent={inNav ? "center" : "left"}
                spacing="0px"
                marginLeft="5px"
                marginRight="15px"
                marginTop={item.type === "event" || inNav ? "0px" : "10px"}
            >
                {item.type === "event" && (
                    <Text
                        textAlign="left"
                        fontSize="12px"
                        fontWeight="700"
                        color={isPastEvent(item) ? "#8d8d8d" : "#cf1a1a"}
                        href={location?.pathname}
                        marginTop="0px"
                    >
                        {item.is_all_day ? getDateLong(item.starts_at) : getDateAndTimeLong(item.starts_at)}
                    </Text>
                )}
                <HStack>
                    <Text
                        color={isDark ? "white" : "black"}
                        fontSize="16px"
                        fontWeight="700"
                        textAlign="left"
                        lineHeight={item.type === "event" ? "17px" : "inherit"}
                        marginTop={item.type === "event" ? "2px" : "0px"}
                        style={singleLineEllipsisStyle}
                        onClick={onClick}
                        cursor="pointer"
                    >
                        {item.name}
                    </Text>
                </HStack>

                {!inNav && (
                    <>
                        <Box>
                            <Text fontSize="14px" textAlign="left" style={singleLineEllipsisStyle}>
                                {item.description}
                            </Text>
                        </Box>
                        <Box paddingTop={item.type === "event" ? "0px" : "4px"}>
                            <CircleTags circle={item} size="tiny" inSelect={inSelect} />
                        </Box>
                    </>
                )}

                {!inSelect && (
                    <Box paddingTop="2px">
                        <CircleActions circle={item} onChatToggle={onChatToggle} />
                    </Box>
                )}
                {showChat && (
                    <Box align="start" paddingTop="10px">
                        <CircleChat item={item} embeddedChatHeight={400} />
                    </Box>
                )}
                {/* <Box>
                <LatestMembers item={item} circleId={item.id} size={16} hasPopover={true} marginTop="6px" spacing="4px" />
            </Box> */}
            </VStack>

            {!inSelect && <ConnectButton circle={item} position="absolute" bottom="5px" right="10px" hoverFadeColor="#ffffff" />}

            <VStack position="absolute" top="0px" right="7px" align="left" spacing="2px">
                {item.type === "event" && (
                    <Flex
                        borderRadius="20px"
                        height="18px"
                        backgroundColor="white"
                        paddingLeft="2px"
                        paddingRight="5px"
                        align="center"
                        flexDirection="row"
                        justifyContent="center"
                        onClick={(event) => {
                            if (inSelect) return;

                            event.stopPropagation();
                            setFocusOnMapItem({ item });
                        }}
                    >
                        <Icon width="14px" height="14px" color="#929292" as={HiClock} cursor="pointer" marginRight="2px" />
                        <Text fontWeight="700" color="#929292" fontSize="12px">
                            {getEventTime(item)}
                        </Text>
                    </Flex>
                )}

                {item.distance && (
                    <Flex
                        borderRadius="20px"
                        height="18px"
                        //backgroundColor="#c242bb"
                        backgroundColor="white"
                        paddingLeft="2px"
                        paddingRight="5px"
                        align="center"
                        flexDirection="row"
                        justifyContent="center"
                        onClick={(event) => {
                            if (inSelect) return;

                            event.stopPropagation();
                            setFocusOnMapItem({ item });
                        }}
                    >
                        <Icon width="14px" height="14px" color="#929292" as={RiMapPinFill} cursor="pointer" marginRight="2px" />
                        <Text fontWeight="700" color="#929292" fontSize="12px">
                            {getDistanceString(item.distance)}
                        </Text>
                    </Flex>
                )}
            </VStack>
        </Flex>
    );
};

export const ChatButton = ({ circle, onChatToggle }) => {
    const [isMobile] = useAtom(isMobileAtom);
    const [user] = useAtom(userAtom);
    const [userData] = useAtom(userDataAtom);
    const iconSize = isMobile ? 20 : 20;
    const iconSizePx = iconSize + "px";
    const [showChat, setShowChat] = useState(false);

    const toggleChat = () => {
        if (!circle?.id) {
            return;
        }

        let newShowChat = !showChat;
        setShowChat(newShowChat);
        onChatToggle(newShowChat);
    };

    const isAuthorized = () => {
        return circle.is_public || isConnected(userData, circle?.id, ["connected_mutually_to"]);
    };

    // TODO if chat is private and user isn't connected, show a lock icon on the chat button
    // if (!user?.id || !isConnected(userData, circle?.id, ["connected_mutually_to"])) return;

    return (
        <>
            <Flex
                position="relative"
                width={iconSize + 8 + "px"}
                height={iconSize + 8 + "px"}
                backgroundColor="#ffffff"
                _hover={{ backgroundColor: "#f5f5f5", color: "#2596ff" }}
                borderRadius="50%"
                justifyContent="center"
                alignItems="center"
                onClick={toggleChat}
                cursor="pointer"
                color={showChat ? "#2596ff" : "#333"}
            >
                <Icon width={iconSizePx} height={iconSizePx} as={!isAuthorized() ? BsChat : showChat ? BsChatTextFill : BsChatText} />
                {!isAuthorized() && <Icon position="absolute" width="14px" height="14px" as={BsLockFill} right="4px" bottom="2px" />}
            </Flex>
            {circle?.messages > 0 && (
                <Text fontSize="14px" fontWeight="400" color="#333" marginLeft="5px" marginRight="5px">
                    {circle.messages}
                </Text>
            )}
        </>
    );
};

export const LikeButton = ({ circle }) => {
    const [isMobile] = useAtom(isMobileAtom);
    const [user] = useAtom(userAtom);
    const [userData] = useAtom(userDataAtom);
    const iconSize = isMobile ? 20 : 20;
    const iconSizePx = iconSize + "px";
    const [isLiked, setIsLiked] = useState(false);
    const [likes, setLikes] = useState(0);

    useEffect(() => {
        if (!userData?.circle_settings) {
            setIsLiked(false);
        } else {
            setIsLiked(userData.circle_settings[circle.id]?.liked);
        }
    }, [circle?.id, userData?.circle_settings]);

    useEffect(() => {
        setLikes(circle?.likes);
    }, [circle?.likes]);

    const toggleLiked = () => {
        if (!circle?.id) {
            return;
        }

        let liked = isLiked;
        if (liked === true) {
            liked = false;
        } else {
            liked = true;
        }
        setIsLiked(liked);
        let currentLikes = likes ? likes : 0;
        setLikes(liked ? currentLikes + 1 : currentLikes - 1);

        // update liked settings
        axios.post(`/circles/${user.id}/settings`, {
            circleId: circle.id,
            settings: { liked: liked },
        });
    };

    // TODO if chat is private and user isn't connected, show a lock icon on the chat button
    // if (!user?.id || !isConnected(userData, circle?.id, ["connected_mutually_to"])) return;

    return (
        <>
            <Flex
                position="relative"
                width={iconSize + 8 + "px"}
                height={iconSize + 8 + "px"}
                backgroundColor="#ffffff"
                _hover={{ backgroundColor: "#f5f5f5", color: "#ff4772" }}
                borderRadius="50%"
                justifyContent="center"
                alignItems="center"
                onClick={toggleLiked}
                cursor="pointer"
                color={isLiked ? "#ff4772" : "#333"}
            >
                <Icon width={iconSizePx} height={iconSizePx} as={isLiked ? AiFillHeart : AiOutlineHeart} />
            </Flex>
            {likes > 0 && (
                <Text fontSize="14px" fontWeight="400" color="#333" marginLeft="5px" marginRight="5px">
                    {likes}
                </Text>
            )}
        </>
    );
};

export const CircleActions = ({ circle, onChatToggle, ...props }) => {
    const [isMobile] = useAtom(isMobileAtom);
    const [userData] = useAtom(userDataAtom);

    if (!circle) return null;

    return (
        <HStack position="relative" align="center">
            <ChatButton circle={circle} onChatToggle={onChatToggle} />
            <LikeButton circle={circle} />
            {/* <FavoriteButton />
            {isConnected(userData, circle.id, ["connected_mutually_to"]) && <NotificationsBell />}
            <ShareButtonMenu />
            <ConnectButton circle={circle} hoverFadeColor="#ffffff" /> */}
        </HStack>
    );
};

export const CircleListItemNormal = ({ item, onClick, inSelect, ...props }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isMobile] = useAtom(isMobileAtom);
    const location = useLocationNoUpdates();
    const [showChat, setShowChat] = useState(false);
    const [formattedContent, setFormattedContent] = useState(item?.content);
    const [, setFocusOnMapItem] = useAtom(focusOnMapItemAtom);

    useEffect(() => {
        if (!item?.content) return;

        if (item.type === "post" && item.has_links) {
            const options = { target: "_blank" };
            let formattedText = linkifyHtml(item.content, options);
            setFormattedContent(formattedText);
        } else {
            setFormattedContent(item.content);
        }
    }, [item?.content, item?.type, item?.has_links]);

    const onChatToggle = (showChat) => {
        setShowChat(showChat);
    };

    if (!item) return null;

    return (
        <Flex flexDirection="column" key={item.id} borderBottom="1px solid #ebebeb">
            <Flex
                align="left"
                role="group"
                color="black"
                bg={inSelect ? "transparent" : "white"}
                // _hover={
                //     inSelect
                //         ? {}
                //         : {
                //               bg: "#ddd8db",
                //               color: "black",
                //           }
                // }
                overflow="hidden"
                position="relative"
                flexDirection="row"
                flexGrow="0"
                flexShrink="0"
                paddingBottom="10px"
                {...props}
            >
                <Box margin="10px" minWidth="60px" minHeight="60px" position="relative">
                    <CirclePicture circle={item.type === "post" ? item.creator : item} size={60} hasPopover={true} />
                </Box>

                <VStack
                    flexGrow="1"
                    align="left"
                    justifyContent="left"
                    spacing="0px"
                    marginLeft="5px"
                    marginRight="15px"
                    marginTop={item.type === "event" ? "0px" : "10px"}
                >
                    {item.type === "event" && (
                        <Text
                            textAlign="left"
                            fontSize="12px"
                            fontWeight="700"
                            color={isPastEvent(item) ? "#8d8d8d" : "#cf1a1a"}
                            href={location?.pathname}
                            marginTop="0px"
                        >
                            {item.is_all_day ? getDateLong(item.starts_at) : getDateAndTimeLong(item.starts_at)}
                        </Text>
                    )}
                    <HStack>
                        <Text
                            fontSize="16px"
                            fontWeight="700"
                            textAlign="left"
                            lineHeight={item.type === "event" ? "17px" : "inherit"}
                            marginTop={item.type === "event" ? "2px" : "0px"}
                            style={singleLineEllipsisStyle}
                            onClick={onClick}
                            cursor="pointer"
                        >
                            {item.name}
                        </Text>
                    </HStack>

                    {item.content && (
                        <Box
                            align="left"
                            marginLeft={isMobile ? "15px" : "0px"}
                            marginRight={isMobile ? "15px" : "0px"}
                            marginTop="10px"
                            overflow="hidden"
                            maxHeight={isExpanded ? "none" : "150px"}
                            position="relative"
                        >
                            <div
                                className="embedHtmlContent"
                                dangerouslySetInnerHTML={{ __html: formattedContent }}
                                style={{ marginBottom: isExpanded ? "30px" : "0px" }}
                            />
                            {/* Add fade out gradient */}
                            <Box
                                position="absolute"
                                height={isExpanded ? "100%" : "150px"}
                                // backgroundColor="#bbbb24af"
                                bottom="0px"
                                top="0px"
                                left="0px"
                                right="0px"
                                pointerEvents="none"
                            >
                                {!isExpanded && (
                                    <>
                                        <Box
                                            position="absolute"
                                            bottom="10px"
                                            left="0px"
                                            right="0px"
                                            height="50px"
                                            background="linear-gradient(rgba(255,255,255,0), rgba(255,255,255,1))"
                                        />
                                        <Box position="absolute" bottom="0px" left="0px" right="0px" height="10px" background="#ffffff" />
                                    </>
                                )}
                                <Link
                                    onClick={() => setIsExpanded(!isExpanded)}
                                    position="absolute"
                                    bottom="0px"
                                    left="0px"
                                    right="0px"
                                    fontSize="12px"
                                    fontWeight="400"
                                    pointerEvents="auto"
                                >
                                    {isExpanded ? "Show less" : "Show more"}
                                </Link>
                            </Box>
                        </Box>
                    )}

                    <CircleCover type={item.type} cover={item.cover} metaData={item?.meta_data} nullIfMissing={true} maxHeight="500px" />

                    <Box paddingTop="4px">
                        <CircleTags circle={item} size="tiny" inSelect={inSelect} />
                    </Box>

                    <Box paddingTop="4px">
                        <CircleActions circle={item} onChatToggle={onChatToggle} />
                    </Box>

                    {/* <Box>
                <LatestMembers item={item} circleId={item.id} size={16} hasPopover={true} marginTop="6px" spacing="4px" />
            </Box> */}
                    {showChat && (
                        <Box align="start" paddingTop="10px">
                            <CircleChat item={item} embeddedChatHeight={400} />
                        </Box>
                    )}
                </VStack>

                {!inSelect && <ConnectButton circle={item} position="absolute" bottom="5px" right="10px" hoverFadeColor="#ffffff" />}

                <VStack position="absolute" top="0px" right="7px" align="left" spacing="2px">
                    {item.type === "event" && (
                        <Flex
                            borderRadius="20px"
                            height="18px"
                            backgroundColor="white"
                            paddingLeft="2px"
                            paddingRight="5px"
                            align="center"
                            flexDirection="row"
                            justifyContent="center"
                            onClick={(event) => {
                                if (inSelect) return;

                                event.stopPropagation();
                                setFocusOnMapItem({ item });
                            }}
                        >
                            <Icon width="14px" height="14px" color="#929292" as={HiClock} cursor="pointer" marginRight="2px" />
                            <Text fontWeight="700" color="#929292" fontSize="12px">
                                {getEventTime(item)}
                            </Text>
                        </Flex>
                    )}

                    {item.distance && (
                        <Flex
                            borderRadius="20px"
                            height="18px"
                            //backgroundColor="#c242bb"
                            backgroundColor="white"
                            paddingLeft="2px"
                            paddingRight="5px"
                            align="center"
                            flexDirection="row"
                            justifyContent="center"
                            onClick={(event) => {
                                if (inSelect) return;

                                event.stopPropagation();
                                setFocusOnMapItem({ item });
                            }}
                        >
                            <Icon width="14px" height="14px" color="#929292" as={RiMapPinFill} cursor="pointer" marginRight="2px" />
                            <Text fontWeight="700" color="#929292" fontSize="12px">
                                {getDistanceString(item.distance)}
                            </Text>
                        </Flex>
                    )}
                </VStack>
            </Flex>
        </Flex>
    );
};

export default CircleListItem;
