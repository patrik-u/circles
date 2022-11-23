//#region imports
import React, { useState, useEffect, useContext } from "react";
import {
    Flex,
    Box,
    VStack,
    Text,
    Image,
    Icon,
    useToast,
    HStack,
    Popover,
    PopoverContent,
    PopoverTrigger,
    PopoverArrow,
    Tabs,
    Tab,
    TabList,
    MenuButton,
    ButtonGroup,
    IconButton,
    Button,
    MenuList,
    MenuItem,
    Spinner,
    Menu,
    Portal,
} from "@chakra-ui/react";
import UserContext from "./UserContext";
import { isMobile } from "react-device-detect";
import { useNavigate, useLocation, matchPath } from "react-router-dom";
import { AiFillHome, AiOutlineGlobal } from "react-icons/ai";
import { RiAdminLine, RiShareLine } from "react-icons/ri";
import { MdSettings } from "react-icons/md";
import { FaCalendarAlt } from "react-icons/fa";
import { IoIosLink } from "react-icons/io";
import { HiUsers } from "react-icons/hi";
import { IoAdd } from "react-icons/io5";
import { BsChatText } from "react-icons/bs";
import { ImQrcode } from "react-icons/im";
import { BiNetworkChart } from "react-icons/bi";
import i18n from "i18n/Localization";
import { toastInfo, getImageKitUrl } from "./Helpers";
import { QRCodeCanvas } from "qrcode.react";
import { FacebookShareButton, TwitterShareButton, FacebookIcon, TwitterIcon } from "react-share";
import { RiMapPinFill, RiLinksLine } from "react-icons/ri";
import { CircleItemSmall } from "../screens/Circle";
import Scrollbars from "react-custom-scrollbars-2";
import { fromFsDate, log } from "./Helpers";
import { defaultEarthCircle } from "../store";
import { NotificationsBell } from "./Messages";
//#endregion

export const routes = {
    home: "/circle/earth/circles",
    circle: (id) => ({
        home: `/circle/${id}`,
        chat: `/circle/${id}/chat`,
        users: `/circle/${id}/users`,
        rooms: `/circle/${id}/rooms`,
        circles: `/circle/${id}/circles`,
        events: `/circle/${id}/events`,
        links: `/circle/${id}/links`,
        new: `/circle/${id}/new`,
        settings: {
            home: `/circle/${id}/settings`,
            about: `/circle/${id}/settings`,
            images: `/circle/${id}/settings/images`,
            tags: `/circle/${id}/settings/tags`,
            questions: `/circle/${id}/settings/questions`,
            base: `/circle/${id}/settings/base`,
            socialmedia: `/circle/${id}/settings/socialmedia`,
            connections: `/circle/${id}/settings/connections`,
            misc: `/circle/${id}/settings/misc`,
        },
    }),
    appAdmin: "/appAdmin",
    graph: "/graph",
};

export const defaultContentWidth = "435px";

export const ShareButtonMenu = ({ children, referrer }) => {
    const location = useLocation();
    const [absoluteLocation, setAbsoluteLocation] = useState();
    const [absoluteQrLocation, setAbsoluteQrLocation] = useState();
    const toast = useToast();

    const copyPageLink = () => {
        navigator.clipboard.writeText(absoluteLocation).then(
            function () {
                toastInfo(toast, i18n.t("Copied to clipboard"));
            },
            function (err) {}
        );
    };

    const downloadQrCode = () => {
        // generate download with use canvas and stream
        const canvas = document.getElementById("qr-code");
        const pngUrl = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
        let downloadLink = document.createElement("a");
        downloadLink.href = pngUrl;
        downloadLink.download = `qr.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    };

    useEffect(() => {
        log("ShareButtonMenu.useEffect 1");
        const urlParams = new URLSearchParams(window.location.search);

        if (referrer) {
            urlParams.set("referrerId", referrer.id);
        }

        var hasParams = Array.from(urlParams).length > 0;
        var urlWithParams = hasParams ? window.location.href.split("?")[0] + "?" + urlParams.toString() : window.location.href;

        urlParams.set("qrCode", "true");
        var urlWithQrParams = window.location.href.split("?")[0] + "?" + urlParams.toString();
        setAbsoluteLocation((current) => urlWithParams);
        setAbsoluteQrLocation((current) => urlWithQrParams);
    }, [location, referrer]);

    return (
        <Menu closeOnBlur="true">
            <MenuButton
                as={Button}
                rounded={"full"}
                variant={"link"}
                cursor={"pointer"}
                minW={0}
                position="absolute"
                right="20px"
                bottom="-40px"
                overflow="hidden"
                zIndex="1"
            >
                <Flex flexDirection="row" align="center">
                    <RiShareLine size="24px" color="black" />
                </Flex>
            </MenuButton>
            <MenuList alignItems={"center"} borderRadius="10" width={{ base: "100%", md: "250px" }} overflow="hidden">
                <MenuItem>
                    <FacebookShareButton url={absoluteLocation}>
                        <HStack align="center">
                            <FacebookIcon size={32} round />
                            <Text>{i18n.t("Share on Facebook")}</Text>
                        </HStack>
                    </FacebookShareButton>
                </MenuItem>
                <MenuItem>
                    <TwitterShareButton url={absoluteLocation}>
                        <HStack align="center">
                            <TwitterIcon size={32} round />
                            <Text>{i18n.t("Share on Twitter")}</Text>
                        </HStack>
                    </TwitterShareButton>
                </MenuItem>
                <MenuItem icon={<IoIosLink size={28} />} onClick={copyPageLink}>
                    {i18n.t("Copy link to page")}
                </MenuItem>
                <MenuItem icon={<ImQrcode size={28} />} onClick={downloadQrCode}>
                    {i18n.t("Download QR code")}
                    <QRCodeCanvas id="qr-code" size={400} includeMargin={true} value={absoluteQrLocation} hidden />
                </MenuItem>
            </MenuList>
        </Menu>
    );
};

export const isConnectedToUser = (user, item) => {
    return user?.connectionsToUser?.some((x) => x.source.id === item.id);
};

export const getConnectionLabel = (user, item) => {
    let connection = user?.connectionsToUser?.find((x) => x.source.id === item.id);
    if (!connection) return null;
    if (connection.type.includes("owned_by")) {
        return i18n.t("Owned by you");
    } else if (connection.type.includes("admin_by")) {
        return i18n.t("Administered by you");
    } else if (connection.type.includes("moderated_by")) {
        return i18n.t("Moderated by you");
    } else if (connection.type.includes("created_by")) {
        return i18n.t("Created by you");
    } else if (connection.type.includes("connected_to")) {
        return i18n.t("Follows you");
    } else if (connection.type.includes("connected_mutually_to")) {
        return i18n.t("Connected to you");
    } else {
        return null;
    }
};

export const LatestConnections = ({ item, circleId, size, remainingFontSize, hasPopover, ...props }) => {
    const navigate = useNavigate();

    const remainingConnectionsCount = () => {
        return item.connections - item?.latest_connections?.length ?? 0;
    };

    const pictureSize = size ?? 20;
    const _remainingFontSize = remainingFontSize ?? "10px";

    const navigateToConnection = (circleId) => {
        navigate(routes.circle(circleId).home);
    };

    return (
        <HStack {...props}>
            {item.latest_connections?.map((connection) => (
                <CirclePicture
                    key={connection.id}
                    circle={connection}
                    hasPopover={hasPopover}
                    size={pictureSize + "px"}
                    onClick={() => navigateToConnection(connection.id)}
                />
            ))}

            {remainingConnectionsCount() > 0 && (
                <Flex
                    height={pictureSize + "px"}
                    minWidth={pictureSize + "px"}
                    borderRadius={pictureSize + "px"}
                    backgroundColor="#eeeeee"
                    flexDirection="row"
                    align="center"
                    cursor="pointer"
                    onClick={() => navigate(routes.circle(circleId ?? "earth").users)}
                >
                    <Text textAlign="center" minWidth={pictureSize - 8 + "px"} fontSize={_remainingFontSize} color="#5a5a5a" marginLeft="4px" marginRight="4px">
                        +{remainingConnectionsCount().toLocaleString()}
                    </Text>
                </Flex>
            )}
        </HStack>
    );
};

export const getNavigationItems = (circle, user) => {
    let id = circle?.id ?? "earth";
    let navigationItems = [];
    navigationItems.push({ route: routes.circle(id).home, name: i18n.t("Home"), icon: AiFillHome, switchOffMap: true, matchSubPaths: false, category: "home" });

    navigationItems.push({
        route: routes.circle(id).chat,
        name: i18n.t("Chat"),
        icon: BsChatText,
        switchOffMap: true,
        matchSubPaths: true,
        category: "chat",
    });
    navigationItems.push({
        route: routes.circle(id).circles,
        name: i18n.t("Circles"),
        icon: BiNetworkChart,
        switchOffMap: true,
        matchSubPaths: true,
        category: "circles",
    });
    navigationItems.push({
        route: routes.circle(id).events,
        name: i18n.t("Events"),
        icon: FaCalendarAlt,
        switchOffMap: true,
        matchSubPaths: true,
        category: "events",
    });
    navigationItems.push({
        route: routes.circle(id).rooms,
        name: i18n.t("Rooms"),
        switchOffMap: true,
        matchSubPaths: true,
        category: "rooms",
        image: require("../assets/images/room_icon.png"),
    });
    navigationItems.push({
        route: routes.circle(id).links,
        name: i18n.t("Links"),
        icon: AiOutlineGlobal,
        switchOffMap: true,
        matchSubPaths: true,
        category: "links",
    });
    navigationItems.push({ route: routes.circle(id).users, name: i18n.t("Users"), icon: HiUsers, switchOffMap: true, matchSubPaths: true, category: "users" });
    navigationItems.push({
        route: routes.circle(id).settings.home,
        name: i18n.t("Settings"),
        icon: MdSettings,
        requireAdmin: true,
        switchOffMap: true,
        matchSubPaths: true,
        category: "settings",
    });

    if (user?.is_admin) {
        navigationItems.push({ route: routes.appAdmin, name: i18n.t("Admin"), icon: RiAdminLine, switchOffMap: true, matchSubPaths: true });
    }

    return navigationItems;
};

export const isAdmin = (circle, user) => {
    if (circle?.id === user?.id) return true;
    return user?.connections?.some((x) => x.target.id === circle.id && (x.type?.includes("owner_of") || x.type?.includes("admin_of")));
};

//  takes connections to same source or target and clusters them
export const clusterConnections = (connections, clusterSource) => {
    // merge user connections of the same type
    let filteredConnections = [];
    let connections_clone = connections;
    try {
        if (typeof structuredClone === "function") {
            connections_clone = structuredClone(connections);
        }
    } catch {
        connections_clone = connections;
    }

    if (Array.isArray(connections)) {
        let seen = {};
        filteredConnections = connections_clone?.filter((entry) => {
            var previous;
            var clusterId = clusterSource ? entry.source.id : entry.target.id;

            // have we seen this label before?
            if (seen.hasOwnProperty(clusterId)) {
                // yes, grab it and add this data to it
                previous = seen[clusterId];
                previous.type.push(entry.type);

                // don't keep this entry, we've merged it into the previous one
                return false;
            }

            // entry.type probably isn't an array; make it one for consistency
            if (!Array.isArray(entry.type)) {
                entry.type = [entry.type];
            }

            // remember that we've seen it
            seen[clusterId] = entry;
            return true;
        });
    }
    return filteredConnections;
};

export const adminCircles = (user) => {
    let circles = user?.connections?.filter((x) => x.type?.includes("owner_of") || x.type?.includes("admin_of"));
    return circles?.map((x) => x.target) ?? [];
};

export const isFollowing = (user, circle) => {
    if (!circle || !user) return false;
    return user?.connections?.some((x) => x.target.id === circle.id && x.type.includes("connected_to"));
};

export const isMutuallyConnected = (user, circle, includeRequests) => {
    if (!circle || !user) return false;
    return user?.connections?.some(
        (x) => x.target.id === circle.id && (x.type.includes("connected_mutually_to") || (includeRequests && x.type.includes("connected_mutually_to_request")))
    );
};

export const isMember = (userConnections, circleId) => {
    return userConnections?.some((x) => x.target.id === circleId && x.type.includes("connected_mutually_to"));
};

export const isConnected = (user, circle) => {
    return isConnectedId(user, circle?.id);
};

export const isConnectedId = (user, circleId) => {
    if (!circleId || !user) return false;
    return user?.connections?.some((x) => x.target.id === circleId);
};

const shouldShowNavItem = (navItem, circle, user) => {
    if (circle == null) return true;
    if (navItem.requireAdmin && !isAdmin(circle, user)) {
        return false;
    } else if (navItem.requireConnection && !isConnected(user, circle)) {
        return false;
    } else if (navItem.requireSelf && circle.id !== user.id) {
        return false;
    }
    return true;
};

export const circleDefaultRoute = (user, circleId) => {
    // if (circleId === "earth") return routes.circle(circleId).circles;
    // if (circleId === user?.id) return routes.circle(circleId).circles;
    // let connection = user?.connections?.find((y) => y.target.id === circleId);
    // if (!connection) {
    //     return routes.circle(circleId).home;
    // }
    // switch (connection.target.type) {
    //     case "user":
    //         return routes.circle(circleId).home;
    //     case "circle":
    //         return routes.circle(circleId).chat;
    //     case "event":
    //         return routes.circle(circleId).home;
    //     case "tag":
    //         return routes.circle(circleId).home;
    //     default:
    //         return routes.circle(circleId).home;
    // }

    let connection = user?.connections?.find((y) => y.target.id === circleId);
    if (connection && connection.target.type === "room") {
        return routes.circle(circleId).chat;
    }

    // for now the default route for all circles is the home screen
    return routes.circle(circleId).home;
};

export const openCircle = (navigate, user, circleId, circle, setCircle, inSelect) => {
    if (circle?.id !== circleId) {
        setCircle(null);
    }

    navigate(circleDefaultRoute(user, circleId));
};

export const openCircleSection = (navigate, user, circleId, circle, setCircle, section) => {
    if (circle?.id !== circleId) {
        setCircle(null);
    }

    navigate(routes.circle(circleId)[section]);
};

export const parseCircleId = (path) => {
    var match = path.match(/\/circle\/([^/]*)/);
    if (match === null) return null;
    return match[1];
};

export const CircleTags = ({ circle, setCircle, inSelect, showAll = false, size = "md" }) => {
    const navigate = useNavigate();
    const user = useContext(UserContext);
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
            <Flex flexWrap="wrap">
                {circle.tags?.slice(0, showAll ? 10000 : 3)?.map((tag) => (
                    <Box
                        key={tag.id}
                        fontSize={getFontSize()}
                        padding={smallSize ? "2px 6px 2px 6px" : "2px 10px 2px 10px"}
                        margin={smallSize ? "0px 4px 0px 0px" : "0px 4px 4px 2px"}
                        cursor={tag.is_custom ? "auto" : "pointer"}
                        background={tagColor(tag)}
                        _hover={{ backgroundColor: hoverColor(tag) }}
                        color="white"
                        height={smallSize ? "auto" : "22px"}
                        borderRadius="20px"
                        onClick={
                            tag.is_custom
                                ? (event) => {
                                      event.stopPropagation();
                                  }
                                : (event) => {
                                      if (inSelect) return;

                                      event.stopPropagation();
                                      openCircle(navigate, user, tag.id, circle, setCircle);
                                  }
                        }
                    >
                        <Text>{tag.text}</Text>
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
    const user = useContext(UserContext);
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
                            colorScheme="blue"
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

export const CircleHeader = ({ circle, setCircle, onConnect, createNew, filterConnected, setFilterConnected, title, width = "435px" }) => {
    const user = useContext(UserContext);
    const headerHeight = 74;

    return (
        <>
            <Flex
                flex="initial"
                order="0"
                backgroundColor="#ffffffee"
                align="left"
                flexDirection="column"
                position="Fixed"
                width={isMobile ? "100%" : width}
                height={`${headerHeight}px`}
                zIndex="1"
            >
                <Flex
                    flexDirection="row"
                    height="74px"
                    width={isMobile ? "100%" : width}
                    align="center"
                    paddingTop="10px"
                    paddingLeft="10px"
                    paddingBottom="10px"
                >
                    <Flex marginLeft="10px" align="left" flexDirection="column" width="100%" marginRight="20px" position="relative">
                        <HStack>
                            <Text fontWeight="700" fontSize="20px" textAlign="left" lineHeight="22px">
                                {circle?.name}
                                <span style={{ fontWeight: 700 }}> | {i18n.t(`title [${title}]`)}</span>
                            </Text>
                        </HStack>

                        <Box marginTop="4px" position="relative">
                            <CircleTags circle={circle} setCircle={setCircle} size="sm" />
                        </Box>
                        <Flex position="absolute" top="0px" right="0px" flexDirection="row" align="center" height="24px">
                            {circle?.id !== "earth" && <ConnectButton circle={circle} onConnect={onConnect} size="md" />}
                            {circle?.id !== "earth" && <NotificationsBell circle={circle} />}
                        </Flex>
                    </Flex>
                </Flex>
            </Flex>
            <Box height={`${headerHeight}px`} />
        </>
    );
};

export const CircleCover = ({ circle, ...props }) => {
    const coverWidth = 435;
    const getDefaultCircleCover = () => {
        switch (circle.type) {
            default:
            case "circle":
                return require("../assets/images/default-circle-cover.png");
            case "event":
                return require("../assets/images/default-event-cover.png");
            case "user":
                return require("../assets/images/default-user-cover.png");
        }
    };

    return (
        <Image
            width="100%"
            height="100%"
            src={getImageKitUrl(circle.cover, coverWidth) ?? getDefaultCircleCover()}
            backgroundColor="white"
            objectFit="cover"
            {...props}
        />
    );
};

export const CirclePicture = ({ circle, size, hasPopover, popoverPlacement, onClick, onParentClick, ...props }) => {
    const user = useContext(UserContext);

    const getDefaultCirclePicture = () => {
        switch (circle.type) {
            case "event":
                return require("../assets/images/default-event-picture.png");
            default:
            case "circle":
                return require("../assets/images/default-circle-picture.png");
            case "user":
                return require("../assets/images/default-user-picture.png");
            case "tag":
                return require("../assets/images/default-tag-picture.png");
            case "link":
                return require("../assets/images/default-link-picture.png");
        }
    };

    const getCirclePicture = (picture) => {
        if (!picture) return getDefaultCirclePicture();
        return getImageKitUrl(picture);
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
                            <CircleItemSmall item={circle} />
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

            {hasUpdates(user, circle, "any") && (
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

export const BlueBar = ({ selectedCircleId, isSigningIn, circle, setCircle }) => {
    const user = useContext(UserContext);
    const leftBarWidth = "80px"; //"92px"; // "72px";
    const leftBarCircleSize = 56;
    const navigate = useNavigate();
    const addSize = "48px";

    return (
        <Flex
            width={leftBarWidth}
            minWidth={leftBarWidth}
            //backgroundColor="#53459b"
            backgroundColor="#3f4779"
            height="100%"
        >
            <Box height="calc(100% - 100px)" width={leftBarWidth}>
                <Scrollbars autoHide>
                    <VStack marginTop="13px" spacing="14px">
                        {user && (
                            <Box
                                align="center"
                                borderRadius="50px"
                                role="group"
                                cursor="pointer"
                                spacing="12px"
                                padding="3px"
                                _hover={{
                                    //bg: "white",
                                    filter: "none",
                                    opacity: "1",
                                }}
                                opacity="0.5"
                                filter="grayscale(1)"
                            >
                                <CirclePicture size={leftBarCircleSize} circle={user} onClick={() => openCircle(navigate, user, user.id, circle, setCircle)} />
                            </Box>
                        )}

                        <Box
                            align="center"
                            borderRadius="50px"
                            role="group"
                            cursor="pointer"
                            spacing="12px"
                            padding="3px"
                            _hover={{
                                //bg: "white",
                                filter: "none",
                                opacity: "1",
                            }}
                            opacity="0.5"
                            filter="grayscale(1)"
                        >
                            <CirclePicture
                                size={leftBarCircleSize}
                                circle={defaultEarthCircle}
                                onClick={() => openCircle(navigate, user, "earth", circle, setCircle)}
                            />
                        </Box>

                        {isSigningIn && <Spinner color="#333" />}

                        {user?.connections
                            ?.filter((x) => x.target.type === "circle" && x.target.id !== "earth")
                            .map((item) => (
                                <Box
                                    key={item.target.id}
                                    align="center"
                                    borderRadius="50px"
                                    role="group"
                                    cursor="pointer"
                                    spacing="12px"
                                    padding="3px"
                                    _hover={{
                                        //bg: "white",
                                        filter: "none",
                                        opacity: "1",
                                    }}
                                    opacity="0.5"
                                    filter="grayscale(1)"
                                >
                                    <CirclePicture
                                        size={leftBarCircleSize}
                                        circle={item.target}
                                        onClick={() => openCircle(navigate, user, item.target.id, circle, setCircle)}
                                        onParentClick={() => openCircle(navigate, user, item.target.parent_circle?.id, circle, setCircle)}
                                    />
                                </Box>
                            ))}
                    </VStack>
                </Scrollbars>
            </Box>

            {/* Fade out effect */}
            <Box
                backgroundImage="linear-gradient(to bottom, transparent, #3f4779);"
                width={leftBarWidth}
                height="50px"
                position="absolute"
                bottom="100px"
            ></Box>
            <Box width={leftBarWidth} height="100px" position="absolute" bottom="0px" backgroundColor="#3f4779"></Box>

            <Flex width={leftBarWidth} minWidth={leftBarWidth} position="absolute" alignItems="center" justifyContent="center" bottom="30px">
                <Flex
                    //backgroundColor="#c242bbdd"
                    backgroundColor="#6e4590"
                    _hover={{ backgroundColor: "#e94ce1dd" }}
                    width={addSize}
                    height={addSize}
                    borderRadius="50%"
                    cursor="pointer"
                    alignItems="center"
                    justifyContent="center"
                    marginTop="10px"
                    onClick={() => navigate(routes.circle(circle?.id ?? "earth").new)}
                >
                    <Icon width="28px" height="28px" color="white" as={IoAdd} />
                </Flex>
            </Flex>
        </Flex>
    );
};

export const hasUpdates = (user, circle, category) => {
    // show update indicator if user is connected to circle and user data indicates user hasn't seen latest updates
    if (!user || !circle || !category) return false;
    if (circle.id === "earth") return false;
    if (!isConnected(user, circle)) return false;

    let updatedAt = fromFsDate(circle.updates?.[category]);
    let seenAt = fromFsDate(user.seen?.[circle.id]?.[category]);

    if (updatedAt && !seenAt) {
        return true;
    }

    return updatedAt > seenAt;
};

export const LeftNavigator = ({ circle, setCircle, isSigningIn }) => {
    const user = useContext(UserContext);
    const navigate = useNavigate();
    const location = useLocation();
    const isMatch = getNavigationItems(circle, user)
        .filter((x) => shouldShowNavItem(x, circle, user))
        .map((navItem) => matchPath(navItem.matchSubPaths ? navItem.route + "/*" : navItem.route, location.pathname) != null);
    const [isExpanded, setIsExpanded] = useState(true);
    const expandedSizeNum = 84; //72;
    const expandedSize = expandedSizeNum + "px";

    const navigateTo = (route) => {
        navigate(route);
    };
    const iconSize = isExpanded ? "24px" : "24px";
    const getNameFontSize = (name) => {
        if (name.length > 9) {
            return "13px";
        }
        return name.length > 8 ? "14px" : "15px";
    };

    const getPaddingBottom = () => {
        const tagsPadding = circle?.tags?.length > 0 ? 0 : 0;
        let padding = tagsPadding + (isExpanded ? 4 : 34) + "px";
        console.log("padding = " + padding);
        return padding;
    };

    return (
        <Flex
            flexDirection="column"
            width={isExpanded ? expandedSize : "50px"}
            minWidth={isExpanded ? expandedSize : "50px"}
            maxWidth={isExpanded ? expandedSize : "50px"}
            margin="0px"
            align="center"
            overflow="hidden"
            backgroundColor="#f2f2f2"
            flexGrow="0"
            flexShrink="0"
            position="relative"
        >
            <VStack align="center" marginTop="0px" width={isExpanded ? expandedSize : "50px"} spacing={isExpanded ? "14px" : "25px"}>
                <Flex
                    backgroundColor="#fafafa"
                    width={isExpanded ? expandedSize : "50px"}
                    align="center"
                    justifyContent="center"
                    alignItems="center"
                    height="74px"
                    cursor="pointer"
                >
                    <CirclePicture
                        circle={circle}
                        size={isExpanded ? 60 : 30}
                        onClick={() => openCircle(navigate, user, circle.id, circle, setCircle)}
                        onParentClick={() => openCircle(navigate, user, circle.parent_circle?.id, circle, setCircle)}
                    />
                </Flex>

                {getNavigationItems(circle, user)
                    .filter((x) => shouldShowNavItem(x, circle, user))
                    .map((navItem, i) => (
                        <Box
                            key={navItem.name}
                            borderRadius="15px"
                            role="group"
                            cursor="pointer"
                            color={isMatch[i] ? "#585858" : "#4d4668"}
                            bg={isMatch[i] ? "#d5d5d5" : "transparent"}
                            _hover={{
                                bg: "#e1e0e9",
                                color: "black",
                            }}
                            paddingTop={isExpanded ? "10px" : "5px"}
                            paddingBottom={isExpanded ? "5px" : "0px"}
                            width={isExpanded ? `${expandedSizeNum - 15}px` : "42px"}
                            onClick={() => navigateTo(navItem.route)}
                            align="center"
                            position="relative"
                        >
                            <Box key={navItem.route} align="center">
                                {navItem.icon && (
                                    <Icon
                                        fontSize="16"
                                        width={iconSize}
                                        height={iconSize}
                                        _groupHover={{
                                            color: "black",
                                        }}
                                        as={navItem.icon}
                                    />
                                )}
                                {navItem.image && <Image src={navItem.image} color={isMatch[i] ? "#585858" : "#4d4668"} marginBottom="5px" />}
                            </Box>
                            {isExpanded && <Text fontSize={getNameFontSize(navItem.name)}>{navItem.name}</Text>}
                            {!isMatch[i] && hasUpdates(user, circle, navItem.category) && (
                                <Box
                                    width={isExpanded ? "8.5px" : "8.5px"}
                                    height={isExpanded ? "8.5px" : "8.5px"}
                                    backgroundColor="#ff6499"
                                    borderRadius="50%"
                                    position="absolute"
                                    bottom={isExpanded ? "33px" : "6px"}
                                    right={isExpanded ? "18px" : "5px"}
                                ></Box>
                            )}
                        </Box>
                    ))}
            </VStack>
            <Box
                height="20px"
                width="100%"
                position="absolute"
                bottom="0px"
                onClick={() => setIsExpanded(!isExpanded)}
                cursor="pointer"
                backgroundColor="#f2f2f2"
            />
        </Flex>
    );
};

export const BottomNavigator = ({ circle }) => {
    const navHeight = "50px";
    const user = useContext(UserContext);
    const navigate = useNavigate();
    const location = useLocation();
    const isMatch = getNavigationItems(circle, user)
        .filter((x) => shouldShowNavItem(x, circle, user))
        .map((navItem) => matchPath(navItem.matchSubPaths ? navItem.route + "/*" : navItem.route, location.pathname) != null);

    const navigateTo = (route) => {
        navigate(route);
    };

    return (
        <Flex flex="0 0 40px" backgroundColor="#f7f7f7" color="black" flexDirection="row" align="center" justifyContent="flex-start">
            <Flex
                width="60px"
                minWidth="60px"
                height={navHeight}
                backgroundColor="#8985a7"
                borderTopRightRadius="100px"
                borderBottomRightRadius="100px"
                align="center"
                justifyContent="center"
                marginRight="10px"
            >
                <CirclePicture circle={circle} size={30} />
            </Flex>

            <Flex height={navHeight} overflowX="auto" overflowY="hidden" flexDirection="row" align="center" paddingLeft="10px">
                {getNavigationItems(circle, user)
                    .filter((x) => shouldShowNavItem(x, circle, user))
                    .map((navItem, i) => (
                        <Flex
                            key={navItem.route}
                            height="30px"
                            align="center"
                            borderRadius="50px"
                            cursor="pointer"
                            paddingLeft="10px"
                            paddingRight="10px"
                            color={isMatch[i] ? "white" : "#757575"}
                            fontWeight={isMatch[i] ? "700" : "500"}
                            bg={isMatch[i] ? "#c242bb" : "transparent"}
                            onClick={() => navigateTo(navItem.route)}
                            position="relative"
                        >
                            <Text>{navItem.name}</Text>
                            {!isMatch[i] && hasUpdates(user, circle, navItem.category) && (
                                <Box width="8.5px" height="8.5px" backgroundColor="#ff6499" borderRadius="50%" position="absolute" top="5px" right="0px"></Box>
                            )}
                        </Flex>
                    ))}
            </Flex>
        </Flex>
    );
};
