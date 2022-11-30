//#region imports
import React, { useEffect, lazy, Suspense, useCallback } from "react";
import { Flex, Box } from "@chakra-ui/react";
import { log } from "./components/Helpers";
import { Routes, Route } from "react-router-dom";
import { useAtom } from "jotai";
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

    //#region methods
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

    //#endregion

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
