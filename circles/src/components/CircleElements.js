//#region imports
import React, { useContext } from "react";
import {
    Flex,
    Box,
    VStack,
    Text,
    Image,
    Icon,
    HStack,
    Popover,
    Link,
    PopoverContent,
    PopoverTrigger,
    PopoverArrow,
    Button,
    Spinner,
    Portal,
} from "@chakra-ui/react";
import { useNavigateNoUpdates, useLocationNoUpdates } from "components/RouterUtils";
import { IoAdd } from "react-icons/io5";
import i18n from "i18n/Localization";
import { getImageKitUrl, isConnected, hasUpdates, singleLineEllipsisStyle, twoLineEllipsisStyle, getCircleTypes } from "components/Helpers";
import { routes, openCircle } from "components/Navigation";
import { CirclePreview } from "screens/circle/CirclePreview";
import { RiLinksLine } from "react-icons/ri";
import { GrGallery } from "react-icons/gr";
import { FaMapMarkedAlt } from "react-icons/fa";
import { IoMap } from "react-icons/io5";
import Scrollbars from "react-custom-scrollbars-2";
import { NotificationsBell } from "screens/main/Messages";
import { atom, atomWithStorage, useAtom } from "jotai";
import {
    isMobileAtom,
    userAtom,
    userDataAtom,
    displayModeAtom,
    showNetworkLogoAtom,
    signInStatusAtom,
    circleAtom,
    circleConnectionsAtom,
} from "components/Atoms";
import { displayModes } from "components/Constants";
//#endregion

export const CirclePanel = ({ children, title }) => {
    return (
        <Box align="left" marginLeft={{ base: "22px", md: "22px" }} marginBottom={{ base: "50px", md: "0px" }}>
            <Text className="contentSubHeader">{title}</Text>
            {children}
        </Box>
    );
};

export const CircleTagsPanel = () => {
    const [circle] = useAtom(circleAtom);
    if (!circle?.tags || circle?.tags?.length <= 0) return null;

    return (
        <CirclePanel title={i18n.t("Tags")}>
            <CircleTags circle={circle} showAll={true} wrap="wrap" />
        </CirclePanel>
    );
};

export const QuickLinks = ({ circle }) => {
    const location = useLocationNoUpdates();

    if (!circle?.social_media) return null;

    return (
        <HStack spacing="10px" alignSelf="start">
            {circle.social_media.facebook && (
                <Link href={circle.social_media.facebook} target="_blank">
                    <Image src={"/social_facebook26x26.png"} className="social-media-icon" />
                </Link>
            )}
            {circle.social_media.twitter && (
                <Link href={circle.social_media.twitter} target="_blank">
                    <Image src={"/social_twitter26x26.png"} className="social-media-icon" />
                </Link>
            )}
            {circle.social_media.instagram && (
                <Link href={circle.social_media.instagram} target="_blank">
                    <Image src={"/social_instagram26x26.png"} className="social-media-icon" />
                </Link>
            )}
            {circle.social_media.youtube && (
                <Link href={circle.social_media.youtube} target="_blank">
                    <Image src={"/social_youtube26x26.png"} className="social-media-icon" />
                </Link>
            )}
            {circle.social_media.tiktok && (
                <Link href={circle.social_media.tiktok} target="_blank">
                    <Image src={"/social_tiktok26x26.png"} className="social-media-icon" />
                </Link>
            )}
            {circle.social_media.linkedin && (
                <Link href={circle.social_media.linkedin} target="_blank">
                    <Image src={"/social_linkedin26x26.png"} className="social-media-icon" />
                </Link>
            )}
            {circle.social_media.medium && (
                <Link href={circle.social_media.medium} target="_blank">
                    <Image src={"/social_medium26x26.png"} className="social-media-icon" />
                </Link>
            )}
            {circle.social_media.link1 && (
                <Link href={circle.social_media.link1} target="_blank">
                    <Image src={"/social_link26x26.png"} className="social-media-icon" />
                </Link>
            )}
            {circle.social_media.link2 && (
                <Link href={circle.social_media.link2} target="_blank">
                    <Image src={"/social_link26x26.png"} className="social-media-icon" />
                </Link>
            )}
            {circle.social_media.link3 && (
                <Link href={circle.social_media.link3} target="_blank">
                    <Image src={"/social_link26x26.png"} className="social-media-icon" />
                </Link>
            )}
            <Link href={location.pathname} target="_blank">
                <Image src={"/social_codo26x26.png"} className="social-media-icon" />
            </Link>
        </HStack>
    );
};

export const QuickLinksPanel = () => {
    const [circle] = useAtom(circleAtom);
    if (!circle?.social_media) return null;

    return (
        <CirclePanel title={i18n.t("Quick Links")}>
            <QuickLinks circle={circle} />
        </CirclePanel>
    );
};

export const CircleMembersPanel = () => {
    const [isMobile] = useAtom(isMobileAtom);
    const [circle] = useAtom(circleAtom);
    const [circleConnections] = useAtom(circleConnectionsAtom);
    if (!circle?.id) return null;

    const circleTypes = getCircleTypes(circle.type, "user");
    const members = circleConnections.filter((x) => x.circle_types === circleTypes && x.display_circle.picture).map((x) => x.display_circle);

    const size = 44;
    const sizePx = size + "px";
    const spacing = 6;
    const spacingPx = spacing + "px";

    return (
        <CirclePanel title={i18n.t(`Members [${circle?.type}]`)}>
            <Flex flexWrap="wrap">
                {members.map((member) => (
                    <Box key={member.id} width={sizePx} height={sizePx} marginRight={spacingPx} marginBottom={spacingPx}>
                        <CirclePicture circle={member} hasPopover={true} size={size} />
                    </Box>
                ))}
            </Flex>
        </CirclePanel>
    );
};

export const CircleRightPanel = ({ section }) => {
    const [isMobile] = useAtom(isMobileAtom);
    const [circle] = useAtom(circleAtom);

    switch (section) {
        case "home":
            return (
                <>
                    {circle?.type === "user" && <QuickLinksPanel />}
                    <CircleTagsPanel />
                    <CircleMembersPanel />
                </>
            );

        default:
        case "chat":
        case "circles":
            return isMobile ? null : (
                <>
                    {circle?.type === "user" && <QuickLinksPanel />}
                    <CircleTagsPanel />
                    <CircleMembersPanel />
                </>
            );
    }
};

export const DisplayModeButtons = ({ ...props }) => {
    const [isMobile] = useAtom(isMobileAtom);
    const [displayMode, setDisplayMode] = useAtom(displayModeAtom);
    const iconCircleSize = isMobile ? "38px" : "48px";
    const iconSize = isMobile ? "22px" : "28px";

    return (
        <VStack
            position="absolute"
            right={isMobile ? (displayMode === displayModes.map ? "40px" : "10px") : "12px"}
            bottom={isMobile ? "10px" : displayMode === displayModes.map ? "26px" : "12px"}
            {...props}
        >
            <Flex
                backgroundColor="#f4f4f4dd"
                _hover={{ backgroundColor: "#1fff50dd" }}
                width={iconCircleSize}
                height={iconCircleSize}
                borderRadius="50%"
                cursor="pointer"
                alignItems="center"
                justifyContent="center"
                onClick={() => setDisplayMode(displayMode === displayModes.default ? displayModes.map : displayModes.default)}
            >
                <Icon
                    width={iconSize}
                    height={iconSize}
                    color="black"
                    as={displayMode === displayModes.default ? FaMapMarkedAlt : GrGallery}
                    cursor="pointer"
                />
            </Flex>
        </VStack>
    );
};

export const CircleCover = ({ type, cover, coverWidth, coverHeight, ...props }) => {
    const getDefaultCircleCover = () => {
        switch (type) {
            default:
            case "circle":
                return "/default-circle-cover.png";
            case "event":
                return "/default-event-cover.png";
            case "user":
                return "/default-user-cover.png";
        }
    };

    return (
        <Image
            width={coverWidth ? `${coverWidth}px` : "100%"}
            height={`${coverHeight}px`}
            src={getImageKitUrl(cover ?? getDefaultCircleCover(), coverWidth, coverHeight)}
            backgroundColor="white"
            objectFit="cover"
            {...props}
        />
    );
};

export const CirclePicture = ({ circle, size, hasPopover, popoverPlacement, disableClick, ...props }) => {
    const navigate = useNavigateNoUpdates();
    const [userData] = useAtom(userDataAtom);
    const [isMobile] = useAtom(isMobileAtom);

    const getDefaultCirclePicture = () => {
        switch (circle.type) {
            case "event":
                return "/default-event-picture.png";
            default:
            case "circle":
                return "/default-circle-picture.png";
            case "user":
                return "/default-user-picture.png";
            case "tag":
                return "/default-tag-picture.png";
            case "link":
                return "/default-link-picture.png";
        }
    };

    const getCirclePicture = (picture) => {
        return getImageKitUrl(picture ?? getDefaultCirclePicture(), size, size);
    };

    const onClick = () => {
        if (disableClick) return;
        openCircle(navigate, circle?.id);
    };

    const onParentClick = () => {
        if (disableClick) return;
        openCircle(navigate, circle?.parent_circle?.id);
    };

    return hasPopover && !isMobile ? (
        <Box width={`${size}px`} height={`${size}px`} position="relative" flexShrink="0" flexGrow="0">
            <Popover isLazy trigger="hover" gutter="0">
                <PopoverTrigger>
                    <Image
                        width={`${size}px`}
                        height={`${size}px`}
                        src={getCirclePicture(circle?.picture)}
                        flexShrink="0"
                        flexGrow="0"
                        borderRadius="50%"
                        objectFit="cover"
                        onClick={onClick}
                        cursor={!disableClick ? "pointer" : "inherit"}
                        fallbackSrc={getCirclePicture(getDefaultCirclePicture())}
                        {...props}
                    />
                </PopoverTrigger>
                <Portal>
                    <PopoverContent backgroundColor="transparent" borderColor="transparent" width="450px">
                        <Box zIndex="160" onClick={onClick} cursor={onClick ? "pointer" : "inherit"}>
                            <PopoverArrow />
                            <CirclePreview item={circle} />
                        </Box>
                    </PopoverContent>
                </Portal>
            </Popover>
        </Box>
    ) : (
        <Box width={`${size}px`} height={`${size}px`} position="relative" flexShrink="0" flexGrow="0">
            {circle && (
                <Image
                    width={`${size}px`}
                    height={`${size}px`}
                    src={getCirclePicture(circle?.picture)}
                    flexShrink="0"
                    flexGrow="0"
                    borderRadius="50%"
                    objectFit="cover"
                    onClick={onClick}
                    cursor={!disableClick ? "pointer" : "inherit"}
                    fallbackSrc={getCirclePicture(getDefaultCirclePicture())}
                    {...props}
                />
            )}
            {circle?.id !== "earth" && circle?.parent_circle && (
                <Image
                    position="absolute"
                    width={`${size / 3}px`}
                    height={`${size / 3}px`}
                    top="0px"
                    left="0px"
                    src={getCirclePicture(circle?.parent_circle?.picture)}
                    flexShrink="0"
                    flexGrow="0"
                    borderRadius="50%"
                    objectFit="cover"
                    onClick={onParentClick}
                    cursor={!disableClick ? "pointer" : "inherit"}
                    fallbackSrc={getCirclePicture(getDefaultCirclePicture())}
                    {...props}
                />
            )}

            {hasUpdates(userData, circle, "any") && (
                <Box
                    width={`${size / 7}px`}
                    height={`${size / 7}px`}
                    backgroundColor="#ff6499"
                    borderRadius="50%"
                    position="absolute"
                    bottom="0px"
                    right="0px"
                ></Box>
            )}
        </Box>
    );
};

export const CircleHeader = ({ circle, onConnect, createNew, filterConnected, setFilterConnected, title }) => {
    const [isMobile] = useAtom(isMobileAtom);

    const getNameFontSize = (name) => {
        if (!isMobile || !name) return "32px";

        if (name.length <= 16) return "24px";
        if (name.length <= 17) return "23px";
        if (name.length <= 18) return "22px";
        if (name.length <= 19) return "20px";
        if (name.length <= 20) return "19px";
        return "19px";
    };

    return (
        <Flex flex="initial" order="0" align="left" flexDirection="column" width="100%" height={isMobile ? "120px" : "140px"}>
            <Flex flexDirection="row" width="100%" align="center">
                <Flex align="left" flexDirection="column" width="100%" position="relative">
                    <Text style={twoLineEllipsisStyle} fontSize={getNameFontSize(circle?.name)} fontWeight="bold" marginTop={isMobile ? "0px" : "5px"}>
                        {circle?.name}
                    </Text>
                    <Box width="fit-content" borderRadius="20px" backgroundColor="gray.100" paddingLeft="10px" paddingRight="10px" marginBottom="10px">
                        <Text fontSize="14px" fontWeight="500">
                            {circle?.type}
                        </Text>
                    </Box>

                    <Text style={twoLineEllipsisStyle}>{circle?.description}</Text>

                    {/* {circle?.name} Longer Name Network */}

                    {/* <Box marginTop="4px" position="relative">
                            <CircleTags circle={circle} size={isMobile ? "sm" : "md"} />
                        </Box>
                        <Flex position="absolute" top="5px" right="5px" flexDirection="row" align="center" height="24px">
                            {circle?.id !== "earth" && <ConnectButton circle={circle} onConnect={onConnect} size={isMobile ? "md" : "lg"} />}
                            {circle?.id !== "earth" && <NotificationsBell circle={circle} />}
                        </Flex> */}
                </Flex>
            </Flex>
        </Flex>
    );
};

export const CircleTags = ({ circle, inSelect, showAll = false, size = "md", wrap = "nowrap" }) => {
    const navigate = useNavigateNoUpdates();
    const [user] = useAtom(userAtom);

    const isOverlap = (causeId) => {
        return user?.tags?.some((x) => x.id === causeId);
    };
    const tagColor = (tag) => {
        let overlap = isOverlap(tag?.id);
        if (!overlap) {
            if (tag.is_custom) {
                return "#c9c1d9";
            } else {
                return "#9cb5f7";
            }
        } else {
            if (tag.is_custom) {
                return "#a9d9a4";
            } else {
                return "#50cb7c";
            }
        }
    };

    const smallSize = size === "sm" || size === "tiny";

    const getFontSize = () => {
        switch (size) {
            default:
            case "md":
                return "14px";
            case "sm":
                return "12px";
            case "tiny":
                return "10px";
        }
    };

    const hoverColor = (tag) => {
        let overlap = isOverlap(tag?.id);
        if (!overlap) {
            if (tag.is_custom) {
                return "#c9c1d9";
            } else {
                return "#799af5";
            }
        } else {
            if (tag.is_custom) {
                return "#a9d9a4";
            } else {
                return "#26c95f";
            }
        }
    };

    return (
        circle?.tags?.length > 0 && (
            <Flex flexWrap={wrap}>
                {circle.tags?.slice(0, showAll ? 10000 : 3)?.map((tag) => (
                    <Box
                        key={tag.id}
                        fontSize={getFontSize()}
                        padding={smallSize ? "2px 6px 2px 6px" : "2px 13px 2px 10px"}
                        margin={smallSize ? "0px 4px 0px 0px" : "0px 4px 4px 2px"}
                        cursor={tag.is_custom ? "auto" : "pointer"}
                        background={tagColor(tag)}
                        _hover={{ backgroundColor: hoverColor(tag) }}
                        color="white"
                        height="auto"
                        borderRadius="20px"
                        onClick={
                            tag.is_custom
                                ? (event) => {
                                      event.stopPropagation();
                                  }
                                : (event) => {
                                      if (inSelect) return;

                                      event.stopPropagation();
                                      openCircle(navigate, tag.id);
                                  }
                        }
                    >
                        <Text style={singleLineEllipsisStyle}>{tag.text}</Text>
                    </Box>
                ))}
            </Flex>
        )
    );
};

export const getConnectLabel = (circleType, connectType) => {
    switch (connectType) {
        case "owner_of":
            return i18n.t("Owner");
        case "admin_of":
            return i18n.t("Admin");
        case "moderator_of":
            return i18n.t("Moderator");
        case "connected_mutually_to":
            switch (circleType) {
                default:
                case "circle":
                    return i18n.t("Member");
                case "user":
                    return i18n.t("Contact");
                case "event":
                    return i18n.t("Attendee");
                case "tag":
                    return i18n.t("Supporter");
            }
        case "connected_mutually_to_request":
            return i18n.t(`Request [${circleType}]`);
        case "connected_to":
            return i18n.t("Follower");
        case "creator_of":
            return i18n.t("Creator");
        default:
            return i18n.t("Connected");
    }
};

export const ConnectButton = ({ circle, onConnect, size = "sm", ...props }) => {
    const [user] = useAtom(userAtom);
    const [userData] = useAtom(userDataAtom);
    const smallSize = size === "sm" || size === "tiny";
    const height = smallSize ? "19px" : "22px";

    const getConnectionStatus = () => {
        return i18n.t("Connected");

        // PWA123 we don't have user connections
        // let connection = user?.connections?.find((x) => x.target.id === circle.id);
        // if (!connection) {
        //     return i18n.t("Follower");
        // }
        // if (connection.type.includes("owner_of")) {
        //     return i18n.t("Owner");
        // } else if (connection.type.includes("admin_of")) {
        //     return i18n.t("Admin");
        // } else if (connection.type.includes("moderator_of")) {
        //     return i18n.t("Moderator");
        // } else if (connection.type.includes("connected_mutually_to")) {
        //     switch (connection?.target?.type) {
        //         default:
        //         case "circle":
        //             return i18n.t("Member");
        //         case "user":
        //             return i18n.t("Contact");
        //         case "event":
        //             return i18n.t("Attendee");
        //         case "tag":
        //             return i18n.t("Supporter");
        //     }
        // } else if (connection.type.includes("connected_to")) {
        //     return i18n.t("Follower");
        // } else if (connection.type.includes("creator_of")) {
        //     return i18n.t("Creator");
        // } else if (connection.type.includes("connected_mutually_to_request")) {
        //     return i18n.t("Connecting");
        // } else {
        //     return i18n.t("Connected");
        // }
    };

    return (
        circle?.id !== user?.id && (
            <Box {...props}>
                {isConnected(userData, circle?.id) ? (
                    <Flex flexDirection="row" position="relative">
                        <Box
                            backgroundImage="linear-gradient(to right, transparent, #ffffff);"
                            width="10px"
                            height={height}
                            position="absolute"
                            left="-15px"
                            _groupHover={{
                                backgroundImage: "linear-gradient(to right, transparent, #ddd8db);",
                            }}
                        ></Box>
                        <Box
                            backgroundColor="white"
                            width="15px"
                            height={height}
                            position="absolute"
                            left="-5px"
                            _groupHover={{
                                backgroundColor: "#ddd8db",
                            }}
                        ></Box>
                        <Button
                            colorScheme="blue"
                            borderRadius="25px"
                            lineHeight="0"
                            padding="0px 5px 0px 8px"
                            variant="ghost"
                            backgroundColor="#ffffff"
                            color="#333"
                            border="1px solid #e7e7e7"
                            height={height}
                            onClick={(event) => {
                                event.stopPropagation();
                                onConnect(user, circle, "list");
                            }}
                            position="relative"
                        >
                            <HStack spacing="4px">
                                <Text fontSize="11px" fontWeight="700">
                                    {getConnectionStatus()}
                                </Text>
                                <RiLinksLine size="12px" />
                            </HStack>
                        </Button>
                    </Flex>
                ) : (
                    <Box>
                        <Flex
                            width={height}
                            height={height}
                            borderRadius="50%"
                            lineHeight="0"
                            backgroundColor="#389bf8"
                            color="white"
                            onClick={(event) => {
                                event.stopPropagation();
                                onConnect(user, circle, "list");
                            }}
                            position="relative"
                            align="center"
                            justifyContent="center"
                            _hover={{
                                backgroundColor: "var(--chakra-colors-blue-600);",
                            }}
                            _active={{
                                backgroundColor: "var(--chakra-colors-blue-700);",
                            }}
                            cursor="pointer"
                        >
                            <RiLinksLine size="12px" />
                        </Flex>
                    </Box>
                )}
            </Box>
        )
    );
};
