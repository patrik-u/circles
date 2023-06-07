//#region imports
import React, { forwardRef, useState, useEffect, useRef } from "react";
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
} from "components/Atoms";
import { displayModes, defaultCoverHeight } from "components/Constants";
import axios from "axios";
import { HiOutlineBellSlash, HiOutlineBellAlert } from "react-icons/hi2";
import { AiFillStar, AiOutlineStar } from "react-icons/ai";
import { IoIosLink } from "react-icons/io";
import { ImQrcode } from "react-icons/im";
import { TbChartCircles } from "react-icons/tb";
import CircleChat from "components/CircleChat";
import CircleVideo from "components/CircleVideo";
//#endregion

// Responsible for showing widgets such as Chat, Calendar, Video, Map, etc.
const WidgetController = () => {
    const [isMobile] = useAtom(isMobileAtom);
    const [toggledWidgets, setToggledWidgets] = useState(["activity"]);
    const menuItems = ["about", "activity", "video", "calendar"];

    const toggleWidget = (component, toggleOn) => {
        if (isMobile) {
            if (toggledWidgets.includes(component)) {
                if (toggleOn === undefined || toggleOn === false) {
                    setToggledWidgets([]);
                }
            } else {
                if (toggleOn === undefined || toggleOn === true) {
                    setToggledWidgets([component]);
                }
            }
        } else {
            if (toggledWidgets.includes(component)) {
                if (toggleOn === undefined || toggleOn === false) {
                    setToggledWidgets(toggledWidgets.filter((item) => item !== component));
                }
            } else {
                if (toggleOn === undefined || toggleOn === true) {
                    if (toggledWidgets.length < 3) {
                        setToggledWidgets([...toggledWidgets, component]);
                    }
                }
            }
            //setToggleResize(true);
        }
    };

    const getWidgetClass = (component) => {
        let index = toggledWidgets.indexOf(component);
        let fixedSize = false;
        if (!isMobile) {
            fixedSize = (toggledWidgets[0] === component || toggledWidgets[2] === component) && toggledWidgets.length !== 1;
            if (component === "activity") {
                fixedSize = true;
            }
        }
        return `flex flex-col ${fixedSize ? "min-w-96 w-96 flex-shrink-0" : "flex-grow"} order-${index + 1}`;
    };

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
        <div class="flex flex-col h-screen w-screen z-1 absolute pointer-events-none">
            <div class={`p-5 absolute w-screen pointer-events-auto`}>
                <div class="flex justify-center" style={{ marginLeft: "5px", marginTop: isMobile ? "30px" : "" }}>
                    {menuItems.map((component) => (
                        <button
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
                {toggledWidgets.includes("about") && <div class={getWidgetClass("about")}></div>}
                {toggledWidgets.includes("activity") && (
                    <div class={getWidgetClass("activity")}>
                        <CircleChat />
                    </div>
                )}
                {toggledWidgets.includes("video") && (
                    <div class={getWidgetClass("video")}>
                        <CircleVideo />
                    </div>
                )}
                {toggledWidgets.includes("calendar") && <div class={getWidgetClass("calendar")}></div>}
            </Box>
        </div>
    );
};

export default WidgetController;
