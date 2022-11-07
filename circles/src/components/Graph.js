// #region imports
import React, { useState, useEffect, useContext, useRef, useMemo, useCallback } from "react";
import ReactFlow, { MiniMap, Controls, Background, useNodesState, useEdgesState, addEdge } from "reactflow";
import {
    Box,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    Flex,
    FormControl,
    FormLabel,
    HStack,
    VStack,
    Spinner,
    Table,
    TableCaption,
    Thead,
    Tr,
    Td,
    Th,
    Tfoot,
    Tbody,
    Text,
    Image,
    Icon,
    Link,
    Popover,
    PopoverTrigger,
    PopoverContent,
    Button,
    useDisclosure,
    PopoverArrow,
    useToast,
} from "@chakra-ui/react";
import {
    CircleTypeForm,
    CircleImagesForm,
    CircleTagsForm,
    CircleBaseForm,
    CircleSocialMediaForm,
    CircleContentForm,
    EventContentForm,
    CircleDeleteForm,
    CircleConnectionsSettings,
    CircleQuestionsForm,
} from "../components/CircleSettingsForms";
import i18n from "i18n/Localization";
import UserContext from "../components/UserContext";
import db from "../components/Firebase";
import axios from "axios";
import {
    timeSince,
    getLatlng,
    getDistanceString,
    log,
    lat,
    lng,
    fromFsDate,
    getDateWithoutTime,
    getDateAndTimeLong,
    getDateLong,
    mapNavigateTo,
    isToday,
    toastError,
    toastSuccess,
    getLngLatArray,
} from "../components/Helpers";
import { collection, doc, onSnapshot, query, where, orderBy } from "firebase/firestore";
import IsMobileContext from "../components/IsMobileContext";
import { Marker } from "react-map-gl";
import { Routes, Route, useNavigate, useParams, useSearchParams, useLocation, matchPath } from "react-router-dom";
import {
    CircleHeader,
    CirclePicture,
    CircleCover,
    routes,
    ShareButtonMenu,
    openCircle,
    circleDefaultRoute,
    isConnected,
    isConnectedId,
    isMutuallyConnected,
    isFollowing,
    adminCircles,
    defaultContentWidth,
    CircleTags,
    ConnectButton,
    getConnectLabel,
} from "../components/Navigation";
import { HiClock, HiCheckCircle, HiXCircle } from "react-icons/hi";
import { RiMapPinFill, RiLinksLine } from "react-icons/ri";
import { GiRoundStar } from "react-icons/gi";
import { BsArrowRight } from "react-icons/bs";
import { AiOutlineDisconnect } from "react-icons/ai";
import { Step, Steps, useSteps } from "chakra-ui-steps";
import { getPreciseDistance } from "geolib";
import { Scrollbars } from "react-custom-scrollbars-2";
import { Source, Layer } from "react-map-gl";
// #endregion

import "reactflow/dist/style.css";

const initialNodes = [
    { id: "1", position: { x: 0, y: 0 }, data: { label: "1" } },
    { id: "2", position: { x: 0, y: 100 }, data: { label: "2" } },
];

const initialEdges = [{ id: "e1-2", source: "1", target: "2" }];

const Graph = ({ circle, setCircle, circles, setCircles }) => {
    const [nodes, setNodes, onNodesChange] = useNodesState();
    const [edges, setEdges, onEdgesChange] = useEdgesState();

    const user = useContext(UserContext);

    useEffect(() => {
        log("CircleHome.useEffect 1", 0);

        let circleId = circle?.id;
        if (!circleId) {
            return;
        }

        // show all connections on the map
        // subscribe to connected circles
        let q = query(collection(db, "connections"), where("circle_ids", "array-contains", circleId));

        let unsubscribeGetCircles = onSnapshot(q, (snap) => {
            let circleConnections = snap.docs.map((doc) => {
                return { id: doc.id, ...doc.data() };
            });

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

            // console.log("connections = " + JSON.stringify(connections, null, 2));
            let nodes = circles?.map((x, i) => {
                let position = getLngLatArray(x.base);
                return { id: x.id, position: { x: i * 10, y: i * 10 }, data: { label: x.name } };
            });
            nodes?.push({ id: circle.id, position: { x: 0, y: 0 }, data: { label: circle.name } });

            setNodes(nodes);
            setEdges(
                connections?.map((x) => {
                    return { id: x.id, source: x.source.id, target: x.target.id };
                })
            );
            log(JSON.stringify(edges, null, 2));

            let startDate = getDateWithoutTime(); // today
            setCircles(
                connections
                    .map((x) => x.display_circle)
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
            setCircles([]);
        };
    }, [circle?.id, setCircles]);

    const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

    return (
        <Box backgroundColor="#dfdfdf" width="100%" height="100%">
            <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect}>
                <MiniMap />
                <Controls />
            </ReactFlow>
        </Box>
    );
};

export default Graph;
