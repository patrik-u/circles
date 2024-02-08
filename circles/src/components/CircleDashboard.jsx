//#region imports
import React, { useEffect, useMemo, useState, Suspense } from "react";
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
    Button,
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
//#endregion

const examplePosts = [
    {
        author: {
            name: "Skyler Smith",
            picture: "https://randomuser.me/api/portraits/men/38.jpg",
        },
        image: "https://source.unsplash.com/featured/?nature",
        content: "Let's turn our ideas into impactful actions.",
    },
    {
        author: {
            name: "Casey Johnson",
            picture: "https://randomuser.me/api/portraits/men/36.jpg",
        },
        image: "https://source.unsplash.com/featured/?water",
        content: "Innovation and collaboration – the keys to success.",
    },
    {
        author: {
            name: "Casey Brown",
            picture: "https://randomuser.me/api/portraits/men/52.jpg",
        },
        image: "https://source.unsplash.com/featured/?fun",
        content: "Empowering communities through creative collaboration.",
    },
    {
        author: {
            name: "Skyler Johnson",
            picture: "https://randomuser.me/api/portraits/women/27.jpg",
        },
        image: "https://source.unsplash.com/featured/?art",
        content: "United in purpose, divided in tasks. Let's co-create!",
    },
    {
        author: {
            name: "Taylor Miller",
            picture: "https://randomuser.me/api/portraits/men/75.jpg",
        },
        image: "https://source.unsplash.com/featured/?play",
        content: "Together, we can create a brighter future!",
    },
    {
        author: {
            name: "Jamie Brown",
            picture: "https://randomuser.me/api/portraits/women/92.jpg",
        },
        image: "https://source.unsplash.com/featured/?people",
        content: "Together, we can create a brighter future!",
    },
    {
        author: {
            name: "Jordan Garcia",
            picture: "https://randomuser.me/api/portraits/men/49.jpg",
        },
        image: "https://source.unsplash.com/featured/?revolution",
        content: "United in purpose, divided in tasks. Let's co-create!",
    },
    {
        author: {
            name: "Avery Wilson",
            picture: "https://randomuser.me/api/portraits/women/5.jpg",
        },
        image: "https://source.unsplash.com/featured/?tech",
        content: "Bringing innovative minds together for a better world.",
    },
    {
        author: {
            name: "Riley Davis",
            picture: "https://randomuser.me/api/portraits/men/15.jpg",
        },
        image: "https://source.unsplash.com/featured/?urban",
        content: "Your ideas can transform the world. Share them!",
    },
    {
        author: {
            name: "Morgan Williams",
            picture: "https://randomuser.me/api/portraits/women/78.jpg",
        },
        image: "https://source.unsplash.com/featured/?permaculture",
        content: "Every small step leads to a big change.",
    },
    {
        author: {
            name: "Jordan Williams",
            picture: "https://randomuser.me/api/portraits/men/92.jpg",
        },
        image: "https://source.unsplash.com/featured/?streetart",
        content: "Join the movement of positive change makers.",
    },
    {
        author: {
            name: "Riley Rodriguez",
            picture: "https://randomuser.me/api/portraits/men/48.jpg",
        },
        image: "https://source.unsplash.com/featured/?love",
        content: "Join us in making a positive change in our community.",
    },
    {
        author: {
            name: "Charlie Wilson",
            picture: "https://randomuser.me/api/portraits/women/61.jpg",
        },
        image: "https://source.unsplash.com/featured/?romance",
        content: "Change starts with us. Let's be the change makers!",
    },
    {
        author: {
            name: "Morgan Rodriguez",
            picture: "https://randomuser.me/api/portraits/men/69.jpg",
        },
        image: "https://source.unsplash.com/featured/?earth",
        content: "Together, we can create a brighter future!",
    },
];

const Post = ({ post }) => {
    const [isMobile] = useAtom(isMobileAtom);

    // Return social media post with image, content, and author
    return (
        <Box
            bgGradient="linear(to-r,#ffffff,#ffffff)"
            borderRadius="10px"
            margin="5px"
            padding="5px"
            flexGrow="1"
            pointerEvents="auto"
            position="relative"
        >
            <Flex flexDirection="row" align="center" position="relative">
                <Image
                    src={getImageKitUrl(post.author.picture ?? defaultUserPicture, 42, 42)}
                    width="48px"
                    height="48px"
                    borderRadius="50%"
                    fallbackSrc={getImageKitUrl(defaultUserPicture, 42, 42)}
                />
                <Text fontSize="16px" fontWeight="bold" color="black" lineHeight="18px" marginLeft="15px">
                    {post.author.name}
                </Text>
            </Flex>
            <Text fontSize="16px" color="black" lineHeight="18px" marginTop="10px" marginBottom="10px">
                {post.content}
            </Text>

            <Image
                src={post.image}
                width="100%"
                height="250px"
                maxWidth={isMobile ? "none" : "450px"}
                objectFit="cover"
                borderRadius="10px"
                fallbackSrc={getImageKitUrl(defaultUserPicture, 48, 48)}
            />
        </Box>
    );
};

// const exampleCircles = [
//     {
//         id: "1",
//         name: "Global",
//         picture: "https://source.unsplash.com/featured/?globe",
//     },
//     {
//         id: "2",
//         name: "Social Systems Lab",
//         picture: "https://source.unsplash.com/featured/?social",
//     },
//     {
//         id: "3",
//         name: "AfrikaBurn",
//         picture: "https://source.unsplash.com/featured/?burningman",
//     },
//     {
//         id: "4",
//         name: "RailNomad",
//         picture: "https://source.unsplash.com/featured/?train",
//     },
//     {
//         id: "5",
//         name: "SoilMates",
//         picture: "https://source.unsplash.com/featured/?permaculture",
//     },
// ];

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
            preCircles = [global, circle];
        } else {
            preCircles = [global];
        }

        return [...preCircles, ...newCircles];
    }, [favoriteCircles, circle, global]);
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
        focusCircle(circle, setFocusOnMapItem);
    };

    if (!selectedCircle?.id) return <Box flexGrow="1" />;

    return (
        <Menu matchWidth margin="5px">
            <MenuButton as={Button} rightIcon={<FiChevronDown />} width="100%" bg="white">
                <Box display="flex" alignItems="center">
                    <Image
                        boxSize="30px"
                        borderRadius="full"
                        src={selectedCircle.picture}
                        alt={selectedCircle.name}
                        mr={2}
                    />
                    <Text>{selectedCircle.name}</Text>
                </Box>
            </MenuButton>
            <MenuList width="100%">
                {circles.map((circle) => (
                    <MenuItem key={circle.id} onClick={() => handleSelect(circle)}>
                        <Image boxSize="30px" borderRadius="full" src={circle.picture} alt={circle.name} mr={2} />
                        <Text>{circle.name}</Text>
                    </MenuItem>
                ))}
            </MenuList>
        </Menu>
    );
};

const Feed = ({ posts }) => {
    return (
        <Scrollbars autoHide>
            {posts.map((post, i) => (
                <Post key={i} post={post} />
            ))}
            <Box height="35px"></Box>
        </Scrollbars>
    );
};

const CircleDashboard = ({ onClose }) => {
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

    // define a mapping from tab paths to tab indexes
    const tabPaths = ["home", "feed", "chat", "circles", "members", "events", "tasks", "settings", "admin"];
    const pathSegments = location.pathname.split("/");
    const currentTabPath = pathSegments[3]; // assuming the structure is always /{hostId}/{circleId}/{tabPath}/... the relevant segment for tab should be the third one (index 2)
    const tabPathIndex = tabPaths.indexOf(currentTabPath);
    const tabIndex = tabPathIndex < 0 ? (circleId === "global" ? tabPaths.indexOf("feed") : 0) : tabPathIndex;

    const handleTabChange = (index) => {
        const path = tabPaths[index];
        navigate(`/${hostId}/${circleId}/${path}`);
    };

    // useEffect(() => {
    //     // This ensures that the tab index is updated when the URL changes
    //     // It handles the case where the user navigates directly via URL or browser back/forward
    //     setTabIndex(tabPaths.indexOf(location.pathname.split("/").pop()));
    // }, [location, tabPaths]);

    const getNameFontSize = (name) => {
        if (!name) return "17px";
        if (name.length < 16) return "17px";
        if (name.length < 19) return "15px";
        if (name.length < 24) return "14px";
        return "14px";
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
                    bgGradient="linear(to-r,#d3d1d3,#ffffff)"
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
                        <Tabs
                            index={tabIndex}
                            onChange={handleTabChange}
                            isLazy
                            isFitted={circleDashboardExpanded ? false : true}
                            display="flex"
                            flexDirection={"column"}
                            orientation={"horizontal"}
                        >
                            <TabList bg="white" borderColor="white">
                                <Tab borderColor={"white"}>
                                    <Flex flexDirection="column" align="center">
                                        <FiHome />
                                        <Text fontSize="12px">Home</Text>
                                    </Flex>
                                </Tab>
                                <Tab borderColor={"white"}>
                                    <Flex flexDirection="column" align="center">
                                        <FiRss />
                                        <Text fontSize="12px">Feed</Text>
                                    </Flex>
                                </Tab>
                                <Tab borderColor={"white"}>
                                    <Flex flexDirection="column" align="center">
                                        <FiMessageCircle />
                                        <Text fontSize="12px">Chat</Text>
                                    </Flex>
                                </Tab>
                                <Tab borderColor={"white"}>
                                    <Flex flexDirection="column" align="center">
                                        <FiCircle />
                                        <Text fontSize="12px">Circles</Text>
                                    </Flex>
                                </Tab>
                                <Tab borderColor={"white"}>
                                    <Flex flexDirection="column" align="center">
                                        <FiUsers />
                                        <Text fontSize="12px">Members</Text>
                                    </Flex>
                                </Tab>

                                {circleDashboardExpanded && (
                                    <>
                                        <Tab borderColor={"white"}>
                                            <Flex flexDirection="column" align="center">
                                                <FiCalendar />
                                                <Text fontSize="12px">Events</Text>
                                            </Flex>
                                        </Tab>
                                        <Tab borderColor={"white"}>
                                            <Flex flexDirection="column" align="center">
                                                <FiClipboard />
                                                <Text fontSize="12px">Tasks</Text>
                                            </Flex>
                                        </Tab>
                                        {isAdmin(circle, userData) && (
                                            <Tab borderColor={"white"}>
                                                <Flex flexDirection="column" align="center">
                                                    <FiSettings />
                                                    <Text fontSize="12px">Settings</Text>
                                                </Flex>
                                            </Tab>
                                        )}
                                        {circle?.id === "global" && user?.is_admin && (
                                            <Tab borderColor={"white"}>
                                                <Flex flexDirection="column" align="center">
                                                    <FiShield />
                                                    <Text fontSize="12px">Admin</Text>
                                                </Flex>
                                            </Tab>
                                        )}
                                    </>
                                )}
                            </TabList>
                        </Tabs>

                        <Box flex="1" backgroundColor="white">
                            <Suspense fallback={<Box></Box>}>
                                <Routes>
                                    <Route
                                        path="/"
                                        element={
                                            circleId === "global" ? <Feed posts={examplePosts} /> : <CircleAbout />
                                        }
                                    />
                                    <Route path="home" element={<CircleAbout />} />
                                    <Route path="feed" element={<Feed posts={examplePosts} />} />
                                    <Route path="chat" element={<CircleChatWidget />} />
                                    <Route path="circles" element={<Circles type="circle" />} />
                                    <Route path="members" element={<Circles type="user" />} />
                                    <Route path="events" element={<Circles type="event" />} />
                                    <Route path="tasks" element={<Circles type="task" />} />
                                    <Route path="/settings/*" element={<CircleSettings />} />
                                    <Route path="admin" element={<CircleAdmin />} />
                                </Routes>
                            </Suspense>
                        </Box>

                        {/* <TabPanel flex="1" overflowY="auto" p={0} m={0} height="100%" backgroundColor="white">
                                    Circles Component 
                                    <Circles type="circle" />
                                </TabPanel>
                                <TabPanel flex="1" overflowY="auto" p={0} m={0} height="100%">
                                     Members Component
                                </TabPanel>
                                <TabPanel flex="1" overflowY="auto" p={0} m={0} height="100%">
                                    Events Component 
                                </TabPanel>
                                <TabPanel flex="1" overflowY="auto" p={0} m={0} height="100%">
                                    Tasks Component 
                                </TabPanel>

                                <TabPanel flex="1" overflowY="auto" p={0} m={0} height="100%">
                                    <CircleSettings />
                                </TabPanel>
                                <TabPanel flex="1" overflowY="auto" p={0} m={0} height="100%">
                                    <CircleAdmin />
                                </TabPanel> */}
                    </Box>
                </Box>
            </Box>
        </>
    );
};

export default CircleDashboard;
