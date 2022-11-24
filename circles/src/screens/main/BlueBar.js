//#region imports
import React, { useContext } from "react";
import { Flex, Box, VStack, Icon, Spinner } from "@chakra-ui/react";
import UserContext from "../../components/UserContext";
import { useNavigate } from "react-router-dom";
import { IoAdd } from "react-icons/io5";
import Scrollbars from "react-custom-scrollbars-2";
import { defaultEarthCircle } from "../../store";
import { CirclePicture } from "../../components/CircleElements";
import { routes, openCircle } from "../../components/Navigation";
//#endregion

export const BlueBar = ({ selectedCircleId, isSigningIn, circle, setCircle }) => {
    const user = useContext(UserContext);
    const leftBarWidth = "80px"; //"92px"; // "72px";
    const leftBarCircleSize = 56;
    const navigate = useNavigate();
    const addSize = "48px";

    return (
        <Flex
            width={leftBarWidth}
            minWidth={leftBarWidth}
            //backgroundColor="#53459b"
            backgroundColor="#3f4779"
            height="100%"
        >
            <Box height="calc(100% - 100px)" width={leftBarWidth}>
                <Scrollbars autoHide>
                    <VStack marginTop="13px" spacing="14px">
                        {user && (
                            <Box
                                align="center"
                                borderRadius="50px"
                                role="group"
                                cursor="pointer"
                                spacing="12px"
                                padding="3px"
                                _hover={{
                                    //bg: "white",
                                    filter: "none",
                                    opacity: "1",
                                }}
                                opacity="0.5"
                                filter="grayscale(1)"
                            >
                                <CirclePicture size={leftBarCircleSize} circle={user} onClick={() => openCircle(navigate, user, user.id, circle, setCircle)} />
                            </Box>
                        )}

                        <Box
                            align="center"
                            borderRadius="50px"
                            role="group"
                            cursor="pointer"
                            spacing="12px"
                            padding="3px"
                            _hover={{
                                //bg: "white",
                                filter: "none",
                                opacity: "1",
                            }}
                            opacity="0.5"
                            filter="grayscale(1)"
                        >
                            <CirclePicture
                                size={leftBarCircleSize}
                                circle={defaultEarthCircle}
                                onClick={() => openCircle(navigate, user, "earth", circle, setCircle)}
                            />
                        </Box>

                        {isSigningIn && <Spinner color="#333" />}

                        {user?.connections
                            ?.filter((x) => x.target.type === "circle" && x.target.id !== "earth")
                            .map((item) => (
                                <Box
                                    key={item.target.id}
                                    align="center"
                                    borderRadius="50px"
                                    role="group"
                                    cursor="pointer"
                                    spacing="12px"
                                    padding="3px"
                                    _hover={{
                                        //bg: "white",
                                        filter: "none",
                                        opacity: "1",
                                    }}
                                    opacity="0.5"
                                    filter="grayscale(1)"
                                >
                                    <CirclePicture
                                        size={leftBarCircleSize}
                                        circle={item.target}
                                        onClick={() => openCircle(navigate, user, item.target.id, circle, setCircle)}
                                        onParentClick={() => openCircle(navigate, user, item.target.parent_circle?.id, circle, setCircle)}
                                    />
                                </Box>
                            ))}
                    </VStack>
                </Scrollbars>
            </Box>

            {/* Fade out effect */}
            <Box
                backgroundImage="linear-gradient(to bottom, transparent, #3f4779);"
                width={leftBarWidth}
                height="50px"
                position="absolute"
                bottom="100px"
            ></Box>
            <Box width={leftBarWidth} height="100px" position="absolute" bottom="0px" backgroundColor="#3f4779"></Box>

            <Flex width={leftBarWidth} minWidth={leftBarWidth} position="absolute" alignItems="center" justifyContent="center" bottom="30px">
                <Flex
                    backgroundColor="#6e4590"
                    _hover={{ backgroundColor: "#e94ce1dd" }}
                    width={addSize}
                    height={addSize}
                    borderRadius="50%"
                    cursor="pointer"
                    alignItems="center"
                    justifyContent="center"
                    marginTop="10px"
                    onClick={() => navigate(routes.circle(circle?.id ?? "earth").new)}
                >
                    <Icon width="28px" height="28px" color="white" as={IoAdd} />
                </Flex>
            </Flex>
        </Flex>
    );
};

export default BlueBar;
