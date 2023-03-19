//#region imports
import React from "react";
import { Flex, Box, Image, HStack } from "@chakra-ui/react";
import { getImageKitUrl, log } from "components/Helpers";
import Notifications from "components/Notifications";
import Messages from "components/Messages";
import ProfileMenu from "components/ProfileMenu";
import { routes } from "components/Navigation";
import { LoginRegisterMenu } from "components/LoginForms";
import { useAtom } from "jotai";
import { isMobileAtom, signInStatusAtom, homeExpandedAtom } from "components/Atoms";
import { useNavigateNoUpdates } from "components/RouterUtils";
import { CircleSearchBox, MobileSearchBox } from "components/CircleSearch";
import { Routes, Route } from "react-router-dom";
//#endregion

export const TopMenu = ({ onLogoClick }) => {
    log("TopMenu.render", -1);

    const [isMobile] = useAtom(isMobileAtom);
    const [signInStatus] = useAtom(signInStatusAtom);
    const [homeExpanded] = useAtom(homeExpandedAtom);
    const navigate = useNavigateNoUpdates();
    const height = isMobile ? "40px" : "90px";
    const logoHeight = isMobile ? 30 : 60; //68;
    const logoHeightPx = `${logoHeight}px`;
    const logoWidth = isMobile ? 30 : 60; //157;
    const logoWidthPx = `${logoWidth}px`;

    const onNetworkLogoClick = () => {
        if (onLogoClick) {
            onLogoClick();
        }
    };

    return (
        <>
            <Flex className="fixedSize" align="center" flexBasis={height} height={height} maxHeight={height} width="100%" position="fixed" zIndex="4" pointerEvents="none">
                {/* TODO show network circle */}
                {!homeExpanded && (
                    <Box className="fixedSize" width={logoWidthPx} height={logoHeightPx} marginLeft={isMobile ? "12px" : "25px"} onClick={onNetworkLogoClick} cursor="pointer" pointerEvents="auto">
                        <Image src="/codo-logo.svg" width={logoWidthPx} height={logoHeightPx} />
                    </Box>
                )}

                <Box flex="1" />
                <Box align="center" height={height} marginRight={isMobile ? "12px" : "25px"} borderRadius="10px" paddingLeft="10px" pointerEvents="auto">
                    <HStack spacing={isMobile ? "20px" : "20px"} align="center" height={height}>
                        {!homeExpanded &&
                            (isMobile ? <MobileSearchBox marginRight="12px" /> : <CircleSearchBox size={isMobile ? "sm" : "md"} hidePlaceholder={true} popover={true} maxWidth="450px" />)}

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
