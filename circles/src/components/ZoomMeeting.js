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
import {
    isMobileAtom,
    userAtom,
    userDataAtom,
    circleAtom,
    chatCircleAtom,
    jitsiTokenAtom,
    inVideoConferenceAtom,
    toggleWidgetEventAtom,
} from "components/Atoms";
import { JitsiMeeting } from "@jitsi/react-sdk";
import config from "Config";
// import { ZoomMtg } from "@zoomus/websdk";
import ZoomMtgEmbedded from "@zoomus/websdk/embedded";
//#endregion

// ZoomMtg.setZoomJSLib("https://source.zoom.us/2.18.0/lib", "/av");

// ZoomMtg.preLoadWasm();
// ZoomMtg.prepareWebSDK();
// ZoomMtg.i18n.load("en-US");
// ZoomMtg.i18n.reload("en-US");

export const ZoomMeeting = () => {
    const client = ZoomMtgEmbedded.createClient();
    const meetingSDKElementRef = useRef(null);

    const [circle] = useAtom(circleAtom);
    const [user] = useAtom(userAtom);
    const [zoomCredentials, setZoomCredentials] = useState(null);

    // If no user and not logging in then show zoom login screen

    useEffect(() => {
        if (!circle?.id) return;
        if (!user?.id) return;

        log("Fetching zoom credentials", 0, true);

        // get meeting signature from backend
        axios
            .get(`/circles/${circle.id}/zoom-credentials`)
            .then((response) => {
                log("Got Zoom Credentials: " + JSON.stringify(response.data, null, 2), 0, true);
                setZoomCredentials(response.data);
            })
            .catch((err) => {
                console.error(err);
            });
    }, [circle?.id, user?.id]);

    useEffect(() => {
        if (!zoomCredentials) return;

        log("Joining ZoomMeeting: " + JSON.stringify(zoomCredentials, null, 2), 0, true);

        client
            .init({
                zoomAppRoot: meetingSDKElementRef.current,
                language: "en-US",
                isSupportCC: false, // Closed Captioning
                isSupportLiveTranscription: false, // Live Transcription
            })
            .then(() => {
                client
                    .join({
                        signature: zoomCredentials.signature,
                        sdkKey: zoomCredentials.apiKey,
                        meetingNumber: zoomCredentials.meetingNumber,
                        password: zoomCredentials.passWord,
                        userName: zoomCredentials.userName,
                        //userEmail: zoomCredentials.userEmail,
                        //   tk: registrantToken,
                        //   zak: zakToken
                    })
                    .then(() => {
                        console.log("joined succesfully");
                    })
                    .catch((error) => {
                        console.log(error);
                    });
            })
            .catch((error) => {
                console.log(error);
            });

        // ZoomMtg.init({
        //     leaveUrl: window.location.origin,
        //     isSupportAV: true,
        //     success: function () {
        //         ZoomMtg.join({
        //             signature: zoomCredentials.signature,
        //             apiKey: zoomCredentials.apiKey,
        //             meetingNumber: zoomCredentials.meetingNumber,
        //             userName: zoomCredentials.userName,
        //             userEmail: zoomCredentials.userEmail,
        //             success: (success) => {
        //                 console.log(success);
        //             },
        //             error: (error) => {
        //                 console.error(error);
        //             },
        //         });
        //     },
        // });
    }, [zoomCredentials, client]);

    return <Box ref={meetingSDKElementRef} id="zoom-meeting-element" width="100%" height="100%"></Box>;
};

export default ZoomMeeting;
