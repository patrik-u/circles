//#region imports
import React, { useState, useEffect, useContext, useCallback } from "react";
import { Box, Flex, HStack, Spinner, Text, Button, useToast } from "@chakra-ui/react";
import i18n from "i18n/Localization";
import UserContext from "../../components/UserContext";
import db from "../../components/Firebase";
import axios from "axios";
import { log, getDateAndTimeLong, toastError, toastSuccess, getConnectLabel } from "../../components/old_Helpers";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { RiLinksLine } from "react-icons/ri";
import { AiOutlineDisconnect } from "react-icons/ai";
//#endregion

export const CircleConnectionsList = ({ connections, connect, disconnect, isConnecting }) => {
    const borderRadius = (i) => {
        let top = i === 0 ? "7px 7px" : "0px 0px";
        let bottom = i === connections.length - 1 ? "7px 7px" : "0px 0px";
        return `${top} ${bottom}`;
    };

    const getDisconnectButtonText = (connection) => {
        switch (connection.type) {
            case "connected_to":
                return i18n.t("Unfollow");
            default:
            case "connected_mutually_to":
                return i18n.t(`Default disconnect [${connection.target.type}]`);
            case "connected_mutually_to_request":
                return i18n.t(`Remove request [${connection.target.type}]`);
        }
    };

    return (
        connections.length > 0 && (
            <>
                {connections.map((connection, i) => (
                    <Flex
                        key={connection.id}
                        flexGrow="1"
                        borderRadius={borderRadius(i)}
                        border="1px solid #e7e7e7"
                        borderWidth={i === 0 ? "1px" : "0px 1px 1px 1px"}
                        flexDirection="row"
                        align="center"
                    >
                        <Box width="190px" flexShrink="0" paddingTop="10px" paddingBottom="10px" paddingLeft="15px">
                            <Text fontWeight="700" fontSize="18px">
                                {getConnectLabel(connection.target.type, connection.type)}
                            </Text>
                            <Text fontSize="12px">{getDateAndTimeLong(connection.created_at)}</Text>
                        </Box>
                        <Box flexGrow="1">
                            {/* <Text fontSize="12px" fontWeight="700" color="#aaa">
                            Established at
                        </Text>
                        <Text fontSize="14px">{getDateAndTimeLong(connection.created_at)}</Text> */}
                        </Box>

                        {(connection.type === "connected_to" ||
                            connection.type === "connected_mutually_to" ||
                            connection.type === "connected_mutually_to_request") && (
                            <Box marginRight="10px">
                                <Button
                                    minWidth="150px"
                                    colorScheme="blue"
                                    borderRadius="25px"
                                    lineHeight="0"
                                    backgroundColor="#389bf8"
                                    color="white"
                                    isDisabled={isConnecting}
                                    position="relative"
                                    onClick={() => disconnect(connection.type)}
                                >
                                    <HStack marginRight="13px">
                                        {/* <RiLinksLine size="18px" /> */}
                                        <AiOutlineDisconnect size="18px" />
                                        <Text>{getDisconnectButtonText(connection)}</Text>
                                    </HStack>
                                </Button>
                            </Box>
                        )}
                    </Flex>
                ))}
            </>
        )
    );
};

export const CircleConnections = ({ source, target, option, isConnecting, setIsConnecting, onConnect, onClose }) => {
    const user = useContext(UserContext);
    const toast = useToast();
    const [isLoadingConnections, setIsLoadingConnections] = useState(true);
    const [isLoadingRequest, setIsLoadingRequest] = useState(true);
    const isLoading = isLoadingConnections || isLoadingRequest;
    const [connections, setConnections] = useState([]);
    const isConnected = connections?.some((x) => x.type === "connected_mutually_to" || x.type === "connected_mutually_to_request");
    const isFollowing = connections?.some((x) => x.type === "connected_to");

    const connect = useCallback(
        (type) => {
            setIsLoadingRequest(true);
            let errorMessage = `${i18n.t(type === "connected_to" ? "Unable to follow" : "Unable to connect to")} ${target.name}`;

            // send request to follow/connect
            axios
                .post(`/circles/${source.id}/connections`, {
                    targetId: target.id,
                    type,
                })
                .then((x) => {
                    let result = x.data;
                    if (result.error) {
                        toastError(toast, errorMessage, result.error);
                    } else if (type === "connected_to" || result.auto_approved) {
                        toastSuccess(toast, `${i18n.t(type === "connected_to" ? "Following" : `Connected to [${target.type}]`)} ${target.name}`);
                    } else if (type === "connected_mutually_to") {
                        toastSuccess(toast, `${i18n.t(`Request made to [${target.type}]`)} ${target.name}`);
                    }
                    setIsLoadingRequest(false);
                })
                .catch((error) => {
                    toastError(toast, errorMessage, error);
                    setIsLoadingRequest(false);
                });
        },
        [source, target, toast]
    );

    const disconnect = useCallback(
        (type) => {
            setIsLoadingRequest(true);
            let errorMessage = `${i18n.t(type === "connected_to" ? "Unable to unfollow" : "Unable to disconnect from")} ${target.name}`;

            // send request to unfollow
            axios
                .delete(`/circles/${source.id}/connections`, {
                    data: {
                        targetId: target.id,
                        type,
                    },
                })
                .then((x) => {
                    let result = x.data;
                    if (result.error) {
                        toastError(toast, errorMessage, result.error);
                    } else {
                        toastSuccess(toast, `${i18n.t(type === "connected_to" ? "Unfollowed" : `Disconnected from [${target.type}]`)} ${target.name}`);
                    }
                    setIsLoadingRequest(false);
                })
                .catch((error) => {
                    toastError(toast, errorMessage, error);
                    setIsLoadingRequest(false);
                });
        },
        [source, target, toast]
    );

    useEffect(() => {
        log("CircleConnections.useEffect 1", 0);
        if (!source?.id || !target?.id) return;
        if (option === "follow") {
            connect("connected_to");
        } else if (option === "connect") {
            connect("connected_mutually_to");
        } else {
            setIsLoadingRequest(false);
        }

        setIsLoadingConnections(true);

        // subscribe to circle connections
        var q = query(collection(db, "connections"), where("source.id", "==", source.id), where("target.id", "==", target.id));
        let unsubscribeGetCircleConnections = onSnapshot(q, (snap) => {
            const newConnections = snap.docs?.map((doc) => ({ id: doc.id, ...doc.data() })) ?? [];
            setConnections(newConnections);
            setIsLoadingConnections(false);
        });

        return () => {
            if (unsubscribeGetCircleConnections) {
                unsubscribeGetCircleConnections();
            }
        };
    }, [source?.id, target?.id, option, toast, connect]);

    return (
        <Box>
            {isLoading && <Spinner />}
            {!isLoading && (
                <>
                    <CircleConnectionsList connections={connections} connect={connect} disconnect={disconnect} isConnecting={isConnecting} />

                    <Flex flexDirection="row" flexGrow="1" marginTop="10px">
                        {(!isConnected || !isFollowing) && (
                            <HStack align="center" height="40px">
                                {!isConnected && (
                                    <Button
                                        minWidth="150px"
                                        colorScheme="blue"
                                        borderRadius="25px"
                                        lineHeight="0"
                                        backgroundColor="#389bf8"
                                        color="white"
                                        isDisabled={isConnecting}
                                        onClick={() => connect("connected_mutually_to")}
                                        position="relative"
                                    >
                                        <HStack marginRight="13px">
                                            <RiLinksLine size="18px" />
                                            <Text>{i18n.t(`Default connect [${target.type}]`)}</Text>
                                        </HStack>
                                    </Button>
                                )}
                                {!isFollowing && (
                                    <Button
                                        minWidth="150px"
                                        colorScheme="blue"
                                        borderRadius="25px"
                                        lineHeight="0"
                                        backgroundColor="#389bf8"
                                        color="white"
                                        isDisabled={isConnecting}
                                        onClick={() => connect("connected_to")}
                                        position="relative"
                                    >
                                        <HStack marginRight="13px">
                                            <RiLinksLine size="18px" />
                                            <Text>{i18n.t("Follow")}</Text>
                                        </HStack>
                                    </Button>
                                )}
                            </HStack>
                        )}
                        <Box flexGrow="1" />
                        {onClose && (
                            <Button variant="ghost" borderRadius="25px" onClick={onClose} isDisabled={isConnecting} lineHeight="0">
                                {i18n.t("Close")}
                            </Button>
                        )}
                    </Flex>
                </>
            )}
        </Box>
    );
};

export default CircleConnections;
