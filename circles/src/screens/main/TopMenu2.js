//#region imports
import React, { useContext } from "react";
import { Flex, Box, Image, Spinner, HStack } from "@chakra-ui/react";
import { getImageKitUrl, log } from "../../components/Helpers";
import { useNavigate } from "react-router-dom";
import Notifications from "./Notifications";
import Messages from "./Messages";
import ProfileMenu from "./ProfileMenu2";
import { routes, openCircle } from "../../components/Navigation";
import { LoginRegisterMenu } from "../../components/LoginForms";
import { atom, atomWithStorage, useAtom } from "jotai";
import { isMobileAtom, signInStatusAtom } from "../../components/Atoms";
//#endregion

export const TopMenu = () => {
    const [isMobile] = useAtom(isMobileAtom);
    const [signInStatus] = useAtom(signInStatusAtom);
    const navigate = useNavigate();

    return (
        <Flex
            className="fixedSize"
            align="center"
            flexBasis={isMobile ? "40px" : "90px"}
            height={isMobile ? "40px" : "90px"}
            maxHeight={isMobile ? "40px" : "90px"}
            backgroundColor={isMobile ? "white" : "transparent"}
            width="100%"
        >
            {/* TODO show network circle */}
            <Box width="157px" height="68px" marginLeft={isMobile ? "12px" : "25px"}>
                <Image src={getImageKitUrl("/circles-small.png", 157, 68)} width="157px" height="68px" />
            </Box>

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

            <Box align="center" marginRight={isMobile ? "12px" : "25px"} borderRadius="10px" paddingLeft="10px" pointerEvents="auto">
                <HStack spacing={isMobile ? "20px" : "50px"} align="center">
                    {/* <Points satelliteMode={satelliteMode} /> */}
                    {signInStatus.signedIn && (
                        <>
                            <Messages />
                            <Notifications />
                        </>
                    )}

                    <ProfileMenu />
                    <LoginRegisterMenu />
                </HStack>
            </Box>
        </Flex>
    );
};

export default TopMenu;
