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
import useWindowDimensions from "@/components/useWindowDimensions";
import i18n from "@/i18n/Localization";
import db from "@/components/Firebase";
import axios from "axios";
import { getDayAndMonth, datesAreOnSameDay, log, isConnected } from "@/components/Helpers";
import { collection, onSnapshot, query, where, orderBy, limit, Timestamp } from "firebase/firestore";
import { CirclePicture, MetaData } from "@/components/CircleElements";
import { HiOutlineEmojiHappy } from "react-icons/hi";
import { IoMdSend } from "react-icons/io";
import { BsReplyFill } from "react-icons/bs";
import { useNavigate } from "react-router-dom";
import { MdDelete, MdModeEdit, MdOutlineClose } from "react-icons/md";
import { Scrollbars } from "react-custom-scrollbars-2";
import EmojiPicker from "@/components/EmojiPicker";
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
} from "@/components/Atoms";
import { JitsiMeeting } from "@jitsi/react-sdk";
import config from "@/Config";
import { ZoomMeeting } from "@/components/ZoomMeeting";
//#endregion

export const CircleVideo = ({ isMinimized, width, height }) => {
    const [isMobile] = useAtom(isMobileAtom);
    const [user] = useAtom(userAtom);
    const [userData] = useAtom(userDataAtom);
    const [circle] = useAtom(circleAtom);
    const [jitsiToken] = useAtom(jitsiTokenAtom);
    const { windowWidth, windowHeight } = useWindowDimensions();
    const [roomName, setRoomName] = useState("");
    const [inVideoConference, setInVideoConference] = useAtom(inVideoConferenceAtom);
    const [, setToggleWidgetEvent] = useAtom(toggleWidgetEventAtom);

    useEffect(() => {
        if (!inVideoConference && circle?.id) {
            let roomId =
                circle.id === "global" ? "Global 2f5077c8dd4b11edb5ea0242ac120002" : `${circle.name} ${circle.id}`;
            roomId = roomId.replace(/[^a-z0-9åäö\s]/gi, ""); // remove non-alphanumeric characters
            setRoomName(roomId);
        }
    }, [circle?.id, circle?.name, inVideoConference]);

    const handleOnApiReady = (externalApi) => {
        // here you can attach custom event listeners to the Jitsi Meet External API
        log("On api ready!", 1, true);

        // called when local user joins video conference
        externalApi.addListener("videoConferenceJoined", (event) => {
            log("On joined! " + event.id, 1, true);
            setInVideoConference(circle?.id);

            // update user jitsiId in db
            axios
                .put(`/circles/${user.id}`, {
                    circleData: {
                        jitsi_id: event.id,
                    },
                })
                .catch((err) => {
                    console.error(err);
                });
        });

        // called when local user leaves video conference
        externalApi.addListener("videoConferenceLeft", (event) => {
            log("On leave! " + event.id, 1, true);
            setInVideoConference(false);
            setToggleWidgetEvent({ name: "video", value: false });
        });

        // called when dominant speaker changes
        externalApi.addListener("dominantSpeakerChanged", (event) => {
            log("On dominantSpeakerChanged! " + event.id, 1, true);
        });

        // vlean up event listeners when component is unmounted
        return () => {
            externalApi.removeListener("videoConferenceJoined");
            externalApi.removeListener("videoConferenceLeft");
        };
    };

    // log("roomName: " + roomName + ", jitsiToken: " + jitsiToken, 0, true);

    if (!circle || !roomName || !jitsiToken || !user?.id) return null;

    return (
        <Flex
            width={isMinimized ? "300px" : "100%"}
            height={isMinimized ? "300px" : "100%"}
            marginTop={isMinimized ? "auto" : "0px"}
            pointerEvents="auto"
            marginLeft={isMinimized ? "auto" : "0px"}
        >
            {circle.use_zoom ? (
                <ZoomMeeting />
            ) : (
                <JitsiMeeting
                    domain={"jitsi.codo.earth"}
                    appId={"codo"}
                    roomName={roomName}
                    jwt={jitsiToken}
                    // configOverwrite={{
                    //     startWithAudioMuted: true,
                    //     startScreenSharing: false,
                    //     enableEmailInStats: false,
                    //     logging: {
                    //         defaultLogLevel: "error",
                    //     },
                    // }}
                    // interfaceConfigOverwrite={{
                    //     SHOW_CHROME_EXTENSION_BANNER: false,
                    //     DISPLAY_WELCOME_PAGE_CONTENT: false,
                    //     SHOW_JITSI_WATERMARK: false,
                    //     SHOW_BRAND_WATERMARK: false,
                    //     SHOW_WATERMARK_FOR_GUESTS: false,
                    //     // TOOLBAR_BUTTONS: [
                    //     //     "microphone",
                    //     //     "camera",
                    //     //     "closedcaptions",
                    //     //     "desktop",
                    //     //     "fullscreen",
                    //     //     "recording",
                    //     //     "sharedvideo",
                    //     //     "settings",
                    //     //     "raisehand",
                    //     //     "filmstrip",
                    //     //     "invite",
                    //     //     "stats",
                    //     //     "shortcuts",
                    //     //     "tileview",
                    //     //     "hangup",
                    //     //     "participants-pane",
                    //     // ],
                    // }}
                    userInfo={{
                        displayName: user?.name,
                    }}
                    getIFrameRef={(node) => {
                        node.style.height = "100%";
                        node.style.width = "100%";
                    }}
                    onApiReady={handleOnApiReady}
                />
            )}
        </Flex>
    );
};

export default CircleVideo;
