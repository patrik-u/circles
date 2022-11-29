/* global google */
//#region imports
import React, { useState, useEffect, useRef, useMemo, lazy, Suspense, useCallback } from "react";
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

import FloatingActionButtons from "./screens/main/old_FloatingActionButtons";
import { CircleMapEdges, CircleMarker, CirclesMapMarkers, LocationPickerMarker } from "./screens/main/MapMarkers";
import BlueBar from "./screens/main/old_BlueBar";
import CircleSearch from "./screens/main/Home";

import { atom, atomWithStorage, useAtom } from "jotai";
import { isMobileAtom } from "./components/Atoms";
import Home from "./screens/main/Home";
import AccountManager from "./components/AccountManager";
import TopMenu from "./screens/main/TopMenu";
//#endregion

const Circle = lazy(() => import("./screens/circle/Circle"));

const App = () => {
    log("App.render", -1);

    //#region fields
    const [isMobile, setIsMobile] = useAtom(isMobileAtom);
    //#endregion

    // //#region methods

    // const onConnect = (source, target, option) => {
    //     if (!isSignedIn) {
    //         mustLogInOnOpen();
    //         return;
    //     }

    //     // verify source is valid
    //     if (!source || !target || !user) return;
    //     if (source.id !== user.id) return;

    //     setConnectSource(source);
    //     setConnectTarget(target);
    //     setConnectOption(option);

    //     // show popup to connect
    //     connectOnOpen();
    // };

    // const onMapClick = (e) => {
    //     if (locationPickerActive) {
    //         // update position of picked location
    //         setLocationPickerPosition([e.lngLat.lng, e.lngLat.lat]);
    //     }
    // };

    // const getUserLocationSuccess = (location) => {
    //     // only update if location has changed more than 100 meters
    //     let newUserLocation = { latitude: location.coords.latitude, longitude: location.coords.longitude };
    //     if (userLocation.latitude && userLocation.longitude) {
    //         var preciseDistance = getPreciseDistance(userLocation, newUserLocation);
    //         log(
    //             `getUserLocationSuccess (diff: ${preciseDistance}, lat: ${location.coords.latitude}, lon: ${location.coords.longitude}, acc: ${location.coords.accuracy})`,
    //             0
    //         );
    //         // don't update if distance hasn't changed more than 50m
    //         if (preciseDistance < 100) return;
    //     }

    //     log(`getUserLocationSuccess (lat: ${location.coords.latitude}, lon: ${location.coords.longitude}, acc: ${location.coords.accuracy})`, 0);
    //     setUserLocation({ latitude: location.coords.latitude, longitude: location.coords.longitude });
    // };

    // const getUserLocationError = (error) => {
    //     log(`getUserLocationError: ${error.message}`, 0);
    //     // try again
    //     navigator.geolocation.getCurrentPosition(getUserLocationSuccess, getUserLocationError, {
    //         enableHighAccuracy: false,
    //         maximumAge: Infinity,
    //     });
    // };

    // const focusItem = (circle) => {
    //     mapRef.current.focusItem(circle);
    // };

    // //#endregion

    // detects if desktop resizes to switch to mobile
    const onWindowResize = useCallback(
        (params) => {
            setIsMobile(window.innerWidth <= 768);
        },
        [setIsMobile]
    );

    useEffect(() => {
        log("App2.useEffect 1");
        window.addEventListener("resize", onWindowResize);

        return () => {
            window.removeEventListener("resize", onWindowResize);
        };
    }, [isMobile, setIsMobile, onWindowResize]);

    return (
        <Flex width="100%" height="100%" flexDirection="column">
            <AccountManager />
            <TopMenu />
            <Suspense fallback={<Box></Box>}>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/circle/:circleId/*" element={<Circle />} />
                </Routes>
            </Suspense>
        </Flex>
    );
};

export default App;
