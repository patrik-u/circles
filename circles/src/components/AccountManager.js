//#region imports
import { useEffect, useState } from "react";
import { useToast } from "@chakra-ui/react";
import db, { auth } from "components/Firebase";
import * as Sentry from "@sentry/react";
import { signOut, onAuthStateChanged, onIdTokenChanged, signInWithCredential, GoogleAuthProvider } from "firebase/auth";
import axios from "axios";
import { toastError, log } from "components/Helpers";
import { collection, doc, onSnapshot, query, where, GeoPoint } from "firebase/firestore";
import i18n from "i18n/Localization";
import { useAtom } from "jotai";
import { signInStatusValues } from "components/Constants";
import {
    uidAtom,
    userAtom,
    userDataAtom,
    userLocationAtom,
    signInStatusAtom,
    userConnectionsAtom,
    requestUserConnectionsAtom,
    newUserPopupAtom,
    jaasTokenAtom,
    inVideoConferenceAtom,
    circleAtom,
} from "components/Atoms";
import config from "Config";
import useScript from "components/useScript";
//#endregion

// signs out user
export const userSignOut = (setUser) => {
    signOut(auth);
    setUser(null);
};

// handles user account log in to circles using firebase auth and google one tap
export const AccountManager = () => {
    log("AccountManager.render", -1);

    const [uid, setUid] = useAtom(uidAtom);
    const [signInStatus, setSignInStatus] = useAtom(signInStatusAtom);
    const [user, setUser] = useAtom(userAtom);
    const [circle] = useAtom(circleAtom);
    const [inVideoConference] = useAtom(inVideoConferenceAtom);
    const [, setUserData] = useAtom(userDataAtom);
    const [, setUserConnections] = useAtom(userConnectionsAtom);
    const [, setNewUserPopup] = useAtom(newUserPopupAtom);
    const [requestUserConnections] = useAtom(requestUserConnectionsAtom);
    const [, setJaasToken] = useAtom(jaasTokenAtom);
    const toast = useToast();
    const googleOneTapScript = useScript("https://accounts.google.com/gsi/client");
    const googleOneTapScriptFlag = "__googleOneTapScript__";
    const [googleOneTapDone, setGoogleOneTapDone] = useState(false);
    const [userLocation] = useAtom(userLocationAtom);

    // //#region useEffects
    //initialize firebase sign in
    useEffect(() => {
        log("AccountManager.useEffect 1", -1);
        const unsubscribeOnAuthStateChanged = onAuthStateChanged(auth, async (inUser) => {
            // event called when user is authenticated or when user is no longer authenticated
            if (inUser) {
                log("user authenticated in firebase", 0);

                Sentry.addBreadcrumb({
                    category: "auth",
                    message: "User authenticated in firebase",
                    level: "info",
                });

                // set user data
                let uid = inUser.uid;
                let idToken = await inUser.getIdToken();
                axios.defaults.headers.common["Authorization"] = `Bearer ${idToken}`;

                log("setting uid " + uid, 0);
                setUid(uid);
                setSignInStatus(signInStatusValues.signingIn);
            } else {
                // happens if the user has lost connection or isn't signed in yet
                log("user not authenticated in firebase", 0);

                Sentry.addBreadcrumb({
                    category: "auth",
                    message: "User not authenticated in firebase",
                    level: "info",
                });

                setUid(null);
                setSignInStatus(signInStatusValues.firebaseSignedOut);
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

        log("AccountManager.useEffect 2", -1);

        const signInFailed = (error) => {
            setUid((x) => null);
            setUser((x) => null);
            setUserData((x) => null);
            setSignInStatus(signInStatusValues.circlesSignInFailed);
            toastError(toast, i18n.t("error1"));
            Sentry.captureException(error);
        };

        let unsubscribeGetUserConnections = null;
        let unsubscribeGetUserData = null;
        let unsubscribeGetUser = null;
        let firstGetUser = true;
        let firstGetUserData = true;

        // sign in to circles
        log("signing in to circles");
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
                setJaasToken(data.jaasToken);
                log("signed into circles, subscribing to user data");

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
                    const updatedUserData = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))[0];

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

                let alwaysShowGuide = config.alwaysShowGuide;

                // show new profile guide
                if (
                    !data.userData.agreed_to_tnc ||
                    !data.userData.completed_guide ||
                    (!data.user.base && !data.userData.skipped_setting_location) ||
                    alwaysShowGuide
                ) {
                    setNewUserPopup(true);
                }

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
    }, [setSignInStatus, setUid, setUser, setUserData, toast, uid, setJaasToken, setNewUserPopup]);

    // attempt sign in using google one tap
    useEffect(() => {
        if (signInStatus.signedIn) {
            setGoogleOneTapDone(true);
            return;
        }

        // have firebase auth failed?
        if (googleOneTapDone || signInStatus !== signInStatusValues.firebaseSignedOut) {
            // no
            return;
        }

        // have we already loaded the google one tap script?
        if (!window?.[googleOneTapScriptFlag] && window.google && googleOneTapScript === "ready") {
            log("initializing Google One Tap", 1);
            setSignInStatus(signInStatusValues.signingIn);
            window.google.accounts.id.initialize({
                client_id: config.googleId,
                cancel_on_tap_outside: false,
                callback: onGoogleSignIn,
                auto_select: true,
                context: "signin",
            });
            window[googleOneTapScriptFlag] = true;
        }
        if (window?.[googleOneTapScriptFlag] && googleOneTapScript === "ready") {
            log("starting Google One Tap", 1);
            setSignInStatus(signInStatusValues.signingIn);
            window.google.accounts.id.prompt((notification) => {
                if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
                    // user cancels google one tap sign in
                    setSignInStatus(signInStatusValues.userSignedOut);
                } else if (notification.isDismissedMoment()) {
                    // google successfully retrieves a credential, or a user wants to stop the credential retrieval flow
                } else {
                }
            });

            setGoogleOneTapDone(true);
            return () => {
                window.google.accounts.id.cancel();
            };
        }
    }, [signInStatus, setSignInStatus, googleOneTapScript, googleOneTapDone]);

    useEffect(() => {
        if (!signInStatus.signedIn || !user?.id) return;

        let location = userLocation ? new GeoPoint(userLocation.latitude, userLocation.longitude) : null;

        try {
            axios.put(`/circles/${user.id}/activity`, {
                active_in_circle: circle,
                active_in_video_conference: inVideoConference,
                location: location,
            });
        } catch (err) {
            console.error(err);
        }

        const intervalId = setInterval(async () => {
            try {
                axios.put(`/circles/${user.id}/activity`, {
                    active_in_circle: circle,
                    active_in_video_conference: inVideoConference,
                    location: location,
                });
            } catch (err) {
                console.error(err);
            }
        }, 60000); // update every minute
        return () => clearInterval(intervalId);
    }, [signInStatus?.signedIn, user?.id, circle, inVideoConference, userLocation]);

    // get user connections
    useEffect(() => {
        // wait to load user connections until we need it to minimize initial payload
        if (!requestUserConnections || !uid) return;

        // subscribe to user connections
        var q = query(collection(db, "connections"), where("source.id", "==", uid));
        let unsubscribeGetUserConnections = onSnapshot(q, (snap) => {
            const updatedUserConnections = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

            log("getting user connections: ", JSON.stringify(updatedUserConnections, null, 2));
            if (snap.docs[0] != null) {
                setUserConnections((currentUser) => updatedUserConnections);
            }
        });

        return () => {
            if (unsubscribeGetUserConnections) {
                unsubscribeGetUserConnections();
            }
        };
    }, [requestUserConnections, uid, setUserConnections]);

    const onGoogleSignIn = async (response) => {
        // console.log(JSON.stringify(response, null, 2));
        let credential = GoogleAuthProvider.credential(response.credential);
        await signInWithCredential(auth, credential);
    };

    return null;
};

export default AccountManager;
