//#region imports
import React, { useState, lazy, useEffect, Suspense, useMemo } from "react";
import {
    Box,
    ButtonGroup,
    Flex,
    Text,
    Icon,
    Button,
    IconButton,
    Popover,
    PopoverTrigger,
    PopoverContent,
    PopoverArrow,
    HStack,
} from "@chakra-ui/react";
import { ChevronLeftIcon, ChevronRightIcon } from "@chakra-ui/icons";
import { CirclePicture } from "@/components/CircleElements";
import i18n from "@/i18n/Localization";
import { Routes, Route, matchPath } from "react-router-dom";
import { openAboutCircle, routes } from "@/components/Navigation";
import { Scrollbars } from "react-custom-scrollbars-2";
import { useNavigateNoUpdates, useLocationNoUpdates } from "@/components/RouterUtils";
import db from "@/components/Firebase";
import { collection, doc, onSnapshot, query, where } from "firebase/firestore";
import { useAtom } from "jotai";
import { isMobileAtom, circleAtom, toggleAboutAtom } from "@/components/Atoms";
import { CircleDeleteForm } from "@/components/settings/CircleDeleteForm";
import { MdOutlineClose } from "react-icons/md";
import {
    format,
    startOfWeek,
    addDays,
    startOfMonth,
    endOfMonth,
    endOfWeek,
    isSameMonth,
    addWeeks,
    subDays,
    subWeeks,
    isSameDay,
    addMonths,
    subMonths,
} from "date-fns";
import { log, fromFsDate, getDateWithoutTime, isConnected } from "@/components/Helpers";
import { CirclePreview } from "@/components/CirclePreview";
//#endregion

const EventHeader = ({ event }) => {
    const [, setToggleAbout] = useAtom(toggleAboutAtom);

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

    return (
        <Popover trigger="hover" gutter="0" isLazy>
            <PopoverTrigger>
                <Flex
                    key={event.id}
                    align="center"
                    flexDirection="row"
                    cursor="pointer"
                    onClick={() => openAboutCircle(event, setToggleAbout)}
                    gap="2px"
                >
                    <CirclePicture size={14} circle={event} />
                    {!event.is_all_day && <Text fontSize="sm">{getShortEventTime(fromFsDate(event.starts_at))}</Text>}
                    <Text fontSize="sm" noOfLines={1}>
                        {event.name}
                    </Text>
                </Flex>
            </PopoverTrigger>
            <PopoverContent backgroundColor="transparent" borderColor="transparent" width="450px">
                <Box zIndex="160">
                    <PopoverArrow />
                    <Suspense fallback={<Box />}>
                        <CirclePreview
                            key={event.id}
                            item={event}
                            hideHeader={true}
                            onClick={() => openAboutCircle(event, setToggleAbout)}
                        />
                    </Suspense>
                </Box>
            </PopoverContent>
        </Popover>
    );
};

const MonthCalendar = ({ currentDate, events }) => {
    const [isMobile] = useAtom(isMobileAtom);

    const [circle] = useAtom(circleAtom);

    const [selectedDate, setSelectedDate] = useState(new Date());

    const renderDays = () => {
        const dateFormat = "EEE";
        const days = [];

        let startDate = startOfWeek(currentDate);

        for (let i = 0; i < 7; i++) {
            days.push(
                <Box w="14%" key={i}>
                    <Text textAlign="center">{format(addDays(startDate, i), dateFormat)}</Text>
                </Box>
            );
        }

        return <Flex justify="space-between">{days}</Flex>;
    };

    const renderCells = () => {
        const monthStart = startOfMonth(currentDate);
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
                        bg={
                            isSameMonth(day, monthStart)
                                ? isSameDay(day, selectedDate)
                                    ? "blue.200"
                                    : "white"
                                : "gray.100"
                        }
                        color={
                            isSameMonth(day, monthStart)
                                ? isSameDay(day, selectedDate)
                                    ? "white"
                                    : "black"
                                : "gray.500"
                        }
                        key={day}
                        flexDirection={"column"}
                        // onClick={() => onDateClick(cloneDay)}
                    >
                        <Text textAlign="center">{formattedDate}</Text>
                        {/* render events */}
                        {dayEvents?.map((x) => {
                            return <EventHeader event={x} />;
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
        <>
            {renderDays()}
            {renderCells()}
        </>
    );
};

const WeekCalendar = ({ currentDate, events }) => {
    // Get the start of the week based on the current date
    const weekStart = startOfWeek(currentDate);
    const daysOfWeek = Array.from({ length: 7 }, (_, i) => i); // 7 days in a week

    // Helper function to get events for a specific day and hour
    const getEventsForTime = (day, hour) => {
        const currentDay = addDays(weekStart, day);
        return events?.filter((event) => {
            const eventDate = fromFsDate(event.starts_at);
            if (isSameDay(eventDate, currentDay)) {
                if (event.is_all_day) {
                    return hour === 0;
                } else {
                    return eventDate.getHours() === hour;
                }
            }
            return false;
        });
    };

    const renderHours = () => {
        const hours = [];

        for (let i = 0; i < 24; i++) {
            hours.push(
                <Box w="40px" key={i} minHeight="60px" mr="1">
                    <Text textAlign="center">{i < 10 ? `0${i}:00` : `${i}:00`}</Text>
                </Box>
            );
        }

        return <Flex direction="column">{hours}</Flex>;
    };

    const renderCells = () => {
        const cells = [];
        let dayEvents;

        for (let hour = 0; hour < 24; hour++) {
            for (let day = 0; day < 7; day++) {
                dayEvents = getEventsForTime(day, hour);
                cells.push(
                    <Box
                        w="14%"
                        p={1}
                        border="1px"
                        borderColor="gray.200"
                        key={day + "-" + hour}
                        overflowY="auto"
                        height="60px"
                        backgroundColor="white"
                    >
                        {dayEvents?.map((event) => (
                            <EventHeader event={event} />
                        ))}
                    </Box>
                );
            }
        }
        return (
            <Flex direction="row" flexWrap="wrap">
                {cells}
            </Flex>
        );
    };

    const renderDayHeaders = () => {
        return (
            <Flex direction="row" justifyContent="space-between">
                <Box w="40px"></Box>
                {daysOfWeek.map((day) => (
                    <Flex key={day} direction="column" alignItems="center" width="14%">
                        <Text fontSize="sm">{format(addDays(weekStart, day), "eee")}</Text>
                        <Text fontSize="lg">{format(addDays(weekStart, day), "d")}</Text>
                    </Flex>
                ))}
            </Flex>
        );
    };

    return (
        <>
            {renderDayHeaders()}
            <Scrollbars>
                <Flex direction="row" width="100%" height="100%" marginTop="5px">
                    {renderHours()}
                    {renderCells()}
                </Flex>
            </Scrollbars>
        </>
    );
};

// const WeekCalendar = ({ currentDate, events }) => {
//     const daysOfWeek = Array.from({ length: 7 }, (_, i) => i); // 7 days in a week
//     const hoursInDay = Array.from({ length: 24 }, (_, i) => i); // 24 hours in a day

//     // Get the start of the week based on the current date
//     const weekStart = startOfWeek(currentDate);

//     // Helper function to get events for a specific day and hour
//     const getEventsForTime = (day, hour) => {
//         const currentDay = addDays(weekStart, day);
//         return events?.filter((event) => {
//             const eventDate = fromFsDate(event.starts_at);
//             if (isSameDay(eventDate, currentDay)) {
//                 if (event.is_all_day) {
//                     return hour === 0;
//                 } else {
//                     return eventDate.getHours() === hour;
//                 }
//             }
//             return false;
//         });
//     };

//     return (
//         <Flex direction="column" width="100%" height="100%" marginTop="5px">
//             <Flex direction="row" justifyContent="space-between">
//                 {daysOfWeek.map((day) => (
//                     <Flex key={day} direction="column" alignItems="center" width="100%">
//                         <Text fontSize="sm">{format(addDays(weekStart, day), "eee")}</Text>
//                         <Text fontSize="lg">{format(addDays(weekStart, day), "d")}</Text>
//                     </Flex>
//                 ))}
//             </Flex>

//             <Scrollbars>
//                 <Flex direction="row" backgroundColor={"white"}>
//                     <Box width="40px">
//                         {hoursInDay.map((hour) => (
//                             <Text key={hour}>{hour < 10 ? `0${hour}:00` : `${hour}:00`}</Text>
//                         ))}
//                     </Box>

//                     {daysOfWeek.map((day) => (
//                         <Flex key={day} direction="column" width="100%">
//                             {hoursInDay.map((hour) => (
//                                 <Box key={hour}>
//                                     {getEventsForTime(day, hour).map((event) => (
//                                         <Box margin={1} padding={1} boxShadow="base">
//                                             <EventHeader event={event} />
//                                         </Box>
//                                     ))}
//                                 </Box>
//                             ))}
//                         </Flex>
//                     ))}
//                 </Flex>
//             </Scrollbars>
//         </Flex>
//     );
// };

const DayCalendar = ({ currentDate, events }) => {
    const hoursInDay = Array.from({ length: 24 }, (_, i) => i);

    // gets event for this day
    const dayEvents = events?.filter((x) => {
        return isSameDay(fromFsDate(x.starts_at), currentDate);
    });

    useEffect(() => {
        log(JSON.stringify(dayEvents?.length, null, 2), 0, true);
    }, [dayEvents]);

    // Helper function to check if the event falls within the given hour
    const isEventInHour = (event, hour) => {
        if (event.is_all_day) {
            return hour === 0;
        }
        const eventStartHour = fromFsDate(event.starts_at).getHours();
        return eventStartHour === hour;
    };

    return (
        <Flex direction="column" width="100%" height="100%" marginTop="5px">
            <Scrollbars>
                {hoursInDay.map((hour) => (
                    <Flex key={hour} direction="row" backgroundColor={"white"} height="40px">
                        <Text>{hour < 10 ? `0${hour}:00` : `${hour}:00`}</Text>
                        {dayEvents.map((event) => {
                            if (isEventInHour(event, hour)) {
                                return (
                                    <Box margin={1} padding={1} boxShadow="base">
                                        <EventHeader event={event} />
                                    </Box>
                                );
                            } else {
                                return null;
                            }
                        })}
                    </Flex>
                ))}
            </Scrollbars>
        </Flex>
    );
};

const CircleCalendar = ({ onClose }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [view, setView] = useState("month"); // default view
    const [isMobile] = useAtom(isMobileAtom);
    const [circle] = useAtom(circleAtom);
    const [events, setEvents] = useState([]);
    const monthStart = useMemo(() => startOfMonth(currentDate), [currentDate]);

    useEffect(() => {
        let circleId = circle?.id;
        if (!circleId) return;

        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart);
        const endDate = endOfWeek(monthEnd);

        // get all events connected to this circle
        // TODO do we want parent circle events as well? It's probably a good idea)
        // TODO deal with global circle (get all events in the system)
        let everything = circleId === "global";
        if (everything) {
            let q = query(
                collection(db, "circles"),
                where("type", "==", "event"),
                where("starts_at", ">=", startDate),
                where("starts_at", "<=", endDate)
            );
            let unsubscribeGetCircles = onSnapshot(q, (snap) => {
                let circles = snap.docs.map((doc) => {
                    return { id: doc.id, ...doc.data() };
                });
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
                if (circle.type === "event") {
                    // add this event to the list
                    newEvents.unshift(circle);
                }

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
    }, [circle?.id, monthStart, circle]);

    const nextPeriod = () => {
        switch (view) {
            case "day":
                setCurrentDate(addDays(currentDate, 1));
                break;
            case "week":
                setCurrentDate(addWeeks(currentDate, 1));
                break;
            case "month":
            default:
                setCurrentDate(addMonths(currentDate, 1));
                break;
        }
    };

    const prevPeriod = () => {
        switch (view) {
            case "day":
                setCurrentDate(subDays(currentDate, 1));
                break;
            case "week":
                setCurrentDate(subWeeks(currentDate, 1));
                break;
            case "month":
            default:
                setCurrentDate(subMonths(currentDate, 1));
                break;
        }
    };

    const getPeriodLabel = () => {
        switch (view) {
            case "day":
                return format(currentDate, "d MMMM yyyy");
            case "week":
                return `Week of ${format(currentDate, "d MMMM yyyy")}`;
            case "month":
            default:
                return format(currentDate, "MMMM yyyy");
        }
    };

    const handleViewChange = (value) => {
        setView(value);
    };

    const renderHeader = () => {
        return (
            <>
                <Flex justify="space-between" position="relative">
                    <IconButton aria-label={`Previous ${view}`} icon={<ChevronLeftIcon />} onClick={prevPeriod} />
                    {/* {!isMobile && (
                        <ButtonGroup isAttached variant="outline" position="absolute" left="50px">
                            <Button isActive={view === "month"} onClick={() => handleViewChange("month")}>
                                Month
                            </Button>
                            <Button isActive={view === "week"} onClick={() => handleViewChange("week")}>
                                Week
                            </Button>
                            <Button isActive={view === "day"} onClick={() => handleViewChange("day")}>
                                Day
                            </Button>
                        </ButtonGroup>
                    )} */}
                    <HStack>
                        <CirclePicture size={20} circle={circle} />
                        <Text>{circle?.name} - </Text>
                        <Text>{getPeriodLabel()}</Text>
                    </HStack>
                    <IconButton
                        aria-label={`Next ${view}`}
                        icon={<ChevronRightIcon />}
                        onClick={nextPeriod}
                        marginRight="40px"
                    />
                </Flex>
                <ButtonGroup isAttached variant="outline" marginTop="5px">
                    <Button isActive={view === "month"} onClick={() => handleViewChange("month")} height="30px">
                        Month
                    </Button>
                    <Button isActive={view === "week"} onClick={() => handleViewChange("week")} height="30px">
                        Week
                    </Button>
                    <Button isActive={view === "day"} onClick={() => handleViewChange("day")} height="30px">
                        Day
                    </Button>
                </ButtonGroup>
            </>
        );
    };

    const iconSize = 12;

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
                <Flex
                    flexGrow="1"
                    height={isMobile ? "100%" : "100%"}
                    position="relative"
                    left="0px"
                    flexDirection={"column"}
                    top="0px"
                >
                    {renderHeader()}
                    {view === "month" && <MonthCalendar currentDate={currentDate} events={events} />}
                    {view === "week" && <WeekCalendar currentDate={currentDate} events={events} />}
                    {view === "day" && <DayCalendar currentDate={currentDate} events={events} />}

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
                        <Icon
                            width={iconSize + 8 + "px"}
                            height={iconSize + 8 + "px"}
                            color={"#333"}
                            as={MdOutlineClose}
                            cursor="pointer"
                        />
                    </Flex>
                </Flex>
            </Box>
        </Box>
    );
};

export default CircleCalendar;
