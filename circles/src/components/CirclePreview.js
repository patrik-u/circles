//#region imports
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Box, Flex, HStack, VStack, Text, Icon, Button, Spinner } from "@chakra-ui/react";
import {
    log,
    getDistanceString,
    getDateAndTimeLong,
    getDateLong,
    getEventTime,
    getSetId,
    isPastEvent,
    isActiveInCircle,
    isActiveInVideoConference,
    getCircleTypes,
} from "components/Helpers";
import { openAboutCircle, openCircle } from "components/Navigation";
import { CirclePicture, CircleCover, CircleHeader, buttonHighlight, SimilarityIndicator } from "components/CircleElements";
import { HiClock } from "react-icons/hi";
import { RiMapPinFill, RiLiveFill } from "react-icons/ri";
import { TbMessage } from "react-icons/tb";
import { useAtom } from "jotai";
import {
    toggleAboutAtom,
    inVideoConferenceAtom,
    toggleWidgetEventAtom,
    highlightedCircleAtom,
    previewCircleAtom,
    userAtom,
    userDataAtom,
    updateRelationAtom,
} from "components/Atoms";
import { useNavigateNoUpdates } from "./RouterUtils";
import Lottie from "react-lottie";
import talkdotsAnimation from "assets/lottie/talkdots.json";
import axios from "axios";
//#endregion

export const ActiveInCircle = ({ circle, location, ...props }) => {
    const navigate = useNavigateNoUpdates();
    const [, setToggleAbout] = useAtom(toggleAboutAtom);
    const [inVideoConference] = useAtom(inVideoConferenceAtom);
    const [, setToggleWidgetEvent] = useAtom(toggleWidgetEventAtom);

    if (!circle?.activity?.active_in_circle) {
        return null;
    }

    return (
        <Flex
            borderRadius="500px"
            role="group"
            color="black"
            cursor="pointer"
            bg="white"
            boxShadow="md"
            _hover={{
                bg: "#ddd8db",
                color: "black",
            }}
            overflow="hidden"
            position="relative"
            marginLeft="10px"
            marginRight="10px"
            flexGrow="0"
            flexShrink="0"
            flexDirection="column"
            marginTop="1px"
            minHeight="40px"
            align="left"
            justifyContent="center"
            {...props}
        >
            <Flex overflow="hidden">
                <CirclePicture circle={circle.activity.active_in_circle} marginLeft="2px" size={36} disableClick={true} />

                <VStack flexGrow="1" align="left" justifyContent="center" spacing="0px" marginLeft="15px" marginRight="15px">
                    {circle.activity.active_in_circle.type === "event" && (
                        <Text fontSize="14px" fontWeight="700" color={isPastEvent(circle) ? "#8d8d8d" : "#cf1a1a"} href={location?.pathname} marginTop="0px">
                            {circle.activity.active_in_circle.is_all_day
                                ? getDateLong(circle.activity.active_in_circle.starts_at)
                                : getDateAndTimeLong(circle.activity.active_in_circle.starts_at)}
                        </Text>
                    )}
                    <HStack>
                        <Text fontSize="16px" fontWeight="700">
                            {circle.activity.active_in_circle.name}
                        </Text>
                    </HStack>
                    {/* <Box>
                    <Text fontSize="14px" noOfLines={3}>
                        {circle.description}
                    </Text>
                </Box> */}
                </VStack>
                {/* if video conference in progress show button to join */}
                <Box
                    position="absolute"
                    onClick={() => openAboutCircle(circle.activity.active_in_circle, setToggleAbout)}
                    top="0px"
                    left="0px"
                    width="100%"
                    height="100%"
                />

                {isActiveInVideoConference(circle) && !inVideoConference && (
                    <Flex
                        position="absolute"
                        right="0px"
                        marginRight="5px"
                        borderRadius={"25px"}
                        alignSelf="center"
                        height="30px"
                        lineHeight="0"
                        backgroundColor="#f83838"
                        color="white"
                        onClick={() => {
                            console.log("opening circle");
                            openCircle(navigate, circle.activity.active_in_circle);
                            setToggleWidgetEvent({ name: "video", value: true });
                        }}
                        align="center"
                        justifyContent="center"
                        _hover={{
                            backgroundColor: "var(--chakra-colors-red-500);",
                        }}
                        _active={{
                            backgroundColor: "var(--chakra-colors-red-700);",
                        }}
                        cursor="pointer"
                    >
                        <HStack marginRight={"13px"} marginLeft={"13px"}>
                            <RiLiveFill size={"12px"} />
                            <Text fontSize="14px" fontWeight="400">
                                Join
                            </Text>
                        </HStack>
                    </Flex>
                )}
            </Flex>
        </Flex>
    );
};

export const RelationSetInfo = ({ circle, ...props }) => {
    const [user] = useAtom(userAtom);
    const [userData] = useAtom(userDataAtom);
    const [relationSet, setRelationSet] = useState(null);
    const [relationIsLoading, setRelationIsLoading] = useState(false);
    const [, setUpdateRelation] = useAtom(updateRelationAtom);

    const setId = useMemo(() => {
        return getSetId(user?.id, circle?.id);
    }, [user?.id, circle?.id]);

    const relationDescription = useMemo(() => {
        let description = userData?.circle_settings?.[circle?.id]?.relation?.description;
        if (typeof description === "string") {
            return description;
        }
        return null;
    }, [userData?.circle_settings, circle?.id]);

    useEffect(() => {
        if (user?.id === circle?.id || !setId) {
            setRelationIsLoading(false);
            return;
        }

        const sortedIds = [user?.id, circle?.id].sort();
        setRelationSet({
            type: "set",
            id: setId,
            [user.id]: user,
            [circle.id]: circle,
            set_size: 2,
            description: relationDescription,
            circle_ids: sortedIds,
            circle_types: getCircleTypes(user.type, circle.type),
        });

        // TODO check if relation data is up to date by checking when it was generated and when the user and circle was updated
        if (!relationDescription) {
            // do axios call to update relation data
            setRelationIsLoading(true);
            setUpdateRelation(circle.id);
        } else {
            setRelationIsLoading(false);
        }
    }, [user, circle, setId, relationDescription, setUpdateRelation]);

    if (user?.id === circle?.id) return null;

    return (
        <Flex
            borderRadius="20px"
            role="group"
            color="black"
            cursor="pointer"
            bg="white"
            boxShadow="md"
            _hover={{
                bg: "#ddd8db",
                color: "black",
            }}
            overflow="hidden"
            position="relative"
            marginLeft="10px"
            marginRight="10px"
            flexGrow="0"
            flexShrink="0"
            flexDirection="column"
            marginTop="1px"
            minHeight="40px"
            align="left"
            justifyContent="center"
            {...props}
        >
            <Flex overflow="hidden">
                <Flex flexDirection="column">
                    <Box marginLeft="5px" marginTop="5px" marginBottom="5px">
                        <CirclePicture circle={relationSet} size={36} disableClick={true} circleBorderColors={["white"]} />
                    </Box>
                    <Box flexGrow="1" />
                    {/* 
                    <Box align="center">
                        <Box alignSelf="flex-end" borderRadius="50%" backgroundColor="#904903" marginBottom="10px" width="28px" height="28px">
                            <TbMessage size="20px" />
                        </Box>
                    </Box> */}
                </Flex>

                <VStack flexGrow="1" align="left" justifyContent="center" spacing="0px" marginLeft="15px" marginRight="15px" marginTop="5px" marginBottom="5px">
                    <HStack>
                        {relationIsLoading ? (
                            <Lottie
                                options={{
                                    loop: true,
                                    autoplay: true,
                                    animationData: talkdotsAnimation,
                                    rendererSettings: {
                                        preserveAspectRatio: "xMidYMid slice",
                                    },
                                }}
                                height={50}
                                width={50}
                            />
                        ) : (
                            <Text fontSize="14px" fontStyle="italic">
                                {relationDescription}
                            </Text>
                        )}
                    </HStack>
                </VStack>
            </Flex>
        </Flex>
    );
};

export const CirclePreview = ({ item, onClick, focusItem, location, inChat, inMap, hideHeader, ...props }) => {
    const [highlightedCircle, setHighlightedCircle] = useAtom(highlightedCircleAtom);

    useEffect(() => {
        if (inMap) return; // do not highlight circles in map
        // if (previewCircle?.id === item?.id) return; // do not highlight previewed circle
        setHighlightedCircle(item);
        return () => {
            setHighlightedCircle(null);
        };
    }, [item, setHighlightedCircle, inMap]);

    if (!item) return null;

    return (
        <Box key={item.id}>
            {!hideHeader && <CircleHeader circle={item} position="absolute" top="-30px" inPreview={true} inChat={inChat} onClickSpace={onClick} />}
            <Flex
                key={item.id}
                align="left"
                borderRadius="13px"
                role="group"
                color="black"
                cursor="pointer"
                bg="white"
                boxShadow="md"
                _hover={{
                    bg: "#ddd8db",
                    color: "black",
                }}
                overflow="hidden"
                position="relative"
                marginLeft="10px"
                marginRight="10px"
                flexGrow="0"
                flexShrink="0"
                flexDirection="column"
                {...props}
            >
                <Flex height="95px" overflow="hidden">
                    <Box
                        width="140px"
                        height="95px"
                        flexShrink="0"
                        flexGrow="0"
                        backgroundColor="#b9b9b9"
                        overflow="hidden"
                        position="relative"
                        borderRadius="0px 13px 13px 0px"
                    >
                        <CircleCover circle={item} coverWidth={140} coverHeight={95} />

                        <CirclePicture circle={item} position="absolute" size={40} top="5px" right="5px" disableClick={true} />

                        <VStack position="absolute" top="5px" left="5px" align="left" spacing="2px">
                            {item?.type === "event" && (
                                <Flex
                                    borderRadius="20px"
                                    height="18px"
                                    backgroundColor="#c28b42"
                                    paddingLeft="2px"
                                    paddingRight="5px"
                                    align="center"
                                    flexDirection="row"
                                    justifyContent="center"
                                    onClick={() => focusItem(item)}
                                >
                                    <Icon width="12px" height="12px" color="white" as={HiClock} cursor="pointer" marginRight="2px" />
                                    <Text fontWeight="700" color="#fff" fontSize="10px">
                                        {getEventTime(item)}
                                    </Text>
                                </Flex>
                            )}

                            {item.distance && (
                                <Flex
                                    borderRadius="20px"
                                    height="18px"
                                    backgroundColor="#c242bb"
                                    paddingLeft="2px"
                                    paddingRight="5px"
                                    align="center"
                                    flexDirection="row"
                                    justifyContent="center"
                                    onClick={() => focusItem(item)}
                                >
                                    <Icon width="12px" height="12px" color="white" as={RiMapPinFill} cursor="pointer" marginRight="2px" />
                                    <Text fontWeight="700" color="#fff" fontSize="10px">
                                        {getDistanceString(item.distance)}
                                    </Text>
                                </Flex>
                            )}
                        </VStack>
                    </Box>

                    <VStack flexGrow="1" align="left" justifyContent="left" spacing="0px" marginLeft="15px" marginRight="15px">
                        {item.type === "event" && (
                            <Text fontSize="14px" fontWeight="700" color={isPastEvent(item) ? "#8d8d8d" : "#cf1a1a"} href={location?.pathname} marginTop="0px">
                                {item.is_all_day ? getDateLong(item.starts_at) : getDateAndTimeLong(item.starts_at)}
                            </Text>
                        )}
                        <HStack marginTop="5px">
                            <Text fontSize="16px" fontWeight="700">
                                {item.name}
                            </Text>
                        </HStack>
                        <Box>
                            <Text fontSize="14px" noOfLines={3}>
                                {item.description}
                            </Text>
                        </Box>
                    </VStack>
                    <Box position="absolute" onClick={onClick} top="0px" left="0px" width="100%" height="100%" />
                    <SimilarityIndicator circle={item} position="absolute" top="2px" right="2px" />
                </Flex>
            </Flex>

            {isActiveInCircle(item) && <ActiveInCircle circle={item} location={location} />}
            <RelationSetInfo circle={item} />
        </Box>
    );
};

export default CirclePreview;
