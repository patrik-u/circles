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
//#endregion

// Responsible for showing widgets such as Chat, Calendar, Video, Map, etc.
const WidgetController = () => {
    const [isMobile] = useAtom(isMobileAtom);
    const [toggleAbout, setToggleAbout] = useAtom(toggleAboutAtom);
    const [toggleSettings, setToggleSettings] = useAtom(toggleSettingsAtom);
    const [circle] = useAtom(circleAtom);
    const [user] = useAtom(userAtom);
    const [userData] = useAtom(userDataAtom);
    const [previewCircle, setPreviewCircle] = useAtom(previewCircleAtom);
    const [toggleWidgetEvent, setToggleWidgetEvent] = useAtom(toggleWidgetEventAtom);
    const [toggledWidgets, setToggledWidgets] = useState(["chat"]);
    const menuItems = useMemo(() => ["about", "chat", "video", "calendar", "admin"], []);
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
                        if (toggledWidgets.length < 3) {
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
                    searchParams.set(item, item === "about" ? toggleAboutCircle?.id ?? circle?.id : true);
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

    const getWidgetClass = (component) => {
        // activities always on the left

        // about always on the right
        // video always on the right
        // calendar always on the right

        let index = toggledWidgets.indexOf(component);
        let fixedSize = false;
        if (!isMobile) {
            fixedSize = (toggledWidgets[0] === component || toggledWidgets[2] === component) && toggledWidgets.length !== 1;
            if (component === "chat") {
                fixedSize = true;
                index = 0;
            } else if (component === "about") {
                fixedSize = true;
                index = 2;
            } else if (component === "video") {
                index = 1;
            }
        }
        return `flex flex-col ${fixedSize ? "min-w-96 w-96 flex-shrink-0" : "flex-grow"} order-${index + 1}`;
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
        return true;
    };

    const openCreateCircle = () => {
        setNewCirclePopup({ circle });
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

    return (
        <div class={`flex flex-col h-screen w-full z-1 absolute pointer-events-none`}>
            <div class={`pt-5 pr-1 pl-1 ${isMobile ? "relative" : "absolute"} w-full pointer-events-auto`}>
                <div class="flex justify-center flex-wrap gap-1" style={{ marginTop: isMobile ? "30px" : "" }}>
                    {menuItems
                        .filter((x) => shouldShowMenuItem(x))
                        .map((component) => (
                            <button
                                key={component}
                                class={`px-6 py-1 text-gray-200 hover:bg-navbuttonHoverDark transition-colors duration-200 rounded focus:outline-none navbutton navbutton${
                                    toggledWidgets.includes(component) ? "-toggled-dark" : "-dark"
                                }`}
                                onClick={() => toggleWidget(component)}
                            >
                                {component.charAt(0).toUpperCase() + component.slice(1)}
                            </button>
                        ))}
                    <button
                        class={`${
                            isMobile ? "px-3" : "px-6"
                        } py-1 text-gray-200 hover:bg-navbuttonHoverDark transition-colors duration-200 rounded focus:outline-none navbutton navbutton-dark`}
                        onClick={() => openCreateCircle()}
                    >
                        {isMobile ? "+" : "+ Create"}
                    </button>
                </div>
            </div>

            <Box className="flex flex-grow" marginTop={isMobile ? "0px" : "90px"} zIndex="10">
                {toggledWidgets.includes("about") && (
                    <div class={getWidgetClass("about")}>
                        <CircleAbout onClose={onAboutClose} />
                    </div>
                )}
                {toggledWidgets.includes("chat") && (
                    <div class={getWidgetClass("chat")}>
                        <CircleChatWidget />
                    </div>
                )}
                {(toggledWidgets.includes("video") || inVideoConference) && (
                    <div class="flex flex-col flex-grow order-2">
                        <CircleVideo isMinimized={videoMinimized} />
                    </div>
                )}
                {!(
                    isMobile ||
                    toggledWidgets.includes("video") ||
                    toggledWidgets.includes("calendar") ||
                    toggledWidgets.includes("settings") ||
                    toggledWidgets.includes("admin") ||
                    inVideoConference
                ) && <div class="flex flex-col flex-grow order-2"></div>}

                {toggledWidgets.includes("settings") && (
                    <div class="flex flex-col flex-grow order-2">
                        <CircleSettings onClose={onSettingsClose} />
                    </div>
                )}

                {toggledWidgets.includes("calendar") && (
                    <div class="flex flex-col flex-grow order-2">
                        <CircleCalendar onClose={onCalendarClose} />
                    </div>
                )}

                {toggledWidgets.includes("admin") && (
                    <div class="flex flex-col flex-grow order-2">
                        <CircleAdmin onClose={onAdminClose} />
                    </div>
                )}
            </Box>
            <DisplayModeButtons position={isMobile ? "static" : "absolute"} />
        </div>
    );
};

export default WidgetController;
