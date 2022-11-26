// #region imports
import React, { useState, useEffect, useContext, useMemo, useCallback } from "react";
import ReactFlow, { MiniMap, Controls, useNodesState, useEdgesState, addEdge, Handle, Position } from "reactflow";
import { Box, Image, Input, Flex, InputGroup, InputLeftElement, SimpleGrid, Text, Button } from "@chakra-ui/react";
import { CirclePicture } from "../../components/CircleElements";
import { getImageKitUrl, log, singleLineEllipsisStyle } from "../../components/Helpers";
import { openCirclePWA } from "../../components/Navigation";
import { useNavigate } from "react-router-dom";
import { HiOutlineSearch } from "react-icons/hi";
import { useAtom } from "jotai";
import { isMobileAtom, userAtom, userDataAtom } from "../../components/Atoms";
import { auth } from "../../components/Firebase";
import { signOut } from "firebase/auth";
// #endregion

export const Home = () => {
    const [isMobile] = useAtom(isMobileAtom);
    const [user] = useAtom(userAtom);
    const [userData] = useAtom(userDataAtom);
    const navigate = useNavigate();

    const [latestCircles, setLatestCircles] = useState([]);

    useEffect(() => {
        if (!userData?.latestCircles) {
            // read from local storage
            let latestCirclesStr = window.localStorage.getItem("latestCircles");
            if (latestCirclesStr) {
                setLatestCircles(JSON.parse(latestCirclesStr));
            }
            return;
        }

        log(JSON.stringify(userData, null, 2));

        // read from user.connections
        let userCircles = userData?.latestCircles
            ?.filter((x) => x.target.type === "circle")
            ?.slice(0, 10)
            ?.map((x) => x.target);
        setLatestCircles(userCircles);
        window.localStorage.setItem("latestCircles", JSON.stringify(userCircles));
    }, [userData]);

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

                <Flex marginBottom="200px" height={isMobile ? "271px" : "212px"} alignItems="center" justifyContent="center">
                    <SimpleGrid columns={isMobile ? 4 : 5} spacing={isMobile ? 5 : 10} maxWidth="500px" marginLeft="15px" marginRight="15px">
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
                                onClick={() => openCirclePWA(navigate, item.id)}
                            >
                                <CirclePicture size={48} circle={item} onParentClick={() => openCirclePWA(navigate, item.parent_circle?.id)} />
                                <Text style={singleLineEllipsisStyle} fontSize="12px" marginTop="5px">
                                    {item.name}
                                </Text>
                            </Box>
                        ))}
                    </SimpleGrid>
                    <Button
                        onClick={() => {
                            signOut(auth);
                        }}
                    >
                        Sign out
                    </Button>
                </Flex>
            </Flex>
        </Flex>
    );
};

export default Home;
