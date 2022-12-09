//#region imports
import { useEffect, useState, useCallback } from "react";
import { useToast } from "@chakra-ui/react";
import db, { auth, messaging } from "components/Firebase";
import * as Sentry from "@sentry/react";
import { signOut, onAuthStateChanged, onIdTokenChanged, signInWithCredential, GoogleAuthProvider } from "firebase/auth";
import { onMessage, requestPermission, getToken } from "firebase/messaging";
import axios from "axios";
import { toastError, log } from "components/Helpers";
import { collection, doc, onSnapshot, query, where } from "firebase/firestore";
import i18n from "i18n/Localization";
import { useAtom } from "jotai";
import { signInStatusValues } from "components/Constants";
import { uidAtom, userAtom, userDataAtom, signInStatusAtom, userConnectionsAtom, requestUserConnectionsAtom, userLocationAtom } from "components/Atoms";
import config from "Config";
import useScript from "components/useScript";
import { getPreciseDistance } from "geolib";
//#endregion

// asks permission for user location and updates it
export const PushNotificationsManager = () => {
    log("PushNotificationsManager.render", -1);

    const [signInStatus] = useAtom(signInStatusAtom);

    //#region useEffects

    useEffect(() => {
        log("PushNotificationsManager.useEffect", 0);
        if (signInStatus.signedIn) {
            if (!("Notification" in window)) {
                // browser does't support notifications
                log("Browser does't support notifications");
                return;
            }

            //if (Notification.permission !== "granted") {
            log("Asking for permission to receive notifications");
            Notification.requestPermission().then((permission) => {
                if (permission === "granted") {
                    console.log("Notification permission granted.");
                    getToken(messaging).then((token) => {
                        log("messaging token: " + token);
                    });

                    // get messaging token
                } else if (permission === "denied") {
                    console.log("Permission for Notifications was denied");
                }
            });
            //} else {
            //log("Permission for push notifications granted");
            //}

            // let unsubscribeGetMessages = onMessage(messaging, (payload) => {
            //     console.log("message received" + payload);
            // });
            // requestPermission(messaging).then(() => {
            //     return messaging.getToken();
            // }).then(token => {
            //     log("permission to enable push notifications granted. token: " + token);
            // }).catch(error => {
            //     log("Error when requesting permission to enable push notifications." + JSON.stringify(error));
            // });

            // messaging
            //     .requestPermission()
            //     .then(() => {
            //         return messaging.getToken();
            //     })
            //     .then((token) => {
            //         log("permission to enable push notifications granted. token: " + token);
            //     })
            //     .catch((error) => {
            //         log("Error when requesting permission to enable push notifications." + JSON.stringify(error));
            //     });

            // return () => {
            //     if (unsubscribeGetMessages) {
            //         unsubscribeGetMessages();
            //     }
            // };
        }
    }, [signInStatus?.signedIn]);

    //#endregion

    return null;
};

export default PushNotificationsManager;
