//#region Imports
import React, { useEffect, useState } from "react";
import {
    Modal,
    ModalOverlay,
    ModalBody,
    ModalContent,
    ModalHeader,
    ModalCloseButton,
    ModalFooter,
    Flex,
    Box,
    Drawer,
    DrawerBody,
    DrawerOverlay,
    DrawerContent,
    DrawerCloseButton,
    Button,
    useDisclosure,
} from "@chakra-ui/react";
import db from "components/Firebase";
import axios from "axios";
import { log, fromFsDate, getDateWithoutTime, isConnected } from "components/Helpers";
import { collection, doc, onSnapshot, query, where, getDoc } from "firebase/firestore";
import { useAtom } from "jotai";
import { serverConfigAtom } from "components/Atoms";
//#endregion

const ServerConfigManager = () => {
    const [currentVersion, setCurrentVersion] = useState(process.env.REACT_APP_VERSION);
    const [hasBeenInitialized, setHasBeenInitialized] = useState(false);
    const [serverConfig, setServerConfig] = useAtom(serverConfigAtom);
    const [showModal, setShowModal] = useState(false);

    // compares versions in the format of "1.0.0"
    const compareVersions = (version1, version2) => {
        const v1Parts = version1.split(".").map(Number);
        const v2Parts = version2.split(".").map(Number);

        for (let i = 0; i < v1Parts.length; i++) {
            if (v1Parts[i] > v2Parts[i]) {
                return 1;
            } else if (v1Parts[i] < v2Parts[i]) {
                return -1;
            }
        }
        return 0;
    };

    useEffect(() => {
        log("ServerConfigManager.useEffect 1", -1);
        const unsubscribeGetConfig = onSnapshot(doc(db, "config", "config"), (doc) => {
            setServerConfig(doc.data());
        });

        return () => {
            if (unsubscribeGetConfig) {
                unsubscribeGetConfig();
            }
        };
    }, [setServerConfig]);

    useEffect(() => {
        log("ServerConfigManager.useEffect 2", -1);

        let minVersion = serverConfig?.min_version;
        if (!minVersion) return;

        log("minVersion: " + minVersion + ", currentVersion: " + currentVersion, -1, true);
        if (compareVersions(currentVersion, minVersion) < 0) {
            log("newVersionNeeded", -1, true);
            if (hasBeenInitialized) {
                // alert user that new version is available and that they need to refresh
                //alert("A new version is available, click Reload to refresh the page (make sure to save any unsaved work before)");
                setShowModal(true);
            } else {
                // automatically refresh the page to get latest version if this is on startup
                window.location.reload(true);
            }
        }
        setHasBeenInitialized(true);
    }, [serverConfig?.min_version, currentVersion, hasBeenInitialized]);

    const handleClose = () => {
        setShowModal(false);
    };

    const handleRefresh = () => {
        window.location.reload(true);
    };

    return (
        <>
            {showModal && (
                <Modal isOpen={showModal} onClose={handleClose}>
                    <ModalOverlay />
                    <ModalContent>
                        <ModalHeader>New Version Available</ModalHeader>
                        <ModalCloseButton />
                        <ModalBody>Click "Reload" to refresh the page and update to the latest version.</ModalBody>

                        <ModalFooter>
                            <Button colorScheme="blue" mr={3} onClick={handleRefresh}>
                                Reload
                            </Button>
                            <Button variant="ghost" onClick={handleClose}>
                                Cancel
                            </Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            )}
        </>
    );
};

export default ServerConfigManager;
