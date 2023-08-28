//#region imports
import React, { useMemo } from "react";
import { Flex, Text, Box, Image, HStack, Tooltip } from "@chakra-ui/react";
import { getImageKitUrl, log } from "components/Helpers";
import Notifications from "components/Notifications";
import Messages from "components/Messages";
import ProfileMenu from "components/ProfileMenu";
import { routes } from "components/Navigation";
import { LoginRegisterMenu } from "components/LoginForms";
import { useAtom } from "jotai";
import { isMobileAtom, signInStatusAtom, homeExpandedAtom, circleAtom } from "components/Atoms";
import { useNavigateNoUpdates } from "components/RouterUtils";
import { CircleSearchBoxIcon } from "components/CircleSearch";
import { CirclePicture, SettingsButton, AboutButton } from "components/CircleElements";
import { Routes, Route } from "react-router-dom";
//#endregion

export const TopMenu = ({ onLogoClick }) => {
    log("TopMenu.render", -1);

    const [isMobile] = useAtom(isMobileAtom);
    const [signInStatus] = useAtom(signInStatusAtom);
    const [circle] = useAtom(circleAtom);
    const [homeExpanded] = useAtom(homeExpandedAtom);
    const navigate = useNavigateNoUpdates();
    const height = isMobile ? "40px" : "90px";
    const logoHeight = isMobile ? 30 : 60; //68;

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

    return (
        <>
            <Flex position="absolute" align="center" flexBasis={height} height={height} maxHeight={height} width="100%" zIndex="154" pointerEvents="none">
                <Tooltip label="Click to switch circle" placement="bottom">
                    <Flex flexDirection="row" marginLeft="20px" onClick={onLogoClick} alignItems="center" pointerEvents="auto" cursor="pointer">
                        <CirclePicture circle={circle} size={logoWidth} hasPopover={false} parentCircleSizeRatio={3.75} parentCircleOffset={3} />
                        {circle?.type !== "set" && (
                            <Text
                                fontSize={titleSize}
                                fontWeight="bold"
                                color="white"
                                marginLeft={isMobile ? "10px" : "20px"}
                                noOfLines={2}
                                maxWidth={isMobile ? "150px" : "250px"}
                            >
                                {circle?.name}
                            </Text>
                        )}
                        {circle?.type === "set" && (
                            <Text fontSize={setTitleSize} fontWeight="bold" color="white" marginLeft={isMobile ? "10px" : "20px"} noOfLines={2}>
                                {circle[circle.circle_ids[0]].name} &
                                <br />
                                {circle[circle.circle_ids[1]].name}
                            </Text>
                        )}
                    </Flex>
                </Tooltip>
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
