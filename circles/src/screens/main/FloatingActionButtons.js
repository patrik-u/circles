//#region imports
import React, { useContext } from "react";
import { Flex, Icon, VStack } from "@chakra-ui/react";
import IsMobileContext from "../../components/IsMobileContext";
import { useNavigate } from "react-router-dom";
import { FaSatellite, FaMapMarkedAlt } from "react-icons/fa";
import { IoAdd, IoList, IoMap } from "react-icons/io5";
import { BiNetworkChart } from "react-icons/bi";
import { routes } from "../../components/Navigation";
import config from "../../Config";
//#endregion

const FloatingActionButtons = ({ displayMode, setDisplayMode, satelliteMode, setSatelliteMode, mapOnly, circle }) => {
    const isMobile = useContext(IsMobileContext);
    const navigate = useNavigate();

    return (
        <VStack position="absolute" right="18px" bottom={isMobile ? "300px" : "30px"} zIndex="50">
            {isMobile && !mapOnly && (
                <>
                    <Flex
                        backgroundColor="#c242bbdd"
                        _hover={{ backgroundColor: "#e94ce1dd" }}
                        width="54px"
                        height="54px"
                        borderRadius="50%"
                        cursor="pointer"
                        alignItems="center"
                        justifyContent="center"
                        onClick={() => navigate(routes.circle(circle?.id ?? "earth").new)}
                    >
                        <Icon width="28px" height="28px" color="white" as={IoAdd} />
                    </Flex>
                    <Flex
                        backgroundColor="#f4f4f4dd"
                        _hover={{ backgroundColor: "#f5f5f5dd" }}
                        width="48px"
                        height="48px"
                        borderRadius="50%"
                        cursor="pointer"
                        alignItems="center"
                        justifyContent="center"
                        onClick={() => setDisplayMode(displayMode === "map" ? "list" : "map")}
                    >
                        <Icon width="28px" height="28px" color="black" as={displayMode === "map" ? IoList : IoMap} cursor="pointer" />
                    </Flex>
                </>
            )}

            {(!isMobile || displayMode === "map" || displayMode === "graph") && (
                <Flex cursor="pointer" alignItems="center" justifyContent="center" flexDirection="column">
                    <Flex
                        backgroundColor="#f4f4f4dd"
                        _hover={{ backgroundColor: "#f5f5f5dd" }}
                        borderRadius="50%"
                        cursor="pointer"
                        width="48px"
                        height="48px"
                        alignItems="center"
                        justifyContent="center"
                    >
                        <Icon
                            width="28px"
                            height="28px"
                            color="black"
                            as={satelliteMode ? FaMapMarkedAlt : FaSatellite}
                            onClick={() => {
                                if (displayMode === "map") {
                                    setSatelliteMode(!satelliteMode);
                                }
                                setDisplayMode("map");
                            }}
                            cursor="pointer"
                        />
                    </Flex>
                </Flex>
            )}

            {config.environment !== "prod" && (
                <Flex cursor="pointer" alignItems="center" justifyContent="center" flexDirection="column">
                    <Flex
                        backgroundColor="#f4f4f4dd"
                        _hover={{ backgroundColor: "#f5f5f5dd" }}
                        borderRadius="50%"
                        cursor="pointer"
                        width="48px"
                        height="48px"
                        alignItems="center"
                        justifyContent="center"
                    >
                        <Icon width="28px" height="28px" color="black" as={BiNetworkChart} onClick={() => setDisplayMode("graph")} cursor="pointer" />
                    </Flex>
                </Flex>
            )}
        </VStack>
    );
};

export default FloatingActionButtons;
