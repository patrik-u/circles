//#region imports
import React from "react";
import { Flex, Text, Box, Image, HStack } from "@chakra-ui/react";
import { getImageKitUrl, log } from "components/Helpers";
import Notifications from "components/Notifications";
import Messages from "components/Messages";
import ProfileMenu from "components/ProfileMenu";
import { routes } from "components/Navigation";
import { LoginRegisterMenu } from "components/LoginForms";
import { useAtom } from "jotai";
import { isMobileAtom, signInStatusAtom, homeExpandedAtom, circleAtom } from "components/Atoms";
import { useNavigateNoUpdates } from "components/RouterUtils";
import { CircleSearchBox, MobileSearchBox } from "components/CircleSearch";
import { CirclePicture } from "components/CircleElements";
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
    const titleSize = isMobile ? "16px" : "24px";
    const logoHeightPx = `${logoHeight}px`;
    const logoWidth = isMobile ? 30 : 48; //157;
    const logoWidthPx = `${logoWidth}px`;

    return (
        <>
            <Flex position="absolute" align="center" flexBasis={height} height={height} maxHeight={height} width="100%" zIndex="4" pointerEvents="none">
                <Flex flexDirection="row" marginLeft="20px" onClick={onLogoClick} alignItems="center" pointerEvents="auto" cursor="pointer">
                    <CirclePicture circle={circle} size={logoWidth} hasPopover={false} parentCircleSizeRatio={3.75} parentCircleOffset={3} />
                    <Text fontSize={titleSize} fontWeight="bold" color="white" marginLeft="20px">
                        {circle?.name}
                    </Text>
                </Flex>

                <Box flex="1" />
                <Box align="center" height={height} marginRight={isMobile ? "12px" : "25px"} borderRadius="10px" paddingLeft="10px" pointerEvents="auto">
                    <HStack spacing={isMobile ? "20px" : "20px"} align="center" height={height}>
                        {!homeExpanded &&
                            (isMobile ? (
                                <MobileSearchBox marginRight="12px" />
                            ) : (
                                <MobileSearchBox marginRight="12px" />
                                // <CircleSearchBox size={isMobile ? "sm" : "md"} hidePlaceholder={true} popover={true} maxWidth="450px" />
                            ))}

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
