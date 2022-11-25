// #region imports
import React, { useState, useEffect, useContext, useMemo, useCallback } from "react";
import ReactFlow, { MiniMap, Controls, useNodesState, useEdgesState, addEdge, Handle, Position } from "reactflow";
import { Box, Image, Input, Flex, InputGroup, InputLeftElement, SimpleGrid, Text } from "@chakra-ui/react";
import UserContext from "../../components/UserContext";
import { CirclePicture } from "../../components/CircleElements";
import { getImageKitUrl } from "../../components/Helpers";
import { openCircle } from "../../components/Navigation";
import { useNavigate } from "react-router-dom";
import { HiOutlineSearch } from "react-icons/hi";
import IsMobileContext from "../../components/IsMobileContext";
// #endregion

export const Home = ({ circle, setCircle }) => {
    const isMobile = useContext(IsMobileContext);
    const user = useContext(UserContext);
    const navigate = useNavigate();
    const [latestCircles, setLatestCircles] = useState([]);

    useEffect(() => {
        if (!user?.connections) {
            // read from local storage
            let latestCirclesStr = window.localStorage.getItem("latestCircles");
            if (latestCirclesStr) {
                setLatestCircles(JSON.parse(latestCirclesStr));
            }
            return;
        }

        // read from user.connections
        let userCircles = user?.connections
            ?.filter((x) => x.target.type === "circle")
            ?.slice(0, 10)
            ?.map((x) => x.target);
        setLatestCircles(userCircles);
        window.localStorage.setItem("latestCircles", JSON.stringify(userCircles));
    }, [user?.connections]);

    return (
        <Flex backgroundColor="#ffffff" width="100%" height="100%" alignItems="center" justifyContent="center">
            <Flex flexDirection="column" alignItems="center" width="100%">
                <Box width="313px" height="114px">
                    <Image src={getImageKitUrl("/circles.png", 313, 114)} width="313px" height="114px" />
                </Box>

                <Flex width="100%" maxWidth="580px" marginBottom="40px">
                    <InputGroup marginTop="35px">
                        <InputLeftElement color="gray.300" pointerEvents="none" children={<HiOutlineSearch size={28} />} height="50px" marginLeft="20px" />
                        <Input
                            paddingLeft="65px"
                            borderRadius="50px"
                            height="50px"
                            width="100%"
                            marginLeft="15px"
                            marginRight="15px"
                            focusBorderColor="pink.400"
                            placeholder="Type search terms or enter URL"
                            _placeholder={{ fontSize: isMobile ? "16px" : "22px", height: "50px", textAlign: "center", paddingRight: "32px" }}
                        />
                    </InputGroup>
                </Flex>

                <Flex marginBottom="200px" height="212px" alignItems="center" justifyContent="center">
                    <SimpleGrid columns={5} spacing={10} maxWidth="500px" marginLeft="15px" marginRight="15px">
                        {latestCircles?.map((item) => (
                            <Box
                                key={item.id}
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
                                opacity="0.9"
                                filter="grayscale(0.05)"
                            >
                                <CirclePicture
                                    size={48}
                                    circle={item}
                                    onClick={() => openCircle(navigate, user, item.id, circle, setCircle)}
                                    onParentClick={() => openCircle(navigate, user, item.parent_circle?.id, circle, setCircle)}
                                />
                                <Text fontSize="12px" marginTop="5px">
                                    {item.name}
                                </Text>
                            </Box>
                        ))}
                    </SimpleGrid>
                </Flex>
            </Flex>
        </Flex>
    );
};

export default Home;
