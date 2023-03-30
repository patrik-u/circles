//#region imports
import React, { useEffect, lazy, useRef, useState, useCallback } from "react";
import { Flex, Box } from "@chakra-ui/react";
import db from "components/Firebase";
import axios from "axios";
import { log, fromFsDate, getDateWithoutTime, isConnected } from "components/Helpers";
import { collection, doc, onSnapshot, query, where } from "firebase/firestore";
import { Routes, Route, useParams } from "react-router-dom";
import { defaultCoverHeight } from "components/Constants";
import { CircleHeader, CircleCover, DisplayModeButtons, CircleRightPanel, ConnectButton, CirclePicture, FloatingAddButton } from "components/CircleElements";
import LeftMenu from "components/LeftMenu";
import HorizontalNavigator from "components/HorizontalNavigator";
import { useAtom } from "jotai";
import { isMobileAtom, userAtom, userDataAtom, displayModeAtom, homeExpandedAtom, signInStatusAtom, circleAtom, circlesAtom, circleConnectionsAtom, searchResultsShownAtom } from "components/Atoms";
import { displayModes } from "components/Constants";
import TopMenu from "components/TopMenu";
import { useDrag, useGesture, useScroll, useWheel } from "@use-gesture/react";
import { useSpring, animated } from "react-spring";
import useWindowDimensions from "components/useWindowDimensions";
import { Home } from "components/Home";
import { useNavigateNoUpdates } from "components/RouterUtils";
import { routes } from "components/Navigation";
//#endregion

const CircleHome = lazy(() => import("components/CircleHome"));
const CircleChat = lazy(() => import("components/CircleChat"));
const CircleMap = lazy(() => import("components/CircleMap"));
const Circles = lazy(() => import("components/Circles"));
const CircleSettings = lazy(() => import("components/settings/CircleSettings"));
const CircleAdmin = lazy(() => import("components/CircleAdmin"));
const CircleCreateNew = lazy(() => import("components/settings/CircleCreateNew"));

const CircleProfilePicture = ({ circle, size, ...props }) => {
    const borderWidth = 3;
    const sizePx = `${size}px`;
    const sizeWithoutBorder = size - borderWidth * 2 - (circle?.id === "global" ? 5 : 0);

    return (
        <Flex
            backgroundColor="white"
            borderRadius="50%"
            width={sizePx}
            height={sizePx}
            flexShrink="0"
            flexGrow="0"
            alignItems="center"
            justifyContent="center"
            position="absolute"
            top={`-${size / 3}px`}
            {...props}
            zIndex="200"
        >
            <CirclePicture circle={circle} size={sizeWithoutBorder} hasPopover={false} parentCircleSizeRatio={3.75} parentCircleOffset={3} />
        </Flex>
    );
};

export const Circle = ({ isGlobal }) => {
    log("Circle.render", -1);

    const { circleId } = useParams();
    const [isMobile] = useAtom(isMobileAtom);
    const [signInStatus] = useAtom(signInStatusAtom);
    const [homeExpanded, setHomeExpanded] = useAtom(homeExpandedAtom);
    const [circle, setCircle] = useAtom(circleAtom);
    const [displayMode] = useAtom(displayModeAtom);
    const [, setCircles] = useAtom(circlesAtom);
    const [, setCircleConnections] = useAtom(circleConnectionsAtom);
    const [user] = useAtom(userAtom);
    const [userData] = useAtom(userDataAtom);
    const { windowWidth, windowHeight } = useWindowDimensions();
    const navigate = useNavigateNoUpdates();
    const [searchResultsShown] = useAtom(searchResultsShownAtom);

    const onLogoClick = () => {
        navigate(routes.circle("global").home);
        //toggleExpand();
    };

    useEffect(() => {
        if (isGlobal || circleId === "global") {
            setCircle({
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
            });
            return;
        }

        if (!circleId) return;

        log("Circle.useEffect");
        let unsubscribeGetCircle = null;

        // subscribe to circle
        unsubscribeGetCircle = onSnapshot(doc(db, "circles", circleId), (doc) => {
            var newCircle = doc.data();
            if (!doc.exists) {
                // TODO display something about circle not existing
                return;
            }
            newCircle.id = doc.id;
            setCircle((currentCircle) => newCircle);
            console.log(JSON.stringify(newCircle, null, 2));
        });

        return () => {
            if (unsubscribeGetCircle) {
                unsubscribeGetCircle();
            }
        };
    }, [circleId, setCircle, isGlobal]);

    useEffect(() => {
        if (!circleId && !isGlobal) return;

        // show all connections on the map
        // subscribe to connected circles
        let q = null;
        let everything = circleId === "global" || isGlobal;
        if (everything) {
            q = query(collection(db, "connections"));
        } else {
            q = query(collection(db, "connections"), where("circle_ids", "array-contains", circleId));
        }
        let unsubscribeGetCircles = onSnapshot(q, (snap) => {
            let circleConnections = snap.docs.map((doc) => {
                return { id: doc.id, ...doc.data() };
            });
            // merge circle connections of the same type
            let connections = [];
            if (Array.isArray(circleConnections)) {
                let seen = {};
                connections = everything
                    ? circleConnections?.filter((entry) => {
                          if (!entry.source || !entry.target) {
                              //log(entry.id, 2, true); // due to some unknown bug there was a couple of connections missing source or target
                              return false;
                          }
                          let id = entry.source.id > entry.target.id ? entry.source.id + entry.target.id : entry.target.id + entry.source.id;
                          if (seen.hasOwnProperty(id)) {
                              // yes, grab it and add this data to it
                              let previous = seen[id];
                              previous.type.push(entry.type);
                              // don't keep this entry, we've merged it into the previous one
                              return false;
                          }
                          // entry.type probably isn't an array; make it one for consistency
                          if (!Array.isArray(entry.type)) {
                              entry.type = [entry.type];
                          }

                          // remember that we've seen it
                          seen[id] = entry;

                          return true;
                      })
                    : circleConnections?.filter((entry) => {
                          var previous;
                          // wether to use source or target depends
                          let parentCircleIsSource = entry.source.id === circleId;
                          let mergeId = parentCircleIsSource ? entry.target.id : entry.source.id;
                          // have we seen this label before?
                          if (seen.hasOwnProperty(mergeId)) {
                              // yes, grab it and add this data to it
                              previous = seen[mergeId];
                              previous.type.push(entry.type);
                              // don't keep this entry, we've merged it into the previous one
                              return false;
                          }
                          // entry.type probably isn't an array; make it one for consistency
                          if (!Array.isArray(entry.type)) {
                              entry.type = [entry.type];
                          }
                          entry.display_circle = parentCircleIsSource ? entry.target : entry.source;
                          // remember that we've seen it
                          seen[mergeId] = entry;
                          return true;
                      });
            }

            setCircleConnections(connections);
            let startDate = getDateWithoutTime(); // today

            if (everything) {
                let seen = {};
                let everyCircle = [];
                connections?.forEach((entry) => {
                    if (!seen.hasOwnProperty(entry.source.id)) {
                        everyCircle.push(entry.source);
                        seen[entry.source.id] = true;
                    }
                    if (!seen.hasOwnProperty(entry.target.id)) {
                        everyCircle.push(entry.target);
                        seen[entry.target.id] = true;
                    }
                });
                setCircles(
                    everyCircle.filter((x) => {
                        // remove old events
                        if (x.type === "event") {
                            return fromFsDate(x.starts_at) > startDate;
                        } else {
                            return true;
                        }
                    })
                );
            } else {
                setCircles(
                    connections
                        ?.map((x) => x.display_circle)
                        .filter((x) => {
                            // remove old events
                            if (x.type === "event") {
                                return fromFsDate(x.starts_at) > startDate;
                            } else {
                                return true;
                            }
                        })
                );
            }
        });

        return () => {
            if (unsubscribeGetCircles) {
                unsubscribeGetCircles();
            }
        };
    }, [circleId, setCircles, setCircleConnections, isGlobal]);

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

    const circlePictureSize = isMobile ? 120 : 160;

    const debugBg = false;
    const coverHeight = isMobile ? defaultCoverHeight.mobile : defaultCoverHeight.default;

    return (
        <>
            {displayMode !== displayModes.map_only && <TopMenu onLogoClick={onLogoClick} />}
            <Flex flexDirection="column">
                {/* ref={circleRef} */}
                {/* <animated.div ref={expandableBoxRef} id="expandableBox" style={{ height: springProps.height, overflow: "hidden" }}>
                    <Home />
                </animated.div> */}

                {/* <Box ref={expandableBoxRef} id="expandableBox" backgroundColor="blue" height="0px" width="100%"></Box> */}

                {/* Cover image */}
                {/* <Box width="100%" height="90px" backgroundColor="blue" /> */}
                <Box width="100%" height={`${coverHeight}px`} position="relative">
                    {displayMode === displayModes.default && <CircleCover type={circle?.type} cover={circle?.cover} metaData={circle?.meta_data} coverHeight={coverHeight} />}
                    {(displayMode === displayModes.map || displayMode === displayModes.map_only) && <CircleMap height={coverHeight} />}
                    <DisplayModeButtons />
                </Box>

                {/* Main Content */}
                {displayMode !== displayModes.map_only && (
                    <>
                        <Flex width="100%" flexDirection={isMobile ? "column" : "row"} flexWrap={isMobile ? "nowrap" : "wrap"} justifyContent="center" zIndex="2" backgroundColor="white">
                            <Box
                                flex={isMobile ? "initial" : "2"}
                                order={isMobile ? "0" : "2"}
                                maxWidth={isMobile ? "none" : "800px"}
                                backgroundColor={debugBg ? "lightgreen" : "transparent"}
                                position="relative"
                            >
                                <CircleProfilePicture circle={circle} size={circlePictureSize} left={isMobile ? "10px" : "-180px"} />
                                {/* Header */}
                                <Box marginLeft={isMobile ? `${circlePictureSize + 20}px` : "0px"} marginTop={isMobile ? "3px" : "5px"}>
                                    <CircleHeader circle={circle} />
                                </Box>
                                {isMobile && circle?.id !== "global" && !isConnected(userData, circle?.id, ["connected_mutually_to"]) && (
                                    <Flex align="center" justifyContent="center" marginTop="5px" marginBottom="5px">
                                        <ConnectButton circle={circle} inHeader={true} />
                                    </Flex>
                                )}
                                {isMobile && <HorizontalNavigator />}

                                {/* Section content */}
                                <Routes>
                                    <Route path="/" element={<CircleHome />} />
                                    <Route path="/posts" element={<Circles type="post" />} />
                                    <Route path="/chat" element={<CircleChat />} />
                                    <Route path="/circles" element={<Circles type="circle" />} />
                                    <Route path="/events" element={<Circles type="event" />} />
                                    <Route path="/rooms" element={<Circles type="room" />} />
                                    <Route path="/users" element={<Circles type="user" />} />
                                    <Route path="/links" element={<Circles type="link" />} />
                                    <Route path="/settings/*" element={<CircleSettings />} />
                                    <Route path="/admin" element={<CircleAdmin />} />
                                    <Route path="/new" element={<CircleCreateNew />} />
                                </Routes>
                            </Box>
                            {/* Left panel */}
                            {!isMobile && (
                                <Box
                                    flex={isMobile ? "initial" : "1"}
                                    order={isMobile ? "0" : "1"}
                                    align="right"
                                    backgroundColor={debugBg ? "orange" : "transparent"}
                                    maxWidth={isMobile ? "none" : "270px"}
                                >
                                    <LeftMenu marginRight="40px" marginLeft="10px" paddingTop="140px" paddingBottom="60px" />
                                </Box>
                            )}
                            {/* Right panel */}
                            <Routes>
                                <Route path="/" element={<CircleRightPanel section="home" />} />
                                <Route path="/posts" element={<CircleRightPanel section="circles" type="post" />} />
                                <Route path="/chat" element={<CircleRightPanel section="chat" />} />
                                <Route path="/circles" element={<CircleRightPanel section="circles" type="circle" />} />
                                <Route path="/events" element={<CircleRightPanel section="circles" type="event" />} />
                                <Route path="/rooms" element={<CircleRightPanel section="circles" type="room" />} />
                                <Route path="/users" element={<CircleRightPanel section="circles" type="user" />} />
                                <Route path="/links" element={<CircleRightPanel section="circles" type="link" />} />
                            </Routes>
                        </Flex>
                        <FloatingAddButton />
                    </>
                )}
            </Flex>
        </>
    );
};

export default Circle;
