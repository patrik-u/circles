//#region imports
import React, { useState, useEffect, useRef, useMemo } from "react";
import {
    Box,
    Flex,
    HStack,
    VStack,
    Text,
    Icon,
    Link,
    Image,
    IconButton,
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    useToast,
    useDisclosure,
    Portal,
    AlertDialog,
    AlertDialogBody,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogContent,
    AlertDialogOverlay,
    Button,
    Card,
    CardBody,
} from "@chakra-ui/react";
import {
    getDistanceString,
    getDateAndTimeLong,
    fromFsDate,
    getDateLong,
    singleLineEllipsisStyle,
    isPastEvent,
    getEventTime,
    isConnected,
    getPostTime,
    isAdmin,
    log,
    getMetaImage,
} from "@/components/Helpers";
import {
    CirclePicture,
    CircleTags,
    ConnectButton,
    CircleCover,
    FavoriteButton,
    ShareButtonMenu,
    NotificationsBell,
    SimilarityIndicator,
    CircleRichText,
    CardIf,
} from "@/components/CircleElements";
import { HiClock } from "react-icons/hi";
import { RiMapPinFill } from "react-icons/ri";
import { useLocationNoUpdates } from "@/components/RouterUtils";
import { useAtom } from "jotai";
import {
    isMobileAtom,
    userDataAtom,
    userAtom,
    focusOnMapItemAtom,
    highlightedCircleAtom,
    newCirclePopupAtom,
} from "@/components/Atoms";
import { AiOutlineHeart, AiFillHeart } from "react-icons/ai";
import { BsChatText, BsChatTextFill, BsChatFill, BsChat, BsLockFill } from "react-icons/bs";
import { CircleChat } from "@/components/CircleChat";
import axios from "axios";
import linkifyHtml from "linkify-html";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { HiOutlineDotsHorizontal } from "react-icons/hi";
import { FiEdit } from "react-icons/fi";
import { DeleteIcon } from "@chakra-ui/icons";
import { circleAtom } from "./Atoms";
//#endregion

const sliderSettings = {
    dots: true,
    infinite: false,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    adaptiveHeight: true,
    arrows: true,
};

export const MediaDisplay = ({ media, meta_data, ...props }) => {
    const SliderIf = ({ children, noSlider }) => {
        return noSlider ? children : <Slider {...sliderSettings}>{children}</Slider>;
    };

    const containerRef = useRef();
    const [containerWidth, setContainerWidth] = useState("100%");

    const allMedia = useMemo(() => {
        let m = media ?? [];
        let metaMedia =
            meta_data?.map((x) => ({
                name: x.title,
                is_meta_data: true,
                url: x.images[0],
                type: "image",
                link: x.url,
            })) ?? [];

        return [...m, ...metaMedia];
    }, [media, meta_data]);

    useEffect(() => {
        const handleResize = () => {
            if (containerRef.current) {
                setContainerWidth(`${containerRef.current.offsetWidth}px`);
            }
        };

        // Call resize function on component mount and add event listener for future resizes
        handleResize();
        window.addEventListener("resize", handleResize);

        // Cleanup event listener on component unmount
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    return (
        <Box ref={containerRef} width="100%" {...props}>
            <Box width={containerWidth}>
                <SliderIf noSlider={allMedia?.length <= 1}>
                    {allMedia
                        .filter((x) => x?.url)
                        .map((media) => (
                            <Flex
                                key={media.url}
                                flexDirection="column"
                                width="100%"
                                maxWidth={containerWidth}
                                backgroundColor="white"
                            >
                                <Image src={media.url} width="100%" height="100%" objectFit="contain" />
                                {media.link && (
                                    <Link href={media.link} target="_blank">
                                        <Flex
                                            // backgroundColor="#e5e5e5"
                                            height="30px"
                                            align="center"
                                            paddingLeft="5px"
                                            paddingRight="5px"
                                        >
                                            <Text style={singleLineEllipsisStyle} fontSize="12px">
                                                {media.name}
                                            </Text>
                                        </Flex>
                                    </Link>
                                )}
                            </Flex>
                        ))}
                </SliderIf>
            </Box>
        </Box>
    );
};

export const CircleDotsMenu = ({ circle, ...props }) => {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const cancelRef = useRef();
    const [userData] = useAtom(userDataAtom);
    const toast = useToast();
    const [, setNewCirclePopup] = useAtom(newCirclePopupAtom);

    if (!circle) return;

    const showDotsMenu = circle.type === "post" || circle.type === "event";
    if (!showDotsMenu) return null;

    // if user is author/admin of circle show dots menu
    if (!isAdmin(circle, userData)) return null;

    const editCircle = () => {
        setNewCirclePopup({ type: circle.type, circle: circle, isUpdateForm: true });
    };
    const deleteCircle = async () => {
        // delete circle
        let typeName = circle.type;
        typeName = typeName.charAt(0).toUpperCase() + typeName.slice(1);

        try {
            onClose();
            // delete circle
            let putCircleResult = null;
            try {
                putCircleResult = await axios.delete(`/circles/${circle.id}`, {
                    data: { name_confirmation: circle.name },
                });
            } catch (err) {
                console.log(err);
            }

            if (!putCircleResult || putCircleResult.data?.error) {
                toast({
                    title: `${typeName} couldn't be deleted`,
                    description: putCircleResult?.data?.error,
                    status: "error",
                    position: "top",
                    duration: 4500,
                    isClosable: true,
                });
            } else {
                toast({
                    title: `${typeName} has been deleted`,
                    status: "success",
                    position: "top",
                    duration: 4500,
                    isClosable: true,
                });
            }
        } catch (error) {
            toast({
                title: `${typeName} couldn't be deleted`,
                description: error,
                status: "error",
                position: "top",
                duration: 4500,
                isClosable: true,
            });
        }
    };

    return (
        <>
            <Menu>
                <MenuButton
                    as={IconButton}
                    icon={<HiOutlineDotsHorizontal />}
                    variant="ghost"
                    isRound="true"
                    size="sm"
                    {...props}
                ></MenuButton>
                <Portal>
                    <MenuList zIndex={1400}>
                        <MenuItem icon={<FiEdit />} onClick={editCircle}>
                            Edit
                        </MenuItem>
                        <MenuItem icon={<DeleteIcon />} onClick={onOpen}>
                            Delete
                        </MenuItem>
                    </MenuList>
                </Portal>
            </Menu>
            <AlertDialog isOpen={isOpen} leastDestructiveRef={cancelRef} onClose={onClose}>
                <AlertDialogOverlay>
                    <AlertDialogContent>
                        <AlertDialogHeader fontSize="lg" fontWeight="bold">
                            Delete {circle.type}
                        </AlertDialogHeader>

                        <AlertDialogBody>Are you sure? You can't undo this action afterwards.</AlertDialogBody>

                        <AlertDialogFooter>
                            <Button ref={cancelRef} onClick={onClose}>
                                Cancel
                            </Button>
                            <Button colorScheme="red" onClick={deleteCircle} ml={3}>
                                Delete
                            </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialogOverlay>
            </AlertDialog>
        </>
    );

    // <IconButton icon={<HiOutlineDotsHorizontal />} isRound="true" size="sm" variant="ghost" {...props} />;
};

const contentMargin = 10;
const contentMarginPx = contentMargin + "px";

const CircleListItemHeader = ({ item, inSelect, onClick, ...props }) => {
    const [circle] = useAtom(circleAtom);

    return (
        <Flex
            align="left"
            role="group"
            color="black"
            overflow="hidden"
            position="relative"
            flexDirection="row"
            flexGrow="0"
            flexShrink="0"
            {...props}
        >
            <Box
                margin={contentMarginPx}
                minWidth={item.type === "post" ? "40px" : "60px"}
                minHeight={item.type === "post" ? "40px" : "60px"}
                position="relative"
            >
                <CirclePicture
                    circle={item.type === "post" ? item.creator : item}
                    size={item.type === "post" ? 40 : 60}
                    hasPopover={true}
                />
            </Box>

            <HStack spacing="0px" align="center">
                <Text
                    fontSize={"15px"}
                    fontWeight="700"
                    textAlign="left"
                    style={singleLineEllipsisStyle}
                    onClick={onClick}
                    cursor="pointer"
                >
                    {item.type === "post" ? item.creator.name : item.name}
                </Text>
                {item.type === "post" && (
                    <>
                        {/* Time since post */}
                        <Text fontSize="15px" fontWeight="400" color="#8d8d8d" marginLeft="5px">
                            · {getPostTime(item)}
                        </Text>
                        {item.parent_circle && item.parent_circle.id !== circle?.id && (
                            <>
                                <Flex flexDir={"row"} align="center">
                                    <Text fontSize="15px" fontWeight="400" color="#8d8d8d" marginLeft="5px">
                                        ·
                                    </Text>
                                    <CirclePicture
                                        circle={item?.parent_circle}
                                        size={16}
                                        hasPopover={true}
                                        marginLeft="7px"
                                    />
                                    {/* <Text fontSize="12px" marginLeft="4px">
                                                {item?.parent_circle?.name}
                                            </Text> */}
                                </Flex>
                            </>
                        )}
                    </>
                )}
                {item.type === "event" && (
                    <Text
                        fontSize="15px"
                        fontWeight="400"
                        marginLeft="5px"
                        color={isPastEvent(item) ? "#8d8d8d" : "#cf1a1a"}
                        href={location?.pathname}
                    >
                        · {item.is_all_day ? getDateLong(item.starts_at) : getDateAndTimeLong(item.starts_at)}
                    </Text>
                )}
            </HStack>
            <CircleDotsMenu circle={item} position="absolute" top="5px" right="5px" />
        </Flex>
    );
};

export const CircleListItem = ({ item, onClick, inSelect, asCard, isCompact, ...props }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isMobile] = useAtom(isMobileAtom);
    const location = useLocationNoUpdates();
    const [showChat, setShowChat] = useState(false);
    const [formattedContent, setFormattedContent] = useState(item?.content);
    const [, setFocusOnMapItem] = useAtom(focusOnMapItemAtom);

    const onChatToggle = (showChat) => {
        setShowChat(showChat);
    };

    if (!item) return null;

    return (
        <CardIf noCard={!asCard} marginBottom="20px" noBody={true}>
            <Flex flexDirection="column" key={item.id} borderBottom={asCard ? "none" : "1px solid #ebebeb"}>
                <CircleListItemHeader item={item} inSelect={inSelect} onClick={onClick} {...props} />

                <VStack flexGrow="1" align="left" justifyContent="left" spacing="0px" overflow="hidden">
                    {item.content && (
                        <Box
                            align="left"
                            overflow="hidden"
                            maxHeight={isExpanded ? "none" : "150px"}
                            position="relative"
                            width="100%"
                        >
                            <Box
                                marginLeft={contentMarginPx}
                                marginRight={contentMarginPx}
                                position="relative"
                                maxHeight={isExpanded ? "none" : "150px"}
                                overflow="hidden"
                                align="left"
                            >
                                <Box marginBottom={isExpanded ? "30px" : "0px"} width="100%" overflow="hidden">
                                    <CircleRichText mentions={item.mentions}>{formattedContent}</CircleRichText>
                                </Box>
                                <Box
                                    position="absolute"
                                    height={isExpanded ? "100%" : "150px"}
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
                                                bottom="20px"
                                                left="0px"
                                                right="0px"
                                                height="50px"
                                                background="linear-gradient(rgba(255,255,255,0), rgba(255,255,255,1))"
                                            />
                                            <Box
                                                position="absolute"
                                                bottom="0px"
                                                left="0px"
                                                right="0px"
                                                height="20px"
                                                background="#ffffff"
                                            />
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
                                        color="#6491ff"
                                    >
                                        {isExpanded ? "Show less" : "Show more"}
                                    </Link>
                                </Box>
                            </Box>
                        </Box>
                    )}

                    {item.type !== "post" && item.description && (
                        <Box paddingBottom="2px" marginLeft={contentMarginPx} marginRight={contentMarginPx}>
                            <Text fontSize="14px" textAlign="left" style={singleLineEllipsisStyle}>
                                {item.description}
                            </Text>
                        </Box>
                    )}

                    {item.media && !isCompact && (
                        <MediaDisplay media={item.media} meta_data={item.meta_data} marginTop="10px" />
                    )}

                    {item.type !== "post" && !isCompact && (
                        <CircleCover circle={item} nullIfMissing={true} maxHeight="500px" marginTop="10px" />
                    )}

                    <Box paddingTop="4px" marginLeft={contentMarginPx} marginRight={contentMarginPx}>
                        <CircleTags circle={item} size="tiny" inSelect={inSelect} />
                    </Box>

                    {/* <Box>
                <LatestMembers item={item} circleId={item.id} size={16} hasPopover={true} marginTop="6px" spacing="4px" />
            </Box> */}
                    {/* {showChat && (
                        <Box align="start" paddingTop="10px">
                            <CircleChat item={item} embeddedChatHeight={400} />
                        </Box>
                    )} */}
                    {!inSelect && (
                        <Box paddingTop="2px" marginLeft={contentMarginPx} marginBottom="5px">
                            <CircleActions circle={item} onChatToggle={onChatToggle} />
                        </Box>
                    )}
                </VStack>

                <VStack position="absolute" top="0px" right="7px" align="left" spacing="2px">
                    {item.type === "event" && (
                        <Flex
                            borderRadius="20px"
                            height="18px"
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
                            <Icon
                                width="14px"
                                height="14px"
                                color="#929292"
                                as={HiClock}
                                cursor="pointer"
                                marginRight="2px"
                            />
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
                            <Icon
                                width="14px"
                                height="14px"
                                color="#929292"
                                as={RiMapPinFill}
                                cursor="pointer"
                                marginRight="2px"
                            />
                            <Text fontWeight="700" color="#929292" fontSize="12px">
                                {getDistanceString(item.distance)}
                            </Text>
                        </Flex>
                    )}
                </VStack>
            </Flex>
        </CardIf>
    );
};

export const CommentButton = ({ circle, onCommentToggle }) => {
    const [isMobile] = useAtom(isMobileAtom);
    const [user] = useAtom(userAtom);
    const [userData] = useAtom(userDataAtom);
    const iconSize = 18;
    const iconSizePx = iconSize + "px";
    const [showComments, setShowComments] = useState(false);

    const toggleComments = () => {
        if (!circle?.id) {
            return;
        }

        let newShowComments = !showComments;
        setShowComments(newShowComments);
        onCommentToggle(newShowComments);
    };

    const isAuthorized = () => {
        return circle.is_public || isConnected(userData, circle?.id, ["connected_mutually_to"]);
    };

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
                onClick={toggleComments}
                cursor="pointer"
                color={showComments ? "#2596ff" : "#333"}
            >
                <Icon
                    width={iconSizePx}
                    height={iconSizePx}
                    as={!isAuthorized() ? BsChat : showComments ? BsChatTextFill : BsChatText}
                />
                {!isAuthorized() && (
                    <Icon position="absolute" width="14px" height="14px" as={BsLockFill} right="4px" bottom="2px" />
                )}
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
        axios
            .post(`/circles/${user.id}/settings`, {
                circleId: circle.id,
                settings: { liked: liked },
            })
            .catch((err) => {
                console.error(err);
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

export const CircleActions = ({ circle, onCommentToggle, ...props }) => {
    const [isMobile] = useAtom(isMobileAtom);
    const [userData] = useAtom(userDataAtom);

    if (!circle) return null;

    return (
        <Flex position="relative" align="center" flexDirection="row">
            <CommentButton circle={circle} onCommentToggle={onCommentToggle} />
            <LikeButton circle={circle} />
            {/* <ShareButtonMenu /> */}
            {/* <FavoriteButton />
            {isConnected(userData, circle.id, ["connected_mutually_to"]) && <NotificationsBell />}
            
            <ConnectButton circle={circle} hoverFadeColor="#ffffff" /> */}
        </Flex>
    );
};

export default CircleListItem;
