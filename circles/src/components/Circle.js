//#region imports
import React, { useEffect, lazy, useRef, useState, useCallback } from "react";
import { Flex, Box, Drawer, DrawerBody, DrawerOverlay, DrawerContent, DrawerCloseButton, Button, useDisclosure } from "@chakra-ui/react";
import db from "components/Firebase";
import axios from "axios";
import { log, fromFsDate, getDateWithoutTime, isConnected } from "components/Helpers";
import { collection, doc, onSnapshot, query, where } from "firebase/firestore";
import { Routes, Route, useParams, useSearchParams } from "react-router-dom";
import { defaultCoverHeight } from "components/Constants";
import {
    CircleHeader,
    CircleCover,
    DisplayModeButtons,
    CircleRightPanel,
    ConnectButton,
    CirclePicture,
    FloatingAddButton,
    CircleProfilePicture,
} from "components/CircleElements";
import LeftMenu from "components/LeftMenu";
import HorizontalNavigator from "components/HorizontalNavigator";
import { useAtom } from "jotai";
import {
    isMobileAtom,
    userAtom,
    userDataAtom,
    displayModeAtom,
    homeExpandedAtom,
    signInStatusAtom,
    circleAtom,
    circlesAtom,
    circleConnectionsAtom,
    searchResultsShownAtom,
    navigationPanelPinnedAtom,
    circlesFilterAtom,
    inVideoConferenceAtom,
    showHistoricCirclesAtom,
} from "components/Atoms";
import { displayModes } from "components/Constants";
import TopMenu from "components/TopMenu";
import { useDrag, useGesture, useScroll, useWheel } from "@use-gesture/react";
import { useSpring, animated } from "react-spring";
import useWindowDimensions from "components/useWindowDimensions";
import { Home } from "components/Home";
import { useLocationNoUpdates, useNavigateNoUpdates } from "components/RouterUtils";
import { routes } from "components/Navigation";
import { DataProviderFactory } from "services/DataProviderFactory";
import Appreciative from "./contracts/Appreciative";
import CircleHolon from "components/Holons/CircleHolon";
import CircleHome from "components/CircleHome";
import CircleChat from "components/CircleChat";
import CircleMap from "components/CircleMap";
import Circles from "components/Circles";
import CircleSettings from "components/settings/CircleSettings";
import CircleAdmin from "components/CircleAdmin";
import CircleCreateNew from "components/settings/CircleCreateNew";
import CircleVideo from "components/CircleVideo";
import WidgetController from "components/WidgetController";
import NavigationPanel from "components/NavigationPanel";
//#endregion

export const globalCircle = {
    id: "global",
    name: "co:do Network",
    description: "Welcome, this is the global view of our social networking platform for change makers.",
    content:
        "Here, you can explore all the communities, users, events, and posts that make up our greater community.<br/><br/>On the map, you'll see pins representing different communities, each with their own unique missions and causes. You’ll also see pins representing people, events, chats and a whole lot more. Every pin is a circle with its own profile. Click on a circle to dive into its profile and connect with like-minded individuals working towards a common goal.<br/><br/>But co:do isn't just about individuals and communities. It's also about the connections between them. Our platform is designed to foster collaboration and cross-pollination between different groups and here is where you can see these connections come to life.<br/><br/>From local grassroots initiatives to global movements, co:do has it all. Whether you're looking to join a community, organize an event, or simply stay up to date on the latest developments in the world of social change, this is a good place to start. So come explore, join the movement and let’s co-create a better world together.",
    picture: "/codo-logo.svg",
    cover: "/splash.jpg",
    type: "circle",
    created: new Date(),
    created_by: "global",
    updated: new Date(),
    updated_by: "global",
    connections: [],
    isGlobal: true,
    is_public: true,
};

export const Circle = ({ isGlobal }) => {
    log("Circle.render", -1);

    const { hostId, circleId } = useParams();
    const [isMobile] = useAtom(isMobileAtom);
    const [signInStatus] = useAtom(signInStatusAtom);
    const [circle, setCircle] = useAtom(circleAtom);
    const [displayMode] = useAtom(displayModeAtom);
    const [, setCircles] = useAtom(circlesAtom);
    const [, setCircleConnections] = useAtom(circleConnectionsAtom);
    const [user] = useAtom(userAtom);
    const [userData] = useAtom(userDataAtom);
    const [showHistoricCircles, setShowHistoricCircles] = useAtom(showHistoricCirclesAtom);
    const { windowWidth, windowHeight } = useWindowDimensions();
    const navigate = useNavigateNoUpdates();
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [isPinned, setIsPinned] = useAtom(navigationPanelPinnedAtom);
    const [circlesFilter, setCirclesFilter] = useAtom(circlesFilterAtom);
    const [inVideoConference] = useAtom(inVideoConferenceAtom);

    const handlePinClick = () => {
        setIsPinned(!isPinned);
    };

    const onLogoClick = () => {
        // open navigation menu
        onOpen();
        log("opening navigation menu");
    };

    useEffect(() => {
        if (isGlobal || circleId === "global") {
            setCircle(globalCircle);
            return;
        }

        if (!circleId) return;

        log("Circle.useEffect");

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

    useEffect(() => {
        if (!circleId && !isGlobal) return;

        // get all circles that has recently been active in circle
        const lastXMinutes = new Date();
        lastXMinutes.setMinutes(lastXMinutes.getMinutes() - 60 * 24); // last 24 hours

        // show all connections on the map
        // subscribe to connected circles
        let q = null;

        let everything = circleId === "global" || isGlobal;
        if (everything) {
            if (showHistoricCircles) {
                // TODO get connected circles as well
                q = query(collection(db, "circles"));
            } else {
                q = query(collection(db, "circles"), where("activity.last_activity", ">=", lastXMinutes));
            }
        } else {
            if (showHistoricCircles) {
                // TODO get connected circles as well
                q = query(collection(db, "circles"), where("activity.active_in_circle.id", "==", circleId));
            } else {
                q = query(
                    collection(db, "circles"),
                    where("activity.active_in_circle.id", "==", circleId),
                    where("activity.last_activity", ">=", lastXMinutes)
                );
            }
        }
        let unsubscribeGetCircles = onSnapshot(q, (snap) => {
            let circles = snap.docs.map((doc) => {
                return { id: doc.id, ...doc.data() };
            });

            let startDate = getDateWithoutTime(); // today
            setCircles(
                circles.filter((x) => {
                    // remove old events
                    if (x.type === "event") {
                        return fromFsDate(x.starts_at) > startDate;
                    } else {
                        return true;
                    }
                })
            );
        });

        return () => {
            if (unsubscribeGetCircles) {
                unsubscribeGetCircles();
            }
        };
    }, [circleId, setCircles, setCircleConnections, isGlobal, showHistoricCircles]);

    useEffect(() => {
        log("Circle.useEffect 2", -1);
        if (!signInStatus.signedIn) return;
        if (!user?.id || !circleId) return;

        log("Circle.seen");

        // mark circle as seen
        axios
            .post(`/seen`, {
                category: "any",
                circleId: circleId,
            })
            .then((x) => {})
            .catch((error) => {});
    }, [user?.id, circleId, signInStatus]);

    useEffect(() => {
        // set to show only active circles
        if (circlesFilter.only_active !== !showHistoricCircles) {
            setCirclesFilter({ ...circlesFilter, only_active: !showHistoricCircles });
        }
        if (!circlesFilter.types) return;
        let { types: _, ...newFilter } = circlesFilter;
        setCirclesFilter(newFilter);
    }, [circlesFilter, setCirclesFilter, showHistoricCircles]);

    useEffect(() => {
        if (!signInStatus.signedIn || !user?.id) return;

        try {
            axios.put(`/circles/${circleId}/activity`, {
                active_in_video_conference: inVideoConference === circleId,
            });
        } catch (err) {
            console.error(err);
        }

        const intervalId = setInterval(async () => {
            try {
                axios.put(`/circles/${circleId}/activity`, {
                    active_in_video_conference: inVideoConference === circleId,
                });
            } catch (err) {
                console.error(err);
            }
        }, 60000);
        return () => clearInterval(intervalId);
    }, [signInStatus?.signedIn, user?.id, circleId, inVideoConference]);

    const circlePictureSize = isMobile ? 120 : 160;

    const debugBg = false;
    const coverHeight = windowHeight;

    return (
        <Flex flexDirection="row">
            {isPinned && !isMobile && (
                <Box backgroundColor="blue" width="300px" height="100vh">
                    <NavigationPanel isPinned={isPinned} setIsPinned={setIsPinned} />
                </Box>
            )}
            <Box flexGrow="1" position="relative">
                {displayMode !== displayModes.map_only && <TopMenu onLogoClick={onLogoClick} />}
                <Flex flexDirection="column" position="relative">
                    <Box width="100%" height={coverHeight + "px"} position="relative">
                        <CircleMap height={coverHeight} />
                    </Box>

                    <WidgetController />
                </Flex>
                {(!isPinned || isMobile) && (
                    <Drawer isOpen={isOpen} onClose={onClose} placement="left" size={isMobile ? "full" : "xs"} closeOnOverlayClick={!isPinned}>
                        <DrawerOverlay />
                        <DrawerContent padding="0">
                            <DrawerBody padding="0">
                                <NavigationPanel isPinned={isPinned} setIsPinned={setIsPinned} onClose={onClose} />
                            </DrawerBody>
                        </DrawerContent>
                    </Drawer>
                )}
            </Box>
        </Flex>
    );
};

export default Circle;
