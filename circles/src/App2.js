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

import FloatingActionButtons from "./screens/main/FloatingActionButtons";
import { CircleMapEdges, CircleMarker, CirclesMapMarkers, LocationPickerMarker } from "./screens/main/MapMarkers";
import BlueBar from "./screens/main/BlueBar";
import CircleSearch from "./screens/main/Home";
import Circle from "./screens/circle/Circle";

import { atom, atomWithStorage, useAtom } from "jotai";
import { isMobileAtom } from "./components/Atoms";
import Home from "./screens/main/Home";
import AccountManager from "./components/AccountManager";
import TopMenu from "./screens/main/TopMenu2";
//#endregion

const App = () => {
    //#region fields
    const [isMobile, setIsMobile] = useAtom(isMobileAtom);
    const Circle = lazy(() => import("./screens/circle/Circle2"));
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

    log("App is rerendered");

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
        <Flex width="100vw" height="100vh" flexDirection="column">
            <AccountManager />
            <TopMenu />
            <Suspense fallback={<Box></Box>}>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/circle/:circleId/*" element={<Circle />} />
                </Routes>
            </Suspense>
        </Flex>

        // <Flex
        //     width="100vw"
        //     minWidth="100vw"
        //     maxWidth="100vw"
        //     height="100%"
        //     minHeight="100%"
        //     maxHeight="100%"
        //     flexDirection="row"
        //     overflow="hidden"
        //     background={embed ? "transparent" : "white"}
        // >
        //     {/* Content panel */}
        //     <Suspense fallback={<Box />}>
        //         <Routes>
        //             <Route
        //                 path="/circle/:circleId/*"
        //                 element={
        //                     <Circle
        //                         circle={circle}
        //                         setCircle={setCircle}
        //                         circles={circles}
        //                         setCircles={setCircles}
        //                         circleConnections={circleConnections}
        //                         setCircleConnections={setCircleConnections}
        //                         displayMode={displayMode}
        //                         setDisplayMode={setDisplayMode}
        //                         isSignedIn={isSignedIn}
        //                         isSigningIn={isSigningIn}
        //                         mustLogInOnOpen={mustLogInOnOpen}
        //                         userLocation={userLocation}
        //                         locationPickerPosition={locationPickerPosition}
        //                         setLocationPickerActive={setLocationPickerActive}
        //                         setLocationPickerPosition={setLocationPickerPosition}
        //                         focusItem={focusItem}
        //                         filterConnected={filterConnected}
        //                         setFilterConnected={setFilterConnected}
        //                         setContentWidth={setContentWidth}
        //                         contentWidth={contentWidth}
        //                         onConnect={onConnect}
        //                         isConnecting={isConnecting}
        //                         setChatCircle={setChatCircle}
        //                         onSignOut={onSignOut}
        //                         gsiScriptLoaded={gsiScriptLoaded}
        //                         satelliteMode={satelliteMode}
        //                         chatCircle={chatCircle}
        //                     />
        //                 }
        //             />
        //         </Routes>
        //     </Suspense>

        //     {/* Map/search/graph panel */}
        //     <Flex
        //         id="mapRegion"
        //         width="100%"
        //         top={isMobile ? "114px" : "0px"}
        //         height={isMobile ? "calc(100% - 164px)" : "100%"}
        //         minHeight={isMobile ? "calc(100% - 164px)" : "100%"}
        //         position={isMobile ? "absolute" : "relative"}
        //         backgroundColor="#06090e"
        //     >
        //         {!mapOnly && !isMobile && (
        //             <TopMenu
        //                 circle={circle}
        //                 setCircle={setCircle}
        //                 onSignOutClick={onSignOut}
        //                 isSigningIn={isSigningIn}
        //                 isSignedIn={isSignedIn}
        //                 gsiScriptLoaded={gsiScriptLoaded}
        //                 satelliteMode={satelliteMode}
        //                 chatCircle={chatCircle}
        //                 displayMode={displayMode}
        //             />
        //         )}

        //         {displayMode === "search" && <CircleSearch circle={circle} setCircle={setCircle} />}

        //         {displayMode === "map" && (
        //             <ThreeboxMap ref={mapRef} onMapClick={onMapClick} satelliteMode={satelliteMode}>
        //                 {circle && circles?.length > 0 && <CircleMapEdges circle={circle} circles={circles} />}
        //                 {circle && <CircleMarker circle={circle} />}
        //                 {circles?.length > 0 && <CirclesMapMarkers circles={circles} />}
        //                 {locationPickerActive && locationPickerPosition && <LocationPickerMarker position={locationPickerPosition} />}
        //             </ThreeboxMap>
        //         )}

        //         {/* Graph panel */}
        //         {displayMode === "graph" && (
        //             <Box
        //                 id="graphRegion"
        //                 width="100%"
        //                 height="100%"
        //                 minHeight="100%"
        //                 position={isMobile ? "absolute" : "relative"}
        //                 backgroundColor="black"
        //             >
        //                 <Suspense fallback={<div></div>}>
        //                     <GraphView circle={circle} circles={circles} circleConnections={circleConnections} />
        //                 </Suspense>
        //             </Box>
        //         )}
        //     </Flex>

        //     {/* Floating action buttons */}
        //     <FloatingActionButtons
        //         displayMode={displayMode}
        //         setDisplayMode={setDisplayMode}
        //         setSatelliteMode={setSatelliteMode}
        //         satelliteMode={satelliteMode}
        //         mapOnly={mapOnly}
        //     />

        //     {/* Circle connections */}
        //     <Modal initialFocusRef={connectInitialRef} isOpen={connectIsOpen} onClose={connectOnClose} size="xl" isLazy>
        //         <ModalOverlay />
        //         <ModalContent borderRadius="25px">
        //             <ModalHeader>
        //                 <Flex>
        //                     <Box flexShrink="0" marginRight="5px">
        //                         <HStack spacing="10px">
        //                             <CirclePicture circle={connectSource} size={30} />
        //                             <RiLinksLine size={18} />
        //                             <CirclePicture circle={connectTarget} size={30} />
        //                         </HStack>
        //                     </Box>
        //                     <Text marginLeft="10px">
        //                         {i18n.t("Connections to")} {connectTarget?.name}
        //                     </Text>
        //                 </Flex>
        //             </ModalHeader>
        //             <ModalCloseButton />
        //             <ModalBody marginBottom="20px">
        //                 {connectIsOpen && (
        //                     <Suspense fallback={<Box></Box>}>
        //                         <CircleConnections
        //                             source={connectSource}
        //                             target={connectTarget}
        //                             option={connectOption}
        //                             isConnecting={isConnecting}
        //                             setIsConnecting={setIsConnecting}
        //                             onClose={connectOnClose}
        //                         />
        //                     </Suspense>
        //                 )}
        //             </ModalBody>
        //         </ModalContent>
        //     </Modal>

        //     {/* Change maker profile guide */}
        //     <Modal isOpen={newProfileIsOpen} onClose={newProfileOnClose} size="xl" isLazy closeOnOverlayClick={false}>
        //         <ModalOverlay />
        //         {newProfileIsOpen && (
        //             <Suspense fallback={<Box />}>
        //                 <NewUserGuide onClose={newProfileOnClose} />
        //             </Suspense>
        //         )}
        //     </Modal>

        //     {/* Modal popup - Must be logged in */}
        //     <Modal initialFocusRef={mustLogInInitialRef} isOpen={mustLogInIsOpen} onClose={mustLogInOnClose} size="lg">
        //         <ModalOverlay />
        //         <ModalContent borderRadius="25px">
        //             <ModalHeader>{i18n.t("You need to be logged in")}</ModalHeader>
        //             <ModalCloseButton />
        //             <ModalBody>
        //                 <Text fontSize="18px">{i18n.t("You need to be logged in to do this")}</Text>
        //             </ModalBody>

        //             <ModalFooter>
        //                 <Button ref={mustLogInInitialRef} colorScheme="blue" mr={3} borderRadius="25px" onClick={mustLogInOnClose}>
        //                     {i18n.t("Ok")}
        //                 </Button>
        //             </ModalFooter>
        //         </ModalContent>
        //     </Modal>
        // </Flex>
    );
};

export default App;
