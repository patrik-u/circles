// #region imports
import React, { useState, useEffect, useContext, useMemo, useCallback } from "react";
import ReactFlow, { MiniMap, Controls, useNodesState, useEdgesState, addEdge, Handle, Position } from "reactflow";
import { Box, Image, Input, Flex, InputGroup, InputLeftElement, SimpleGrid, Text, Button } from "@chakra-ui/react";
import { CirclePicture } from "components/CircleElements";
import { getImageKitUrl, log, singleLineEllipsisStyle } from "components/Helpers";
import { openCircle } from "components/Navigation";
import { useNavigateNoUpdates } from "components/RouterUtils";
import { HiOutlineSearch } from "react-icons/hi";
import { useAtom } from "jotai";
import { isMobileAtom, userAtom, userDataAtom, showNetworkLogoAtom, searchResultsShownAtom } from "components/Atoms";
import { auth } from "components/Firebase";
import { signOut } from "firebase/auth";
import config from "Config";
import CircleListItem from "components/CircleListItem";
import CircleSearchBox from "components/CircleSearch";
import algoliasearch from "algoliasearch/lite";
import { InstantSearch, SearchBox, Hits, RefinementList, useInstantSearch, useSearchBox } from "react-instantsearch-hooks-web";
// #endregion

export const Home = () => {
    log("Home.render", -1);

    const [isMobile] = useAtom(isMobileAtom);
    const [user] = useAtom(userAtom);
    const [userData] = useAtom(userDataAtom);
    const [, setShowNetworkLogo] = useAtom(showNetworkLogoAtom);
    const navigate = useNavigateNoUpdates();
    const [searchResultsShown] = useAtom(searchResultsShownAtom);

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

    useEffect(() => {
        setShowNetworkLogo(false);
    });

    return (
        <Flex backgroundColor="#ffffff" justifyContent="center">
            <Flex flexDirection="column" alignItems="center" width="100%">
                <Box width="313px" height="114px">
                    <Image src={getImageKitUrl("/circles.png", 313, 114)} width="313px" height="114px" />
                </Box>

                <Flex width="100%" maxWidth="580px" marginBottom="40px" flexDirection="column">
                    <CircleSearchBox marginTop="35px" marginBottom="0px" />

                    {!searchResultsShown && (
                        <Flex marginBottom="200px" marginTop="35px" height={isMobile ? "271px" : "212px"} alignItems="center" justifyContent="center">
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
                                    >
                                        <CirclePicture size={48} circle={item} />
                                        <Text style={singleLineEllipsisStyle} fontSize="12px" marginTop="5px" onClick={() => openCircle(navigate, item.id)}>
                                            {item.name}
                                        </Text>
                                    </Box>
                                ))}
                            </SimpleGrid>
                        </Flex>
                    )}
                </Flex>
            </Flex>
        </Flex>
    );
};

export default Home;
