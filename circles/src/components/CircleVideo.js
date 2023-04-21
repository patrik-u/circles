//#region imports
import React, { useState, useEffect, useRef, useMemo } from "react";
import {
    Box,
    Textarea,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    Flex,
    HStack,
    VStack,
    Text,
    Spinner,
    Image,
    Icon,
    Link,
    Popover,
    PopoverTrigger,
    PopoverContent,
    Button,
    useDisclosure,
    PopoverArrow,
    useToast,
} from "@chakra-ui/react";
import useWindowDimensions from "components/useWindowDimensions";
import i18n from "i18n/Localization";
import db from "components/Firebase";
import axios from "axios";
import { getDayAndMonth, datesAreOnSameDay, log, isConnected } from "components/Helpers";
import { collection, onSnapshot, query, where, orderBy, limit, Timestamp } from "firebase/firestore";
import { CirclePicture, MetaData } from "components/CircleElements";
import { HiOutlineEmojiHappy } from "react-icons/hi";
import { IoMdSend } from "react-icons/io";
import { BsReplyFill } from "react-icons/bs";
import { useNavigate } from "react-router-dom";
import { MdDelete, MdModeEdit, MdOutlineClose } from "react-icons/md";
import { Scrollbars } from "react-custom-scrollbars-2";
import EmojiPicker from "components/EmojiPicker";
import linkifyHtml from "linkify-html";
import { useAtom } from "jotai";
import { isMobileAtom, userAtom, userDataAtom, circleAtom, chatCircleAtom } from "components/Atoms";
import { JitsiMeeting } from "@jitsi/react-sdk";
//#endregion

export const CircleVideo = () => {
    const [isMobile] = useAtom(isMobileAtom);
    const [user] = useAtom(userAtom);
    const [userData] = useAtom(userDataAtom);
    const [circle] = useAtom(circleAtom);
    const { windowWidth, windowHeight } = useWindowDimensions();

    // top bar + cover image + header
    const getVideoHeight = () => {
        return isMobile ? windowHeight - (40 + 250 + 123) : 900;
    };

    if (!circle) return null;

    return (
        <Flex height={`${getVideoHeight()}px`}>
            <JitsiMeeting
                roomName={circle.id === "global" ? "circles-global-2f5077c8-dd4b-11ed-b5ea-0242ac120002" : `circle-${circle.id}`}
                getIFrameRef={(node) => {
                    node.style.height = "100%";
                    node.style.width = "100%";
                }}
            />
        </Flex>
    );
};

export default CircleVideo;
