//#region imports
import React, { useContext } from "react";
import { Flex, Box, Text } from "@chakra-ui/react";
import UserContext from "../../components/UserContext";
import { useNavigate, useLocation, matchPath } from "react-router-dom";
import { hasUpdates } from "../../components/Helpers";
import { getNavigationItems, shouldShowNavItem } from "../../components/Navigation";
import { CirclePicture } from "../../components/CircleElements";
//#endregion

export const BottomNavigator = ({ circle }) => {
    const navHeight = "50px";
    const user = useContext(UserContext);
    const navigate = useNavigate();
    const location = useLocation();
    const isMatch = getNavigationItems(circle?.id, user?.id_admin)
        .filter((x) => shouldShowNavItem(x, circle, user))
        .map((navItem) => matchPath(navItem.matchSubPaths ? navItem.route + "/*" : navItem.route, location.pathname) != null);

    const navigateTo = (route) => {
        navigate(route);
    };

    return (
        <Flex flex="0 0 40px" backgroundColor="#f7f7f7" color="black" flexDirection="row" align="center" justifyContent="flex-start">
            <Flex
                width="60px"
                minWidth="60px"
                height={navHeight}
                backgroundColor="#8985a7"
                borderTopRightRadius="100px"
                borderBottomRightRadius="100px"
                align="center"
                justifyContent="center"
                marginRight="10px"
            >
                <CirclePicture circle={circle} size={30} />
            </Flex>

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
                                <Box width="8.5px" height="8.5px" backgroundColor="#ff6499" borderRadius="50%" position="absolute" top="5px" right="0px"></Box>
                            )}
                        </Flex>
                    ))}
            </Flex>
        </Flex>
    );
};

export default BottomNavigator;
