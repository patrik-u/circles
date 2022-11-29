//#region imports
import React from "react";
import { Box, Flex, HStack, VStack, Text, Icon } from "@chakra-ui/react";
import { getDistanceString, getDateAndTimeLong, getDateLong, singleLineEllipsisStyle, isPastEvent, getEventTime } from "../../components/old_Helpers";
import { CirclePicture, CircleTags, ConnectButton } from "../../components/CircleElements";
import { HiClock } from "react-icons/hi";
import { RiMapPinFill } from "react-icons/ri";
//#endregion

export const CircleListItem = ({ item, setCircle, onClick, focusItem, navigate, location, onConnect, inSelect, ...props }) => {
    return (
        <Flex
            key={item.id}
            align="left"
            role="group"
            color="black"
            cursor="pointer"
            borderBottom="1px solid #ebebeb"
            bg={inSelect ? "transparent" : "white"}
            _hover={
                inSelect
                    ? {}
                    : {
                          bg: "#ddd8db",
                          color: "black",
                      }
            }
            overflow="hidden"
            position="relative"
            flexDirection="row"
            flexGrow="0"
            flexShrink="0"
            paddingBottom="10px"
            maxHeight="84px"
            onClick={onClick}
            {...props}
        >
            <Box margin="10px" minWidth="60px" minHeight="60px" position="relative">
                <CirclePicture circle={item} size={60} />
            </Box>

            <VStack
                flexGrow="1"
                align="left"
                justifyContent="left"
                spacing="0px"
                marginLeft="5px"
                marginRight="15px"
                marginTop={item.type === "event" ? "0px" : "10px"}
            >
                {item.type === "event" && (
                    <Text
                        textAlign="left"
                        fontSize="12px"
                        fontWeight="700"
                        color={isPastEvent(item) ? "#8d8d8d" : "#cf1a1a"}
                        href={location?.pathname}
                        marginTop="0px"
                    >
                        {item.is_all_day ? getDateLong(item.starts_at) : getDateAndTimeLong(item.starts_at)}
                    </Text>
                )}
                <HStack>
                    <Text
                        fontSize="16px"
                        fontWeight="700"
                        textAlign="left"
                        lineHeight={item.type === "event" ? "17px" : "inherit"}
                        marginTop={item.type === "event" ? "2px" : "0px"}
                        style={singleLineEllipsisStyle}
                    >
                        {item.name}
                    </Text>
                </HStack>

                <Box>
                    <Text fontSize="14px" textAlign="left" style={singleLineEllipsisStyle}>
                        {item.description}
                    </Text>
                </Box>
                <Box paddingTop={item.type === "event" ? "0px" : "4px"}>
                    <CircleTags circle={item} setCircle={setCircle} size="tiny" inSelect={inSelect} />
                </Box>
                {/* <Box>
                <LatestMembers item={item} circleId={item.id} size={16} hasPopover={true} marginTop="6px" spacing="4px" />
            </Box> */}
            </VStack>

            {!inSelect && <ConnectButton circle={item} onConnect={onConnect} position="absolute" bottom="5px" right="10px" />}

            <VStack position="absolute" top="0px" right="7px" align="left" spacing="2px">
                {item.type === "event" && (
                    <Flex
                        borderRadius="20px"
                        height="18px"
                        backgroundColor="white"
                        paddingLeft="2px"
                        paddingRight="5px"
                        align="center"
                        flexDirection="row"
                        justifyContent="center"
                        onClick={(event) => {
                            if (inSelect) return;

                            event.stopPropagation();
                            focusItem(item);
                        }}
                    >
                        <Icon width="14px" height="14px" color="#929292" as={HiClock} cursor="pointer" marginRight="2px" />
                        <Text fontWeight="700" color="#929292" fontSize="12px">
                            {getEventTime(item)}
                        </Text>
                    </Flex>
                )}

                {item.distance && (
                    <Flex
                        borderRadius="20px"
                        height="18px"
                        //backgroundColor="#c242bb"
                        backgroundColor="white"
                        paddingLeft="2px"
                        paddingRight="5px"
                        align="center"
                        flexDirection="row"
                        justifyContent="center"
                        onClick={(event) => {
                            if (inSelect) return;

                            event.stopPropagation();
                            focusItem(item);
                        }}
                    >
                        <Icon width="14px" height="14px" color="#929292" as={RiMapPinFill} cursor="pointer" marginRight="2px" />
                        <Text fontWeight="700" color="#929292" fontSize="12px">
                            {getDistanceString(item.distance)}
                        </Text>
                    </Flex>
                )}
            </VStack>
        </Flex>
    );
};

export default CircleListItem;
