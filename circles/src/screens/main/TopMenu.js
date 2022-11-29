//#region imports
import React, { useContext } from "react";
import { Flex, Box, Image, Spinner, HStack } from "@chakra-ui/react";
import { getImageKitUrl, log } from "components/Helpers";
import Notifications from "./Notifications";
import Messages from "./Messages";
import ProfileMenu from "./ProfileMenu";
import { routes, openCircle } from "components/Navigation";
import { LoginRegisterMenu } from "screens/settings/LoginForms";
import { atom, atomWithStorage, useAtom } from "jotai";
import { isMobileAtom, signInStatusAtom, showNetworkLogoAtom } from "components/Atoms";
import { useNavigateNoUpdates } from "components/RouterUtils";
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
                zIndex="1"
                backgroundColor="white"
            >
                {/* TODO show network circle */}
                {showNetworkLogo && (
                    <Box width={logoWidthPx} height={logoHeightPx} marginLeft={isMobile ? "12px" : "25px"} onClick={onNetworkLogoClick} cursor="pointer">
                        <Image src={getImageKitUrl("/circles-small.png", logoWidth, logoHeight)} width={logoWidthPx} height={logoHeightPx} />
                    </Box>
                )}

                {/* {isMobile && circle && circle.id !== "earth" && (
                <Box marginLeft="6px" pointerEvents="auto">
                    <Flex flexGrow="1" flexDirection="row" justifyContent="flex-start" align="center">
                        {circle?.parent_circle ? (
                            <Image
                                src={getImageKitUrl(circle.parent_circle.picture, isMobile ? 20 : 50, isMobile ? 20 : 50)}
                                width={isMobile ? "20px" : "50px"}
                                height={isMobile ? "20px" : "50px"}
                                onClick={() => openCircle(navigate, user, circle.parent_circle.id, circle, setCircle)}
                                cursor="pointer"
                                position="absolute"
                                top="7px"
                                left="10px"
                            />
                        ) : (
                            <Image
                                src="/earth.png"
                                width={isMobile ? "20px" : "50px"}
                                height={isMobile ? "20px" : "50px"}
                                onClick={() => navigate(routes.home)}
                                cursor="pointer"
                                position="absolute"
                                top="7px"
                                left="10px"
                            />
                        )}
                    </Flex>
                </Box>
            )} */}

                <Box flex="1" />

                <Box align="center" height={height} marginRight={isMobile ? "12px" : "25px"} borderRadius="10px" paddingLeft="10px" pointerEvents="auto">
                    <HStack spacing={isMobile ? "20px" : "50px"} align="center" height={height}>
                        {/* <Points satelliteMode={satelliteMode} /> */}
                        {signInStatus.signedIn && (
                            <>
                                <Messages />
                                <Notifications />
                            </>
                        )}

                        <Box width={isMobile ? "30px" : "48px"} height={isMobile ? "30px" : "48px"}>
                            <ProfileMenu />
                        </Box>
                        <LoginRegisterMenu />
                    </HStack>
                </Box>
            </Flex>
            <Box className="fixedSize" height={height} />
        </>
    );
};

export default TopMenu;
