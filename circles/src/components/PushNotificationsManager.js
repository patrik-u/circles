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
import {
    uidAtom,
    userAtom,
    userDataAtom,
    signInStatusAtom,
    userConnectionsAtom,
    requestUserConnectionsAtom,
    userLocationAtom,
    messageTokenAtom,
} from "components/Atoms";
import config from "Config";
import useScript from "components/useScript";
import { getPreciseDistance } from "geolib";
//#endregion

// asks permission for user location and updates it
export const PushNotificationsManager = () => {
    log("PushNotificationsManager.render", -1);

    const [signInStatus] = useAtom(signInStatusAtom);
    const [uid] = useAtom(uidAtom);
    const [, setMessageToken] = useAtom(messageTokenAtom);
    const toast = useToast();

    //#region useEffects

    useEffect(() => {
        log("PushNotificationsManager.useEffect", -1);
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
                    log("Notification permission granted.");

                    // get messaging token
                    getToken(messaging).then((token) => {
                        // TODO register token in db?
                        log("messaging token: " + token);
                        setMessageToken(token);

                        // only register token in prod
                        if (config.environment === "prod") {
                            // update message token in db
                            axios.post(`/messageToken`, { messageToken: token });
                        }
                    });
                } else if (permission === "denied") {
                    log("Permission for Notifications was denied");
                }
            });

            // uncomment to listen to push messages in the foreground
            // log("subscribing to push messages", 0, true);
            // let unsubscribeOnMessage = onMessage(messaging, (payload) => {
            //     log("message received" + JSON.stringify(payload), 0, true);
            //     toast({
            //         title: payload.notification.title,
            //         description: payload.notification.body,
            //         status: "info",
            //         position: "top",
            //         duration: null,
            //         isClosable: true,
            //     });
            // });

            return () => {
                // if (unsubscribeOnMessage) {
                //     log("unsubscribing from push messages");
                //     unsubscribeOnMessage();
                // }
            };
        }
    }, [signInStatus?.signedIn, toast, setMessageToken, uid]);

    //#endregion

    return null;
};

export default PushNotificationsManager;
