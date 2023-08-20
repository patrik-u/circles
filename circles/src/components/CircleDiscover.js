//#region imports
import React, { useEffect, useMemo, useState } from "react";
import { Box, VStack, Text, Flex, HStack, Icon, Button, Select, ButtonGroup } from "@chakra-ui/react";
import { log, getDateAndTimeLong, getDateLong, singleLineEllipsisStyle, twoLineEllipsisStyle, isActiveInCircle } from "components/Helpers";
import { useAtom } from "jotai";
import { isMobileAtom, circleAtom, filteredCirclesAtom, circlesAtom, circlesFilterAtom, previewCircleAtom, userAtom, toggleAboutAtom } from "components/Atoms";
import { useLocationNoUpdates } from "components/RouterUtils";
import { CircleCover, CirclePicture, CircleHeader, QuickLinks, CircleMembersPanel } from "components/CircleElements";
import { Scrollbars } from "react-custom-scrollbars-2";
import { CircleTags } from "components/CircleElements";
import { ActiveInCircle, RelationSetInfo } from "components/CirclePreview";
import { MdOutlineClose, MdCompare, MdLink, MdChat, MdSearch } from "react-icons/md";
import { TbClockPlay } from "react-icons/tb";
import CircleListItem, { CircleListItemNormal } from "./CircleListItem";
import { openAboutCircle, openCircle } from "components/Navigation";
//#endregion

const CircleDiscover = ({ onClose, ...props }) => {
    log("CircleDiscover.render", -1);

    const [isMobile] = useAtom(isMobileAtom);
    const [circles] = useAtom(circlesAtom);
    const [filteredCircles] = useAtom(filteredCirclesAtom);
    const [circlesFilter, setCirclesFilter] = useAtom(circlesFilterAtom);
    const [, setToggleAbout] = useAtom(toggleAboutAtom);
    const iconSize = 12;
    const showIcon = false;

    const [activeCategory, setActiveCategory] = useState("all"); // Default category set to 'active'
    const [circleTypeFilter, setCircleTypeFilter] = useState("all"); // Default filter set to 'all'

    const CategoryButton = ({ label, icon, isActive }) => (
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

    const FilterButton = ({ label, isActive }) => (
        <Button size="sm" variant={isActive ? "solid" : "outline"} colorScheme="blue" onClick={() => setCircleTypeFilter(label.toLowerCase())}>
            {label}
        </Button>
    );

    return (
        <Flex
            bgGradient="linear(to-r,#d3d1d3,#ffffff)"
            borderRadius="10px"
            margin={isMobile ? "0px" : "0px 10px 10px 0px"}
            padding="5px"
            flexGrow="1"
            pointerEvents="auto"
            position="relative"
            overflow="hidden"
            height="100%"
            flexDirection="column"
            {...props}
        >
            {/* Top Bar */}
            <Box mb={3}>
                <Flex justify="space-between" align="center">
                    <Text fontSize="xl" fontWeight="700" marginLeft="10px">
                        Circle Discover
                    </Text>
                    <HStack spacing={4}>
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
                {/* <TabButton label="Active" icon={TbClockPlay} isActive={activeCategory === "active"} /> */}
                <CategoryButton label="All" icon={TbClockPlay} isActive={activeCategory === "all"} />
                <CategoryButton label="Similar" icon={MdCompare} isActive={activeCategory === "similar"} />
                <CategoryButton label="Connected" icon={MdLink} isActive={activeCategory === "connected"} />
                <CategoryButton label="Mentioned" icon={MdChat} isActive={activeCategory === "mentioned"} />
                <CategoryButton label="Search" icon={MdSearch} isActive={activeCategory === "search"} />
            </HStack>
            <ButtonGroup isAttached>
                <FilterButton label="All" isActive={circleTypeFilter === "all"} />
                <FilterButton label="Users" isActive={circleTypeFilter === "users"} />
                <FilterButton label="Circles" isActive={circleTypeFilter === "circles"} />
                <FilterButton label="Events" isActive={circleTypeFilter === "events"} />
            </ButtonGroup>

            {/* Results Area */}
            <Box flexGrow="1" backgroundColor="white" borderRadius="7px" marginTop="5px">
                <Scrollbars autoHide>
                    <VStack spacing={4} align="stretch" mb={4}>
                        {filteredCircles?.map((circle) => (
                            <CircleListItem key={circle.id} item={circle} inSelect={true} onClick={() => openAboutCircle(circle, setToggleAbout)} />
                        ))}
                        {/* <CircleListItemNormal /> */}
                    </VStack>
                </Scrollbars>
            </Box>
        </Flex>
    );
};

export default CircleDiscover;
