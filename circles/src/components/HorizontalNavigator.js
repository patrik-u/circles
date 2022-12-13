//#region imports
import React from "react";
import { Flex, Box, Text } from "@chakra-ui/react";
import { hasUpdates } from "components/Helpers";
import { getNavigationItems, shouldShowNavItem } from "components/Navigation";
import { matchPath } from "react-router-dom";
import { userAtom, circleAtom } from "components/Atoms";
import { useNavigateNoUpdates, useLocationNoUpdates } from "components/RouterUtils";
import { useAtom } from "jotai";
//#endregion

export const HorizontalNavigator = () => {
    const navHeight = "50px";
    const [user] = useAtom(userAtom);
    const [circle] = useAtom(circleAtom);
    const navigate = useNavigateNoUpdates();
    const location = useLocationNoUpdates();
    const isMatch = getNavigationItems(circle?.id, user?.id_admin)
        .filter((x) => shouldShowNavItem(x, circle, user))
        .map((navItem) => matchPath(navItem.matchSubPaths ? navItem.route + "/*" : navItem.route, location.pathname) != null);

    const navigateTo = (route) => {
        navigate(route);
    };

    if (!circle) return null;

    return (
        <Box height="40px" overflowY="hidden" overflowX="auto">
            <Flex flex="0 0 40px" color="black" flexDirection="row" align="center" justifyContent="flex-start" overflowY="hidden">
                <Flex height={navHeight} overflowX="auto" overflowY="hidden" flexDirection="row" align="center" paddingLeft="10px">
                    {getNavigationItems(circle?.id, user?.is_admin)
                        .filter((x) => shouldShowNavItem(x, circle, user))
                        .map((navItem, i) => (
                            <Flex
                                key={navItem.route}
                                height="30px"
                                align="center"
                                borderRadius="50px"
                                cursor="pointer"
                                paddingLeft="10px"
                                paddingRight="10px"
                                color={isMatch[i] ? "white" : "#757575"}
                                fontWeight={isMatch[i] ? "700" : "500"}
                                bg={isMatch[i] ? "#c242bb" : "transparent"}
                                onClick={() => navigateTo(navItem.route)}
                                position="relative"
                            >
                                <Text>{navItem.name}</Text>
                                {!isMatch[i] && hasUpdates(user, circle, navItem.category) && (
                                    <Box
                                        width="8.5px"
                                        height="8.5px"
                                        backgroundColor="#ff6499"
                                        borderRadius="50%"
                                        position="absolute"
                                        top="5px"
                                        right="0px"
                                    ></Box>
                                )}
                            </Flex>
                        ))}
                </Flex>
            </Flex>
        </Box>
    );
};

export default HorizontalNavigator;
