//#region imports
import React, { useEffect, useContext, lazy, Suspense, useMemo } from "react";
import {
    Flex,
    Box,
    Text,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    Button,
    useToast,
    HStack,
    useDisclosure,
    Image,
} from "@chakra-ui/react";
import db from "components/Firebase";
import axios from "axios";
import { log, fromFsDate, getDateWithoutTime, getImageKitUrl, singleLineEllipsisStyle, getDefaultCirclePicture } from "components/Helpers";
import { collection, doc, onSnapshot, query, where } from "firebase/firestore";
import { Routes, Route, useParams } from "react-router-dom";

import { CircleHeader, CircleCover, DisplayModeButtons, CircleRightPanel, ConnectButton } from "components/CircleElements";
import LeftMenu from "components/LeftMenu";
import { useAtom } from "jotai";
import {
    isMobileAtom,
    userAtom,
    userDataAtom,
    displayModeAtom,
    showNetworkLogoAtom,
    signInStatusAtom,
    circleAtom,
    circlesAtom,
    circleConnectionsAtom,
} from "components/Atoms";
import { displayModes } from "components/Constants";
//#endregion

const CircleHome = lazy(() => import("components/CircleHome"));
const CircleChat = lazy(() => import("components/CircleChat"));
const CircleMap = lazy(() => import("components/CircleMap"));
const Circles = lazy(() => import("components/Circles"));
const CircleSettings = lazy(() => import("components/settings/CircleSettings"));
const CircleAdmin = lazy(() => import("components/CircleAdmin"));

export const Circle = () => {
    log("Circle.render", -1);

    const { circleId } = useParams();
    const [isMobile] = useAtom(isMobileAtom);
    const [signInStatus] = useAtom(signInStatusAtom);
    const [, setShowNetworkLogo] = useAtom(showNetworkLogoAtom);
    const [circle, setCircle] = useAtom(circleAtom);
    const [displayMode] = useAtom(displayModeAtom);
    const [circles, setCircles] = useAtom(circlesAtom);
    const [circleConnections, setCircleConnections] = useAtom(circleConnectionsAtom);
    const [user] = useAtom(userAtom);

    useEffect(() => {
        setShowNetworkLogo(true);
    }, [setShowNetworkLogo]);

    useEffect(() => {
        if (!circleId) return;

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
        });

        return () => {
            if (unsubscribeGetCircle) {
                unsubscribeGetCircle();
            }
        };
    }, [circleId, setCircle]);

    useEffect(() => {
        if (!circleId) return;

        // show all connections on the map
        // subscribe to connected circles
        let q = query(collection(db, "connections"), where("circle_ids", "array-contains", circleId));
        let unsubscribeGetCircles = onSnapshot(q, (snap) => {
            let circleConnections = snap.docs.map((doc) => doc.data());
            // merge circle connections of the same type
            let connections = [];
            if (Array.isArray(circleConnections)) {
                let seen = {};
                connections = circleConnections?.filter((entry) => {
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
        });

        return () => {
            if (unsubscribeGetCircles) {
                unsubscribeGetCircles();
            }
        };
    }, [circleId, setCircles, setCircleConnections]);

    useEffect(() => {
        log("Circle.useEffect 2", 0);
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
    }, [user?.id, circleId]);

    const circlePictureSize = isMobile ? 120 : 160;

    const CircleProfilePicture = ({ picture, type, size, ...props }) => {
        const borderWidth = 3;
        const sizePx = `${size}px`;
        const sizeWithoutBorder = size - borderWidth * 2;
        const sizeWithoutBorderPx = `${sizeWithoutBorder}px`;

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
            >
                <Image
                    src={getImageKitUrl(circle?.picture ?? getDefaultCirclePicture(circle?.type), sizeWithoutBorder, sizeWithoutBorder)}
                    fallbackSrc={getImageKitUrl(getDefaultCirclePicture(circle?.type), sizeWithoutBorder, sizeWithoutBorder)}
                    borderRadius="50%"
                    width={sizeWithoutBorderPx}
                    height={sizeWithoutBorderPx}
                    objectFit="cover"
                />
            </Flex>
        );
    };

    const debugBg = false;
    const coverHeight = isMobile ? 250 : 464;

    return (
        <Flex flexDirection="column">
            {/* Cover image */}
            <Box width="100%" height={`${coverHeight}px`} position="relative">
                {displayMode === displayModes.default && <CircleCover type={circle?.type} cover={circle?.cover} coverHeight={coverHeight} />}
                {displayMode === displayModes.map && <CircleMap height={coverHeight} />}
                <DisplayModeButtons />
            </Box>

            {/* Main Content */}
            <Flex width="100%" flexDirection={isMobile ? "column" : "row"} flexWrap={isMobile ? "nowrap" : "wrap"} justifyContent="center" zIndex="2">
                <Box
                    flex={isMobile ? "initial" : "2"}
                    order={isMobile ? "0" : "2"}
                    maxWidth={isMobile ? "none" : "800px"}
                    backgroundColor={debugBg ? "lightgreen" : "transparent"}
                    position="relative"
                >
                    <CircleProfilePicture picture={circle?.picture} type={circle?.type} size={circlePictureSize} left={isMobile ? "10px" : "-180px"} />
                    {/* Header */}
                    <Box marginLeft={isMobile ? `${circlePictureSize + 20}px` : "0px"} marginTop={isMobile ? "3px" : "5px"}>
                        <CircleHeader circle={circle} />
                    </Box>
                    {isMobile && (
                        <Flex align="center" justifyContent="center">
                            <ConnectButton circle={circle} inHeader={true} />
                        </Flex>
                    )}

                    {/* Section content */}
                    <Routes>
                        <Route path="/" element={<CircleHome />} />
                        <Route path="/chat" element={<CircleChat />} />
                        <Route path="/circles" element={<Circles type="circle" />} />
                        <Route path="/events" element={<Circles type="event" />} />
                        <Route path="/rooms" element={<Circles type="room" />} />
                        <Route path="/users" element={<Circles type="user" />} />
                        <Route path="/links" element={<Circles type="link" />} />
                        <Route path="/settings" element={<CircleSettings />} />
                        <Route path="/admin" element={<CircleAdmin />} />
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
                    <Route path="/chat" element={<CircleRightPanel section="chat" />} />
                    <Route path="/circles" element={<CircleRightPanel section="circles" type="circle" />} />
                    <Route path="/events" element={<CircleRightPanel section="circles" type="event" />} />
                    <Route path="/rooms" element={<CircleRightPanel section="circles" type="room" />} />
                    <Route path="/users" element={<CircleRightPanel section="circles" type="user" />} />
                    <Route path="/links" element={<CircleRightPanel section="circles" type="link" />} />
                </Routes>
            </Flex>
        </Flex>
    );
};

export default Circle;
