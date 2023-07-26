//#region imports
import React, { useState, lazy, useEffect, Suspense } from "react";
import { Box, Flex, Text, Icon, Button, IconButton, Popover, PopoverTrigger, PopoverContent, PopoverArrow } from "@chakra-ui/react";
import { ChevronLeftIcon, ChevronRightIcon } from "@chakra-ui/icons";
import { CirclePicture } from "components/CircleElements";
import i18n from "i18n/Localization";
import { Routes, Route, matchPath } from "react-router-dom";
import { openAboutCircle, routes } from "components/Navigation";
import { Scrollbars } from "react-custom-scrollbars-2";
import { useNavigateNoUpdates, useLocationNoUpdates } from "components/RouterUtils";
import db from "components/Firebase";
import { collection, doc, onSnapshot, query, where } from "firebase/firestore";
import { useAtom } from "jotai";
import { isMobileAtom, circleAtom, toggleAboutAtom } from "components/Atoms";
import { CircleDeleteForm } from "components/settings/CircleDeleteForm";
import { MdOutlineClose } from "react-icons/md";
import { format, startOfWeek, addDays, startOfMonth, endOfMonth, endOfWeek, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";
import { log, fromFsDate, getDateWithoutTime, isConnected } from "components/Helpers";
import { CirclePreview } from "components/CirclePreview";
//#endregion

const CircleCalendar = ({ onClose }) => {
    const navigate = useNavigateNoUpdates();
    const location = useLocationNoUpdates();
    const [isMobile] = useAtom(isMobileAtom);
    const [events, setEvents] = useState([]);
    const [, setToggleAbout] = useAtom(toggleAboutAtom);
    const [circle] = useAtom(circleAtom);
    const iconSize = 12;

    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());

    useEffect(() => {
        let circleId = circle?.id;
        if (!circleId) return;

        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart);
        const endDate = endOfWeek(monthEnd);

        // get all events connected to this circle
        // TODO do we want parent circle events as well? It's probably a good idea)
        // TODO deal with global circle (get all events in the system)
        let everything = circleId === "global";
        if (everything) {
            let q = query(collection(db, "circles"), where("type", "==", "event"), where("starts_at", ">=", startDate), where("starts_at", "<=", endDate));
            let unsubscribeGetCircles = onSnapshot(q, (snap) => {
                let circles = snap.docs.map((doc) => {
                    return { id: doc.id, ...doc.data() };
                });

                // let newEvents = connections
                //     ?.map((x) => x.display_circle)
                //     .filter((x) => {
                //         // remove old events
                //         if (x.type === "event") {
                //             return fromFsDate(x.starts_at) > startDate;
                //         } else {
                //             return true;
                //         }
                //     });
                setEvents(circles);
            });
            return () => {
                if (unsubscribeGetCircles) {
                    unsubscribeGetCircles();
                }
            };
        } else {
            let q = query(
                collection(db, "connections"),
                where("target.id", "==", circleId),
                where("source.type", "==", "event"),
                where("source.starts_at", ">=", startDate),
                where("source.starts_at", "<=", endDate)
            );
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

                let newEvents = connections?.map((x) => x.display_circle);
                setEvents(newEvents);

                // log("events:", 0, true);
                // log(
                //     JSON.stringify(
                //         newEvents?.map((x) => x.name + " " + x.type + " " + x.starts_at),
                //         null,
                //         2
                //     ),
                //     0,
                //     true
                // );
                // log("connections:", 0, true);
                // log(JSON.stringify(circleConnections.length, null, 2), 0, true);
            });
            return () => {
                if (unsubscribeGetCircles) {
                    unsubscribeGetCircles();
                }
            };
        }
    }, [circle?.id, currentMonth]);

    const onDateClick = (day) => {
        //setSelectedDate(day);
    };

    const nextMonth = () => {
        setCurrentMonth(addMonths(currentMonth, 1));
    };

    const prevMonth = () => {
        setCurrentMonth(subMonths(currentMonth, 1));
    };

    const renderHeader = () => {
        const dateFormat = "MMMM yyyy";

        return (
            <Flex justify="space-between">
                <IconButton aria-label="Previous month" icon={<ChevronLeftIcon />} onClick={prevMonth} />
                <Text>{format(currentMonth, dateFormat)}</Text>
                <IconButton aria-label="Next month" icon={<ChevronRightIcon />} onClick={nextMonth} marginRight="40px" />
            </Flex>
        );
    };

    const renderDays = () => {
        const dateFormat = "EEE";
        const days = [];

        let startDate = startOfWeek(currentMonth);

        for (let i = 0; i < 7; i++) {
            days.push(
                <Box w="14%" key={i}>
                    <Text textAlign="center">{format(addDays(startDate, i), dateFormat)}</Text>
                </Box>
            );
        }

        return <Flex justify="space-between">{days}</Flex>;
    };

    const getShortEventTime = (date) => {
        // Check if the minutes are not zero (i.e., it's a half hour or not on the hour)
        const minutes = date.getMinutes();

        // Format date accordingly
        if (minutes === 0) {
            // If it's on the hour, only display the hour
            return format(date, "H");
        } else {
            // If it's not on the hour, display the hour and the minutes
            return format(date, "H:mm");
        }
    };

    const renderCells = () => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart);
        const endDate = endOfWeek(monthEnd);

        const dateFormat = "d";
        const rows = [];

        let days = [];
        let day = startDate;
        let formattedDate = "";

        while (day <= endDate) {
            for (let i = 0; i < 7; i++) {
                formattedDate = format(day, dateFormat);
                const cloneDay = day;
                // gets event for this day
                let dayEvents = events?.filter((x) => {
                    return isSameDay(fromFsDate(x.starts_at), cloneDay);
                });

                days.push(
                    <Flex
                        w="14%"
                        p={1}
                        border="1px"
                        borderColor="gray.200"
                        bg={isSameMonth(day, monthStart) ? (isSameDay(day, selectedDate) ? "blue.200" : "white") : "gray.100"}
                        color={isSameMonth(day, monthStart) ? (isSameDay(day, selectedDate) ? "white" : "black") : "gray.500"}
                        key={day}
                        flexDirection={"column"}
                        // onClick={() => onDateClick(cloneDay)}
                    >
                        <Text textAlign="center">{formattedDate}</Text>
                        {/* render events */}
                        {dayEvents?.map((x) => {
                            return (
                                <Popover trigger="hover" gutter="0" isLazy>
                                    <PopoverTrigger>
                                        <Flex key={x.id} align="center" flexDirection="row" cursor="pointer" onClick={() => openAboutCircle(x, setToggleAbout)} gap="2px">
                                            <CirclePicture size={14} circle={x} />
                                            {!x.is_all_day && <Text fontSize="sm">{getShortEventTime(fromFsDate(x.starts_at))}</Text>}
                                            <Text fontSize="sm" noOfLines={1}>
                                                {x.name}
                                            </Text>
                                        </Flex>
                                    </PopoverTrigger>
                                    <PopoverContent backgroundColor="transparent" borderColor="transparent" width="450px">
                                        <Box zIndex="160">
                                            <PopoverArrow />
                                            <Suspense fallback={<Box />}>
                                                <CirclePreview key={x.id} item={x} hideHeader={true} />
                                            </Suspense>
                                        </Box>
                                    </PopoverContent>
                                </Popover>
                            );
                        })}
                    </Flex>
                );
                day = addDays(day, 1);
            }
            rows.push(
                <Flex key={day} justify="space-between" flexGrow="1">
                    {days}
                </Flex>
            );
            days = [];
        }
        return (
            <Flex flexGrow="1" flexDirection="column">
                {rows}
            </Flex>
        );
    };

    if (!circle) return null;

    return (
        <Box
            bgGradient="linear(to-r,#d3d1d3,#ffffff)"
            borderRadius="10px"
            margin={isMobile ? "0px" : "0px 10px 10px 10px"}
            padding="5px"
            // flexGrow="1"
            pointerEvents="auto"
            position="relative"
            overflow="hidden"
            height={"100%"}
            width="auto"
        >
            <Flex flexGrow="1" height={isMobile ? "auto" : "100%"} position="relative" left="0px" flexDirection={"column"} top="0px">
                {renderHeader()}
                {renderDays()}
                {renderCells()}

                <Flex
                    width={iconSize + 8 + "px"}
                    height={iconSize + 8 + "px"}
                    _hover={{ color: "#e6e6e6", transform: "scale(1.1)" }}
                    _active={{ transform: "scale(0.98)" }}
                    borderRadius="50%"
                    justifyContent="center"
                    alignItems="center"
                    onClick={onClose}
                    cursor="pointer"
                    position="absolute"
                    top="10px"
                    right="10px"
                >
                    <Icon width={iconSize + 8 + "px"} height={iconSize + 8 + "px"} color={"#333"} as={MdOutlineClose} cursor="pointer" />
                </Flex>
            </Flex>
        </Box>
    );
};

export default CircleCalendar;
