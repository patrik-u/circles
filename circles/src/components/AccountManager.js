//#region imports
import { useEffect, useState } from "react";
import { useToast } from "@chakra-ui/react";
import db, { auth } from "@/components/Firebase";
import * as Sentry from "@sentry/react";
import { signOut, onAuthStateChanged, onIdTokenChanged, signInWithCredential, GoogleAuthProvider } from "firebase/auth";
import axios from "axios";
import { toastError, log, fromFsDate } from "@/components/Helpers";
import { collection, doc, onSnapshot, query, where, GeoPoint } from "firebase/firestore";
import i18n from "@/i18n/Localization";
import { useAtom } from "jotai";
import { signInStatusValues } from "@/components/Constants";
import {
    uidAtom,
    userAtom,
    userDataAtom,
    userLocationAtom,
    signInStatusAtom,
    userConnectionsAtom,
    requestUserConnectionsAtom,
    newUserPopupAtom,
    jitsiTokenAtom,
    inVideoConferenceAtom,
    circleAtom,
    updateRelationAtom,
} from "@/components/Atoms";
import config from "@/Config";
import useScript from "@/components/useScript";
import { tnsLastUpdate } from "@/components/TermsOfService";
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
    const [userData, setUserData] = useAtom(userDataAtom);
    const [, setUserConnections] = useAtom(userConnectionsAtom);
    const [, setNewUserPopup] = useAtom(newUserPopupAtom);
    const [requestUserConnections] = useAtom(requestUserConnectionsAtom);
    const [, setJitsiToken] = useAtom(jitsiTokenAtom);
    const toast = useToast();
    const googleOneTapScript = useScript("https://accounts.google.com/gsi/client");
    const googleOneTapScriptFlag = "__googleOneTapScript__";
    const [googleOneTapDone, setGoogleOneTapDone] = useState(false);
    const [userLocation] = useAtom(userLocationAtom);
    const [updateRelation] = useAtom(updateRelationAtom);

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
                setJitsiToken(data.jitsiToken);
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

                // log("agreed_to_tnc: " + fromFsDate(data.userData.agreed_to_tnc), 0, true);
                // log("tnsLastUpdate: " + fromFsDate(tnsLastUpdate), 0, true);
                // log("agreed_to_tnc < tnsLastUpdate:" + (fromFsDate(data.userData.agreed_to_tnc) < fromFsDate(tnsLastUpdate)).toString(), 0, true);

                // show new profile guide
                if (
                    !data.userData.agreed_to_tnc ||
                    !data.userData.completed_guide ||
                    (!data.user.base && !data.userData.skipped_setting_location) ||
                    fromFsDate(data.userData.agreed_to_tnc) < fromFsDate(tnsLastUpdate) ||
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
    }, [setSignInStatus, setUid, setUser, setUserData, toast, uid, setJitsiToken, setNewUserPopup]);

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
        if (config.disableOnActive) return;
        if (!signInStatus.signedIn || !user?.id) return;
        if (userData?.incognito) return;

        // we want to do this once only unless circle ID changes

        let location =
            userLocation?.latitude && userLocation?.longitude
                ? new GeoPoint(userLocation.latitude, userLocation.longitude)
                : null;

        axios
            .put(`/circles/${user.id}/activity`, {
                active_in_circle: circle,
                active_in_video_conference: inVideoConference,
                location: location,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            })
            .catch((err) => {
                console.error(err);
            });

        const intervalId = setInterval(async () => {
            axios
                .put(`/circles/${user.id}/activity`, {
                    active_in_circle: circle,
                    active_in_video_conference: inVideoConference,
                    location: location,
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                })
                .catch((err) => {
                    console.error(err);
                });
        }, 60000); // update every minute
        return () => clearInterval(intervalId);
    }, [signInStatus?.signedIn, user?.id, circle?.id, inVideoConference, userLocation, userData?.incognito]); // we only want to trigger if circle ID changes hence compiler warning

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

    useEffect(() => {
        if (!signInStatus.signedIn || !user?.id) return;
        if (!updateRelation) return;
        axios.post(`/request_relation_update`, { circleId: updateRelation }).catch((err) => {
            console.error(err);
        });
    }, [updateRelation, signInStatus.signedIn, user?.id]);

    return null;
};

export default AccountManager;
