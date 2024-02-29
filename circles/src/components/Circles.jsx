//#region imports
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
} from "@chakra-ui/react";
import i18n from "@/i18n/Localization";
import axios from "axios";
import { log, isConnected, isAdmin } from "@/components/Helpers";
import { openCircle, focusCircle } from "@/components/Navigation";
import { CircleListItem, CircleListItemNormal } from "@/components/CircleListItem";
import { useNavigateNoUpdates } from "@/components/RouterUtils";
import { CirclePicture, CircleTags, ConnectButton } from "@/components/CircleElements";
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
//#endregion

const CreateNewCircleForm = ({ type }) => {
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
        <Flex flexDirection="column" paddingRight="5px" paddingTop="5px">
            <Flex flexDirection="row" height="40px" align="center">
                <Box margin="10px" minWidth="40px" minHeight="40px" position="relative">
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
            {/* {showInfoBox && (
                <Alert status="info" marginBottom="10px" variant="subtle" alignItems="center" justifyContent="start" textAlign="start">
                    <AlertIcon />
                    <Box>
                        <AlertTitle>AI-assisted creating</AlertTitle>
                        <AlertDescription>
                            Type an instruction above to create a new post. You can type any content you want to create a post with and/or you can give specific
                            instructions, for example:
                            <br />- <i>Post an inspirational quote from Rumi</i>
                            <br />- <i>Write a call to action to join the circle</i>
                            <br />
                            Or just press enter to create a post manually.
                        </AlertDescription>
                    </Box>
                </Alert>
            )} */}
        </Flex>
    );
};

export const Circles = ({ type, types, categories, noScrollbars, sortBy = null }) => {
    const [user] = useAtom(userAtom);
    const [circle] = useAtom(circleAtom);
    const [circlesFilter, setCirclesFilter] = useAtom(circlesFilterAtom);
    const [filteredCircles] = useAtom(filteredCirclesAtom);
    const [signInStatus] = useAtom(signInStatusAtom);
    const [circleSettings, setCircleSettings] = useAtom(circleSettingsAtom);
    const [, setFocusOnMapItem] = useAtom(focusOnMapItemAtom);

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
        <Flex
            flexGrow={noScrollbars ? "0" : "1"}
            width="100%"
            height={noScrollbars ? "auto" : "100%"}
            flexDirection={"column"}
            maxWidth="600px"
        >
            <CreateNewCircleForm type={type} />
            {filteredCircles?.length > 0 && (
                <Flex borderBottom="1px solid #ebebeb" justifyContent="end" paddingRight="5px" paddingTop="5px">
                    <ButtonGroup size="sm" isAttached variant="outline" marginBottom="5px" alignSelf="end">
                        <IconButton
                            width="28px"
                            height="28px"
                            margin="0px"
                            minWidth="24px"
                            padding="0px"
                            aria-label="Compact"
                            backgroundColor={view === "compact" ? "#e6e6e6" : "transparent"}
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
                            backgroundColor={view === "normal" ? "#e6e6e6" : "transparent"}
                            icon={<MdViewAgenda size={18} />}
                            onClick={() => {
                                updateCircleSettings("view", "normal");
                            }}
                        />
                    </ButtonGroup>
                </Flex>
            )}
            <Flex flexGrow="1" flexDirection={"column"}>
                <ScrollbarsIf noScrollbars={noScrollbars}>
                    {filteredCircles
                        ?.filter((x) => x.type === type)
                        ?.map((item) =>
                            view === "compact" ? (
                                <CircleListItem
                                    key={item.id}
                                    item={item}
                                    onClick={() => {
                                        openCircle(navigate, item);
                                        focusCircle(item, setFocusOnMapItem);
                                    }}
                                />
                            ) : (
                                <CircleListItemNormal
                                    key={item.id}
                                    item={item}
                                    onClick={() => {
                                        openCircle(navigate, item);
                                        focusCircle(item, setFocusOnMapItem);
                                    }}
                                />
                            )
                        )}
                </ScrollbarsIf>
                {/* {filteredCircles?.length <= 0 && (
                    <Text marginLeft="12px" marginTop="10px" alignSelf="start">
                        {i18n.t(`No ${type}s`)}
                    </Text>
                )} */}
            </Flex>
        </Flex>
    );
};

export default Circles;
