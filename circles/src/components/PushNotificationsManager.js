//#region imports
import { useEffect } from "react";
import { useToast } from "@chakra-ui/react";
import { messaging } from "components/Firebase";
import { getToken } from "firebase/messaging";
import { isSupported } from "firebase/messaging";
import axios from "axios";
import { log } from "components/Helpers";
import { useAtom } from "jotai";
import { uidAtom, signInStatusAtom, messageTokenAtom } from "components/Atoms";
import config from "Config";
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

                    try {
                        isSupported().then((supported) => {
                            if (!supported) return;

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
                        });
                    } catch (error) {
                        log("error getting messaging token: " + error);
                    }
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
