//#region imports
import React, { useContext } from "react";
import { Flex, Box, VStack, Text, Image, Icon, HStack, Popover, PopoverContent, PopoverTrigger, PopoverArrow, Button, Spinner, Portal } from "@chakra-ui/react";
import { useNavigateNoUpdates, useLocationNoUpdates } from "components/RouterUtils";
import { IoAdd } from "react-icons/io5";
import i18n from "i18n/Localization";
import { getImageKitUrl, isConnected, hasUpdates, singleLineEllipsisStyle, twoLineEllipsisStyle } from "components/Helpers";
import { routes, openCircle } from "components/Navigation";
import { CirclePreview } from "screens/circle/CirclePreview";
import { RiLinksLine } from "react-icons/ri";
import Scrollbars from "react-custom-scrollbars-2";
import { NotificationsBell } from "screens/main/Messages";
import { atom, atomWithStorage, useAtom } from "jotai";
import { isMobileAtom, userAtom, userDataAtom, showNetworkLogoAtom, signInStatusAtom, circleAtom } from "components/Atoms";
//#endregion

export const CircleCover = ({ type, cover, ...props }) => {
    const [isMobile] = useAtom(isMobileAtom);
    const height = isMobile ? 250 : 464;
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
            width="100%"
            height={`${height}px`}
            src={getImageKitUrl(cover, null, height) ?? getDefaultCircleCover()}
            backgroundColor="white"
            objectFit="cover"
            {...props}
        />
    );
};

export const CirclePicture = ({ circle, size, hasPopover, popoverPlacement, onClick, onParentClick, ...props }) => {
    const [user] = useAtom(userAtom);
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
        if (!picture) return getDefaultCirclePicture();
        return getImageKitUrl(picture, size, size);
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
                        cursor={onClick ? "pointer" : "inherit"}
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
                    cursor={onClick ? "pointer" : "inherit"}
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
        if (!isMobile || !name) return "28px";

        if (name.length <= 16) return "24px";
        if (name.length <= 17) return "23px";
        if (name.length <= 18) return "22px";
        if (name.length <= 19) return "20px";
        if (name.length <= 20) return "19px";
        return "19px";
    };

    return (
        <Flex flex="initial" order="0" align="left" flexDirection="column" width="100%" height={isMobile ? "70px" : "100px"}>
            <Flex flexDirection="row" width="100%" align="center">
                <Flex align="left" flexDirection="column" width="100%" position="relative">
                    <Text style={twoLineEllipsisStyle} fontSize={getNameFontSize(circle?.name)} fontWeight="bold">
                        {circle?.name}
                    </Text>
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
    const smallSize = size === "sm" || size === "tiny";
    const height = smallSize ? "19px" : "22px";

    const getConnectionStatus = () => {
        let connection = user?.connections?.find((x) => x.target.id === circle.id);
        if (!connection) {
            return i18n.t("Follower");
        }
        if (connection.type.includes("owner_of")) {
            return i18n.t("Owner");
        } else if (connection.type.includes("admin_of")) {
            return i18n.t("Admin");
        } else if (connection.type.includes("moderator_of")) {
            return i18n.t("Moderator");
        } else if (connection.type.includes("connected_mutually_to")) {
            switch (connection?.target?.type) {
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
        } else if (connection.type.includes("connected_to")) {
            return i18n.t("Follower");
        } else if (connection.type.includes("creator_of")) {
            return i18n.t("Creator");
        } else if (connection.type.includes("connected_mutually_to_request")) {
            return i18n.t("Connecting");
        } else {
            return i18n.t("Connected");
        }
    };

    return (
        circle?.id !== user?.id && (
            <Box {...props}>
                {isConnected(user, circle) ? (
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
