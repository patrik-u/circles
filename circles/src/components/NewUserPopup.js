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
    newUserPopupAtom,
} from "components/Atoms";
import config from "Config";
import useScript from "components/useScript";
import { getPreciseDistance } from "geolib";
import { RiLinksLine } from "react-icons/ri";
//#endregion

const NewUserGuide = lazy(() => import("components/NewUserGuide"));

// handles actions triggered by components
export const NewUserPopup = () => {
    log("ConnectPopup.render", -1);

    const [newUserPopup, setNewUserPopup] = useAtom(newUserPopupAtom);

    //#region useEffects

    useEffect(() => {
        if (newUserPopup) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }

        return () => {
            document.body.style.overflow = "unset";
        };
    }, [newUserPopup]);

    //#endregion

    const onClose = () => {
        setNewUserPopup(null);
    };

    if (!newUserPopup) return null;

    return (
        <ModalPopup onClose={onClose}>
            <NewUserGuide onClose={onClose} />
        </ModalPopup>
    );
};

export default NewUserPopup;
