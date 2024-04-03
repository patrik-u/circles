//#region imports
import React, { useEffect, useMemo, useState, Suspense, useRef } from "react";
import {
    Box,
    VStack,
    Text,
    Flex,
    HStack,
    IconButton,
    Image,
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    MenuDivider,
    MenuGroup,
    Divider,
    AbsoluteCenter,
    Button,
    SimpleGrid,
    Tabs,
    TabList,
    TabPanels,
    TabPanel,
    Tab,
} from "@chakra-ui/react";
import { openCircle, focusCircle } from "@/components/Navigation";
import {
    log,
    getDateAndTimeLong,
    getDateLong,
    singleLineEllipsisStyle,
    twoLineEllipsisStyle,
    isActiveInCircle,
    getImageKitUrl,
    isAdmin,
} from "@/components/Helpers";
import { defaultUserPicture } from "@/components/Constants";
import { Routes, Route, Navigate, useParams } from "react-router-dom";
import { useAtom } from "jotai";
import {
    isMobileAtom,
    circleAtom,
    circlesFilterAtom,
    previewCircleAtom,
    userAtom,
    userDataAtom,
    toggleWidgetEventAtom,
    circleDashboardExpandedAtom,
    focusOnMapItemAtom,
} from "@/components/Atoms";
import { useLocationNoUpdates, useNavigateNoUpdates } from "@/components/RouterUtils";
import {
    CircleCover,
    CirclePicture,
    CircleHeader,
    QuickLinks,
    CircleMembersPanel,
    CircleRichText,
} from "@/components/CircleElements";
import config from "../Config";
import { Scrollbars } from "react-custom-scrollbars-2";
import { CircleTags } from "@/components/CircleElements";
import { ActiveInCircle, RelationSetInfo } from "@/components/CirclePreview";
import ReactMarkdown from "react-markdown";
import { AboutButton, CircleLink } from "@/components/CircleElements";
import {
    FiChevronLeft,
    FiChevronRight,
    FiChevronDown,
    FiHome,
    FiUsers,
    FiCircle,
    FiCalendar,
    FiClipboard,
    FiMessageCircle,
    FiSettings,
    FiShield,
    FiRss,
} from "react-icons/fi";
import { HiOutlineChat } from "react-icons/hi";
import TopMenu from "@/components/TopMenu";
import CircleAdmin from "@/components/CircleAdmin";
import CircleSettings from "@/components/settings/CircleSettings";
import { CircleChatWidget } from "@/components/CircleChat";
import { Circles } from "@/components/Circles";
import CircleAbout from "./CircleAbout";
import { GrAppsRounded } from "react-icons/gr";
import CircleHomeFeed from "./CircleHomeFeed";
import CircleExtrasAndMain from "./CircleExtrasAndMain";
import { CircleNameAndPicture } from "./CircleElements";
import CircleProject from "./CircleProject";
import CirclePost from "./CirclePost";
//#endregion

const CircleSelector = () => {
    // get circles from user similar to favorite menu
    const [userData] = useAtom(userDataAtom);
    const [favoriteCircles, setFavoriteCircles] = useState([]);
    const [circle] = useAtom(circleAtom);
    const [, setFocusOnMapItem] = useAtom(focusOnMapItemAtom);
    let global = { id: "global", name: "Explore", picture: "/explore3.png" };
    const circles = useMemo(() => {
        let newCircles = [];
        if (favoriteCircles) {
            newCircles = favoriteCircles
                .filter((c) => c.id !== circle?.id)
                .sort((a, b) => a.name.localeCompare(b.name));
        }
        // global circle first and then add favorite circles
        let preCircles = [];
        if (circle?.id && circle?.id !== "global") {
            preCircles = [circle];
        } else {
            preCircles = [];
        }

        return [...preCircles, ...newCircles];
    }, [favoriteCircles, circle]);
    const navigate = useNavigateNoUpdates();
    const location = useLocationNoUpdates();
    const view = "compact";

    useEffect(() => {
        if (!userData?.circle_settings) return;

        let newFavoriteCircles = [];
        for (var circleId in userData.circle_settings) {
            let favorite = userData.circle_settings[circleId].favorite;
            if (favorite) {
                let favoriteCircle = userData.circle_settings[circleId].circle;
                if (favoriteCircle?.type === "circle") {
                    newFavoriteCircles.push(favoriteCircle);
                }
            }
        }
        setFavoriteCircles(newFavoriteCircles);
    }, [userData?.circle_settings]);

    useEffect(() => {
        if (!circle?.id) return;
        // if circle id changes and it differs from selected circle we want to update the selected circle
        if (circle?.id !== selectedCircle?.id) {
            setSelectedCircle(circle);
        }
    }, [circle?.id]);

    const [selectedCircle, setSelectedCircle] = useState(circles[0]);

    const handleSelect = (circle) => {
        setSelectedCircle(circle);
        openCircle(navigate, circle);
        // focusCircle(circle, setFocusOnMapItem);
    };

    if (!selectedCircle?.id) return <Box flexGrow="1" />;

    return (
        <Menu matchWidth margin="5px">
            <MenuButton as={Button} rightIcon={<FiChevronDown />} width="100%" bg="white">
                <Box display="flex" alignItems="center">
                    <CircleNameAndPicture circle={selectedCircle} size={30} hasPopover={false} />
                </Box>
            </MenuButton>
            <MenuList width="100%">
                <MenuItem key={global.id} onClick={() => handleSelect(global)}>
                    <Image boxSize="30px" borderRadius="full" src={global.picture} alt={global.name} mr={2} />
                    <Flex flexDirection="column">
                        <Text fontWeight="bold">{global.name}</Text>
                        <Text fontSize="10px">Explore circles</Text>
                    </Flex>
                </MenuItem>

                {circles.length > 0 && (
                    <Flex position="relative" flexDirection="row" paddingTop="14px" paddingBottom="14px" align="center">
                        <Divider />
                        <Flex position="absolute" left="0" top="8px" bg="white" px="4" align="center">
                            <Text fontSize="10px" fontWeight="bold">
                                MY CIRCLES
                            </Text>
                        </Flex>
                    </Flex>
                )}

                {circles.map((circle) => (
                    <MenuItem key={circle.id} onClick={() => handleSelect(circle)}>
                        <CircleNameAndPicture circle={circle} size={30} hasPopover={false} />
                        {/* <CirclePicture circle={circle} size={30} hasPopover={false} />
                        <Text paddingLeft="8px" fontWeight="bold">
                            {circle.name}
                        </Text> */}
                    </MenuItem>
                ))}
            </MenuList>
        </Menu>
    );
};

export const tabs = [
    {
        id: "home",
        name: "Home",
        icon: FiHome,
        showInMap: true,
        type: "circle",
    },
    {
        id: "chat",
        name: "Chat",
        icon: FiMessageCircle,
        type: "circle",
    },
    {
        id: "circles",
        name: "Circles",
        icon: FiCircle,
        showInMap: true,
        type: "circle",
    },
    {
        id: "events",
        name: "Events",
        icon: FiCalendar,
        showInMap: true,
        type: "event",
    },
    {
        id: "members",
        name: "Members",
        icon: FiUsers,
        showInMap: true,
        type: "user",
    },
    {
        id: "projects",
        name: "Projects",
        icon: FiClipboard,
        showInMap: true,
        type: "project",
    },
    {
        id: "settings",
        name: "Settings",
        icon: FiSettings,
        type: "circle",
    },
    {
        id: "admin",
        name: "Admin",
        icon: FiShield,
        type: "circle",
    },
];

export const CircleDashboard = ({ onClose }) => {
    log("CircleDashboard.render", -1);

    const [user] = useAtom(userAtom);
    const [userData] = useAtom(userDataAtom);
    const [isMobile] = useAtom(isMobileAtom);
    const [currentCircle] = useAtom(circleAtom);
    const [previewCircle] = useAtom(previewCircleAtom);
    const [, setToggleWidgetEvent] = useAtom(toggleWidgetEventAtom);
    const [circleDashboardExpanded, setCircleDashboardExpanded] = useAtom(circleDashboardExpandedAtom);
    const [circle] = useAtom(circleAtom);
    const location = useLocationNoUpdates();
    const navigate = useNavigateNoUpdates();
    const { hostId, circleId } = useParams();
    const dropdownRef = useRef(null);
    const [, setFocusOnMapItem] = useAtom(focusOnMapItemAtom);

    const pathSegments = location.pathname.split("/");
    const currentTabPath = pathSegments[3]; // assuming the structure is always /{hostId}/{circleId}/{tabPath}/... the relevant segment for tab should be the third one (index 2)
    const selectedTab = useMemo(() => {
        // get tab with id same as currentTabPath
        let tab = tabs.find((x) => x.id === currentTabPath);
        if (!tab) {
            return tabs.find((x) => x.id === "home"); // default tab
        }
        return tab;
    }, [currentTabPath, tabs, circleId]);
    const tabIndex = useMemo(() => {
        return tabs.indexOf(selectedTab);
    }, [selectedTab]);

    const [showDropdown, setShowDropdown] = useState(false);
    const visibleTabs = useMemo(() => {
        if (circleDashboardExpanded) return tabs;
        else return tabs.slice(0, 4);
    }, [tabs, circleDashboardExpanded]);
    const dropdownTabs = tabs.slice(4);

    useEffect(() => {
        // close dropdown on blur
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [dropdownRef]);

    const isTabSelected = (tab) => {
        return tab?.id === selectedTab?.id;
    };

    const onTabClick = (tab) => {
        const path = tab?.id ?? "";
        navigate(`/${hostId}/${circleId}/${path}`);
    };

    return (
        <>
            <Box
                position="relative"
                flexGrow="1"
                height="100%"
                margin={isMobile ? "0px" : `10px 10px 10px ${circleDashboardExpanded ? "10px" : "0px"}`}
            >
                {!isMobile && (
                    <IconButton
                        position="absolute"
                        pointerEvents="auto"
                        left="-6px"
                        top="30px"
                        aria-label="Expand circle dashboard"
                        zIndex="600"
                        size="xs"
                        icon={circleDashboardExpanded ? <FiChevronRight /> : <FiChevronLeft />}
                        onClick={() => setCircleDashboardExpanded(!circleDashboardExpanded)}
                        isRound
                    />
                )}

                <Box
                    borderRadius={isMobile ? "0px" : "10px"}
                    padding="0px"
                    flexGrow="1"
                    pointerEvents="auto"
                    position="relative"
                    height="100%"
                    overflow="hidden"
                >
                    <Flex flexDirection="row" align="center" backgroundColor="white">
                        <CircleSelector />
                        <TopMenu />
                    </Flex>

                    <Box
                        display="flex"
                        flexDirection="column"
                        flexGrow="1"
                        height="calc(100% - 40px)" // Ensure this element takes the full height
                    >
                        <Flex flexDirection="row" height="50px" backgroundColor="white" align="center">
                            {visibleTabs.map((tab) => (
                                <Flex
                                    borderWidth="0px 0px 2px 0px"
                                    borderBottomColor={isTabSelected(tab) ? "#ff2a10" : "white"}
                                    height="50px"
                                    // #ff8b68
                                    cursor="pointer"
                                    flexDirection="column"
                                    align="center"
                                    minWidth={circleDashboardExpanded ? "70px" : "none"}
                                    flex={circleDashboardExpanded ? 0 : 1}
                                    onClick={() => onTabClick(tab)}
                                >
                                    <Flex flexDirection="column" align="center" marginTop="auto" marginBottom="auto">
                                        <tab.icon />
                                        <Text userSelect="none" fontSize="12px">
                                            {tab.name}
                                        </Text>
                                    </Flex>
                                </Flex>
                            ))}

                            {!circleDashboardExpanded && (
                                <Flex
                                    borderWidth="0px 0px 2px 0px"
                                    borderBottomColor={dropdownTabs.includes(selectedTab) ? "#ff2a10" : "white"}
                                    height="50px"
                                    cursor="pointer"
                                    flexDirection="column"
                                    align="center"
                                    minWidth={circleDashboardExpanded ? "70px" : "none"}
                                    flex={circleDashboardExpanded ? 0 : 1}
                                    onClick={() => setShowDropdown(!showDropdown)}
                                >
                                    <Flex flexDirection="column" align="center" marginTop="auto" marginBottom="auto">
                                        {dropdownTabs.includes(selectedTab) ? (
                                            <>
                                                <selectedTab.icon />
                                                <Flex flexDirection="row" align="center">
                                                    <Text userSelect="none" fontSize="12px">
                                                        {selectedTab.name}
                                                    </Text>
                                                    <FiChevronDown size="10px" />
                                                </Flex>
                                            </>
                                        ) : (
                                            <>
                                                <GrAppsRounded />
                                                <Flex flexDirection="row" align="center">
                                                    <Text userSelect="none" fontSize="12px">
                                                        More
                                                    </Text>
                                                    <FiChevronDown size="10px" />
                                                </Flex>
                                            </>
                                        )}
                                    </Flex>
                                </Flex>
                            )}
                        </Flex>

                        {showDropdown && (
                            <Box
                                ref={dropdownRef}
                                position="absolute"
                                right="0"
                                mt="50px" // Adjust based on actual layout
                                boxShadow="md"
                                zIndex="10"
                                backgroundColor="white"
                            >
                                <SimpleGrid columns={4} spacing={0} borderWidth="1px" borderRadius="7px">
                                    {dropdownTabs.map((tab) => (
                                        <Box
                                            p={2}
                                            cursor="pointer"
                                            _hover={{ bg: "gray.100" }}
                                            // borderWidth="1px"
                                            // borderRadius="md"
                                            onClick={() => {
                                                onTabClick(tab);
                                                setShowDropdown(false); // Close dropdown after selection
                                            }}
                                        >
                                            <Flex flexDirection="column" align="center">
                                                <tab.icon />
                                                <Text userSelect="none" fontSize="12px">
                                                    {tab.name}
                                                </Text>
                                            </Flex>
                                        </Box>
                                    ))}
                                </SimpleGrid>
                            </Box>
                        )}

                        <Box flex="1" position="relative">
                            <Suspense fallback={<Box></Box>}>
                                <Routes>
                                    <Route path="/*" element={<CircleHomeFeed />} />
                                    <Route path="home/*" element={<CircleHomeFeed />} />
                                    <Route
                                        path="chat/*"
                                        element={
                                            <CircleExtrasAndMain
                                                main={<CircleChatWidget />}
                                                extras={<CircleAbout />}
                                                switchWhenExpanded={true}
                                                hideExtrasWhenCompact={true}
                                            />
                                        }
                                    />

                                    <Route
                                        path="circles/*"
                                        element={
                                            <CircleExtrasAndMain
                                                main={
                                                    <Circles
                                                        type="circle"
                                                        types={["circle"]}
                                                        categories={circleId === "global" ? [] : ["connected"]}
                                                        asCards={true}
                                                        noScrollbars={circleDashboardExpanded}
                                                    />
                                                }
                                                extras={<CircleAbout />}
                                                switchWhenExpanded={true}
                                                hideExtrasWhenCompact={true}
                                            />
                                        }
                                    />

                                    <Route
                                        path="members/*"
                                        element={
                                            <CircleExtrasAndMain
                                                main={
                                                    <Circles
                                                        type="user"
                                                        types={["user"]}
                                                        categories={circleId === "global" ? [] : ["connected"]}
                                                        asCards={true}
                                                        noScrollbars={circleDashboardExpanded}
                                                    />
                                                }
                                                extras={<CircleAbout />}
                                                switchWhenExpanded={true}
                                                hideExtrasWhenCompact={true}
                                            />
                                        }
                                    />
                                    <Route
                                        path="events/*"
                                        element={
                                            <CircleExtrasAndMain
                                                main={
                                                    <Circles
                                                        type="event"
                                                        types={["event"]}
                                                        categories={circleId === "global" ? [] : ["connected"]}
                                                        asCards={true}
                                                        noScrollbars={circleDashboardExpanded}
                                                    />
                                                }
                                                extras={<CircleAbout />}
                                                switchWhenExpanded={true}
                                                hideExtrasWhenCompact={true}
                                            />
                                        }
                                    />
                                    <Route
                                        path="projects/*"
                                        element={
                                            <CircleExtrasAndMain
                                                main={
                                                    <Circles
                                                        type="project"
                                                        types={["project"]}
                                                        categories={circleId === "global" ? [] : ["connected"]}
                                                        asCards={true}
                                                        noScrollbars={circleDashboardExpanded}
                                                    />
                                                }
                                                extras={<CircleAbout />}
                                                switchWhenExpanded={true}
                                                hideExtrasWhenCompact={true}
                                            />
                                        }
                                    />
                                    <Route path="projects/:projectId" element={<CircleProject />} />
                                    <Route path="home/:postId" element={<CirclePost />} />
                                    <Route path="/settings/*" element={<CircleSettings />} />
                                    <Route path="admin/*" element={<CircleAdmin />} />
                                </Routes>
                            </Suspense>
                        </Box>
                    </Box>
                </Box>
            </Box>
        </>
    );
};

export default CircleDashboard;
