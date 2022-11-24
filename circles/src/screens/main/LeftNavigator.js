//#region imports
import React, { useState, useContext } from "react";
import { Flex, Box, VStack, Text, Image, Icon } from "@chakra-ui/react";
import UserContext from "../../components/UserContext";
import { useNavigate, useLocation, matchPath } from "react-router-dom";
import { hasUpdates } from "../../components/Helpers";
import { openCircle, getNavigationItems, shouldShowNavItem } from "../../components/Navigation";
import { CirclePicture } from "../../components/CircleElements";
//#endregion

export const LeftNavigator = ({ circle, setCircle, isSigningIn }) => {
    const user = useContext(UserContext);
    const navigate = useNavigate();
    const location = useLocation();
    const isMatch = getNavigationItems(circle?.id, user?.id_admin)
        .filter((x) => shouldShowNavItem(x, circle, user))
        .map((navItem) => matchPath(navItem.matchSubPaths ? navItem.route + "/*" : navItem.route, location.pathname) != null);
    const [isExpanded, setIsExpanded] = useState(true);
    const expandedSizeNum = 84; //72;
    const expandedSize = expandedSizeNum + "px";

    const navigateTo = (route) => {
        navigate(route);
    };
    const iconSize = isExpanded ? "24px" : "24px";
    const getNameFontSize = (name) => {
        if (name.length > 9) {
            return "13px";
        }
        return name.length > 8 ? "14px" : "15px";
    };

    return (
        <Flex
            flexDirection="column"
            width={isExpanded ? expandedSize : "50px"}
            minWidth={isExpanded ? expandedSize : "50px"}
            maxWidth={isExpanded ? expandedSize : "50px"}
            margin="0px"
            align="center"
            overflow="hidden"
            backgroundColor="#f2f2f2"
            flexGrow="0"
            flexShrink="0"
            position="relative"
        >
            <VStack align="center" marginTop="0px" width={isExpanded ? expandedSize : "50px"} spacing={isExpanded ? "14px" : "25px"}>
                <Flex
                    backgroundColor="#fafafa"
                    width={isExpanded ? expandedSize : "50px"}
                    align="center"
                    justifyContent="center"
                    alignItems="center"
                    height="74px"
                    cursor="pointer"
                >
                    <CirclePicture
                        circle={circle}
                        size={isExpanded ? 60 : 30}
                        onClick={() => openCircle(navigate, user, circle.id, circle, setCircle)}
                        onParentClick={() => openCircle(navigate, user, circle.parent_circle?.id, circle, setCircle)}
                    />
                </Flex>

                {getNavigationItems(circle?.id, user?.id_admin)
                    .filter((x) => shouldShowNavItem(x, circle, user))
                    .map((navItem, i) => (
                        <Box
                            key={navItem.name}
                            borderRadius="15px"
                            role="group"
                            cursor="pointer"
                            color={isMatch[i] ? "#585858" : "#4d4668"}
                            bg={isMatch[i] ? "#d5d5d5" : "transparent"}
                            _hover={{
                                bg: "#e1e0e9",
                                color: "black",
                            }}
                            paddingTop={isExpanded ? "10px" : "5px"}
                            paddingBottom={isExpanded ? "5px" : "0px"}
                            width={isExpanded ? `${expandedSizeNum - 15}px` : "42px"}
                            onClick={() => navigateTo(navItem.route)}
                            align="center"
                            position="relative"
                        >
                            <Box key={navItem.route} align="center">
                                {navItem.icon && (
                                    <Icon
                                        fontSize="16"
                                        width={iconSize}
                                        height={iconSize}
                                        _groupHover={{
                                            color: "black",
                                        }}
                                        as={navItem.icon}
                                    />
                                )}
                                {navItem.image && <Image src={navItem.image} color={isMatch[i] ? "#585858" : "#4d4668"} marginBottom="5px" />}
                            </Box>
                            {isExpanded && <Text fontSize={getNameFontSize(navItem.name)}>{navItem.name}</Text>}
                            {!isMatch[i] && hasUpdates(user, circle, navItem.category) && (
                                <Box
                                    width={isExpanded ? "8.5px" : "8.5px"}
                                    height={isExpanded ? "8.5px" : "8.5px"}
                                    backgroundColor="#ff6499"
                                    borderRadius="50%"
                                    position="absolute"
                                    bottom={isExpanded ? "33px" : "6px"}
                                    right={isExpanded ? "18px" : "5px"}
                                ></Box>
                            )}
                        </Box>
                    ))}
            </VStack>
            <Box
                height="20px"
                width="100%"
                position="absolute"
                bottom="0px"
                onClick={() => setIsExpanded(!isExpanded)}
                cursor="pointer"
                backgroundColor="#f2f2f2"
            />
        </Flex>
    );
};

export default LeftNavigator;
