//#region imports
import React, { useMemo, useState, useEffect } from "react";
import { Flex, Text, Box, Image, HStack, Tooltip, Icon } from "@chakra-ui/react";
import { getImageKitUrl, log } from "components/Helpers";
import Notifications from "components/Notifications";
import Messages from "components/Messages";
import ProfileMenu from "components/ProfileMenu";
import { routes, openCircle } from "components/Navigation";
import { LoginRegisterMenu } from "components/LoginForms";
import { useAtom } from "jotai";
import { isMobileAtom, signInStatusAtom, homeExpandedAtom, circleAtom, toggleWidgetEventAtom, circleHistoryAtom } from "components/Atoms";
import { useNavigateNoUpdates } from "components/RouterUtils";
import { CircleSearchBoxIcon } from "components/CircleSearch";
import { CirclePicture, SettingsButton, AboutButton } from "components/CircleElements";
import { Routes, Route } from "react-router-dom";
import { IoChevronBack, IoChevronForward } from "react-icons/io5";
//#endregion

const NavigationButtons = ({ direction, ...props }) => {
    const navigate = useNavigateNoUpdates();
    const [circleHistory, setCircleHistory] = useAtom(circleHistoryAtom);
    const forwardCircle = useMemo(() => circleHistory?.history?.[circleHistory.position + 1], [circleHistory]);
    const backCircle = useMemo(() => circleHistory?.history?.[circleHistory.position - 1], [circleHistory]);

    const navigateBack = () => {
        if (circleHistory.position > 0) {
            const newPosition = circleHistory.position - 1;
            const circle = circleHistory.history[newPosition];
            setCircleHistory({ ...circleHistory, position: newPosition });
            openCircle(navigate, circle);
        }
    };

    const navigateForward = () => {
        if (circleHistory.position < circleHistory.history.length - 1) {
            const newPosition = circleHistory.position + 1;
            const circle = circleHistory.history[newPosition];
            setCircleHistory({ ...circleHistory, position: newPosition });
            openCircle(navigate, circle);
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
                            <CirclePicture circle={backCircle} size={buttonSize} hasPopover={false} disableClick={true} />
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
                            <CirclePicture circle={forwardCircle} size={buttonSize} hasPopover={false} disableClick={true} />
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
    const height = isMobile ? "40px" : "90px";
    const logoHeight = isMobile ? 30 : 60; //68;
    const [, setToggleWidgetEvent] = useAtom(toggleWidgetEventAtom);
    const [showNavButtons, setShowNavButtons] = useState(false);

    const setTitleSize = isMobile ? "10px" : "18px";
    const logoHeightPx = `${logoHeight}px`;
    const logoWidth = isMobile ? 30 : 48; //157;
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
            <Flex position="absolute" align="center" flexBasis={height} height={height} maxHeight={height} width="100%" zIndex="154" pointerEvents="none">
                <Flex flexDirection="row" marginLeft="20px" alignItems="center" pointerEvents="auto" cursor="pointer">
                    <Box position="relative">
                        <CirclePicture
                            circle={circle}
                            size={logoWidth}
                            hasPopover={false}
                            parentCircleSizeRatio={3.75}
                            parentCircleOffset={3}
                            onClick={onLogoClick}
                        />
                        {showNavButtons && !isMobile && <NavigationButtons />}
                    </Box>
                    {circle?.type !== "set" && (
                        <Tooltip label="Click to switch circle" placement="bottom">
                            <Flex flexDirection="column" position="relative" marginLeft={isMobile ? "10px" : "20px"} maxWidth={isMobile ? "150px" : "250px"}>
                                {circle?.parent_circle && (
                                    <Text
                                        fontSize={isMobile ? "8px" : "12px"}
                                        fontWeight="bold"
                                        color="#e0e0e0"
                                        _hover={{ color: "#aa75ab" }}
                                        noOfLines={1}
                                        position="absolute"
                                        top="-10px"
                                        onClick={() => {
                                            openCircle(navigate, circle.parent_circle);
                                            setToggleWidgetEvent({ name: "about", value: true });
                                        }}
                                    >
                                        {circle?.parent_circle?.name}
                                    </Text>
                                )}
                                <Text fontSize={titleSize} fontWeight="bold" color="white" noOfLines={2} onClick={onLogoClick}>
                                    {circle?.name}
                                </Text>
                            </Flex>
                        </Tooltip>
                    )}
                    {circle?.type === "set" && (
                        <Tooltip label="Click to switch circle" placement="bottom">
                            <Text
                                fontSize={setTitleSize}
                                fontWeight="bold"
                                color="white"
                                marginLeft={isMobile ? "10px" : "20px"}
                                noOfLines={2}
                                onClick={onLogoClick}
                            >
                                {circle[circle.circle_ids[0]].name} &
                                <br />
                                {circle[circle.circle_ids[1]].name}
                            </Text>
                        </Tooltip>
                    )}
                </Flex>
                <AboutButton circle={circle} marginLeft={isMobile ? "5px" : "10px"} pointerEvents="auto" />
                <SettingsButton circle={circle} pointerEvents="auto" />

                <Box flex="1" />
                <Box align="center" height={height} marginRight={isMobile ? "12px" : "25px"} borderRadius="10px" paddingLeft="10px" pointerEvents="auto">
                    <HStack spacing={isMobile ? "10px" : "20px"} align="center" height={height}>
                        {!homeExpanded && <CircleSearchBoxIcon marginRight={isMobile ? "0px" : "4px"} />}

                        {signInStatus.signedIn && (
                            <>
                                <Messages />
                                <Notifications />
                            </>
                        )}

                        {(signInStatus.signedIn || signInStatus.signingIn) && (
                            <Box width={isMobile ? "30px" : "48px"} height={isMobile ? "30px" : "48px"}>
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
