//#region imports
import React from "react";
import { Box, Flex, HStack, VStack, Text, Icon } from "@chakra-ui/react";
import { getDistanceString, getDateAndTimeLong, getDateLong, getEventTime, isPastEvent } from "components/Helpers";
import { CirclePicture, CircleCover } from "components/CircleElements";
import { HiClock } from "react-icons/hi";
import { RiMapPinFill } from "react-icons/ri";
//#endregion

export const CirclePreview = ({ item, onClick, focusItem, navigate, location, ...props }) => {
    if (!item) return null;

    return (
        <Flex
            key={item.id}
            height="95px"
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
            flexDirection="row"
            flexGrow="0"
            flexShrink="0"
            {...props}
        >
            <Box width="140px" height="95px" flexShrink="0" flexGrow="0" backgroundColor="#b9b9b9" overflow="hidden" position="relative" borderRadius="13px">
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
                    <Text fontSize="14px">{item.description}</Text>
                </Box>
            </VStack>

            <Box position="absolute" onClick={onClick} top="0px" left="0px" width="100%" height="100%" />
        </Flex>
    );
};

export default CirclePreview;
