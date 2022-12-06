//#region imports
import { useEffect, useState, useCallback } from "react";
import { useToast } from "@chakra-ui/react";
import db, { auth } from "components/Firebase";
import * as Sentry from "@sentry/react";
import { signOut, onAuthStateChanged, onIdTokenChanged, signInWithCredential, GoogleAuthProvider } from "firebase/auth";
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
export const LocationManager = () => {
    log("LocationManager.render", -1);

    const [userLocation, setUserLocation] = useAtom(userLocationAtom);
    //#region useEffects

    const getUserLocationSuccess = useCallback(
        (location) => {
            let newUserLocation = { latitude: location.coords.latitude, longitude: location.coords.longitude };
            if (userLocation.latitude && userLocation.longitude) {
                // check how much location has changed since previous update
                var preciseDistance = getPreciseDistance(userLocation, newUserLocation);
                log(
                    `getUserLocationSuccess (diff: ${preciseDistance}, lat: ${location.coords.latitude}, lon: ${location.coords.longitude}, acc: ${location.coords.accuracy})`,
                    0
                );
                // only update if location has changed more than 100 meters
                if (preciseDistance < 100) return;
            }

            log(`getUserLocationSuccess (lat: ${location.coords.latitude}, lon: ${location.coords.longitude}, acc: ${location.coords.accuracy})`, 0);
            setUserLocation({ latitude: location.coords.latitude, longitude: location.coords.longitude });
        },
        [userLocation, setUserLocation]
    );

    const getUserLocationError = useCallback(
        (error) => {
            log(`getUserLocationError: ${error.message}`, 0);
            // try again
            navigator.geolocation.getCurrentPosition(getUserLocationSuccess, getUserLocationError, {
                enableHighAccuracy: false,
                maximumAge: Infinity,
            });
        },
        [getUserLocationSuccess]
    );

    useEffect(() => {
        log("LocationManager.useEffect", 0);
        let watchPositionId = null;

        // request permission to get geolocation
        if (navigator.geolocation) {
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

        return () => {
            if (watchPositionId) {
                navigator.geolocation.clearWatch(watchPositionId);
            }
        };
    }, [getUserLocationSuccess, getUserLocationError]);

    //#endregion

    return null;
};

export default LocationManager;
