//#region imports
import { useEffect, useState, useCallback, Suspense, lazy } from "react";
import { Box, Menu, MenuButton, MenuItem, MenuList, Flex, HStack, VStack, Text, Image, Icon, Link, Button, useToast } from "@chakra-ui/react";
import db, { auth } from "components/Firebase";
import * as Sentry from "@sentry/react";
import { signOut, onAuthStateChanged, onIdTokenChanged, signInWithCredential, GoogleAuthProvider } from "firebase/auth";
import axios from "axios";
import { toastError, log } from "components/Helpers";
import { collection, doc, onSnapshot, query, where } from "firebase/firestore";
import i18n from "i18n/Localization";
import { useAtom } from "jotai";
import { ModalPopup, CirclePicture } from "components/CircleElements";
import { signInStatusValues } from "components/Constants";
import {
    uidAtom,
    userAtom,
    userDataAtom,
    signInStatusAtom,
    userConnectionsAtom,
    requestUserConnectionsAtom,
    userLocationAtom,
    connectPopupAtom,
} from "components/Atoms";
import config from "Config";
import useScript from "components/useScript";
import { getPreciseDistance } from "geolib";
import { RiLinksLine } from "react-icons/ri";
//#endregion

const CircleConnections = lazy(() => import("components/CircleConnections"));

// handles actions triggered by components
export const ConnectPopup = () => {
    log("ConnectPopup.render", -1);

    const [connectPopup, setConnectPopup] = useAtom(connectPopupAtom);

    //#region useEffects

    useEffect(() => {
        if (connectPopup) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }

        return () => {
            document.body.style.overflow = "unset";
        };
    }, [connectPopup]);

    //#endregion

    const onClose = () => {
        log("closing popup");
        setConnectPopup(null);
    };

    if (!connectPopup) return null;

    return (
        <ModalPopup onClose={onClose}>
            <Flex alignItems="center">
                <Box flexShrink="0" marginRight="5px">
                    <HStack spacing="10px">
                        <CirclePicture circle={connectPopup.source} size={30} />
                        <RiLinksLine size={18} />
                        <CirclePicture circle={connectPopup.target} size={30} />
                    </HStack>
                </Box>
                <Text marginLeft="10px" fontWeight="700" fontSize="20px">
                    {i18n.t("Connections to")} {connectPopup.target?.name}
                </Text>
            </Flex>
            <Suspense fallback={<Box></Box>}>
                <CircleConnections source={connectPopup.source} target={connectPopup.target} option={connectPopup.option} onClose={onClose} />
            </Suspense>
        </ModalPopup>
    );
};

export default ConnectPopup;
