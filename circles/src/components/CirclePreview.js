//#region imports
import React from "react";
import { Box, Flex, HStack, VStack, Text, Icon, Button } from "@chakra-ui/react";
import { getDistanceString, getDateAndTimeLong, getDateLong, getEventTime, isPastEvent, isActiveInCircle, isActiveInVideoConference } from "components/Helpers";
import { previewCircle, openCircle } from "components/Navigation";
import { CirclePicture, CircleCover } from "components/CircleElements";
import { HiClock } from "react-icons/hi";
import { RiMapPinFill, RiLiveFill } from "react-icons/ri";
import { useAtom } from "jotai";
import { toggleAboutAtom, inVideoConferenceAtom, toggleWidgetEventAtom } from "components/Atoms";
import { useNavigateNoUpdates } from "./RouterUtils";
//#endregion

export const CirclePreview = ({ item, onClick, focusItem, location, ...props }) => {
    const [, setToggleAbout] = useAtom(toggleAboutAtom);
    const [inVideoConference] = useAtom(inVideoConferenceAtom);
    const [toggleWidgetEvent, setToggleWidgetEvent] = useAtom(toggleWidgetEventAtom);
    const navigate = useNavigateNoUpdates();

    if (!item) return null;

    return (
        <Box key={item.id}>
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
                        <CircleCover type={item?.type} cover={item?.cover} metaData={item?.meta_data} coverWidth={140} coverHeight={95} />

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
                </Flex>
            </Flex>

            {isActiveInCircle(item) && (
                <Flex
                    align="left"
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
                >
                    <Flex overflow="hidden">
                        <CirclePicture circle={item.activity.active_in_circle} size={40} disableClick={true} />

                        <VStack flexGrow="1" align="left" justifyContent="center" spacing="0px" marginLeft="15px" marginRight="15px">
                            {item.activity.active_in_circle.type === "event" && (
                                <Text
                                    fontSize="14px"
                                    fontWeight="700"
                                    color={isPastEvent(item) ? "#8d8d8d" : "#cf1a1a"}
                                    href={location?.pathname}
                                    marginTop="0px"
                                >
                                    {item.activity.active_in_circle.is_all_day
                                        ? getDateLong(item.activity.active_in_circle.starts_at)
                                        : getDateAndTimeLong(item.activity.active_in_circle.starts_at)}
                                </Text>
                            )}
                            <HStack>
                                <Text fontSize="16px" fontWeight="700">
                                    {item.activity.active_in_circle.name}
                                </Text>
                            </HStack>
                            {/* <Box>
                                <Text fontSize="14px" noOfLines={3}>
                                    {item.description}
                                </Text>
                            </Box> */}
                        </VStack>
                        {/* if video conference in progress show button to join */}
                        <Box
                            position="absolute"
                            onClick={() => previewCircle(item.activity.active_in_circle, setToggleAbout)}
                            top="0px"
                            left="0px"
                            width="100%"
                            height="100%"
                        />

                        {isActiveInVideoConference(item) && !inVideoConference && (
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
                                    openCircle(navigate, item.activity.active_in_circle);
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
            )}
        </Box>
    );
};

export default CirclePreview;
