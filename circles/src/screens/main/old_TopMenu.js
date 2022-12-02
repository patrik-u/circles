//#region imports
import React, { useContext } from "react";
import { Flex, Box, Image, Spinner, HStack } from "@chakra-ui/react";
import UserContext from "../../components/UserContext";
import IsMobileContext from "../../components/IsMobileContext";
import { getImageKitUrl } from "../../components/old_Helpers";
import { useNavigate } from "react-router-dom";
import Notifications from "./Notifications";
import Messages from "./Messages";
import ProfileMenu from "./old_ProfileMenu";
import { routes, openCircle } from "../../components/Navigation";
import { LoginRegisterMenu } from "../../components/LoginForms";
//#endregion

export const TopMenu = ({ circle, setCircle, onSignOutClick, isSigningIn, isSignedIn, gsiScriptLoaded, satelliteMode, displayMode, chatCircle }) => {
    const isMobile = useContext(IsMobileContext);
    const user = useContext(UserContext);
    const navigate = useNavigate();
    const isMapActive = displayMode === "map" || displayMode === "graph";

    return (
        <Flex
            className="fixedSize"
            align="center"
            flexBasis={isMobile ? "40px" : "90px"}
            height={isMobile ? "40px" : "90px"}
            maxHeight={isMobile ? "40px" : "90px"}
            backgroundColor={isMobile ? "white" : "transparent"}
            position={isMobile ? "relative" : "absolute"}
            top="0px"
            right={isMobile ? "0px" : displayMode === "map" ? "50px" : "0px"}
            zIndex="1000"
            width={isMobile ? "100%" : "calc(100% - 50px)"}
            pointerEvents={isMobile && isMapActive ? "none" : "auto"}
        >
            {isMobile && circle && circle.id !== "earth" && (
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
                                // marginRight={isMobile ? "5px" : "10px"}
                                onClick={() => navigate(routes.home)}
                                cursor="pointer"
                                position="absolute"
                                top="7px"
                                //top={isMobile ? "21px" : "7px"}
                                left="10px"
                            />
                        )}
                    </Flex>
                </Box>
            )}

            <Box flex="1" />

            <Box
                align="center"
                marginRight={isMobile ? "12px" : "25px"}
                backgroundColor={isMobile ? (isMapActive ? "transparent" : "#ffffffee") : "transparent"}
                borderRadius="10px"
                paddingLeft="10px"
                pointerEvents="auto"
            >
                <HStack spacing={isMobile ? "20px" : "50px"} align="center">
                    {/* <Points satelliteMode={satelliteMode} /> */}
                    {user && (
                        <>
                            <Messages satelliteMode={satelliteMode} circle={circle} setCircle={setCircle} chatCircle={chatCircle} />

                            <Notifications satelliteMode={satelliteMode} circle={circle} setCircle={setCircle} />
                        </>
                    )}

                    <ProfileMenu onSignOutClick={onSignOutClick} circle={circle} setCircle={setCircle} />
                </HStack>

                <LoginRegisterMenu satelliteMode={satelliteMode} gsiScriptLoaded={gsiScriptLoaded} isSigningIn={isSigningIn} isSignedIn={isSignedIn} />
            </Box>
        </Flex>
    );
};

export default TopMenu;
