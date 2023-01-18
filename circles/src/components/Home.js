// #region imports
import React, { useEffect } from "react";
import { Box, Image, Flex, SimpleGrid, Text } from "@chakra-ui/react";
import { CirclePicture } from "components/CircleElements";
import { getImageKitUrl, log, singleLineEllipsisStyle } from "components/Helpers";
import { openCircle } from "components/Navigation";
import { useNavigateNoUpdates } from "components/RouterUtils";
import { useAtom } from "jotai";
import { isMobileAtom, userAtom, userDataAtom, showNetworkLogoAtom, searchResultsShownAtom } from "components/Atoms";
import CircleSearchBox from "components/CircleSearch";
// #endregion

export const Home = () => {
    log("Home.render", -1);

    const [isMobile] = useAtom(isMobileAtom);
    const [user] = useAtom(userAtom);
    const [userData] = useAtom(userDataAtom);
    const [, setShowNetworkLogo] = useAtom(showNetworkLogoAtom);
    const navigate = useNavigateNoUpdates();
    const [searchResultsShown] = useAtom(searchResultsShownAtom);

    const getFavoriteCircles = (userData) => {
        if (!userData) return [];
        let favoriteCircles = [];
        for (var circleId in userData.circle_settings) {
            let favorite = userData.circle_settings[circleId].favorite;
            if (favorite) {
                favoriteCircles.push(userData.circle_settings[circleId].circle);
            }
        }
        return favoriteCircles;
    };

    useEffect(() => {
        setShowNetworkLogo(false);
    });

    return (
        <Flex backgroundColor="#ffffff" justifyContent="center">
            <Flex flexDirection="column" alignItems="center" width="100%">
                <Box width="356px" height="356px">
                    <Image src={getImageKitUrl("/icon-512x512.png", 356, 356)} width="356px" height="356px" />
                </Box>

                <Flex width="100%" maxWidth="580px" marginBottom="40px" flexDirection="column">
                    <CircleSearchBox marginBottom="0px" />
                    {!searchResultsShown && (
                        <Flex marginBottom="200px" marginTop="35px" height={isMobile ? "271px" : "212px"} alignItems="center" justifyContent="center">
                            <SimpleGrid
                                columns={isMobile ? 4 : 5}
                                spacing={isMobile ? 5 : 10}
                                maxWidth="500px"
                                marginLeft="15px"
                                marginRight="15px"
                                alignSelf="start"
                            >
                                {getFavoriteCircles(userData)?.map((item) => (
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
            <Box position="absolute" bottom="5px" right="10px" color={process.env.REACT_APP_ENVIRONMENT === "prod" ? "#f3f3f3" : "#a9a9a9"}>
                <Text>
                    {process.env.REACT_APP_NAME} {process.env.REACT_APP_VERSION} ({process.env.REACT_APP_ENVIRONMENT})
                </Text>
            </Box>
        </Flex>
    );
};

export default Home;
