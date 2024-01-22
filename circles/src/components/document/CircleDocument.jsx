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
import DocumentEditor from "@/components/document/DocumentEditor";
import { $convertFromMarkdownString, $convertToMarkdownString, TRANSFORMERS } from "@lexical/markdown";
//#endregion

const CircleDocument = ({ onClose }) => {
    const [isMobile] = useAtom(isMobileAtom);
    const [circle, setCircle] = useAtom(circleAtom);
    const iconSize = 12;

    if (!circle) return;

    return (
        <Box
            //bgGradient="linear(to-r,#d3d1d3,#ffffff)"
            backgroundColor="white"
            borderRadius="10px"
            margin={isMobile ? "0px" : "0px 10px 10px 10px"}
            // flexGrow="1"
            pointerEvents="auto"
            position="relative"
            overflow="hidden"
            height={"100%"}
            width="auto"
        >
            <Box
                borderRadius="10px"
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
                    <DocumentEditor initialDocument={circle} document={circle} setDocument={setCircle} />

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

export default CircleDocument;
