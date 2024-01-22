//#region imports
import { useEffect, useState } from "react";
import { useToast } from "@chakra-ui/react";
import axios from "axios";
import { log } from "@/components/Helpers";
import { useAtom } from "jotai";
import { uidAtom, signInStatusAtom, messageTokenAtom, userDataAtom } from "@/components/Atoms";
import config from "@/Config";
import OneSignal from "react-onesignal";
import { useLocationNoUpdates } from "./RouterUtils";
//#endregion

// asks permission for user location and updates it
export const PushNotificationsManager = () => {
    log("PushNotificationsManager.render", -1);

    const [signInStatus] = useAtom(signInStatusAtom);
    const [uid] = useAtom(uidAtom);
    const [userData] = useAtom(userDataAtom);
    const [, setMessageToken] = useAtom(messageTokenAtom);
    const [isInitialized, setIsInitialized] = useState(false);
    const [isUserIdReported, setIsUserIdReported] = useState(false);
    const toast = useToast();
    const location = useLocationNoUpdates();

    //#region useEffects

    useEffect(() => {
        log("PushNotificationsManager.useEffect", -1);
        if (!signInStatus.signedIn || isInitialized) {
            return;
            //     // browser does't support notifications
            //     log("Browser does't support notifications");
            //     return;
            // }

            //if (Notification.permission !== "granted") {
            // log("Asking for permission to receive notifications");
            // Notification.requestPermission().then((permission) => {
            //     if (permission === "granted") {
            //         log("Notification permission granted.");
            //     } else if (permission === "denied") {
            //         log("Permission for Notifications was denied");
            //     }
            // });

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
        }

        // OneSignal.on("subscriptionChange", (isSubscribed) => {
        //     log("Subscription changed fired, value: " + isSubscribed, 0, true);
        //     if (isSubscribed) {
        //         OneSignal.getUserId((userId) => {
        //             log("player_id of the subscribed user is : " + userId, 0, true);
        //             // Make a POST call to your server with the user ID
        //             axios.post(`/registerOneSignalUserId`, { userId: userId });
        //         });
        //     }
        // });

        // OneSignal.isPushNotificationsEnabled((isEnabled) => {
        //     log("isPusnNotificationsEnabled, value:" + isEnabled, 0, true);
        //     if (isEnabled) {
        //         // user has subscribed
        //         OneSignal.getUserId((userId) => {
        //             log("player_id of the subscribed user is : " + userId, 0, true);
        //             // Make a POST call to your server with the user ID
        //             axios.post(`/registerOneSignalUserId`, { userId: userId });
        //         });
        //     }
        // });

        // initialize onesignal
        log("**** initializing onesignal ****", 0);
        if (config.environment === "dev") {
            setIsInitialized(true);
            return;
        }

        OneSignal.init({ appId: config.oneSignalAppId })
            .then(() => {
                log("OneSignal initialized", 0, true);

                OneSignal.on("subscriptionChange", function (isSubscribed) {
                    log("The user's subscription state is now:" + isSubscribed, 0, true);
                });

                OneSignal.showSlidedownPrompt().then(() => {
                    // do other stuff
                    log("showing slidedown prompt", 0, true);
                });

                OneSignal.isPushNotificationsEnabled((isEnabled) => {
                    log("isPusnNotificationsEnabled, value:" + isEnabled, 0, true);
                    if (isEnabled) {
                        // user has subscribed
                        OneSignal.getUserId((userId) => {
                            log("player_id of the subscribed user is : " + userId, 0, true);
                            // Make a POST call to your server with the user ID
                            axios.post(`/registerOneSignalUserId`, { userId: userId }).catch((err) => {
                                console.error(err);
                            });
                            setIsUserIdReported(true);
                        });
                    }
                });

                setIsInitialized(true);
            })
            .catch((err) => {
                log("Unable to intitialize OneSignal, " + err, 2);
            });
    }, [signInStatus?.signedIn, toast, setMessageToken, uid, isInitialized]);

    useEffect(() => {
        if (isUserIdReported || !isInitialized) return;

        OneSignal.isPushNotificationsEnabled((isEnabled) => {
            log("isPusnNotificationsEnabled, value:" + isEnabled, 0, true);
            if (isEnabled) {
                // user has subscribed
                OneSignal.getUserId((userId) => {
                    log("player_id of the subscribed user is : " + userId, 0, true);
                    // Make a POST call to your server with the user ID
                    axios.post(`/registerOneSignalUserId`, { userId: userId }).catch((err) => {
                        console.error(err);
                    });
                    setIsUserIdReported(true);
                });
            }
        }).catch((err) => {
            log("OneSignal.isPushNotificationsEnabled error" + err, 2);
        });
    }, [location, isUserIdReported, isInitialized]);

    //#endregion

    return null;
};

export default PushNotificationsManager;
