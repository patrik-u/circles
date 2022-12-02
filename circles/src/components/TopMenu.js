//#region imports
import React, { useContext, useState } from "react";
import { Flex, Box, Image, Spinner, HStack } from "@chakra-ui/react";
import { getImageKitUrl, log } from "components/Helpers";
import Notifications from "./Notifications";
import Messages from "./Messages";
import ProfileMenu from "./ProfileMenu";
import { routes, openCircle } from "components/Navigation";
import { LoginRegisterMenu } from "components/LoginForms";
import { atom, atomWithStorage, useAtom } from "jotai";
import { isMobileAtom, signInStatusAtom, showNetworkLogoAtom } from "components/Atoms";
import { useNavigateNoUpdates } from "components/RouterUtils";
import { CircleSearchBox, MobileSearchBox } from "components/CircleSearch";
import { Routes, Route, useParams } from "react-router-dom";
//#endregion

//PWA123 complete

export const TopMenu = () => {
    log("TopMenu.render", -1);

    const [isMobile] = useAtom(isMobileAtom);
    const [signInStatus] = useAtom(signInStatusAtom);
    const [showNetworkLogo] = useAtom(showNetworkLogoAtom);
    const navigate = useNavigateNoUpdates();
    const height = isMobile ? "40px" : "90px";
    const logoHeight = isMobile ? 30 : 53; //68;
    const logoHeightPx = `${logoHeight}px`;
    const logoWidth = isMobile ? 69 : 123; //157;
    const logoWidthPx = `${logoWidth}px`;

    const onNetworkLogoClick = () => {
        navigate(routes.home);
    };

    return (
        <>
            <Flex
                className="fixedSize"
                align="center"
                flexBasis={height}
                height={height}
                maxHeight={height}
                width="100%"
                position="fixed"
                zIndex="4"
                backgroundColor="white"
            >
                {/* TODO show network circle */}
                {showNetworkLogo && (
                    <Box
                        className="fixedSize"
                        width={logoWidthPx}
                        height={logoHeightPx}
                        marginLeft={isMobile ? "12px" : "25px"}
                        onClick={onNetworkLogoClick}
                        cursor="pointer"
                    >
                        <Image src={getImageKitUrl("/circles-small.png", logoWidth, logoHeight)} width={logoWidthPx} height={logoHeightPx} />
                    </Box>
                )}

                <Box flex="1" />
                {!isMobile && (
                    <>
                        <Routes>
                            <Route path="/" element={null} />
                            <Route
                                path="*"
                                element={<CircleSearchBox size={isMobile ? "sm" : "md"} hidePlaceholder={true} popover={true} maxWidth="450px" />}
                            />
                        </Routes>
                        <Box flex="1" />
                    </>
                )}

                {isMobile && (
                    <Routes>
                        <Route path="/" element={null} />
                        <Route path="*" element={<MobileSearchBox marginRight="12px" />} />
                    </Routes>
                )}
                <Box align="center" height={height} marginRight={isMobile ? "12px" : "25px"} borderRadius="10px" paddingLeft="10px" pointerEvents="auto">
                    <HStack spacing={isMobile ? "20px" : "50px"} align="center" height={height}>
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
            <Box className="fixedSize" height={height} />
        </>
    );
};

export default TopMenu;
