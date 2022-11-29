import React, { createContext, useContext, useEffect, useMemo } from "react";
// @ts-ignore
import { Threebox } from "threebox-plugin";
import { useMap } from "react-map-gl";
import { log } from "./old_Helpers";

/** Generate the context */
const ThreeboxContext = createContext(null);

/** Provider to wrap your app with */
export const ThreeboxProvider = ({ children }) => {
    const { current: mapbox } = useMap();
    const tb = useMemo(() => {
        if (mapbox) {
            mapbox.antialias = true;
            return new Threebox(mapbox, mapbox.getCanvas().getContext("webgl"), {
                defaultLights: true,
                enableSelectingObjects: true,
                enableToltips: true,
                realSunlight: false,
                sky: false,
            });
        }
    }, [mapbox]);

    /** Set it globally so the script can find it */
    useEffect(() => {
        log("ThreeboxProvider.useEffect 1");
        if (tb) {
            window.tb = tb;
        }
    }, [tb, mapbox]);

    return <ThreeboxContext.Provider value={tb}>{children}</ThreeboxContext.Provider>;
};

/** Hook to consume the context */
export const useThreebox = () => {
    const context = useContext(ThreeboxContext);
    return context;
};
