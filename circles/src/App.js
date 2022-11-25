/* global google */
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
import ThreeboxMap from "./components/ThreeboxMap";
import UserContext from "./components/UserContext";
import IsMobileContext from "./components/IsMobileContext";
import db, { auth } from "./components/Firebase";
import * as Sentry from "@sentry/react";
import { GoogleAuthProvider, onAuthStateChanged, onIdTokenChanged, signInWithCredential } from "firebase/auth";
import axios from "axios";
import { isMobile as detectIsMobile } from "react-device-detect";
import { toastError, log, clusterConnections } from "./components/Helpers";
import { parseCircleId } from "./components/Navigation";
import { CirclePicture } from "./components/CircleElements";
import { defaultContentWidth } from "./components/Constants";
import { collection, doc, onSnapshot, query, where } from "firebase/firestore";
import { Routes, Navigate, Route, useLocation, useSearchParams } from "react-router-dom";
import i18n from "i18n/Localization";
import config from "./Config";
import { RiLinksLine } from "react-icons/ri";

import FloatingActionButtons from "./screens/main/FloatingActionButtons";
import { CircleMapEdges, CircleMarker, CirclesMapMarkers, LocationPickerMarker } from "./screens/main/MapMarkers";
import BlueBar from "./screens/main/BlueBar";
import CircleSearch from "./screens/main/Home";
import TopMenu from "./screens/main/TopMenu";
import Circle from "./screens/circle/Circle";
//#endregion

const App = () => {
    //#region fields
    //const Circle = lazy(() => import("./screens/circle/Circle"));
    const CircleConnections = lazy(() => import("./screens/circle/CircleConnections"));
    const NewUserGuide = lazy(() => import("./screens/main/NewUserGuide"));
    const GraphView = lazy(() => import("./screens/main/GraphView"));

    const [userPublic, setUserPublic] = useState(null);
    const [userData, setUserData] = useState(null);
    const [userConnections, setUserConnections] = useState([]);
    const [connectionsToUser, setConnectionsToUser] = useState([]);
    const [chatCircle, setChatCircle] = useState(null);
    const user = useMemo(() => {
        if (userPublic) {
            // merge user connections of the same type
            let connections = clusterConnections(userConnections);
            let clusteredConnectionsToUser = clusterConnections(connectionsToUser, true);
            return {
                ...userData,
                ...userPublic,
                connections: connections ?? [],
                connectionsToUser: clusteredConnectionsToUser ?? [],
                public: userPublic,
                data: userData,
            };
        } else {
            return null;
        }
    }, [userPublic, userData, userConnections, connectionsToUser]);

    const [filterConnected, setFilterConnected] = useState(false);
    const [isSignedIn, setIsSignedIn] = useState(false);
    const [isSigningIn, setIsSigningIn] = useState(true);
    const [hasSignedOut, setHasSignedOut] = useState(false);
    const [gsiScriptLoaded, setGsiScriptLoaded] = useState(false);
    const [isMobile, setIsMobile] = useState(detectIsMobile);
    const [displayMode, setDisplayMode] = useState(isMobile ? "list" : "search");
    const [uid, setUid] = useState(null);
    const [circle, setCircle] = useState(null);
    const [circles, setCircles] = useState(null);
    const [circleConnections, setCircleConnections] = useState(null);
    const [userLocation, setUserLocation] = useState({ latitude: undefined, longitude: undefined });
    const mapRef = useRef(null);
    const toast = useToast();
    const [locationPickerActive, setLocationPickerActive] = useState(false);
    const [locationPickerPosition, setLocationPickerPosition] = useState();
    const { isOpen: mustLogInIsOpen, onOpen: mustLogInOnOpen, onClose: mustLogInOnClose } = useDisclosure();
    const mustLogInInitialRef = useRef();
    const location = useLocation();
    const [satelliteMode, setSatelliteMode] = useState(true);
    const [searchParams] = useSearchParams();
    const embed = searchParams.get("embed") === "true";
    const mapOnly = searchParams.get("mapOnly") === "true";
    const selectedCircleId = parseCircleId(location.pathname);
    const [isEmbedLoading] = useState(embed);

    const connectInitialRef = useRef(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const { isOpen: connectIsOpen, onOpen: connectOnOpen, onClose: connectOnClose } = useDisclosure();
    const [connectSource, setConnectSource] = useState();
    const [connectTarget, setConnectTarget] = useState();
    const [connectOption, setConnectOption] = useState("follow");
    const { isOpen: newProfileIsOpen, onOpen: newProfileOnOpen, onClose: newProfileOnClose } = useDisclosure();

    //#endregion

    //#region methods

    const onConnect = (source, target, option) => {
        if (!isSignedIn) {
            mustLogInOnOpen();
            return;
        }

        // verify source is valid
        if (!source || !target || !user) return;
        if (source.id !== user.id) return;

        setConnectSource(source);
        setConnectTarget(target);
        setConnectOption(option);

        // show popup to connect
        connectOnOpen();
    };

    const onSignedInWithGoogle = async (response) => {
        try {
            // authenticate user with google token
            let credential = GoogleAuthProvider.credential(response.credential);
            await signInWithCredential(auth, credential);
        } catch (error) {
            console.error("sign in with google failed", error);
            return;
        }
    };

    // initializes google sign in
    const initializeGSI = () => {
        if (!window.google || gsiScriptLoaded) {
            return;
        }

        google.accounts.id.initialize({
            client_id: config.googleId,
            cancel_on_tap_outside: false,
            callback: onSignedInWithGoogle,
            auto_select: true,
            context: "signin",
        });
        google.accounts.id.prompt((notification) => {
            if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
                // try next provider
                setIsSigningIn(false);
            } else if (notification.isDismissedMoment()) {
                // google successfully retrieves credentials or want to skip the retrieval flow
                //console.log(notification.getDismissedReason())
                //setIsSigningIn(true);
            } else {
                //setIsSigningIn(true);
            }
        });

        setGsiScriptLoaded(true);
    };

    // detects if desktop resizes to switch to mobile
    const onWindowResize = () => {
        setIsMobile(window.innerWidth <= 768);
    };

    const onSignOut = () => {
        auth.signOut();
        setHasSignedOut(true);
        setIsSignedIn(false);
        setUid(null);
        setUserPublic(null);
        setUserData(null);
    };

    const onMapClick = (e) => {
        if (locationPickerActive) {
            // update position of picked location
            setLocationPickerPosition([e.lngLat.lng, e.lngLat.lat]);
        }
    };

    const getUserLocationSuccess = (location) => {
        // only update if location has changed more than 100 meters
        let newUserLocation = { latitude: location.coords.latitude, longitude: location.coords.longitude };
        if (userLocation.latitude && userLocation.longitude) {
            var preciseDistance = getPreciseDistance(userLocation, newUserLocation);
            log(
                `getUserLocationSuccess (diff: ${preciseDistance}, lat: ${location.coords.latitude}, lon: ${location.coords.longitude}, acc: ${location.coords.accuracy})`,
                0
            );
            // don't update if distance hasn't changed more than 50m
            if (preciseDistance < 100) return;
        }

        log(`getUserLocationSuccess (lat: ${location.coords.latitude}, lon: ${location.coords.longitude}, acc: ${location.coords.accuracy})`, 0);
        setUserLocation({ latitude: location.coords.latitude, longitude: location.coords.longitude });
    };

    const getUserLocationError = (error) => {
        log(`getUserLocationError: ${error.message}`, 0);
        // try again
        navigator.geolocation.getCurrentPosition(getUserLocationSuccess, getUserLocationError, {
            enableHighAccuracy: false,
            maximumAge: Infinity,
        });
    };

    const focusItem = (circle) => {
        mapRef.current.focusItem(circle);
    };

    //#endregion

    log("App is rerendered");

    //#region useEffects
    //initialize firebase sign in
    useEffect(() => {
        log("useEffect 6", 0);
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

                log("setting uid " + null, 0);
                setUid(null);
                setIsSigningIn(false);
            }
        });

        const unsubscribeOnIdTokenChanged = onIdTokenChanged(auth, async (inUser) => {
            if (inUser) {
                // token is refreshed
                let idToken = await inUser.getIdToken();
                axios.defaults.headers.common["Authorization"] = `Bearer ${idToken}`;
            }
        });

        if (!detectIsMobile) {
            window.addEventListener("resize", onWindowResize);
        }

        return () => {
            // @ts-ignore
            window.google?.accounts.id.cancel();
            document.getElementById("google-client-script")?.remove();
            if (!detectIsMobile) {
                window.removeEventListener("resize", onWindowResize);
            }
            if (unsubscribeOnAuthStateChanged) {
                unsubscribeOnAuthStateChanged();
            }
            if (unsubscribeOnIdTokenChanged) {
                unsubscribeOnIdTokenChanged();
            }
        };
    }, []);

    useEffect(() => {
        log("useEffect 7", 0);
        let watchPositionId = null;
        if (!isSigningIn) {
            // request permission to get geolocation
            if (!embed && navigator.geolocation) {
                if (navigator.permissions && navigator.permissions.query) {
                    navigator.permissions.query({ name: "geolocation" }).then(function (result) {
                        log(`Query geolocation result: ${result.state}`, 0);
                        if (result.state === "granted") {
                            // do a fast call and a more high precision later
                            navigator.geolocation.getCurrentPosition(getUserLocationSuccess, getUserLocationError, {
                                enableHighAccuracy: false,
                                timeout: 2000,
                                maximumAge: Infinity,
                            });

                            watchPositionId = navigator.geolocation.watchPosition(getUserLocationSuccess);
                        } else if (result.state === "prompt") {
                            navigator.geolocation.getCurrentPosition(getUserLocationSuccess, getUserLocationError, {
                                enableHighAccuracy: true,
                                timeout: 60000,
                                maximumAge: 0,
                            });

                            watchPositionId = navigator.geolocation.watchPosition(getUserLocationSuccess);
                            //console.log(result.state);
                        } else if (result.state === "denied") {
                            // TODO show instructions to enable location
                        }
                        result.onchange = function () {
                            log(`Query geolocation change: ${result.state}`, 0);
                        };
                    });
                } else {
                    // iOS safari
                    // do a fast call and a more high precision later
                    navigator.geolocation.getCurrentPosition(getUserLocationSuccess, getUserLocationError, {
                        enableHighAccuracy: false,
                        timeout: 2000,
                        maximumAge: Infinity,
                    });

                    watchPositionId = navigator.geolocation.watchPosition(getUserLocationSuccess);
                }
            } else {
                log("geo location not available", 0);
            }
        }

        return () => {
            if (watchPositionId) {
                navigator.geolocation.clearWatch(watchPositionId);
            }
        };
    }, [isSigningIn, embed]);

    // initialize sign in
    useEffect(() => {
        log("useEffect 8", 0);
        let unsubscribeGetUserConnections = null;
        let unsubscribeGetUserData = null;
        let unsubscribeGetUser = null;
        let firstGetUser = true;
        let firstGetUserData = true;
        let firstGetUserConnections = true;

        if (uid) {
            axios
                .get(`/signin`)
                .then((getUserResult) => {
                    let userData = getUserResult.data;
                    if (userData.error) {
                        if (uid !== null) {
                            setUid((previousUid) => null);
                        }
                        setUserPublic((previousUser) => null);
                        setUserData((previousUser) => null);
                        setIsSignedIn(false);
                        setIsSigningIn(false);
                        toastError(toast, i18n.t("error1"));
                        Sentry.captureException(userData.error);
                        return;
                    }

                    setUserPublic((previousUser) => ({ ...userData.public, id: uid }));
                    setUserData((previousUser) => userData.data);
                    setUserConnections((previousUser) => userData.connections);
                    setConnectionsToUser((previousUser) => userData.connectionsToUser);

                    // subscribe to user public data
                    unsubscribeGetUser = onSnapshot(doc(db, "circles", uid), (doc) => {
                        var updatedUser = doc.data();

                        // ignore setting user data first time as we've already done so
                        if (firstGetUser) {
                            firstGetUser = false;
                            return;
                        }

                        //console.log("getting updated user data: ", JSON.stringify(updatedUserPublic, null, 2));
                        setUserPublic((currentUser) => ({
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

                    // subscribe to user connections
                    var q2 = query(collection(db, "connections"), where("circle_ids", "array-contains", uid));
                    unsubscribeGetUserConnections = onSnapshot(q2, (snap) => {
                        // ignore setting user connection data first time as we've already done so
                        if (firstGetUserConnections) {
                            firstGetUserConnections = false;
                            return;
                        }

                        const connections = snap.docs?.map((doc) => doc.data()) ?? [];
                        const updatedUserConnections = connections.filter((x) => x.source.id === uid);
                        const updatedConnectionsToUser = connections.filter((x) => x.target.id === uid);

                        //console.log("getting updated user details: ", JSON.stringify(updatedUserDetails, null, 2));
                        if (updatedUserConnections) {
                            log("updating user connections", 0);
                            setUserConnections((currentUser) => updatedUserConnections);
                        }
                        if (updatedConnectionsToUser) {
                            setConnectionsToUser((currentUser) => updatedConnectionsToUser);
                        }
                    });

                    setIsSignedIn(true);
                    setIsSigningIn(false);
                    setHasSignedOut(false);

                    //let isProd = config.environment === "prod";
                    let alwaysShowGuide = false; //!isProd;

                    // show new profile guide
                    if (!userData?.data?.agreed_to_tnc || !userData?.data?.completed_guide || alwaysShowGuide) {
                        newProfileOnOpen();
                    }
                })
                .catch((error) => {
                    toastError(toast, i18n.t("error1"));
                    if (uid !== null) {
                        setUid((previousUid) => null);
                    }
                    setUserPublic((previousUser) => null);
                    setUserData((previousUser) => null);
                    setIsSignedIn(false);
                    setIsSigningIn(false);
                    Sentry.captureException(error);
                });
        } else {
            //onSignedOut(); // causes loop
        }

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
    }, [uid, toast, newProfileOnOpen]);

    // initialize Sentry crash reporting
    useEffect(() => {
        log("useEffect 9", 0);
        Sentry.setUser(user?.id ? { id: user.id, username: user.name, email: user.email } : null);
    }, [user?.id, user?.name, user?.email]);

    useEffect(() => {
        log("useEffect 11", 0);
        Sentry.addBreadcrumb({
            category: "navigation",
            message: `Switching to page ${location.pathname}`,
            level: Sentry.Severity.Info,
        });
        // CONNECT123 we can track circle history here
    }, [location]);

    // initialize google one tap
    useEffect(() => {
        // TODO only do this if regular sign-in failed
        log("useEffect 5", 0);
        if (isSignedIn || isSigningIn || hasSignedOut || embed) return;

        const el = document.createElement("script");
        el.setAttribute("src", "https://accounts.google.com/gsi/client");
        el.async = true;
        el.onload = () => initializeGSI();
        el.id = "google-client-script";
        document.querySelector("body").appendChild(el);

        return () => {
            window.google?.accounts.id.cancel();
            document.getElementById("google-client-script")?.remove();
        };
    }, [isSigningIn, isSignedIn, hasSignedOut, embed]);

    const [contentWidth, setContentWidth] = useState(isMobile ? "100%" : defaultContentWidth);

    //#endregion

    return (
        <UserContext.Provider value={user}>
            <IsMobileContext.Provider value={isMobile}>
                <Flex
                    width="100vw"
                    minWidth="100vw"
                    maxWidth="100vw"
                    height="100%"
                    minHeight="100%"
                    maxHeight="100%"
                    flexDirection="row"
                    overflow="hidden"
                    background={embed ? "transparent" : "white"}
                >
                    {/* Content panel */}
                    <Suspense fallback={<Box />}>
                        <Routes>
                            <Route
                                path="/circle/:circleId/*"
                                element={
                                    <Circle
                                        circle={circle}
                                        setCircle={setCircle}
                                        circles={circles}
                                        setCircles={setCircles}
                                        circleConnections={circleConnections}
                                        setCircleConnections={setCircleConnections}
                                        displayMode={displayMode}
                                        setDisplayMode={setDisplayMode}
                                        isSignedIn={isSignedIn}
                                        isSigningIn={isSigningIn}
                                        mustLogInOnOpen={mustLogInOnOpen}
                                        userLocation={userLocation}
                                        locationPickerPosition={locationPickerPosition}
                                        setLocationPickerActive={setLocationPickerActive}
                                        setLocationPickerPosition={setLocationPickerPosition}
                                        focusItem={focusItem}
                                        filterConnected={filterConnected}
                                        setFilterConnected={setFilterConnected}
                                        setContentWidth={setContentWidth}
                                        contentWidth={contentWidth}
                                        onConnect={onConnect}
                                        isConnecting={isConnecting}
                                        setChatCircle={setChatCircle}
                                        onSignOut={onSignOut}
                                        gsiScriptLoaded={gsiScriptLoaded}
                                        satelliteMode={satelliteMode}
                                        chatCircle={chatCircle}
                                    />
                                }
                            />
                        </Routes>
                    </Suspense>

                    {/* Map/search/graph panel */}
                    <Flex
                        id="mapRegion"
                        width="100%"
                        top={isMobile ? "114px" : "0px"}
                        height={isMobile ? "calc(100% - 164px)" : "100%"}
                        minHeight={isMobile ? "calc(100% - 164px)" : "100%"}
                        position={isMobile ? "absolute" : "relative"}
                        backgroundColor="#06090e"
                    >
                        {!mapOnly && !isMobile && (
                            <TopMenu
                                circle={circle}
                                setCircle={setCircle}
                                onSignOutClick={onSignOut}
                                isSigningIn={isSigningIn}
                                isSignedIn={isSignedIn}
                                gsiScriptLoaded={gsiScriptLoaded}
                                satelliteMode={satelliteMode}
                                chatCircle={chatCircle}
                                displayMode={displayMode}
                            />
                        )}

                        {displayMode === "search" && <CircleSearch circle={circle} setCircle={setCircle} />}

                        {displayMode === "map" && (
                            <ThreeboxMap ref={mapRef} onMapClick={onMapClick} satelliteMode={satelliteMode}>
                                {circle && circles?.length > 0 && <CircleMapEdges circle={circle} circles={circles} />}
                                {circle && <CircleMarker circle={circle} />}
                                {circles?.length > 0 && <CirclesMapMarkers circles={circles} />}
                                {locationPickerActive && locationPickerPosition && <LocationPickerMarker position={locationPickerPosition} />}
                            </ThreeboxMap>
                        )}

                        {/* Graph panel */}
                        {displayMode === "graph" && (
                            <Box
                                id="graphRegion"
                                width="100%"
                                height="100%"
                                minHeight="100%"
                                position={isMobile ? "absolute" : "relative"}
                                backgroundColor="black"
                            >
                                <Suspense fallback={<div></div>}>
                                    <GraphView circle={circle} circles={circles} circleConnections={circleConnections} />
                                </Suspense>
                            </Box>
                        )}
                    </Flex>

                    {/* Floating action buttons */}
                    <FloatingActionButtons
                        displayMode={displayMode}
                        setDisplayMode={setDisplayMode}
                        setSatelliteMode={setSatelliteMode}
                        satelliteMode={satelliteMode}
                        mapOnly={mapOnly}
                    />

                    {/* Circle connections */}
                    <Modal initialFocusRef={connectInitialRef} isOpen={connectIsOpen} onClose={connectOnClose} size="xl" isLazy>
                        <ModalOverlay />
                        <ModalContent borderRadius="25px">
                            <ModalHeader>
                                <Flex>
                                    <Box flexShrink="0" marginRight="5px">
                                        <HStack spacing="10px">
                                            <CirclePicture circle={connectSource} size={30} />
                                            <RiLinksLine size={18} />
                                            <CirclePicture circle={connectTarget} size={30} />
                                        </HStack>
                                    </Box>
                                    <Text marginLeft="10px">
                                        {i18n.t("Connections to")} {connectTarget?.name}
                                    </Text>
                                </Flex>
                            </ModalHeader>
                            <ModalCloseButton />
                            <ModalBody marginBottom="20px">
                                {connectIsOpen && (
                                    <Suspense fallback={<Box></Box>}>
                                        <CircleConnections
                                            source={connectSource}
                                            target={connectTarget}
                                            option={connectOption}
                                            isConnecting={isConnecting}
                                            setIsConnecting={setIsConnecting}
                                            onClose={connectOnClose}
                                        />
                                    </Suspense>
                                )}
                            </ModalBody>
                        </ModalContent>
                    </Modal>

                    {/* Change maker profile guide */}
                    <Modal isOpen={newProfileIsOpen} onClose={newProfileOnClose} size="xl" isLazy closeOnOverlayClick={false}>
                        <ModalOverlay />
                        {newProfileIsOpen && (
                            <Suspense fallback={<Box />}>
                                <NewUserGuide onClose={newProfileOnClose} />
                            </Suspense>
                        )}
                    </Modal>

                    {/* Modal popup - Must be logged in */}
                    <Modal initialFocusRef={mustLogInInitialRef} isOpen={mustLogInIsOpen} onClose={mustLogInOnClose} size="lg">
                        <ModalOverlay />
                        <ModalContent borderRadius="25px">
                            <ModalHeader>{i18n.t("You need to be logged in")}</ModalHeader>
                            <ModalCloseButton />
                            <ModalBody>
                                <Text fontSize="18px">{i18n.t("You need to be logged in to do this")}</Text>
                            </ModalBody>

                            <ModalFooter>
                                <Button ref={mustLogInInitialRef} colorScheme="blue" mr={3} borderRadius="25px" onClick={mustLogInOnClose}>
                                    {i18n.t("Ok")}
                                </Button>
                            </ModalFooter>
                        </ModalContent>
                    </Modal>
                </Flex>
            </IsMobileContext.Provider>
        </UserContext.Provider>
    );
};

export default App;
