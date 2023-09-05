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
import { serverConfigAtom, latestRefreshedVersionAtom } from "components/Atoms";
//#endregion

function urlWithRndQueryParam(url, paramName) {
    const ulrArr = url.split("#");
    const urlQry = ulrArr[0].split("?");
    const usp = new URLSearchParams(urlQry[1] || "");
    usp.set(paramName || "z", `${Date.now()}`);
    urlQry[1] = usp.toString();
    ulrArr[0] = urlQry.join("?");
    return ulrArr.join("#");
}

const handleRefresh = async (minVersion, setLatestRefreshedVersion) => {
    setLatestRefreshedVersion(minVersion);

    // unregister service workers
    if (navigator.serviceWorker) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((reg) => reg.unregister()));
    }

    // clear the cache
    const keyList = await caches.keys();
    await Promise.all(keyList.map((key) => caches.delete(key)));

    // reload the window
    setTimeout(() => {
        window.location.reload();
    }, 1000);
};

const ServerConfigManager = () => {
    const [currentVersion, setCurrentVersion] = useState(process.env.REACT_APP_VERSION);
    const [hasBeenInitialized, setHasBeenInitialized] = useState(false);
    const [serverConfig, setServerConfig] = useAtom(serverConfigAtom);
    const [showModal, setShowModal] = useState(false);
    const [latestRefreshedVersion, setLatestRefreshedVersion] = useAtom(latestRefreshedVersionAtom);

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
        try {
            if (compareVersions(currentVersion, minVersion) < 0) {
                log("new version needed, minVersion: " + minVersion + ", currentVersion: " + currentVersion, 2, true);
                log("latestRefreshedVersion: " + JSON.stringify(latestRefreshedVersion, null, 2), 2, true);
                if (latestRefreshedVersion && compareVersions(latestRefreshedVersion, minVersion) >= 0) {
                    // already refreshed to latest version, so don't show modal
                    return;
                }

                if (hasBeenInitialized) {
                    // alert user that new version is available and that they need to refresh
                    setShowModal(true);
                } else {
                    // automatically refresh the page to get latest version if this is on startup
                    handleRefresh(minVersion, setLatestRefreshedVersion);
                }
            }
        } catch (err) {
            setLatestRefreshedVersion(null); // in case session storage has been corrupted
            log("error: " + err, 0, true);
        }
        setHasBeenInitialized(true);
    }, [serverConfig?.min_version, currentVersion, hasBeenInitialized, setLatestRefreshedVersion, latestRefreshedVersion]);

    const handleClose = () => {
        setShowModal(false);
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
                            <Button colorScheme="blue" mr={3} onClick={() => handleRefresh(serverConfig?.min_version, setLatestRefreshedVersion)}>
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
