//#region imports
import React, { useState, useEffect, useContext } from "react";
import { Box, Flex, VStack, Text, Icon } from "@chakra-ui/react";
import i18n from "i18n/Localization";
import axios from "axios";
import { getLatlng, getDistanceString, log, fromFsDate, getDateWithoutTime } from "components/Helpers";
import { routes, openCircle } from "components/Navigation";
import { CirclePicture } from "components/CircleElements";
import { RiMapPinFill } from "react-icons/ri";
import { getPreciseDistance } from "geolib";
import CircleListItem from "./CircleListItem";
import { useNavigateNoUpdates, useLocationNoUpdates } from "components/RouterUtils";
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
    userLocationAtom,
} from "components/Atoms";
//#endregion

export const Circles = ({ type }) => {
    const [isMobile] = useAtom(isMobileAtom);
    const [user] = useAtom(userAtom);
    const [userData] = useAtom(userDataAtom);
    const [circle] = useAtom(circleAtom);
    const [circleConnections] = useAtom(circleConnectionsAtom);
    const [circles, setCircles] = useAtom(circlesAtom);
    const navigate = useNavigateNoUpdates();
    const [unfilteredCircles, setUnfilteredCircles] = useState([]);
    const [userLocation] = useAtom(userLocationAtom);

    const getCircleTypes = (sourceType, targetType) => {
        const types = [sourceType, targetType];
        return types.sort().join("_");
    };

    useEffect(() => {
        log("Circles.useEffect 1", 0);
        if (!circle?.type || !circleConnections) {
            setUnfilteredCircles([]);
            return;
        }

        // filter connections
        const circleTypes = getCircleTypes(circle.type, type);
        setUnfilteredCircles(circleConnections.filter((x) => x.circle_types === circleTypes).map((x) => x.display_circle));
    }, [circleConnections, circle?.id, type, circle?.type]);

    useEffect(() => {
        log("Circles.useEffect 2", 0);
        let listCircles = unfilteredCircles; //!filterConnected ? unfilteredCircles : unfilteredCircles.filter((x) => user?.connections?.some((y) => y.target.id === x.id));

        if (type === "event") {
            // filter all past events
            let startDate = getDateWithoutTime(); // today
            listCircles = listCircles.filter((x) => fromFsDate(x.starts_at) > startDate);
        }

        if (!userLocation) {
            setCircles(listCircles);
            return;
        }

        let newFilteredCircles = [];
        if (userLocation.latitude && userLocation.longitude) {
            for (var circle of listCircles.filter((x) => x.base)) {
                var circleLocation = getLatlng(circle.base);
                var preciseDistance = getPreciseDistance(userLocation, circleLocation);
                newFilteredCircles.push({ ...circle, distance: preciseDistance });
            }

            newFilteredCircles.sort((a, b) => a.distance - b.distance);
            for (var circlesWithNoBase of listCircles.filter((x) => !x.base)) {
                newFilteredCircles.push(circlesWithNoBase);
            }
        } else {
            newFilteredCircles = listCircles;
        }

        if (type === "event") {
            // TODO if event we just sort by date and ignore proximity for now
            newFilteredCircles.sort((a, b) => fromFsDate(a.starts_at) - fromFsDate(b.starts_at));
        }

        setCircles(newFilteredCircles);
    }, [unfilteredCircles, userLocation, setCircles, user?.connections, type]);

    useEffect(() => {
        log("Circles.useEffect 3", 0);
        let circleId = circle?.id;
        if (!user?.id || !circleId) return;
        if (circleId === "earth") return;

        log("Circles.seen");

        // mark circles as seen
        axios
            .post(`/seen`, {
                category: `${type}s`,
                circleId: circleId,
            })
            .then((x) => {})
            .catch((error) => {});
    }, [user?.id, circle?.id, type]);

    return (
        <Box flexGrow="1" width="100%" height="100%" align="center" position="relative" top="0px" left="0px">
            <Flex width="100%" flexDirection="column" flexWrap="nowrap">
                {circles?.length > 0 && <Box height="1px" backgroundColor="#ebebeb" />}

                {circles?.map((item) => (
                    <CircleListItem key={item.id} item={item} onClick={() => openCircle(navigate, item.id)} />
                ))}

                {circles?.length <= 0 && (
                    <Text marginLeft="12px" marginTop="10px" alignSelf="start">
                        {i18n.t(`No ${type}s`)}
                    </Text>
                )}
            </Flex>
        </Box>
    );
};

export default Circles;
