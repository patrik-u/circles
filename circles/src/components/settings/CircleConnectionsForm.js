//#region imports
import { useState, useEffect, useMemo } from "react";
import MultiSelect, { components } from "react-select";
import { Box, Flex, Spinner, HStack, VStack, Text, Checkbox, Button, useToast, useDisclosure } from "@chakra-ui/react";
import { db } from "components/Firebase";
import { toastError, toastSuccess, log } from "components/Helpers";
import { ConnectionNotification } from "components/Notifications";
import axios from "axios";
import { i18n } from "i18n/Localization";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { RiLinksLine } from "react-icons/ri";
import { useAtom } from "jotai";
import { userAtom } from "components/Atoms";
import "react-datepicker/dist/react-datepicker.css";
import "react-quill/dist/quill.snow.css";
import { CircleListItem } from "components/CircleListItem";
//#endregion

const CircleRequestToConnectForm = ({ circle, onClose, onNext }) => {
    const [isLoadingCircles, setIsLoadingCircles] = useState(true);
    const [isSendingRequests, setIsSendingRequests] = useState(false);
    const [circles, setCircles] = useState([]);
    const [selectedCircles, setSelectedCircles] = useState([]);
    const [inviteToBeAdmin, setInviteToBeAdmin] = useState(false);

    useEffect(() => {
        log("CircleRequestToConnectForm.useEffect 1", -1);
        // get all circles in the system
        if (!circle?.id) return;
        setIsLoadingCircles(true);

        // subscribe to circle connection requests
        var q = query(collection(db, "circles"));
        let unsubscribeGetCircles = onSnapshot(q, (snap) => {
            const newCircles =
                snap.docs?.map((doc) => {
                    let data = doc.data();
                    return { id: doc.id, value: doc.id, label: data.name, ...data };
                }) ?? [];

            // TODO ignore circles that circle is already connected to
            // we already have this information in the parent form

            setCircles(newCircles.filter((x) => x.type !== "tag").sort((a, b) => a.name?.localeCompare(b.name)));

            // print system tags:
            // let tags = newCircles
            //     .filter((x) => x.type === "tag")
            //     .map((y) => y.name)
            //     .sort((a, b) => a.localeCompare(b));
            // console.log(JSON.stringify(tags, null, 2));

            setIsLoadingCircles(false);
        });

        return () => {
            if (unsubscribeGetCircles) {
                unsubscribeGetCircles();
            }
        };
    }, [circle?.id]);

    const toast = useToast();

    const sendRequestToConnect = async () => {
        setIsSendingRequests(true);
        //console.log(JSON.stringify(selectedCircles, null, 2));
        let errors = null;

        if (setInviteToBeAdmin && selectedCircles.length > 1) {
            toastError(toast, "Only one admin can be invited at a time");
            setIsSendingRequests(false);
            return;
        }

        for (const circleId of selectedCircles) {
            // send requests to each circle
            try {
                let res = await axios.post(`/circles/${circle.id}/connections`, {
                    targetId: circleId,
                    type: inviteToBeAdmin ? "admin_by" : "connected_mutually_to",
                    alwaysNotify: true,
                });

                let result = res.data;
                if (result.error) {
                    errors += result.error;
                    //toastError(toast, errorMessage, result.error);
                }
            } catch (error) {
                errors += JSON.stringify(error, null, 2);
                //toastError(toast, errorMessage, error);
            }
        }

        setInviteToBeAdmin(false);

        if (errors) {
            toastError(toast, "Failed to send request to all recipients", errors);
        } else {
            toastSuccess(toast, "Request sent to all recipients", errors);
        }

        setIsSendingRequests(false);
        setSelectedCircles([]);

        if (onNext) {
            onNext();
        }
    };

    const handleChange = (e) => {
        setSelectedCircles(Array.isArray(e) ? e.map((x) => x.value) : []);
    };

    const { Option } = components;
    const CircleOption = ({ ...props }) => {
        return (
            <Option {...props}>
                <CircleListItem item={props.data} inSelect={true} />
                {/* <HStack>
                    <CirclePicture circle={props.data} size={40} hasPopover={false} />
                    <Text>{props.data.label}</Text>
                </HStack> */}
            </Option>
        );
    };

    return isLoadingCircles ? (
        <Spinner />
    ) : (
        <Box marginTop="20px">
            <Text>
                {i18n.t(`[${circle.type}] Send request to connect`)} {i18n.t("to")}
            </Text>
            <MultiSelect
                isMulti
                options={circles}
                components={{ Option: CircleOption }}
                value={circles.filter((x) => selectedCircles.includes(x.id))}
                onChange={handleChange}
            />
            <Checkbox isChecked={inviteToBeAdmin} onChange={(e) => setInviteToBeAdmin(e.target.checked)}>
                {i18n.t("Invite to be admin")}
            </Checkbox>
            <Flex flexDirection="row" flexGrow="1" marginTop="10px">
                <Button
                    minWidth="150px"
                    colorScheme="blue"
                    borderRadius="25px"
                    lineHeight="0"
                    backgroundColor="#389bf8"
                    color="white"
                    isDisabled={isSendingRequests}
                    onClick={() => sendRequestToConnect()}
                    position="relative"
                >
                    <HStack marginRight="13px">
                        <RiLinksLine size="18px" />
                        {isSendingRequests ? <Spinner /> : <Text>{i18n.t(`[${circle.type}] Send request to connect`)}</Text>}
                    </HStack>
                </Button>

                <Box flexGrow="1" />
                {onClose && (
                    <Button variant="ghost" borderRadius="25px" onClick={onClose} isDisabled={isSendingRequests} lineHeight="0">
                        {i18n.t("Close")}
                    </Button>
                )}
            </Flex>
        </Box>
    );
};

export const CircleConnectionsForm = ({ circle, isUpdateForm }) => {
    const [user] = useAtom(userAtom);
    const toast = useToast();
    const [isLoadingConnections, setIsLoadingConnections] = useState(true);
    const isLoading = isLoadingConnections;
    const { isOpen: inviteFormIsOpen, onOpen: inviteFormOnOpen, onClose: inviteFormOnClose } = useDisclosure();
    const [connections, setConnections] = useState([]);
    const receivedConnectionRequests = useMemo(() => {
        return connections.filter((x) => x.target.id === circle.id && (x.type === "connected_mutually_to_request" || x.type === "admin_by_request"));
    }, [connections, circle?.id]);

    const sentConnectionRequests = useMemo(() => {
        return connections.filter((x) => x.source.id === circle.id && (x.type === "connected_mutually_to_request" || x.type === "admin_by_request"));
    }, [connections, circle?.id]);

    useEffect(() => {
        log("CircleConnectionsForm.useEffect 1", -1);
        if (!circle?.id) return;
        setIsLoadingConnections(true);

        // subscribe to circle connection requests
        var q = query(collection(db, "connections"), where("circle_ids", "array-contains", circle.id));
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
    }, [circle?.id, toast]);

    const ConnectionRequests = ({ requests, isSentRequests }) => {
        const borderRadius = (i) => {
            let top = i === 0 ? "7px 7px" : "0px 0px";
            let bottom = i === connections.length - 1 ? "7px 7px" : "0px 0px";
            return `${top} ${bottom}`;
        };

        return requests.length > 0 ? (
            <>
                {requests.map((connection, i) => (
                    <Flex
                        key={connection.id}
                        flexGrow="1"
                        borderRadius={borderRadius(i)}
                        border="1px solid #e7e7e7"
                        borderWidth={i === 0 ? "1px" : "0px 1px 1px 1px"}
                        flexDirection="row"
                        align="center"
                    >
                        <ConnectionNotification
                            date={connection.created_at}
                            connectionId={connection.id}
                            connectionType={connection.type}
                            source={connection.source}
                            target={connection.target}
                            isSentRequests={isSentRequests}
                        />
                    </Flex>
                ))}
            </>
        ) : (
            <Text>{i18n.t(isSentRequests ? "No connection requests sent" : "No connection requests received")}</Text>
        );
    };

    return (
        <VStack align="center" width="100%">
            <Text className="screenHeader">{i18n.t("Connection requests")}</Text>
            <Text className="screenHeader" fontSize="20px" fontWeight="700">
                {i18n.t("Received")}
            </Text>
            <Flex flexDirection="column" width="100%">
                <ConnectionRequests requests={receivedConnectionRequests} />
            </Flex>
            <Text className="screenHeader" fontSize="20px" fontWeight="700">
                {i18n.t("Sent")}
            </Text>
            <Flex flexDirection="column" width="100%">
                <ConnectionRequests requests={sentConnectionRequests} isSentRequests={true} />
                <CircleRequestToConnectForm circle={circle} />
            </Flex>
        </VStack>
    );
};

export default CircleConnectionsForm;
