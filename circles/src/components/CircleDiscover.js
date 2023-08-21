//#region imports
import React, { useEffect, useMemo, useState, useRef } from "react";
import { Box, VStack, Text, Flex, HStack, Icon, Button, Select, ButtonGroup, Tooltip } from "@chakra-ui/react";
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
import Lottie from "react-lottie";
import liveAnimation from "assets/lottie/live.json";
//#endregion

const LiveButton = () => {
    const [circlesFilter, setCirclesFilter] = useAtom(circlesFilterAtom);

    useEffect(() => {
        const animation = lottieRef.current;
        if (!animation) return;

        if (circlesFilter?.live) {
            // play animation
            animation.play();
        } else {
            // stop animation
            animation.stop();
        }
    }, [circlesFilter, setCirclesFilter]);

    const toggleLive = () => {
        setCirclesFilter({ ...circlesFilter, live: !circlesFilter?.live });
    };

    const lottieRef = useRef(null);

    return (
        <Tooltip label="Show circles that are live" aria-label="A tooltip">
            <Box>
                <Button variant="outline" size="sm" colorScheme="blue" onClick={toggleLive}>
                    {/* backgroundColor={circlesFilter?.live ? "white" : "transparent"} */}
                    <Box style={{ filter: circlesFilter?.live ? "none" : "grayscale(100%)" }}>
                        <Lottie
                            ref={lottieRef}
                            options={{
                                loop: true,
                                autoplay: false,
                                animationData: liveAnimation,
                                rendererSettings: {
                                    preserveAspectRatio: "xMidYMid slice",
                                },
                            }}
                            height={18}
                            // width={50}
                        />
                    </Box>
                </Button>
            </Box>
        </Tooltip>
    );
};

const CircleDiscover = ({ onClose, ...props }) => {
    log("CircleDiscover.render", -1);

    const [isMobile] = useAtom(isMobileAtom);
    const [circle] = useAtom(circleAtom);
    const [filteredCircles] = useAtom(filteredCirclesAtom);
    const [circlesFilter, setCirclesFilter] = useAtom(circlesFilterAtom);
    const [, setToggleAbout] = useAtom(toggleAboutAtom);
    const iconSize = 12;
    const showIcon = false;

    const [activeCategory, setActiveCategory] = useState("all"); // Default category set to 'active'
    //const [circleTypeFilter, setCircleTypeFilter] = useState("all"); // Default filter set to 'all'

    const setCircleTypeFilter = (filter) => {
        let types = null;
        switch (filter) {
            case "users":
                types = ["user"];
                break;
            case "circles":
                types = ["circle"];
                break;
            case "events":
                types = ["event"];
                break;
            default:
            case "all":
                types = null;
                break;
        }

        setCirclesFilter({ ...circlesFilter, types: types });
    };

    const getCategoryTooltipLabel = (label) => {
        switch (label) {
            default:
            case "All":
                return `Show all circles relevant to ${circle.name}`;
            case "Similar":
                return `Show circles similar to ${circle.name}`;
            case "Connected":
                return `Show circles connected to ${circle.name}`;
            case "Mentioned":
                return `Show circles mentioned in ${circle.name}`;
            case "Search":
                return `Show circles matching search queries`;
        }
    };

    const CategoryButton = ({ label, icon, isActive }) => (
        <Tooltip label={getCategoryTooltipLabel(label)} aria-label="A tooltip">
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
        </Tooltip>
    );

    const getFilterTooltipLabel = (label) => {
        switch (label) {
            case "Users":
                return "Show users";
            case "Circles":
                return "Show circles";
            case "Events":
                return "Show events";
            default:
            case "All":
                return "Show all types of circles";
        }
    };

    const FilterButton = ({ label, isActive }) => (
        <Tooltip label={getFilterTooltipLabel(label)} aria-label="A tooltip">
            <Button size="sm" variant={isActive ? "solid" : "outline"} colorScheme="blue" onClick={() => setCircleTypeFilter(label.toLowerCase())}>
                {label}
            </Button>
        </Tooltip>
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
                    <Flex align="center" flexDirection={"row"} marginLeft="5px">
                        <CirclePicture size={20} circle={circle} />
                        <Text fontSize="xl" fontWeight="700" marginLeft="10px">
                            Circle Discover
                        </Text>
                    </Flex>
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
                <CategoryButton label="All" icon={TbClockPlay} isActive={activeCategory === "all"} />
                <CategoryButton label="Similar" icon={MdCompare} isActive={activeCategory === "similar"} />
                <CategoryButton label="Connected" icon={MdLink} isActive={activeCategory === "connected"} />
                <CategoryButton label="Mentioned" icon={MdChat} isActive={activeCategory === "mentioned"} />
                <CategoryButton label="Search" icon={MdSearch} isActive={activeCategory === "search"} />
            </HStack>
            <Flex flexDirection="row" align="center">
                <ButtonGroup isAttached>
                    <FilterButton label="All" isActive={!circlesFilter?.types} />
                    <FilterButton label="Users" isActive={circlesFilter?.types?.includes("user")} />
                    <FilterButton label="Circles" isActive={circlesFilter?.types?.includes("circle")} />
                    <FilterButton label="Events" isActive={circlesFilter?.types?.includes("event")} />
                </ButtonGroup>
                <Box flexGrow="1" />
                <LiveButton />
            </Flex>

            {/* Results Area */}
            <Box flexGrow="1" backgroundColor="white" borderRadius="7px" marginTop="5px">
                <Scrollbars autoHide>
                    <VStack spacing={4} align="stretch" mb={4}>
                        {filteredCircles?.map((circle) => (
                            <CircleListItem key={circle.id} item={circle} inSelect={true} onClick={() => openAboutCircle(circle, setToggleAbout)} />
                        ))}
                        {filteredCircles?.length <= 0 && (
                            <Text fontSize="md" fontWeight="500" color="gray.500" textAlign="center" mt="20px">
                                No circles found
                            </Text>
                        )}

                        {/* <CircleListItemNormal /> */}
                    </VStack>
                </Scrollbars>
            </Box>
        </Flex>
    );
};

export default CircleDiscover;
