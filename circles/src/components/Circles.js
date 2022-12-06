//#region imports
import React, { useState, useEffect, useContext } from "react";
import { Box, Flex, VStack, Text, Icon } from "@chakra-ui/react";
import i18n from "i18n/Localization";
import axios from "axios";
import { getLatlng, getDistanceString, log, fromFsDate, getDateWithoutTime, getCircleTypes } from "components/Helpers";
import { routes, openCircle } from "components/Navigation";
import { CirclePicture } from "components/CircleElements";
import { RiMapPinFill } from "react-icons/ri";
import { getPreciseDistance } from "geolib";
import CircleListItem from "components/CircleListItem";
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
    circlesFilterAtom,
    filteredCirclesAtom,
} from "components/Atoms";
//#endregion

export const Circles = ({ type }) => {
    const [user] = useAtom(userAtom);
    const [circle] = useAtom(circleAtom);
    const [circlesFilter, setCirclesFilter] = useAtom(circlesFilterAtom);
    const [filteredCircles] = useAtom(filteredCirclesAtom);
    const navigate = useNavigateNoUpdates();

    useEffect(() => {
        if (circlesFilter.types?.length === 1 && circlesFilter.types.includes(type)) return;

        let newFilter = { ...circlesFilter };
        newFilter.types = [type];
        setCirclesFilter(newFilter);
    }, [circlesFilter, setCirclesFilter, type]);

    useEffect(() => {
        log("Circles.useEffect 3", 0);
        let circleId = circle?.id;
        if (!user?.id || !circleId) return;

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
                {filteredCircles?.length > 0 && <Box height="1px" backgroundColor="#ebebeb" />}

                {filteredCircles?.map((item) => (
                    <CircleListItem key={item.id} item={item} onClick={() => openCircle(navigate, item.id)} />
                ))}

                {filteredCircles?.length <= 0 && (
                    <Text marginLeft="12px" marginTop="10px" alignSelf="start">
                        {i18n.t(`No ${type}s`)}
                    </Text>
                )}
            </Flex>
        </Box>
    );
};

export default Circles;
