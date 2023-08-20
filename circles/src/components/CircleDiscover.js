//#region imports
import React, { useEffect, useMemo, useState } from "react";
import { Box, VStack, Text, Flex, HStack, Icon, Button, Select } from "@chakra-ui/react";
import { log, getDateAndTimeLong, getDateLong, singleLineEllipsisStyle, twoLineEllipsisStyle, isActiveInCircle } from "components/Helpers";
import { useAtom } from "jotai";
import { isMobileAtom, circleAtom, circlesFilterAtom, previewCircleAtom, userAtom } from "components/Atoms";
import { useLocationNoUpdates } from "components/RouterUtils";
import { CircleCover, CirclePicture, CircleHeader, QuickLinks, CircleMembersPanel } from "components/CircleElements";
import { Scrollbars } from "react-custom-scrollbars-2";
import { CircleTags } from "components/CircleElements";
import { ActiveInCircle, RelationSetInfo } from "components/CirclePreview";
import { MdOutlineClose, MdCompare, MdLink, MdChat, MdSearch } from "react-icons/md";
import { TbClockPlay } from "react-icons/tb";
//#endregion

const CircleDiscover = ({ onClose, ...props }) => {
    log("CircleDiscover.render", -1);

    const [user] = useAtom(userAtom);
    const [isMobile] = useAtom(isMobileAtom);
    const location = useLocationNoUpdates();
    const iconSize = 12;
    const showIcon = false;

    const [activeCategory, setActiveCategory] = useState("active"); // Default category set to 'active'
    const [circleFilter, setCircleFilter] = useState("all"); // Default filter set to 'all'

    const handleFilterChange = (event) => {
        setCircleFilter(event.target.value);
    };

    const TabButton = ({ label, icon, isActive }) => (
        <Button
            variant="ghost"
            borderRadius="0"
            borderBottomWidth={"3px"}
            borderColor={isActive ? "blue.500" : "transparent"}
            fontWeight={isActive ? "bold" : "normal"}
            onClick={() => setActiveCategory(label.toLowerCase())}
            _hover={{ borderColor: "blue.200", borderBottomWidth: "3px" }}
        >
            <VStack marginBottom="10px">
                {showIcon && <Icon as={icon} boxSize={6} />}
                <Text>{label}</Text>
            </VStack>
        </Button>
    );

    return (
        <Box
            bgGradient="linear(to-r,#d3d1d3,#ffffff)"
            borderRadius="10px"
            margin={isMobile ? "0px" : "0px 10px 10px 0px"}
            padding="5px"
            flexGrow="1"
            pointerEvents="auto"
            position="relative"
            overflow="hidden"
            height="100%"
            {...props}
        >
            {/* Top Bar */}
            <Box mb={3}>
                <Flex justify="space-between" align="center">
                    <Text fontSize="xl">Circle Discover</Text>
                    <HStack spacing={4}>
                        <Select defaultValue="all" onChange={handleFilterChange}>
                            <option value="all">All</option>
                            <option value="user">Users</option>
                            <option value="circle">Circles</option>
                            <option value="event">Events</option>
                        </Select>
                        <Flex
                            width={iconSize + 8 + "px"}
                            height={iconSize + 8 + "px"}
                            _hover={{ color: "#e6e6e6", transform: "scale(1.1)" }}
                            _active={{ transform: "scale(0.98)" }}
                            borderRadius="50%"
                            justifyContent="center"
                            alignItems="center"
                            onClick={onClose}
                            cursor="pointer"
                        >
                            <Icon width={iconSize + 8 + "px"} height={iconSize + 8 + "px"} color={"#333"} as={MdOutlineClose} cursor="pointer" />
                        </Flex>
                    </HStack>
                </Flex>
            </Box>

            {/* Categories Navigation */}
            <HStack spacing={4} mb={4}>
                <TabButton label="Active" icon={TbClockPlay} isActive={activeCategory === "active"} />
                <TabButton label="Similar" icon={MdCompare} isActive={activeCategory === "similar"} />
                <TabButton label="Connected" icon={MdLink} isActive={activeCategory === "connected"} />
                <TabButton label="Mentioned" icon={MdChat} isActive={activeCategory === "mentioned"} />
                <TabButton label="Search" icon={MdSearch} isActive={activeCategory === "search"} />
            </HStack>

            {/* Results Area */}
            <Box>
                {
                    // activeCategory === 'active' ? <ActiveCirclesList filter={circleFilter} /> :
                    // activeCategory === 'similar' ? <SimilarCirclesList filter={circleFilter} /> :
                    // activeCategory === 'connected' ? <ConnectedCirclesList filter={circleFilter} /> :
                    // activeCategory === 'mentioned' ? <MentionedCirclesList filter={circleFilter} /> :
                    // <SearchCirclesList filter={circleFilter} />
                }
            </Box>
        </Box>

        // <Box
        //     bgGradient="linear(to-r,#d3d1d3,#ffffff)"
        //     borderRadius="10px"
        //     margin={isMobile ? "0px" : "0px 10px 10px 0px"}
        //     padding="5px"
        //     flexGrow="1"
        //     pointerEvents="auto"
        //     position="relative"
        //     overflow="hidden"
        //     height="100%"
        //     {...props}
        // >
        //     <Flex flex="initial" order="0" align="left" flexDirection="column" width="100%" height={isMobile ? "32px" : "32px"}>
        //         <Flex flexDirection="row" width="100%" align="center">
        //             <Flex flexDirection="row" width="100%" position="relative" align="center" height="28px">
        //                 <Box flexGrow="1" />
        //                 <Flex
        //                     width={iconSize + 8 + "px"}
        //                     height={iconSize + 8 + "px"}
        //                     _hover={{ color: "#e6e6e6", transform: "scale(1.1)" }}
        //                     _active={{ transform: "scale(0.98)" }}
        //                     borderRadius="50%"
        //                     justifyContent="center"
        //                     alignItems="center"
        //                     onClick={onClose}
        //                     cursor="pointer"
        //                 >
        //                     <Icon width={iconSize + 8 + "px"} height={iconSize + 8 + "px"} color={"#333"} as={MdOutlineClose} cursor="pointer" />
        //                 </Flex>
        //             </Flex>
        //         </Flex>
        //     </Flex>
        //     <Scrollbars autoHide></Scrollbars>
        // </Box>
    );
};

export default CircleDiscover;
