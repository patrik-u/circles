//#region imports
import React, { useEffect, lazy, Suspense, useCallback } from "react";
import { Flex, Box } from "@chakra-ui/react";
import { log } from "components/Helpers";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAtom } from "jotai";
import { isMobileAtom } from "components/Atoms";
import LandingPage from "components/LandingPage";
import Home from "components/Home";
import AccountManager from "components/AccountManager";
import LocationManager from "components/LocationManager";
import ConnectPopup from "components/ConnectPopup";
import NewUserPopup from "components/NewUserPopup";
import CreateNewCirclePopup from "components/CreateNewCirclePopup";
import PushNotificationsManager from "components/PushNotificationsManager";
//#endregion

const Circle = lazy(() => import("components/Circle"));

const App = () => {
    log("App.render", -1);

    //#region fields
    const [isMobile, setIsMobile] = useAtom(isMobileAtom);
    //#endregion

    //#region methods
    // detects if desktop resizes to switch to mobile
    const onWindowResize = useCallback(
        (params) => {
            setIsMobile(window.innerWidth <= 768);
        },
        [setIsMobile]
    );

    useEffect(() => {
        log("App2.useEffect 1", -1);
        window.addEventListener("resize", onWindowResize);

        // use dark theme by default
        document.documentElement.classList.add("dark");

        return () => {
            window.removeEventListener("resize", onWindowResize);
        };
    }, [isMobile, setIsMobile, onWindowResize]);

    //#endregion

    return (
        <>
            <AccountManager />
            <LocationManager />
            <PushNotificationsManager />

            <Flex width="100%" height="100%" flexDirection="column">
                <Suspense fallback={<Box></Box>}>
                    <Routes>
                        <Route path="/:hostId/:circleId/*" element={<Circle />} />
                        <Route path="*" element={<Navigate to="/circles/global" replace />} />
                    </Routes>
                </Suspense>
            </Flex>
            {/* <Box position="absolute" top="0px" left="0px" width="100%" height="100%" pointerEvents="none">
                <LandingPage />
            </Box> */}
            <ConnectPopup />
            <NewUserPopup />
            <CreateNewCirclePopup />
        </>
    );
};

export default App;
