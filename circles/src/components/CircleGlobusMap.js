//#region imports
import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import { Flex, Box, Input, NumberInput, NumberInputField, NumberInputStepper, NumberIncrementStepper, NumberDecrementStepper } from "@chakra-ui/react";
import { getLatlng, log, getLocation } from "components/Helpers";
import { useAtom } from "jotai";
import {
    isMobileAtom,
    circleAtom,
    locationPickerActiveAtom,
    locationPickerPositionAtom,
    focusOnMapItemAtom,
    filteredCirclesAtom,
    mapStyleAtom,
    highlightedCircleAtom,
    previewCircleAtom,
    semanticSearchCirclesAtom,
    mergedSemanticSearchCirclesAtom,
} from "components/Atoms";
import { Map } from "react-map-gl";
import { GeolocateControl, NavigationControl } from "react-map-gl";
import { CircleMapEdges, CircleMarker, CirclesMapMarkers, LocationPickerMarker, ConnectionsEdges } from "components/MapMarkers";
import mapboxgl from "mapbox-gl";
import config from "Config";
import * as og from "@openglobus/og";
import "og.css";
//#endregion

export const CircleGlobusMap = ({ height, onMapClick, children }) => {
    const [globus, setGlobus] = useState(null);

    useEffect(() => {
        const osm = new og.layer.XYZ("OpenStreetMap", {
            isBaseLayer: true,
            url: "//{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            visibility: true,
        });

        let sat = new og.layer.XYZ("MapBox Satellite", {
            isBaseLayer: true,
            //url: "https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/256/{z}/{x}/{y}@2x?access_token=pk.eyJ1IjoibWdldmxpY2hzY2FuZXgiLCJhIjoiY2pwcGdsaXlnMDQzdDQybXhsOWZlbXBvdSJ9.fR2YE-ehJA4iajaJBAPKvw",
            url: `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/256/{z}/{x}/{y}@2x?access_token=${config.mapBoxToken}`,
            visibility: true,
            //attribution: `Mapbox Sattelite`,
        });

        const newGlobus = new og.Globe({
            target: "globus", // a HTMLDivElement which its id is `globus`
            name: "Earth",
            terrain: new og.terrain.GlobusTerrain(),
            // terrain:
            //     config.environment !== "dev"
            //         ? new og.terrain.MapboxTerrain("mapbox terrain", {
            //               key: config.mapBoxToken,
            //           })
            //         : null,
            layers: [sat],
            autoActivated: true,
            controls: [
                new og.control.MouseNavigation({ autoActivate: true }),
                //new og.control.KeyboardNavigation({ autoActivate: true }),
                //new og.control.EarthCoordinates({ autoActivate: true, center: false }),
                //new og.control.LayerSwitcher({ autoActivate: true }),
                //new og.control.ZoomControl({ autoActivate: true }),
                //new og.control.TouchNavigation({ autoActivate: true }),
                new og.control.Sun({ autoActivate: true }),
                //new og.control.Atmosphere({ autoActivate: true }),
                //new og.control.Sun({ autoActivate: true }),
                new og.control.Lighting({ autoActivate: true }),
            ],
            //skybox: og.scene.SkyBox.createDefault(),
        });

        //globus.renderer.readDistanceColor = [0.0, 0.0, 0.0, 0.0];

        // let skyBackground = new og.control.SimpleSkyBackground({ autoActivate: true });
        // skyBackground.colorOne = "#000000";
        // skyBackground.colorTwo = "#000000";
        // globus.planet.addControl(skyBackground);

        //globus.planet.flyLonLat(new og.LonLat(2, 48, 20108312));

        newGlobus.planet.renderer.controls.sun.start();
        newGlobus.planet.lightEnabled = true;
        newGlobus.planet.atmosphereEnabled = true;

        //newGlobus.planet.atmosphereMinOpacity = 0;
        setGlobus((x) => newGlobus);

        return () => {
            newGlobus.destroy();
        };
    }, []);

    const onHeightChange = (value) => {
        if (!globus) return;
        globus.planet.setHeightFactor(parseFloat(value));
    };

    useEffect(() => {
        if (!globus) return;
        globus.planet.setHeightFactor(50);
        let layer = globus.planet.layers[0];
        log(globus.planet.layers.length, 0, true);
        layer.opacity = 1;
        layer.nightTextureCoefficient = 10;
    }, [globus]);

    return (
        <>
            <Box id="globus" style={{ width: "100%", height: "100%" }}></Box>

            <Box backgroundColor="white" position="absolute" bottom="10px" right="10px">
                <NumberInput variant="filled" defaultValue={50} onChange={onHeightChange} precision={2} step={0.1}>
                    <NumberInputField />
                    <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                    </NumberInputStepper>
                </NumberInput>
            </Box>
        </>
    );
};

export default CircleGlobusMap;
