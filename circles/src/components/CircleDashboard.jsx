//#region imports
import React, { useEffect, useMemo, useState } from "react";
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
import { openCircle } from "@/components/Navigation";
import {
    log,
    getDateAndTimeLong,
    getDateLong,
    singleLineEllipsisStyle,
    twoLineEllipsisStyle,
    isActiveInCircle,
    getImageKitUrl,
} from "@/components/Helpers";
import { defaultUserPicture } from "@/components/Constants";
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
import { FiChevronLeft, FiChevronRight, FiChevronDown } from "react-icons/fi";
import { FiHome, FiUsers, FiCircle, FiCalendar, FiClipboard } from "react-icons/fi";
import TopMenu from "@/components/TopMenu";
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
                maxWidth="450px"
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
    let global = { id: "global", name: "Global", picture: "/logo2.jpg" };
    const [circles] = useMemo(() => {
        // global circle first and then add favorite circles
        let newCircles = [global];
        if (favoriteCircles) {
            newCircles = [...newCircles, ...favoriteCircles];
        }
        return [newCircles];
    }, [favoriteCircles, global]);
    const navigate = useNavigateNoUpdates();
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
        // if circle id changes and it differs from selected circle we want to update the selected circle
    }, [circle?.id]);

    const [selectedCircle, setSelectedCircle] = useState(circles[0]);

    const handleSelect = (circle) => {
        setSelectedCircle(circle);
    };

    if (!selectedCircle) return <Box flexGrow="1" />;

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

    const [tabIndex, setTabIndex] = useState(0);

    const [user] = useAtom(userAtom);
    const [isMobile] = useAtom(isMobileAtom);
    const [currentCircle] = useAtom(circleAtom);
    const [previewCircle] = useAtom(previewCircleAtom);
    const [, setToggleWidgetEvent] = useAtom(toggleWidgetEventAtom);
    const [circleDashboardExpanded, setCircleDashboardExpanded] = useAtom(circleDashboardExpandedAtom);
    const circle = user;
    const location = useLocationNoUpdates();
    const navigate = useNavigateNoUpdates();

    const getNameFontSize = (name) => {
        if (!name) return "17px";
        if (name.length < 16) return "17px";
        if (name.length < 19) return "15px";
        if (name.length < 24) return "14px";
        return "14px";
    };

    return (
        <>
            {/* {circle && ( */}
            <Box
                position="relative"
                flexGrow="1"
                height="100%"
                margin={isMobile ? "0px" : `10px 10px 10px ${circleDashboardExpanded ? "10px" : "0px"}`}
            >
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

                <Box
                    bgGradient="linear(to-r,#d3d1d3,#ffffff)"
                    borderRadius="10px"
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
                        height="100%" // Ensure this element takes the full height
                    >
                        <Tabs
                            index={tabIndex}
                            onChange={(index) => setTabIndex(index)}
                            isFitted={circleDashboardExpanded ? false : true}
                            display="flex"
                            flex="1"
                            flexDirection={"column"}
                            orientation={"horizontal"}
                        >
                            <TabList bg="white">
                                <Tab borderColor={"white"}>
                                    <Flex flexDirection="column" align="center">
                                        <FiHome />
                                        <Text fontSize="12px">Feed</Text>
                                    </Flex>
                                </Tab>
                                <Tab borderColor={"white"}>
                                    <Flex flexDirection="column" align="center">
                                        <FiUsers />
                                        <Text fontSize="12px">Members</Text>
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
                            </TabList>

                            <TabPanels flex="1">
                                <TabPanel flex="1" overflowY="auto" p={0} m={0} height="100%">
                                    <Feed posts={examplePosts} />
                                </TabPanel>
                                <TabPanel>{/* Members Component */}</TabPanel>
                                <TabPanel>{/* Circles Component */}</TabPanel>
                                <TabPanel>{/* Events Component */}</TabPanel>
                                <TabPanel>{/* Tasks Component */}</TabPanel>
                            </TabPanels>
                        </Tabs>
                    </Box>
                </Box>
            </Box>
            {/* )} */}
        </>
    );
};

export default CircleDashboard;
