// //#region imports
// import React, { useEffect, useContext, lazy, Suspense } from "react";
// import {
//     Flex,
//     Box,
//     Text,
//     Modal,
//     ModalOverlay,
//     ModalContent,
//     ModalHeader,
//     ModalFooter,
//     ModalBody,
//     ModalCloseButton,
//     Button,
//     useToast,
//     HStack,
//     useDisclosure,
// } from "@chakra-ui/react";
// import UserContext from "../../components/UserContext";
// import db from "../../components/Firebase";
// import axios from "axios";
// import { log, fromFsDate, getDateWithoutTime } from "../../components/Helpers";
// import { collection, doc, onSnapshot, query, where } from "firebase/firestore";
// import { Routes, Route, useParams } from "react-router-dom";
// import { Scrollbars } from "react-custom-scrollbars-2";
// import { defaultContentWidth } from "../../components/Constants";
// import IsMobileContext from "../../components/IsMobileContext";
// import LeftNavigator from "../main/LeftNavigator";
// import BottomNavigator from "../main/BottomNavigator";
// import TopMenu from "../main/TopMenu";

// // PWA123
// //import CircleHome from "./CircleHome";
// // import Circles from "./Circles";
// // import CircleSettings from "./CircleSettings";
// // import CircleChat from "./CircleChat";
// // import CircleCreateNew from "./CircleCreateNew";
// //#endregion

// export const Circle = ({
//     circle,
//     setCircle,
//     circles,
//     setCircles,
//     circleConnections,
//     setCircleConnections,
//     displayMode,
//     setDisplayMode,
//     isSignedIn,
//     isSigningIn,
//     mustLogInOnOpen,
//     userLocation,
//     locationPickerPosition,
//     setLocationPickerActive,
//     setLocationPickerPosition,
//     focusItem,
//     filterConnected,
//     setFilterConnected,
//     contentWidth,
//     setContentWidth,
//     onConnect,
//     isConnecting,
//     setChatCircle,
//     onSignOut,
//     gsiScriptLoaded,
//     satelliteMode,
//     chatCircle,
// }) => {
//     const user = useContext(UserContext);
//     const { circleId } = useParams();
//     const isMobile = useContext(IsMobileContext);

//     // PWA123
//     const CircleHome = lazy(() => import("./CircleHome"));
//     const Circles = lazy(() => import("./Circles"));
//     const CircleSettings = lazy(() => import("./CircleSettings"));
//     const CircleChat = lazy(() => import("./CircleChat"));
//     const CircleCreateNew = lazy(() => import("./CircleCreateNew"));
//     const CircleAdmin = lazy(() => import("./CircleAdmin"));

//     useEffect(() => {
//         log("Circle.useEffect 1", 0);
//         if (!circleId || circleId === "undefined") {
//             //navigate(routes.home);
//             setCircles([]);
//             setCircleConnections([]);
//             return;
//         }

//         let unsubscribeGetCircle = null;

//         // subscribe to circle
//         unsubscribeGetCircle = onSnapshot(doc(db, "circles", circleId), (doc) => {
//             var newCircle = doc.data();
//             if (!doc.exists) {
//                 // TODO display something about circle not existing
//                 return;
//             }
//             newCircle.id = doc.id;
//             setCircle((currentCircle) => newCircle);
//         });

//         // show all connections on the map
//         // subscribe to connected circles
//         let q = query(collection(db, "connections"), where("circle_ids", "array-contains", circleId));

//         let unsubscribeGetCircles = onSnapshot(q, (snap) => {
//             let circleConnections = snap.docs.map((doc) => doc.data());

//             // merge circle connections of the same type
//             let connections = [];
//             if (Array.isArray(circleConnections)) {
//                 let seen = {};
//                 connections = circleConnections?.filter((entry) => {
//                     var previous;

//                     // wether to use source or target depends
//                     let parentCircleIsSource = entry.source.id === circleId;
//                     let mergeId = parentCircleIsSource ? entry.target.id : entry.source.id;

//                     // have we seen this label before?
//                     if (seen.hasOwnProperty(mergeId)) {
//                         // yes, grab it and add this data to it
//                         previous = seen[mergeId];
//                         previous.type.push(entry.type);

//                         // don't keep this entry, we've merged it into the previous one
//                         return false;
//                     }

//                     // entry.type probably isn't an array; make it one for consistency
//                     if (!Array.isArray(entry.type)) {
//                         entry.type = [entry.type];
//                     }

//                     entry.display_circle = parentCircleIsSource ? entry.target : entry.source;

//                     // remember that we've seen it
//                     seen[mergeId] = entry;
//                     return true;
//                 });
//             }

//             setCircleConnections(connections);

//             let startDate = getDateWithoutTime(); // today
//             setCircles(
//                 connections
//                     ?.map((x) => x.display_circle)
//                     .filter((x) => {
//                         // remove old events
//                         if (x.type === "event") {
//                             return fromFsDate(x.starts_at) > startDate;
//                         } else {
//                             return true;
//                         }
//                     })
//             );
//         });

//         return () => {
//             if (unsubscribeGetCircle) {
//                 unsubscribeGetCircle();
//             }
//             if (unsubscribeGetCircles) {
//                 unsubscribeGetCircles();
//             }
//             setCircles([]);
//             setCircleConnections([]);
//         };
//     }, [circleId, setCircle, setDisplayMode, setCircles, setCircleConnections, displayMode, isMobile]);

//     useEffect(() => {
//         log("Circle.useEffect 2", 0);
//         if (!user?.id || !circleId) return;
//         if (circleId === "earth") return;

//         log("Circle.seen");

//         // mark circle as seen
//         axios
//             .post(`/seen`, {
//                 category: "any",
//                 circleId: circleId,
//             })
//             .then((x) => {})
//             .catch((error) => {});
//     }, [user?.id, circleId]);

//     return circle ? (
//         <>
//             {!isMobile && displayMode !== "search" && <LeftNavigator circle={circle} setCircle={setCircle} isSigningIn={isSigningIn} />}

//             <Flex
//                 flexDirection={isMobile ? "column" : "row"}
//                 width={circle && displayMode !== "search" ? contentWidth : "0px"}
//                 maxWidth={circle && displayMode !== "search" ? contentWidth : "0px"}
//                 minWidth={circle && displayMode !== "search" ? contentWidth : "0px"}
//             >
//                 {isMobile && (
//                     <TopMenu
//                         circle={circle}
//                         setCircle={setCircle}
//                         onSignOutClick={onSignOut}
//                         isSigningIn={isSigningIn}
//                         isSignedIn={isSignedIn}
//                         gsiScriptLoaded={gsiScriptLoaded}
//                         satelliteMode={satelliteMode}
//                         displayMode={displayMode}
//                         chatCircle={chatCircle}
//                     />
//                 )}
//                 <Scrollbars autoHide>
//                     <Suspense fallback={<div></div>}>
//                         <Routes>
//                             <Route
//                                 path="/"
//                                 element={
//                                     <CircleHome
//                                         circle={circle}
//                                         setCircle={setCircle}
//                                         circles={circles}
//                                         setCircles={setCircles}
//                                         circleConnections={circleConnections}
//                                         displayMode={displayMode}
//                                         setDisplayMode={setDisplayMode}
//                                         isSignedIn={isSignedIn}
//                                         isSigningIn={isSigningIn}
//                                         mustLogInOnOpen={mustLogInOnOpen}
//                                         focusItem={focusItem}
//                                         userLocation={userLocation}
//                                         onConnect={onConnect}
//                                         isConnecting={isConnecting}
//                                     />
//                                 }
//                             />
//                             <Route
//                                 path="/circles/*"
//                                 element={
//                                     <Circles
//                                         circle={circle}
//                                         setCircle={setCircle}
//                                         circles={circles}
//                                         setCircles={setCircles}
//                                         circleConnections={circleConnections}
//                                         displayMode={displayMode}
//                                         setDisplayMode={setDisplayMode}
//                                         userLocation={userLocation}
//                                         locationPickerPosition={locationPickerPosition}
//                                         setLocationPickerActive={setLocationPickerActive}
//                                         setLocationPickerPosition={setLocationPickerPosition}
//                                         isSignedIn={isSignedIn}
//                                         isSigningIn={isSigningIn}
//                                         mustLogInOnOpen={mustLogInOnOpen}
//                                         focusItem={focusItem}
//                                         filterConnected={filterConnected}
//                                         setFilterConnected={setFilterConnected}
//                                         onConnect={onConnect}
//                                         isConnecting={isConnecting}
//                                         type="circle"
//                                     />
//                                 }
//                             />
//                             <Route
//                                 path="/events/*"
//                                 element={
//                                     <Circles
//                                         circle={circle}
//                                         setCircle={setCircle}
//                                         circles={circles}
//                                         setCircles={setCircles}
//                                         circleConnections={circleConnections}
//                                         displayMode={displayMode}
//                                         setDisplayMode={setDisplayMode}
//                                         userLocation={userLocation}
//                                         locationPickerPosition={locationPickerPosition}
//                                         setLocationPickerActive={setLocationPickerActive}
//                                         setLocationPickerPosition={setLocationPickerPosition}
//                                         isSignedIn={isSignedIn}
//                                         isSigningIn={isSigningIn}
//                                         mustLogInOnOpen={mustLogInOnOpen}
//                                         focusItem={focusItem}
//                                         filterConnected={filterConnected}
//                                         setFilterConnected={setFilterConnected}
//                                         onConnect={onConnect}
//                                         isConnecting={isConnecting}
//                                         type="event"
//                                     />
//                                 }
//                             />
//                             <Route
//                                 path="/rooms/*"
//                                 element={
//                                     <Circles
//                                         circle={circle}
//                                         setCircle={setCircle}
//                                         circles={circles}
//                                         setCircles={setCircles}
//                                         circleConnections={circleConnections}
//                                         displayMode={displayMode}
//                                         setDisplayMode={setDisplayMode}
//                                         userLocation={userLocation}
//                                         locationPickerPosition={locationPickerPosition}
//                                         setLocationPickerActive={setLocationPickerActive}
//                                         setLocationPickerPosition={setLocationPickerPosition}
//                                         isSignedIn={isSignedIn}
//                                         isSigningIn={isSigningIn}
//                                         mustLogInOnOpen={mustLogInOnOpen}
//                                         focusItem={focusItem}
//                                         filterConnected={filterConnected}
//                                         setFilterConnected={setFilterConnected}
//                                         onConnect={onConnect}
//                                         isConnecting={isConnecting}
//                                         type="room"
//                                     />
//                                 }
//                             />
//                             <Route
//                                 path="/users/*"
//                                 element={
//                                     <Circles
//                                         circle={circle}
//                                         setCircle={setCircle}
//                                         circles={circles}
//                                         setCircles={setCircles}
//                                         circleConnections={circleConnections}
//                                         displayMode={displayMode}
//                                         setDisplayMode={setDisplayMode}
//                                         userLocation={userLocation}
//                                         locationPickerPosition={locationPickerPosition}
//                                         setLocationPickerActive={setLocationPickerActive}
//                                         setLocationPickerPosition={setLocationPickerPosition}
//                                         isSignedIn={isSignedIn}
//                                         isSigningIn={isSigningIn}
//                                         mustLogInOnOpen={mustLogInOnOpen}
//                                         focusItem={focusItem}
//                                         filterConnected={filterConnected}
//                                         setFilterConnected={setFilterConnected}
//                                         onConnect={onConnect}
//                                         isConnecting={isConnecting}
//                                         type="user"
//                                     />
//                                 }
//                             />
//                             <Route
//                                 path="/settings/*"
//                                 element={
//                                     <CircleSettings
//                                         circle={circle}
//                                         setCircle={setCircle}
//                                         setDisplayMode={setDisplayMode}
//                                         isSignedIn={isSignedIn}
//                                         isSigningIn={isSigningIn}
//                                         mustLogInOnOpen={mustLogInOnOpen}
//                                         locationPickerPosition={locationPickerPosition}
//                                         setLocationPickerActive={setLocationPickerActive}
//                                         setContentWidth={setContentWidth}
//                                         onConnect={onConnect}
//                                     />
//                                 }
//                             />
//                             <Route
//                                 path="/chat/*"
//                                 element={
//                                     <CircleChat
//                                         circle={circle}
//                                         setCircle={setCircle}
//                                         onConnect={onConnect}
//                                         setContentWidth={setContentWidth}
//                                         setChatCircle={setChatCircle}
//                                     />
//                                 }
//                             />
//                             <Route
//                                 path="new"
//                                 element={
//                                     <CircleCreateNew
//                                         circle={circle}
//                                         setCircle={setCircle}
//                                         displayMode={displayMode}
//                                         setDisplayMode={setDisplayMode}
//                                         locationPickerPosition={locationPickerPosition}
//                                         setLocationPickerPosition={setLocationPickerPosition}
//                                         setLocationPickerActive={setLocationPickerActive}
//                                         isSignedIn={isSignedIn}
//                                         isSigningIn={isSigningIn}
//                                         mustLogInOnOpen={mustLogInOnOpen}
//                                         parentId={circleId}
//                                     />
//                                 }
//                             />
//                             <Route path="admin" element={<CircleAdmin />} />
//                         </Routes>
//                     </Suspense>
//                 </Scrollbars>
//                 {isMobile && <BottomNavigator circle={circle} />}
//             </Flex>
//         </>
//     ) : null;
// };

// export default Circle;
