//#region imports
import React, { useState } from "react";
import { Flex, Box, VStack, Text, Image, Icon } from "@chakra-ui/react";
import { matchPath } from "react-router-dom";
import { hasUpdates, getImageKitUrl } from "components/Helpers";
import { getNavigationItems, shouldShowNavItem } from "components/Navigation";
import { useAtom } from "jotai";
import { userAtom, userDataAtom, circleAtom } from "components/Atoms";
import { useNavigateNoUpdates, useLocationNoUpdates } from "components/RouterUtils";
//#endregion

export const LeftMenu = ({ ...props }) => {
    const [circle] = useAtom(circleAtom);
    const [user] = useAtom(userAtom);
    const [userData] = useAtom(userDataAtom);

    const navigate = useNavigateNoUpdates();
    const location = useLocationNoUpdates();
    const isMatch = getNavigationItems(circle, user?.is_admin)
        .filter((x) => shouldShowNavItem(x, circle, userData))
        .map((navItem) => matchPath(navItem.matchSubPaths ? navItem.route + "/*" : navItem.route, location.pathname) != null);
    const [isExpanded] = useState(true);
    const expandedSize = 200; //72;
    const expandedSizePx = expandedSize + "px";

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

    const matchedColor = "#1e2228";
    const notMatchedColor = matchedColor; //"#4a4a4a"

    return (
        <Flex
            className="sticky"
            flexDirection="column"
            width={isExpanded ? expandedSizePx : "50px"}
            minWidth={isExpanded ? expandedSizePx : "50px"}
            maxWidth={isExpanded ? expandedSizePx : "50px"}
            margin="0px"
            align="center"
            overflow="hidden"
            flexGrow="0"
            flexShrink="0"
            {...props}
        >
            <VStack align="center" marginTop="0px" width={isExpanded ? expandedSize : "50px"} spacing={isExpanded ? "5px" : "5px"}>
                {getNavigationItems(circle, user?.is_admin)
                    .filter((x) => shouldShowNavItem(x, circle, userData))
                    .map((navItem, i) => (
                        <Flex
                            key={navItem.name}
                            borderRadius="100px"
                            role="group"
                            cursor="pointer"
                            color={isMatch[i] ? matchedColor : notMatchedColor}
                            bg={isMatch[i] ? "#e9e9e9" : "transparent"}
                            _hover={{
                                bg: "#e1e0e9",
                                color: "black",
                            }}
                            width={isExpanded ? expandedSizePx : "42px"}
                            height="60px"
                            onClick={() => navigateTo(navItem.route)}
                            align="center"
                            position="relative"
                            flexDirection="row"
                            paddingLeft={isExpanded ? "15px" : "10px"}
                            paddingRight="10px"
                        >
                            <Flex align="center" width="30px" height="30px" justifyContent="center" alignItems="center" position="relative">
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
                                {navItem.image && <Image src={getImageKitUrl(navItem.image)} color={isMatch[i] ? matchedColor : notMatchedColor} />}
                                {!isMatch[i] && hasUpdates(userData, circle, navItem.category) && (
                                    <Box
                                        width={isExpanded ? "8.5px" : "8.5px"}
                                        height={isExpanded ? "8.5px" : "8.5px"}
                                        backgroundColor="#ff6499"
                                        borderRadius="50%"
                                        position="absolute"
                                        top={isExpanded ? "19px" : "19px"}
                                        left={isExpanded ? "23px" : "19px"}
                                    ></Box>
                                )}
                            </Flex>
                            {isExpanded && (
                                <Box marginLeft="15px">
                                    <Text fontSize={getNameFontSize(navItem.name)}>{navItem.name}</Text>
                                </Box>
                            )}
                        </Flex>
                    ))}
            </VStack>
        </Flex>
    );
};

export default LeftMenu;
