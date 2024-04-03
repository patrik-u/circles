// #region imports
import React, { useEffect } from "react";
import { Box, Image, Flex, SimpleGrid, Text } from "@chakra-ui/react";
import { CirclePicture } from "@/components/CircleElements";
import { getImageKitUrl, log, singleLineEllipsisStyle } from "@/components/Helpers";
import { openCircle, focusCircle } from "@/components/Navigation";
import { useNavigateNoUpdates } from "@/components/RouterUtils";
import { useAtom } from "jotai";
import {
    isMobileAtom,
    userAtom,
    userDataAtom,
    homeExpandedAtom,
    searchResultsShownAtom,
    focusOnMapItemAtom,
} from "@/components/Atoms";
import CircleSearchBox from "@/components/CircleSearch";
// #endregion

export const Home = () => {
    log("Home.render", -1);

    const [isMobile] = useAtom(isMobileAtom);
    const [user] = useAtom(userAtom);
    const [userData] = useAtom(userDataAtom);
    const navigate = useNavigateNoUpdates();
    const [searchResultsShown] = useAtom(searchResultsShownAtom);
    const [, setFocusOnMapItem] = useAtom(focusOnMapItemAtom);

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

    const logoSize = isMobile ? 256 : 356;
    const logoSizePx = logoSize + "px";

    return (
        <Flex backgroundColor="#ffffff" justifyContent="center">
            <Flex flexDirection="column" alignItems="center" width="100%">
                <Box width={logoSizePx} height={logoSizePx} marginTop="50px">
                    <Image
                        src={getImageKitUrl("/codo-logotype.svg", logoSize, logoSize)}
                        width={logoSizePx}
                        height={logoSizePx}
                    />
                </Box>

                <Flex width="100%" maxWidth="580px" marginBottom="40px" flexDirection="column" position="relative">
                    {/* <CircleSearchBox marginBottom="0px" popover={true} /> */}
                    {!searchResultsShown && (
                        <Flex
                            marginBottom="200px"
                            marginTop="35px"
                            height={isMobile ? "271px" : "212px"}
                            alignItems="center"
                            justifyContent="center"
                        >
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
                                        <Text
                                            style={singleLineEllipsisStyle}
                                            fontSize="12px"
                                            marginTop="5px"
                                            onClick={() => {
                                                openCircle(navigate, item);
                                                // focusCircle(item, setFocusOnMapItem);
                                            }}
                                        >
                                            {item.name}
                                        </Text>
                                    </Box>
                                ))}
                            </SimpleGrid>
                        </Flex>
                    )}
                </Flex>
            </Flex>
            <Box
                position="absolute"
                top="15px"
                left="20px"
                color={import.meta.env.VITE_APP_ENVIRONMENT === "prod" ? "#ffffff" : "#a9a9a9"}
            >
                <Text>
                    {import.meta.env.VITE_APP_NAME} {import.meta.env.VITE_APP_VERSION} (
                    {import.meta.env.VITE_APP_ENVIRONMENT})
                </Text>
            </Box>
        </Flex>
    );
};

export default Home;
