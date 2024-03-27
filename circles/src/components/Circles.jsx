import React, { useEffect, useState } from "react";
import {
    Box,
    Flex,
    Text,
    Textarea,
    Alert,
    AlertIcon,
    AlertTitle,
    AlertDescription,
    ButtonGroup,
    Button,
    IconButton,
    Modal,
    ModalBody,
    ModalFooter,
    ModalHeader,
    ModalContent,
    ModalOverlay,
    ModalCloseButton,
    Card,
    CardBody,
    Input, // Added Input component for search
} from "@chakra-ui/react";
import i18n from "@/i18n/Localization";
import axios from "axios";
import { log, isConnected, isAdmin } from "@/components/Helpers";
import { openCircle, focusCircle } from "@/components/Navigation";
import { CircleListItem } from "@/components/CircleListItem";
import { useNavigateNoUpdates } from "@/components/RouterUtils";
import { CirclePicture, CircleTags, ConnectButton, CardIf } from "@/components/CircleElements";
import { useAtom } from "jotai";
import {
    userAtom,
    signInStatusAtom,
    circleAtom,
    circlesFilterAtom,
    filteredCirclesAtom,
    userDataAtom,
    isMobileAtom,
    newCirclePopupAtom,
    circleSettingsAtom,
    focusOnMapItemAtom,
} from "@/components/Atoms";
import { IoMdSend } from "react-icons/io";
import { MdOutlineList, MdDns, MdPictureInPicture, MdViewAgenda } from "react-icons/md";
import { TbLayoutRows } from "react-icons/tb";
import { BsCardHeading } from "react-icons/bs";
import Scrollbars from "react-custom-scrollbars-2";
import { ScrollbarsIf } from "./CircleElements";
import { Route, Routes } from "react-router-dom";
//#endregion

const CreateNewCircleForm = ({ type, asCard }) => {
    const [user] = useAtom(userAtom);
    const [userData] = useAtom(userDataAtom);
    const [circle] = useAtom(circleAtom);
    const [showInfoBox, setShowInfoBox] = useState(false);
    const [isMobile] = useAtom(isMobileAtom);
    const [, setNewCirclePopup] = useAtom(newCirclePopupAtom);
    const [message, setMessage] = useState("");

    const handleMessageChange = (e) => {
        setMessage(e.target.value);
    };

    const sendMessage = async () => {
        // open create new circle guide
        setNewCirclePopup({ type, parent_circle: circle, message: message });
        setMessage("");
    };

    const togglePopup = () => {
        setNewCirclePopup({ type, parent_circle: circle });
    };

    const handleMessageKeyDown = async (e) => {
        if (!isMobile && e.keyCode === 13 && !e.shiftKey) {
            e.preventDefault();
            await sendMessage();
        } else {
            return;
        }
    };

    if (!user?.id || (!circle?.is_public && !isAdmin(circle, userData)) || type === "user") return null;

    return (
        <CardIf noCard={!asCard} marginTop="10px">
            <Flex flexDirection="column" padding={asCard ? "0px" : "5px 5px 0px 0px"}>
                <Flex flexDirection="row" height="40px" align="center">
                    <Box
                        margin={asCard ? "0px 10px 0px 0px" : "10px"}
                        minWidth="40px"
                        minHeight="40px"
                        position="relative"
                    >
                        <CirclePicture circle={user} size={40} disableClick={true} />
                    </Box>
                    <Box flexGrow="1" marginRight={isMobile ? "5px" : "2px"}>
                        <Textarea
                            className="messageInput"
                            width="100%"
                            resize="none"
                            maxLength="650"
                            rows="1"
                            borderRadius="40px"
                            placeholder={i18n.t(`Create new ${type}`)}
                            onFocus={() => togglePopup()}
                        />
                    </Box>
                </Flex>
            </Flex>
        </CardIf>
    );
};

export const CircleListViewSettings = ({ type }) => {
    const [circleSettings, setCircleSettings] = useAtom(circleSettingsAtom);
    const [user] = useAtom(userAtom);
    const [circle] = useAtom(circleAtom);

    const updateCircleSettings = (property, value) => {
        if (!circle || !user) return;
        let newSettings = { ...circleSettings };
        if (!newSettings[circle.id]) {
            newSettings[circle.id] = {};
        }
        if (!newSettings[circle.id][type]) {
            newSettings[circle.id][type] = {};
        }
        newSettings[circle.id][type][property] = value;
        setCircleSettings(newSettings);
    };
    const getCircleSettings = (property) => {
        if (!circle || !user) return;
        return circleSettings?.[circle.id]?.[type]?.[property];
    };

    const view = getCircleSettings("view") || "normal";

    return (
        <>
            <Flex borderBottom="1px solid #ebebeb" justifyContent="end" paddingRight="5px" paddingTop="5px">
                <ButtonGroup size="sm" isAttached variant="outline" marginBottom="5px" alignSelf="end">
                    <IconButton
                        width="28px"
                        height="28px"
                        margin="0px"
                        minWidth="24px"
                        padding="0px"
                        aria-label="Compact"
                        backgroundColor={view === "compact" ? "white" : "#ededed"}
                        icon={<MdOutlineList size={18} />}
                        onClick={() => {
                            updateCircleSettings("view", "compact");
                        }}
                    />
                    <IconButton
                        width="28px"
                        height="28px"
                        margin="0px"
                        minWidth="24px"
                        padding="0px"
                        aria-label="Normal"
                        backgroundColor={view === "normal" ? "white" : "#ededed"}
                        icon={<MdViewAgenda size={18} />}
                        onClick={() => {
                            updateCircleSettings("view", "normal");
                        }}
                    />
                </ButtonGroup>
            </Flex>
        </>
    );
};

export const Circles = ({ type, types, categories, noScrollbars, asCards, sortBy = null }) => {
    const [user] = useAtom(userAtom);
    const [circle] = useAtom(circleAtom);
    const [circlesFilter, setCirclesFilter] = useAtom(circlesFilterAtom);
    const [filteredCircles] = useAtom(filteredCirclesAtom);
    const [signInStatus] = useAtom(signInStatusAtom);
    const [, setFocusOnMapItem] = useAtom(focusOnMapItemAtom);
    const useCompactList = type !== "post" && type !== "event";
    const [searchQuery, setSearchQuery] = useState(""); // State for search query

    const navigate = useNavigateNoUpdates();

    useEffect(() => {
        log("Circles.useEffect 1", -1);

        // check if filter needs to update
        if (
            circlesFilter?.sortBy !== sortBy ||
            circlesFilter?.types?.join(",") !== types.join(",") ||
            circlesFilter?.categories?.join(",") !== categories.join(",")
        ) {
            setCirclesFilter((currentFilter) => {
                return { ...currentFilter, types: types, categories: categories, sortBy: sortBy };
            });
        }
    }, [setCirclesFilter, types]);

    useEffect(() => {
        log("Circles.useEffect 3", -1);
        if (!signInStatus.signedIn) return;
        let circleId = circle?.id;
        if (!user?.id || !circleId) return;

        // mark circles as seen
        axios
            .post(`/seen`, {
                category: `${type}s`,
                circleId: circleId,
            })
            .then((x) => {})
            .catch((error) => {});
    }, [user?.id, circle?.id, type, signInStatus]);

    // Filter circles based on search query
    const filteredCirclesList = filteredCircles
        ?.filter((x) => x.type === type)
        ?.filter((item) => !searchQuery || (item.name && item.name.toLowerCase().includes(searchQuery.toLowerCase())));

    return (
        <Flex
            flexGrow={noScrollbars ? "0" : "1"}
            width="100%"
            height={noScrollbars ? "auto" : "100%"}
            flexDirection={"column"}
            maxWidth="600px"
            backgroundColor={asCards ? "#ededed" : "transparent"}
            position="relative"
        >
            {type !== "post" && (
                <Input
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    marginTop="10px"
                    backgroundColor="white"
                />
            )}
            <CreateNewCircleForm type={type} asCard={asCards} />
            <Flex flexGrow="1" flexDirection={"column"} marginTop={asCards ? "10px" : "0px"}>
                <ScrollbarsIf noScrollbars={noScrollbars}>
                    {filteredCirclesList?.map((item) => (
                        <CircleListItem
                            key={item.id}
                            item={item}
                            onClick={() => {
                                openCircle(navigate, item);
                                focusCircle(item, setFocusOnMapItem);
                            }}
                            asCard={asCards}
                            isCompact={useCompactList}
                        />
                    ))}
                </ScrollbarsIf>
            </Flex>
        </Flex>
    );
};

export default Circles;
