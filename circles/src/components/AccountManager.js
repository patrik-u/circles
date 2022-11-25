//#region imports
import React, { useState, useEffect, useRef, useMemo, lazy, Suspense } from "react";
import {
    Flex,
    Box,
    Text,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    Button,
    useToast,
    HStack,
    useDisclosure,
} from "@chakra-ui/react";
import { getPreciseDistance } from "geolib";
import ThreeboxMap from "./ThreeboxMap";
import UserContext from "./UserContext";
import IsMobileContext from "./IsMobileContext";
import db, { auth } from "./Firebase";
import * as Sentry from "@sentry/react";
import { GoogleAuthProvider, onAuthStateChanged, onIdTokenChanged, signInWithCredential } from "firebase/auth";
import axios from "axios";
import { isMobile as detectIsMobile } from "react-device-detect";
import { toastError, log, clusterConnections } from "./Helpers";
import { defaultContentWidth } from "./Constants";
import { collection, doc, onSnapshot, query, where } from "firebase/firestore";
import { Routes, Navigate, Route, useLocation, useSearchParams } from "react-router-dom";
import i18n from "../i18n/Localization";
import config from "../Config";
import { atom, atomWithStorage, useAtom } from "jotai";
import { signInStatusValues } from "./Constants";
import { uidAtom, userAtom, userDataAtom, signInStatusAtom } from "./Atoms";
//#endregion

const AccountManager = () => {
    const [uid, setUid] = useAtom(uidAtom);
    const [, setSignInStatus] = useAtom(signInStatusAtom);
    const [, setUser] = useAtom(userAtom);
    const [, setUserData] = useAtom(userDataAtom);
    const toast = useToast();

    // //#region useEffects
    //initialize firebase sign in
    useEffect(() => {
        log("AccountManager.useEffect 1", 0);
        const unsubscribeOnAuthStateChanged = onAuthStateChanged(auth, async (inUser) => {
            // event called when user is authenticated or when user is no longer authenticated
            if (inUser) {
                log("user authenticated in firebase", 0);

                Sentry.addBreadcrumb({
                    category: "auth",
                    message: "User authenticated in firebase",
                    level: Sentry.Severity.Info,
                });

                // set user data
                let uid = inUser.uid;
                let idToken = await inUser.getIdToken();
                axios.defaults.headers.common["Authorization"] = `Bearer ${idToken}`;

                log("setting uid " + uid, 0);
                setUid(uid);
            } else {
                // happens if the user has lost connection or isn't signed in yet
                log("user not authenticated in firebase", 0);

                Sentry.addBreadcrumb({
                    category: "auth",
                    message: "User not authenticated in firebase",
                    level: Sentry.Severity.Info,
                });

                setUid(null);
                setSignInStatus(signInStatusValues.signedOut);
            }
        });

        const unsubscribeOnIdTokenChanged = onIdTokenChanged(auth, async (inUser) => {
            if (inUser) {
                // token is refreshed
                let idToken = await inUser.getIdToken();
                axios.defaults.headers.common["Authorization"] = `Bearer ${idToken}`;
            }
        });

        return () => {
            if (unsubscribeOnAuthStateChanged) {
                unsubscribeOnAuthStateChanged();
            }
            if (unsubscribeOnIdTokenChanged) {
                unsubscribeOnIdTokenChanged();
            }
        };
    }, [setSignInStatus, setUid]);

    // sign in to circles
    useEffect(() => {
        if (!uid) {
            return; // not authenticated in firebase
        }

        log("AccountManager.useEffect 2", 0);

        const signInFailed = (error) => {
            setUid((x) => null);
            setUser((x) => null);
            setUserData((x) => null);
            setSignInStatus(signInStatusValues.signInFailed);
            toastError(toast, i18n.t("error1"));
            Sentry.captureException(error);
        };

        let unsubscribeGetUserConnections = null;
        let unsubscribeGetUserData = null;
        let unsubscribeGetUser = null;
        let firstGetUser = true;
        let firstGetUserData = true;

        // sign in to circles
        axios
            .get(`/signin`)
            .then((signInResult) => {
                let data = signInResult.data;
                if (data.error) {
                    signInFailed(data.error);
                    return;
                }
                setUser(data.user);
                setUserData(data.userData);

                // subscribe to user public data
                unsubscribeGetUser = onSnapshot(doc(db, "circles", uid), (doc) => {
                    var updatedUser = doc.data();

                    // ignore setting user data first time as we've already done so
                    if (firstGetUser) {
                        firstGetUser = false;
                        return;
                    }

                    //console.log("getting updated user data: ", JSON.stringify(updatedUserPublic, null, 2));
                    setUser((x) => ({
                        ...updatedUser,
                        id: doc.id,
                    }));
                });

                // subscribe to user data
                var q = query(collection(db, "circle_data"), where("circle_id", "==", uid));
                unsubscribeGetUserData = onSnapshot(q, (snap) => {
                    const updatedUserData = snap.docs.map((doc) => doc.data())[0];

                    // ignore setting user detail data first time as we've already done so
                    if (firstGetUserData) {
                        firstGetUserData = false;
                        return;
                    }

                    //console.log("getting updated user details: ", JSON.stringify(updatedUserDetails, null, 2));
                    if (snap.docs[0] != null) {
                        setUserData((currentUser) => updatedUserData);
                    }
                });

                log("subscribing to user connections", 0);
                setSignInStatus(signInStatusValues.signedIn);
            })
            .catch((error) => {
                signInFailed(error);
            });

        return () => {
            if (unsubscribeGetUser) {
                unsubscribeGetUser();
            }
            if (unsubscribeGetUserData) {
                unsubscribeGetUserData();
            }
            if (unsubscribeGetUserConnections) {
                unsubscribeGetUserConnections();
            }
        };
    }, [setSignInStatus, setUid, setUser, setUserData, toast, uid]);

    // // initialize google one tap
    // useEffect(() => {
    //     // TODO only do this if regular sign-in failed
    //     log("useEffect 5", 0);
    //     if (isSignedIn || isSigningIn || hasSignedOut || embed) return;

    //     const el = document.createElement("script");
    //     el.setAttribute("src", "https://accounts.google.com/gsi/client");
    //     el.async = true;
    //     el.onload = () => initializeGSI();
    //     el.id = "google-client-script";
    //     document.querySelector("body").appendChild(el);

    //     return () => {
    //         window.google?.accounts.id.cancel();
    //         document.getElementById("google-client-script")?.remove();
    //     };
    // }, [isSigningIn, isSignedIn, hasSignedOut, embed]);

    // const [contentWidth, setContentWidth] = useState(isMobile ? "100%" : defaultContentWidth);

    // //#endregion

    return null;
};

export default AccountManager;
