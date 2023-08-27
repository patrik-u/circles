//#region imports
import React, { forwardRef, useState, useEffect, useRef, useCallback, useMemo } from "react";
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
    Portal,
    CloseButton,
    useToast,
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    Fade,
    Tooltip,
    ButtonGroup,
    useDisclosure,
    useOutsideClick,
} from "@chakra-ui/react";
import { useNavigateNoUpdates, useLocationNoUpdates } from "components/RouterUtils";
import { IoAdd } from "react-icons/io5";
import i18n from "i18n/Localization";
import {
    getImageKitUrl,
    isConnectedOrPending,
    isConnected,
    hasUpdates,
    singleLineEllipsisStyle,
    twoLineEllipsisStyle,
    getCircleTypes,
    toastInfo,
    log,
    getMetaImage,
    isAdmin,
} from "components/Helpers";
import { routes, openCircle } from "components/Navigation";
import { CirclePreview } from "components/CirclePreview";
import { RiLinksLine, RiShareLine } from "react-icons/ri";
import { FacebookShareButton, TwitterShareButton, FacebookIcon, TwitterIcon } from "react-share";
import { QRCodeCanvas } from "qrcode.react";
import { GrGallery } from "react-icons/gr";
import { FaMapMarkedAlt, FaVideo } from "react-icons/fa";
import { useAtom } from "jotai";
import {
    isMobileAtom,
    userAtom,
    userDataAtom,
    displayModeAtom,
    circleAtom,
    circlesAtom,
    circleConnectionsAtom,
    connectPopupAtom,
    isConnectingAtom,
    toggleAboutAtom,
    previewCircleAtom,
    toggleSettingsAtom,
    toggleWidgetEventAtom,
    inVideoConferenceAtom,
    newCirclePopupAtom,
} from "components/Atoms";
import { displayModes, defaultCoverHeight } from "components/Constants";
import axios from "axios";
import { HiOutlineBellSlash, HiOutlineBellAlert } from "react-icons/hi2";
import { AiFillStar, AiOutlineStar } from "react-icons/ai";
import { IoIosLink } from "react-icons/io";
import { ImQrcode } from "react-icons/im";
import { TbChartCircles } from "react-icons/tb";
import { useSearchParams } from "react-router-dom";
import { CircleChatWidget } from "components/CircleChat";
import CircleVideo from "components/CircleVideo";
import CircleAbout from "components/CircleAbout";
import CircleSettings from "components/settings/CircleSettings";
import CircleCalendar from "components/CircleCalendar";
import { DisplayModeButtons } from "./CircleElements";
import CircleAdmin from "components/CircleAdmin";
import CircleDiscover from "./CircleDiscover";
import CircleDocument from "components/document/CircleDocument";
//#endregion

// Responsible for showing widgets such as Chat, Calendar, Video, Map, etc.
const WidgetController = () => {
    const [isMobile] = useAtom(isMobileAtom);
    const [toggleAbout, setToggleAbout] = useAtom(toggleAboutAtom);
    const [toggleSettings, setToggleSettings] = useAtom(toggleSettingsAtom);
    const [circle] = useAtom(circleAtom);
    const [user] = useAtom(userAtom);
    const [userData] = useAtom(userDataAtom);
    const [, setPreviewCircle] = useAtom(previewCircleAtom);
    const [toggleWidgetEvent, setToggleWidgetEvent] = useAtom(toggleWidgetEventAtom);
    const [toggledWidgets, setToggledWidgets] = useState(["chat"]);
    const menuItems = useMemo(() => ["discover", "chat", "document", "video", "calendar", "admin"], []);
    const [searchParams, setSearchParams] = useSearchParams();
    const [inVideoConference] = useAtom(inVideoConferenceAtom);
    const videoMinimized = useMemo(() => {
        return !toggledWidgets.includes("video") && inVideoConference;
    }, [toggledWidgets, inVideoConference]);
    const [, setNewCirclePopup] = useAtom(newCirclePopupAtom);

    // get preview circle from search params
    //const previewCircleId = searchParams.get("preview");

    const showSettings = () => {
        return isAdmin(circle, userData);
    };

    const toggleWidget = useCallback(
        (component, toggleOn, toggleAboutCircle) => {
            let newToggledWidgets = [...toggledWidgets];
            if (isMobile) {
                if (toggledWidgets.includes(component)) {
                    if (toggleOn === undefined || toggleOn === false) {
                        newToggledWidgets = [];
                    }
                } else {
                    if (toggleOn === undefined || toggleOn === true) {
                        newToggledWidgets = [component];
                    }
                }
            } else {
                if (toggledWidgets.includes(component)) {
                    if (toggleOn === undefined || toggleOn === false) {
                        newToggledWidgets = toggledWidgets.filter((item) => item !== component);
                    }
                } else {
                    if (toggleOn === undefined || toggleOn === true) {
                        if (toggledWidgets.length < 4) {
                            newToggledWidgets = [...toggledWidgets, component];
                        }
                    }
                }
                //setToggleResize(true);
            }

            if (!toggleAboutCircle && component === "about") {
                setPreviewCircle(null);
            }

            menuItems.forEach((item) => {
                if (newToggledWidgets.includes(item)) {
                    if (item === "about") {
                        searchParams.set(item, toggleAboutCircle?.id ?? circle?.id);
                    } else {
                        searchParams.set(item, true);
                    }
                } else {
                    searchParams.delete(item);
                }
            });

            setSearchParams(searchParams);
            setToggledWidgets((x) => newToggledWidgets);
        },
        [isMobile, toggledWidgets, menuItems, searchParams, setSearchParams, circle?.id, setPreviewCircle]
    );

    useEffect(() => {
        if (!toggleAbout) {
            return;
        }
        setPreviewCircle(toggleAbout);
        toggleWidget("about", true, toggleAbout);
        setToggleAbout(false);
    }, [toggleAbout, setToggleAbout, toggleWidget, setPreviewCircle]);

    useEffect(() => {
        if (!toggleSettings) {
            return;
        }
        toggleWidget("settings");
        setToggleSettings(false);
    }, [toggleSettings, setToggleSettings, toggleWidget]);

    useEffect(() => {
        if (!toggleWidgetEvent) {
            return;
        }
        log("toggling widget:" + toggleWidgetEvent.name + " to " + toggleWidgetEvent.value, 0, true);
        toggleWidget(toggleWidgetEvent.name, toggleWidgetEvent.value, toggleWidgetEvent.toggleAboutCircle);
        setToggleWidgetEvent(false);
    }, [toggleWidgetEvent, setToggleWidgetEvent, toggleWidget]);

    const onDiscoverClose = () => {
        toggleWidget("discover", false);
    };

    const onAboutClose = () => {
        toggleWidget("about", false);
    };

    const onSettingsClose = () => {
        toggleWidget("settings", false);
    };

    const onCalendarClose = () => {
        toggleWidget("calendar", false);
    };

    const onDocumentClose = () => {
        toggleWidget("document", false);
    };

    const onAdminClose = () => {
        toggleWidget("admin", false);
    };

    const shouldShowMenuItem = (item) => {
        if (item === "settings") {
            return showSettings();
        }
        if (item === "admin") {
            return circle?.id === "global" && user?.is_admin;
        }
        if (item === "document") {
            return circle?.type === "document";
        }
        return true;
    };

    const openCreateCircle = () => {
        setNewCirclePopup({ circle });
    };

    const getTooltip = (component) => {
        switch (component) {
            case "discover":
                return `Show all circles relevant to ${circle?.name}`;
            case "chat":
                return `Chat for ${circle?.name}`;
            case "video":
                return `Enter video conference in ${circle?.name}`;
            case "calendar":
                return `Show calendar for ${circle?.name}`;
            case "admin":
                return `Show admin panel for ${circle?.name}`;
            case "settings":
                return `Show settings for ${circle?.name}`;
            case "document":
                return `Show and edit document ${circle?.name}`;
            default:
                return "";
        }
    };

    // useEffect(() => {
    //     console.log("previewing circle", previewCircleId);
    //     if (!previewCircleId) {
    //         return;
    //     }

    //     if (toggledWidgets.includes("about")) return;
    //     toggleWidget("about", true);
    // }, [previewCircle, toggleWidget, toggledWidgets]);

    // createEffect(() => {
    //     let action = toggleWidgetAction();
    //     if (!action) {
    //         return;
    //     }
    //     toggleWidget(action.widget, action.toggleOn);
    //     setToggleWidgetAction(null);
    // });

    // bg: #262626
    // color: white
    // selected: #1e5785

    const WidgetButton = ({ component, children, onClick = null, ...props }) => {
        return (
            <Button
                py={1}
                px={6}
                color="#d4d4d4"
                fontSize="14px"
                borderRadius="30px"
                height="30px"
                fontWeight={"400"}
                backgroundColor={toggledWidgets.includes(component) ? "#314b8f" : "#3c3d42"}
                _hover={{
                    backgroundColor: "#3175ad",
                }}
                onClick={onClick ?? (() => toggleWidget(component))}
                {...props}
            >
                {children ?? component.charAt(0).toUpperCase() + component.slice(1)}
            </Button>
        );
    };

    return (
        <Flex flexDirection="column" w="full" h="full" pos="absolute" zIndex="1" pointerEvents="none">
            <Box p={5} position={isMobile ? "relative" : "absolute"} w="full" pointerEvents="auto">
                <Flex justifyContent="center" flexWrap="wrap" mt={isMobile ? "30px" : 0} gap={1}>
                    {menuItems
                        .filter((x) => shouldShowMenuItem(x))
                        .map((component) => (
                            <Tooltip key={component} label={getTooltip(component)} placement="bottom">
                                <Box>
                                    <WidgetButton component={component} />
                                </Box>
                            </Tooltip>
                        ))}
                    <Tooltip label="Create a new circle" placement="bottom">
                        <Box>
                            <WidgetButton onClick={() => openCreateCircle()}>{isMobile ? "+" : "+ Create"}</WidgetButton>
                        </Box>
                    </Tooltip>
                </Flex>
            </Box>

            <Flex flexGrow="1" marginTop={isMobile ? "0px" : "90px"} zIndex="10">
                {toggledWidgets.includes("discover") && (
                    <Flex flexDirection="column" minWidth="24rem" width="24rem" flexShrink={0} order="3" className="min-w-96 w-96 flex-shrink-0">
                        <CircleDiscover onClose={onDiscoverClose} />
                    </Flex>
                )}

                {toggledWidgets.includes("about") && (
                    <Flex flexDirection="column" minWidth="24rem" width="24rem" flexShrink={0} order="3" className="min-w-96 w-96 flex-shrink-0">
                        <CircleAbout onClose={onAboutClose} />
                    </Flex>
                )}

                {toggledWidgets.includes("chat") && (
                    <Flex flexDirection="column" minWidth="24rem" width="24rem" flexShrink={0} order="1" className="min-w-96 w-96 flex-shrink-0">
                        <CircleChatWidget />
                    </Flex>
                )}
                {(toggledWidgets.includes("video") || inVideoConference) && (
                    <Flex flexDirection="column" flexGrow="1" order="2">
                        <CircleVideo isMinimized={videoMinimized} />
                    </Flex>
                )}
                {!(
                    isMobile ||
                    toggledWidgets.includes("video") ||
                    toggledWidgets.includes("calendar") ||
                    toggledWidgets.includes("settings") ||
                    toggledWidgets.includes("admin") ||
                    toggledWidgets.includes("document") ||
                    inVideoConference
                ) && <Flex flexDirection="column" flexGrow="1" order="2"></Flex>}

                {toggledWidgets.includes("settings") && (
                    <Flex flexDirection="column" flexGrow="1" order="2">
                        <CircleSettings onClose={onSettingsClose} />
                    </Flex>
                )}

                {toggledWidgets.includes("calendar") && (
                    <Flex flexDirection="column" flexGrow="1" order="2">
                        <CircleCalendar onClose={onCalendarClose} />
                    </Flex>
                )}

                {toggledWidgets.includes("document") && (
                    <Flex flexDirection="column" flexGrow="1" order="2">
                        <CircleDocument onClose={onDocumentClose} />
                    </Flex>
                )}

                {toggledWidgets.includes("admin") && (
                    <Flex flexDirection="column" flexGrow="1" order="2">
                        <CircleAdmin onClose={onAdminClose} />
                    </Flex>
                )}
            </Flex>
            <DisplayModeButtons position={isMobile ? "static" : "absolute"} />
        </Flex>
    );
};

export default WidgetController;
