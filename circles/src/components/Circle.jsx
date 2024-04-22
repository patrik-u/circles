//#region imports
import React, { useEffect, lazy, useRef, useState, useCallback, useMemo } from "react";
import {
    Flex,
    Box,
    Drawer,
    DrawerBody,
    DrawerOverlay,
    DrawerContent,
    DrawerCloseButton,
    Button,
    Text,
    useDisclosure,
    PortalManager,
} from "@chakra-ui/react";
import db from "@/components/Firebase";
import axios from "axios";
import { openCircle, focusCircle } from "@/components/Navigation";
import { log, fromFsDate, getDateWithoutTime, isConnected } from "@/components/Helpers";
import { collection, doc, onSnapshot, query, where } from "firebase/firestore";
import { Routes, Route, useParams, useSearchParams } from "react-router-dom";
import { defaultCoverHeight } from "@/components/Constants";
import {
    CircleHeader,
    CircleCover,
    DisplayModeButtons,
    CircleRightPanel,
    ConnectButton,
    CirclePicture,
    FloatingAddButton,
    CircleProfilePicture,
} from "@/components/CircleElements";
import LeftMenu from "@/components/LeftMenu";
import HorizontalNavigator from "@/components/HorizontalNavigator";
import { useAtom } from "jotai";
import {
    isMobileAtom,
    userAtom,
    userDataAtom,
    displayModeAtom,
    homeExpandedAtom,
    signInStatusAtom,
    circleAtom,
    subcirclesAtom,
    circleDataAtom,
    circleConnectionsAtom,
    searchResultsShownAtom,
    navigationPanelPinnedAtom,
    circlesFilterAtom,
    inVideoConferenceAtom,
    showHistoricCirclesAtom,
    activeCirclesAtom,
    similarCirclesAtom,
    connectedCirclesAtom,
    mentionedCirclesAtom,
    circleHistoryAtom,
    circleDashboardExpandedAtom,
    focusOnMapItemAtom,
} from "@/components/Atoms";
import { displayModes } from "@/components/Constants";
import { useDrag, useGesture, useScroll, useWheel } from "@use-gesture/react";
import { useSpring, animated } from "react-spring";
import useWindowDimensions from "@/components/useWindowDimensions";
import { Home } from "@/components/Home";
import { useLocationNoUpdates, useNavigateNoUpdates } from "@/components/RouterUtils";
import { routes } from "@/components/Navigation";
import { DataProviderFactory } from "@/services/DataProviderFactory";
import CircleMap from "@/components/CircleMap";
import WidgetController from "@/components/WidgetController";
import NavigationPanel from "@/components/NavigationPanel";
import config from "@/Config";
import CircleGlobusMap from "@/components/CircleGlobusMap";
import { CircleDashboard, tabs } from "@/components/CircleDashboard";
import { CircleChatWidget } from "@/components/CircleChat";
import { UserDashboard } from "@/components/UserDashboard";
import { CircleSearcher } from "@/components/CircleSearch";
import { disableMapAutoFocusAtom } from "./Atoms";
import { CircleSelector } from "./CircleDashboard";
//#endregion

export const globalCircle = {
    id: "global",
    name: "Circles",
    description: "Welcome, this is the global view of our social networking platform for change makers.",
    content:
        "Here, you can explore all the communities, users, events, and projects that make up our greater community.\n\nOn the map, you'll see pins representing different communities, each with their own unique missions and causes. You’ll also see pins representing people, events, chats and a whole lot more. Every pin is a circle with its own profile. Click on a circle to dive into its profile and connect with like-minded individuals working towards a common goal.\n\nBut Circles isn't just about individuals and communities. It's also about the connections between them. Our platform is designed to foster collaboration and cross-pollination between different groups and here is where you can see these connections come to life.\n\nFrom local grassroots initiatives to global movements, Circles has it all. Whether you're looking to join a community, organize an event, or simply stay up to date on the latest developments in the world of social change, this is a good place to start. So come explore, join the movement and let’s co-create a better world together.",
    picture: "/codo-logo.svg",
    cover: "/splash.jpg",
    type: "circle",
    created: new Date(),
    created_by: "global",
    chat_circle_ids: [config.ai_agent],
    updated: new Date(),
    updated_by: "global",
    connections: [],
    isGlobal: true,
    is_public: true,
};

export const Circle = ({ isGlobal }) => {
    log("Circle.render", -1);

    const [isMobile] = useAtom(isMobileAtom);
    const [toggledWidgets, setToggledWidgets] = useState(
        isMobile ? ["user-dashboard"] : ["user-dashboard", "circle-dashboard"]
    );
    const [circleDashboardExpanded, setCircleDashboardExpanded] = useAtom(circleDashboardExpandedAtom);
    const { hostId, circleId } = useParams();

    const [signInStatus] = useAtom(signInStatusAtom);
    const [circle, setCircle] = useAtom(circleAtom);
    const [, setCircleData] = useAtom(circleDataAtom);
    const [displayMode] = useAtom(displayModeAtom);
    const [, setActiveCircles] = useAtom(activeCirclesAtom);
    const [, setSimilarCircles] = useAtom(similarCirclesAtom);
    const [, setConnectedCircles] = useAtom(connectedCirclesAtom);
    const [, setMentionedCircles] = useAtom(mentionedCirclesAtom);
    const [, setCircleConnections] = useAtom(circleConnectionsAtom);
    const [, setSubcircles] = useAtom(subcirclesAtom);
    const [user] = useAtom(userAtom);
    const [userData] = useAtom(userDataAtom);
    const [showHistoricCircles, setShowHistoricCircles] = useAtom(showHistoricCirclesAtom);
    const { windowWidth, windowHeight } = useWindowDimensions();
    const navigate = useNavigateNoUpdates();
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [isPinned, setIsPinned] = useAtom(navigationPanelPinnedAtom);
    const [circlesFilter, setCirclesFilter] = useAtom(circlesFilterAtom);
    const [inVideoConference] = useAtom(inVideoConferenceAtom);
    const [circleHistory, setCircleHistory] = useAtom(circleHistoryAtom);
    const [initialFocusDone, setInitialFocusDone] = useState(false);
    const [, setDisableMapAutoFocus] = useAtom(disableMapAutoFocusAtom);
    const [, setFocusOnMapItem] = useAtom(focusOnMapItemAtom);
    const location = useLocationNoUpdates();

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

    const handlePinClick = () => {
        setIsPinned(!isPinned);
    };

    const onLogoClick = () => {
        // open navigation menu
        onOpen();
        log("opening navigation menu", -1);
    };

    // updates circle history
    useEffect(() => {
        if (!circle?.id) return;

        // update history unless current circle is at the history position, for now just add circle to history
        setCircleHistory((x) => {
            // get circle at current position
            const currentCircle = x.history?.[x.position];

            // if circle is already at position do nothing
            if (currentCircle?.id === circle.id) return x;

            // if we're not at the end of the history, discard future circles
            if (x.position < x.history.length - 1) {
                return {
                    position: x.position + 1,
                    history: [...x.history.slice(0, x.position + 1), circle],
                };
            }

            // if we're at the end of the history, add circle to history
            return {
                position: x.position + 1,
                history: [...x.history, circle],
            };
        });
    }, [circle?.id, setCircleHistory]); // ignore warning as we only want to update history when circle id changes

    // subscribes to circle
    useEffect(() => {
        log("Circle.useEffect", -1);

        if (!circleId) return;

        const dataProvider = DataProviderFactory.createDataProvider(hostId);
        if (dataProvider.supportsSubscription()) {
            let unsubscribe = dataProvider.subscribeToCircle(circleId, (newCircle) => {
                setCircle(newCircle);
            });

            return () => {
                if (unsubscribe) {
                    unsubscribe();
                }
            };
        } else {
            dataProvider.getCircle(circleId).then((fetchedCircle) => {
                setCircle(fetchedCircle);
            });
        }
    }, [hostId, circleId, setCircle, isGlobal]);

    // subscribes to circle private data
    useEffect(() => {
        if (!circle?.id) return;
        if (!user?.id) return;

        // if user is administrator subscribe to circle private data
        const dataProvider = DataProviderFactory.createDataProvider(hostId);
        let isAdmin =
            user.id === circle.id || userData.admin_of?.includes(circle.id) || userData.owner_of?.includes(circle.id);
        if (isAdmin) {
            if (dataProvider.supportsSubscription()) {
                let unsubscribeData = dataProvider.subscribeToCircleData(circle.id, (newCircleData) => {
                    setCircleData(newCircleData);
                });
                return () => {
                    if (unsubscribeData) {
                        unsubscribeData();
                    }
                };
            } else {
                dataProvider.getCircleData(circle.id).then((fetchedCircleData) => {
                    setCircleData(fetchedCircleData);
                });
            }
        }
    }, [hostId, userData?.admin_of, userData?.owner_of, circle?.id, user?.id, setCircleData]);

    // gets connected circles
    useEffect(() => {
        if (!circleId && !isGlobal) return;

        // if global we get all circles of type "circle" in the system
        let everything = circleId === "global" || isGlobal;
        let q = null;
        if (everything) {
            // get all circles
            q = query(collection(db, "circles"), where("type", "in", ["circle", "post", "event", "user", "task"]));
        } else {
            // get subcircles
            q = query(
                collection(db, "circles"),
                where("parent_circle.id", "==", circleId),
                where("type", "in", ["circle", "post", "event", "user", "task"])
            );

            // get connected circles
            axios
                .get(`/circles/${circleId}/circles`, { params: { filter: ["connected"] } })
                .then((response) => {
                    let connectedCircles = response.data.connectedCircles;
                    setConnectedCircles(connectedCircles ?? []);
                })
                .catch((err) => {
                    console.error(err);
                });
        }

        let unsubscribeGetSubcircles = onSnapshot(q, (snap) => {
            let circles = snap.docs.map((doc) => {
                return { id: doc.id, ...doc.data() };
            });
            setSubcircles(circles);
        });

        return () => {
            if (unsubscribeGetSubcircles) {
                unsubscribeGetSubcircles();
            }
        };

        // DISCOVERY123 old discovery logic to get active, similar, mentioned and connected circles
        // // get all circles that has recently been active in circle
        // const lastXMinutes = new Date();
        // lastXMinutes.setMinutes(lastXMinutes.getMinutes() - 60 * 24); // last 24 hours

        // // show all connections on the map
        // // subscribe to connected circles
        // let q = null;

        // // subscribe to active circles
        // let everything = circleId === "global" || isGlobal;
        // if (everything) {
        //     q = query(collection(db, "circles"), where("activity.last_activity", ">=", lastXMinutes));
        // } else {
        //     q = query(
        //         collection(db, "circles"),
        //         where("activity.active_in_circle.id", "==", circleId),
        //         where("activity.last_activity", ">=", lastXMinutes)
        //     );
        //     // TODO here we might want to get active in sub-circles as well
        // }

        // // subscribe to active circles
        // let unsubscribeGetActiveCircles = onSnapshot(q, (snap) => {
        //     let activeCircles = snap.docs.map((doc) => {
        //         return { id: doc.id, ...doc.data() };
        //     });
        //     setActiveCircles(activeCircles);
        // });

        // // get similar circles
        // axios
        //     .get(`/circles/${circleId}/circles`)
        //     .then((response) => {
        //         let similarCircles = response.data.similarCircles;
        //         setSimilarCircles(similarCircles ?? []);

        //         //log("similar circles: " + JSON.stringify(similarCircles, null, 2), 0, true);

        //         let connectedCircles = response.data.connectedCircles;
        //         setConnectedCircles(connectedCircles ?? []);

        //         let mentionedCircles = response.data.mentionedCircles;
        //         setMentionedCircles(mentionedCircles ?? []);
        //     })
        //     .catch((err) => {
        //         console.error(err);
        //     });

        // return () => {
        //     if (unsubscribeGetActiveCircles) {
        //         unsubscribeGetActiveCircles();
        //     }
        // };
    }, [
        circleId,
        setActiveCircles,
        setCircleConnections,
        isGlobal,
        setSimilarCircles,
        setConnectedCircles,
        setMentionedCircles,
    ]);

    // marks circle as seen
    useEffect(() => {
        log("Circle.useEffect 2", -1);
        if (!signInStatus.signedIn) return;
        if (!user?.id || !circleId) return;

        // mark circle as seen
        axios
            .post(`/seen`, {
                category: "any",
                circleId: circleId,
            })
            .then((x) => {})
            .catch((error) => {});
    }, [user?.id, circleId, signInStatus]);

    // updates user activity
    useEffect(() => {
        if (config.disableOnActive) return;
        if (!signInStatus.signedIn || !user?.id) return;

        axios
            .put(`/circles/${circleId}/activity`, {
                active_in_video_conference: inVideoConference === circleId,
            })
            .catch((err) => {
                console.error(err);
            });

        const intervalId = setInterval(async () => {
            axios
                .put(`/circles/${circleId}/activity`, {
                    active_in_video_conference: inVideoConference === circleId,
                })
                .catch((err) => {
                    console.error(err);
                });
        }, 60000);
        return () => clearInterval(intervalId);
    }, [signInStatus?.signedIn, user?.id, circleId, inVideoConference]);

    // focuses on circle if circle is navigated to directly
    // useEffect(() => {
    //     if (circleId && circle?.id && !initialFocusDone) {
    //         focusCircle(circle, setFocusOnMapItem);
    //         setInitialFocusDone(true); // Prevent further calls on subsequent renders
    //     }
    // }, [circleId, circle, initialFocusDone]);

    const circlePictureSize = isMobile ? 120 : 160;

    const debugBg = false;
    const topMenuHeight = 90;
    const topMenuHeightPx = topMenuHeight + "px";
    const contentHeight = windowHeight;

    const onTabClick = (tab) => {
        const path = tab?.id ?? "";
        setDisableMapAutoFocus(false);
        navigate(`/${hostId}/${circleId}/${path}`);
    };

    const isTabSelected = (tab) => {
        return tab?.id === selectedTab?.id;
    };

    return (
        <Flex flexDirection="row">
            <Box flexGrow="1" position="relative">
                <Flex flexDirection="column" position="relative" backgroundColor="black">
                    <Box
                        width={isMobile ? "100%" : "calc(100% - 360px)"}
                        height={contentHeight + "px"}
                        position="relative"
                    >
                        <CircleMap width={isMobile ? windowWidth : windowWidth - 360} height={contentHeight} />
                        <Flex
                            position="absolute"
                            right="0px"
                            top="0px"
                            width="30px"
                            height="100%"
                            zIndex="1"
                            // backgroundColor="#ffffff66"
                            backgroundColor="transparent"
                            style={{
                                background: "linear-gradient(to right, rgba(0, 0, 0, 0), rgba(0, 0, 0, 1))",
                            }}
                        ></Flex>
                        {/* Floating control panel */}
                        {!circleDashboardExpanded && (
                            <Flex
                                position="absolute"
                                bottom="20px"
                                left="50%"
                                transform="translateX(-50%)"
                                borderRadius="10px"
                                backgroundColor="white"
                                overflow="hidden"
                                align="center"
                            >
                                <CircleSelector compact={true} />

                                {tabs
                                    .filter((x) => x.showInMap)
                                    .map((tab) => (
                                        <Flex
                                            borderWidth="2px 0px 2px 0px"
                                            borderBottomColor={isTabSelected(tab) ? "#ff2a10" : "white"}
                                            // backgroundColor={isTabSelected(tab) ? "#a1b2c9" : "white"}
                                            height="50px"
                                            // #ff8b68
                                            cursor="pointer"
                                            flexDirection="column"
                                            align="center"
                                            minWidth={"70px"}
                                            flex={1}
                                            onClick={() => onTabClick(tab)}
                                        >
                                            <Flex
                                                flexDirection="column"
                                                align="center"
                                                marginTop="auto"
                                                marginBottom="auto"
                                            >
                                                <tab.icon />
                                                <Text userSelect="none" fontSize="12px">
                                                    {tab.name}
                                                </Text>
                                            </Flex>
                                        </Flex>
                                    ))}
                            </Flex>
                        )}
                    </Box>

                    <Flex flexDirection="column" w="full" h="full" pos="absolute" zIndex="2" pointerEvents="none">
                        <Flex flexGrow="1" marginTop={"0px"} zIndex="10">
                            {toggledWidgets.includes("circle-dashboard") && (
                                <Flex
                                    flexDirection="column"
                                    minWidth={"24rem"}
                                    width={circleDashboardExpanded ? "auto" : isMobile ? "100%" : "24rem"}
                                    flexGrow={circleDashboardExpanded ? "1" : "0"}
                                    flexShrink={0}
                                    order="3"
                                >
                                    <CircleDashboard onClose={() => {}} />
                                </Flex>
                            )}

                            {!(isMobile || circleDashboardExpanded) && (
                                <Flex flexDirection="column" flexGrow="1" order="2">
                                    <CircleSearcher />
                                </Flex>
                            )}
                        </Flex>
                    </Flex>
                </Flex>
            </Box>
        </Flex>
    );
};

export default Circle;
