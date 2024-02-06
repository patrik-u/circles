//#region imports
import React, { useMemo, useState, useEffect } from "react";
import { Flex, Text, Box, Image, HStack, Tooltip, Icon } from "@chakra-ui/react";
import { getImageKitUrl, log } from "@/components/Helpers";
import Notifications from "@/components/Notifications";
import Messages from "@/components/Messages";
import ProfileMenu from "@/components/ProfileMenu";
import { routes, openCircle } from "@/components/Navigation";
import { LoginRegisterMenu } from "@/components/LoginForms";
import { useAtom } from "jotai";
import {
    isMobileAtom,
    signInStatusAtom,
    homeExpandedAtom,
    circleAtom,
    toggleWidgetEventAtom,
    circleHistoryAtom,
} from "@/components/Atoms";
import { useNavigateNoUpdates } from "@/components/RouterUtils";
import { CircleSearchBoxIcon } from "@/components/CircleSearch";
import { CirclePicture, SettingsButton, AboutButton } from "@/components/CircleElements";
import { Routes, Route } from "react-router-dom";
import { IoChevronBack, IoChevronForward } from "react-icons/io5";
//#endregion

const NavigationButtons = ({ direction, ...props }) => {
    const navigate = useNavigateNoUpdates();
    const [circleHistory, setCircleHistory] = useAtom(circleHistoryAtom);
    const forwardCircle = useMemo(() => circleHistory?.history?.[circleHistory.position + 1], [circleHistory]);
    const backCircle = useMemo(() => circleHistory?.history?.[circleHistory.position - 1], [circleHistory]);
    const [, setFocusOnMapItem] = useAtom(focusOnMapItemAtom);

    const navigateBack = () => {
        if (circleHistory.position > 0) {
            const newPosition = circleHistory.position - 1;
            const circle = circleHistory.history[newPosition];
            setCircleHistory({ ...circleHistory, position: newPosition });
            openCircle(navigate, circle);
            focusCircle(circle, setFocusOnMapItem);
        }
    };

    const navigateForward = () => {
        if (circleHistory.position < circleHistory.history.length - 1) {
            const newPosition = circleHistory.position + 1;
            const circle = circleHistory.history[newPosition];
            setCircleHistory({ ...circleHistory, position: newPosition });
            openCircle(navigate, circle);
            focusCircle(circle, setFocusOnMapItem);
        }
    };

    const handleClick = () => {
        if (direction === "back") {
            // Implement back logic here
        } else if (direction === "forward") {
            // Implement forward logic here
        }
    };
    const buttonSize = 24;
    const buttonSizePx = `${buttonSize}px`;
    const offset = 5;
    const offsetPx = `${offset}px`;
    const iconSize = buttonSize - offset * 2;
    const iconSizePx = `${iconSize}px`;

    return (
        <>
            {/* Flex position="absolute" bottom="-12px" zIndex="155" {...props} */}

            {backCircle && (
                <Box position="absolute" top="-8px" left="-12px">
                    <Tooltip label={`Navigate back to ${backCircle?.name}`}>
                        <Flex
                            position="relative"
                            width={buttonSizePx}
                            height={buttonSizePx}
                            borderRadius="50%"
                            justifyContent="center"
                            alignItems="center"
                            onClick={navigateBack}
                            cursor="pointer"
                        >
                            <CirclePicture
                                circle={backCircle}
                                size={buttonSize}
                                hasPopover={false}
                                disableClick={true}
                            />
                            <Icon
                                position="absolute"
                                top={offsetPx}
                                left={offsetPx}
                                width={iconSizePx}
                                height={iconSizePx}
                                color={"white"}
                                as={IoChevronBack}
                                zIndex="100"
                            />
                        </Flex>
                    </Tooltip>
                </Box>
            )}
            {forwardCircle && (
                <Box position="absolute" bottom="-8px" right="-12px">
                    <Tooltip label={`Navigate forward to ${forwardCircle?.name}`}>
                        <Flex
                            position="relative"
                            width={buttonSizePx}
                            height={buttonSizePx}
                            borderRadius="50%"
                            justifyContent="center"
                            alignItems="center"
                            onClick={navigateForward}
                            cursor="pointer"
                        >
                            <CirclePicture
                                circle={forwardCircle}
                                size={buttonSize}
                                hasPopover={false}
                                disableClick={true}
                            />
                            <Icon
                                position="absolute"
                                top={offsetPx}
                                left={offsetPx}
                                width={iconSizePx}
                                height={iconSizePx}
                                color={"white"}
                                as={IoChevronForward}
                                zIndex="100"
                            />
                        </Flex>
                    </Tooltip>
                </Box>
            )}
        </>
    );
};

export const TopMenu = ({ onLogoClick }) => {
    log("TopMenu.render", -1);

    const [isMobile] = useAtom(isMobileAtom);
    const [signInStatus] = useAtom(signInStatusAtom);
    const [circle] = useAtom(circleAtom);
    const [homeExpanded] = useAtom(homeExpandedAtom);
    const navigate = useNavigateNoUpdates();
    const height = isMobile ? "40px" : "40px";
    const logoHeight = isMobile ? 30 : 60; //68;
    const [, setToggleWidgetEvent] = useAtom(toggleWidgetEventAtom);
    const [showNavButtons, setShowNavButtons] = useState(false);

    const setTitleSize = isMobile ? "10px" : "18px";
    const logoHeightPx = `${logoHeight}px`;
    const logoWidth = isMobile ? 30 : 30; //157;
    const logoWidthPx = `${logoWidth}px`;

    const titleSize = useMemo(() => {
        const twoLines = circle?.name?.length > 18;
        if (isMobile) {
            return twoLines ? "10px" : "16px";
        }

        return twoLines ? "18px" : "24px";
    }, [circle?.name, isMobile]);

    const handleMouseMove = (e) => {
        if (e.clientY <= 90) {
            setShowNavButtons(true);
        } else {
            setShowNavButtons(false);
        }
    };

    useEffect(() => {
        // Add the event listener when component mounts
        window.addEventListener("mousemove", handleMouseMove);

        // Clean up the event listener on unmount
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
        };
    }, []);

    return (
        <>
            <Flex
                align="center"
                flexBasis={height}
                height={height}
                maxHeight={height}
                width="100%"
                zIndex="154"
                pointerEvents="none"
            >
                <Box
                    align="center"
                    height={height}
                    marginRight={"12px"}
                    borderRadius="10px"
                    paddingLeft="10px"
                    pointerEvents="auto"
                >
                    <HStack spacing="10px" align="center" height={height}>
                        {signInStatus.signedIn && (
                            <>
                                <Messages />
                                <Notifications />
                            </>
                        )}

                        {(signInStatus.signedIn || signInStatus.signingIn) && (
                            <Box width={"30px"} height={"30px"}>
                                <ProfileMenu />
                            </Box>
                        )}
                        <LoginRegisterMenu />
                    </HStack>
                </Box>
            </Flex>
        </>
    );
};

export default TopMenu;
