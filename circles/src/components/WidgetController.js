//#region imports
import React, { forwardRef, useState, useEffect, useRef, useCallback } from "react";
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
} from "components/Atoms";
import { displayModes, defaultCoverHeight } from "components/Constants";
import axios from "axios";
import { HiOutlineBellSlash, HiOutlineBellAlert } from "react-icons/hi2";
import { AiFillStar, AiOutlineStar } from "react-icons/ai";
import { IoIosLink } from "react-icons/io";
import { ImQrcode } from "react-icons/im";
import { TbChartCircles } from "react-icons/tb";
import { useSearchParams } from "react-router-dom";
import CircleChat from "components/CircleChat";
import CircleVideo from "components/CircleVideo";
import CircleAbout from "components/CircleAbout";
//#endregion

// Responsible for showing widgets such as Chat, Calendar, Video, Map, etc.
const WidgetController = () => {
    const [isMobile] = useAtom(isMobileAtom);
    const [toggleAbout, setToggleAbout] = useAtom(toggleAboutAtom);
    const [circle] = useAtom(circleAtom);
    const [previewCircle, setPreviewCircle] = useAtom(previewCircleAtom);
    const [toggledWidgets, setToggledWidgets] = useState(["activity"]);
    const menuItems = ["about", "activity", "video", "calendar"];
    const [searchParams, setSearchParams] = useSearchParams();
    // get preview circle from search params
    //const previewCircleId = searchParams.get("preview");

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

    const getWidgetClass = (component) => {
        // activities always on the left

        // about always on the right
        // video always on the right
        // calendar always on the right

        let index = toggledWidgets.indexOf(component);
        let fixedSize = false;
        if (!isMobile) {
            fixedSize = (toggledWidgets[0] === component || toggledWidgets[2] === component) && toggledWidgets.length !== 1;
            if (component === "activity") {
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
        <div class="flex flex-col h-screen w-full z-1 absolute pointer-events-none">
            <div class={`p-5 absolute w-full pointer-events-auto`}>
                <div class="flex justify-center" style={{ marginLeft: "5px", marginTop: isMobile ? "30px" : "" }}>
                    {menuItems.map((component) => (
                        <button
                            key={component}
                            class={`mr-2 px-6 py-1 text-gray-200 hover:bg-navbuttonHoverDark transition-colors duration-200 rounded focus:outline-none navbutton navbutton${
                                toggledWidgets.includes(component) ? "-toggled-dark" : "-dark"
                            }`}
                            onClick={() => toggleWidget(component)}
                        >
                            {component.charAt(0).toUpperCase() + component.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            <Box className="flex flex-grow" marginTop="90px" zIndex="10">
                {toggledWidgets.includes("about") && (
                    <div class={getWidgetClass("about")}>
                        <CircleAbout onClose={onAboutClose} />
                    </div>
                )}
                {toggledWidgets.includes("activity") && (
                    <div class={getWidgetClass("activity")}>
                        <CircleChat />
                    </div>
                )}
                <div class="flex flex-col flex-grow order-2">{toggledWidgets.includes("video") && <CircleVideo />}</div>

                {toggledWidgets.includes("calendar") && <div class={getWidgetClass("calendar")}></div>}
            </Box>
        </div>
    );
};

export default WidgetController;
