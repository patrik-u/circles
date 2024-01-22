// #region imports
import React, { useState, useEffect, useRef, useMemo } from "react";
import {
    Box,
    Tooltip,
    IconButton,
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
import useWindowDimensions from "@/components/useWindowDimensions";
import i18n from "@/i18n/Localization";
import db from "@/components/Firebase";
import axios from "axios";
import { getDayAndMonth, datesAreOnSameDay, log, isConnected, getSetId, getImageKitUrl } from "@/components/Helpers";
import { collection, onSnapshot, query, where, orderBy, limit, Timestamp, documentId, doc } from "firebase/firestore";
import { CirclePicture, MetaData, NewSessionButton } from "@/components/CircleElements";
import { HiOutlineEmojiHappy } from "react-icons/hi";
import { IoMdSend } from "react-icons/io";
import { AiOutlineUser } from "react-icons/ai";
import { BsReplyFill, BsFillCircleFill, BsGlobeAmericas } from "react-icons/bs";
import { useNavigate } from "react-router-dom";
import { MdDelete, MdModeEdit, MdOutlineClose } from "react-icons/md";
import { RiChatPrivateLine } from "react-icons/ri";
import { Scrollbars } from "react-custom-scrollbars-2";
import EmojiPicker from "@/components/EmojiPicker";
import { useAtom } from "jotai";
import {
    isMobileAtom,
    userAtom,
    userDataAtom,
    circleAtom,
    chatCircleAtom,
    circlesFilterAtom,
    toggleWidgetEventAtom,
    circlesAtom,
    signInStatusAtom,
    mentionedCirclesAtom,
} from "@/components/Atoms";
import Lottie from "react-lottie";
import talkdotsAnimation from "@/assets/lottie/talkdots.json";
import { AboutButton, CircleLink, CircleRichText } from "@/components/CircleElements";
import ReactMarkdown from "react-markdown";
import Linkify from "linkify-it";
import { CircleMention } from "@/components/CircleSearch";
import { AiChat } from "@/components/AiChat";
import { globalCircle } from "@/components/Circle";
// #endregion

export const LandingPage = () => {
    log("LandingPage.render", -1);
    const [user] = useAtom(userAtom);
    const [signInStatus] = useAtom(signInStatusAtom);
    const [aiChatCircle, setAiChatCircle] = useState(null);

    useEffect(() => {
        log("LandingPage.useEffect 1", -1);

        if (!user?.id || !signInStatus.signedIn) {
            return;
        }

        // initiate AI chat circle
        axios
            .post(`/circles/${globalCircle.chat_circle_ids[0]}/init_set`)
            .then((x) => {
                // log(JSON.stringify(x.data, null, 2), 0, true);

                if (x?.data?.error) return;
                setAiChatCircle(x.data.circle);
            })
            .catch((err) => {
                console.error(err);
            });
    }, [user?.id, signInStatus.signedIn]); // we only want to set chatCircle once when circle id changes hence warning

    return (
        <Flex justifyContent="center" alignItems="center" height="100%" pointerEvents="none">
            {/* <Image src={getImageKitUrl("/splash.jpg")} width="100%" height="100%" position="absolute" top="0px" left="0px" /> */}
            <video
                autoPlay
                muted
                loop
                style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    transform: "translate(-50%, -50%)",
                    zIndex: "-1",
                }}
            >
                <source src={"/earth-video-background3.mp4"} type="video/mp4" />
            </video>
            <AiChat circle={aiChatCircle} />
        </Flex>
    );
};

export default LandingPage;
