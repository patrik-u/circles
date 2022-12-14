//#region imports
import React, { useEffect } from "react";
import { Box, Flex, Text } from "@chakra-ui/react";
import i18n from "i18n/Localization";
import axios from "axios";
import { log } from "components/Helpers";
import { openCircle } from "components/Navigation";
import CircleListItem from "components/CircleListItem";
import { useNavigateNoUpdates } from "components/RouterUtils";
import { useAtom } from "jotai";
import { userAtom, signInStatusAtom, circleAtom, circlesFilterAtom, filteredCirclesAtom } from "components/Atoms";
//#endregion

export const Circles = ({ type }) => {
    const [user] = useAtom(userAtom);
    const [circle] = useAtom(circleAtom);
    const [circlesFilter, setCirclesFilter] = useAtom(circlesFilterAtom);
    const [filteredCircles] = useAtom(filteredCirclesAtom);
    const [signInStatus] = useAtom(signInStatusAtom);
    const navigate = useNavigateNoUpdates();

    useEffect(() => {
        if (circlesFilter.types?.length === 1 && circlesFilter.types.includes(type)) return;

        let newFilter = { ...circlesFilter };
        newFilter.types = [type];
        setCirclesFilter(newFilter);
    }, [circlesFilter, setCirclesFilter, type]);

    useEffect(() => {
        log("Circles.useEffect 3", -1);
        if (!signInStatus.signedIn) return;
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
    }, [user?.id, circle?.id, type, signInStatus]);

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
