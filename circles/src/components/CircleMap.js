//#region imports
import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import { Flex } from "@chakra-ui/react";
import { getLatlng, log } from "components/Helpers";
import { useAtom } from "jotai";
import {
    isMobileAtom,
    circleAtom,
    locationPickerActiveAtom,
    locationPickerPositionAtom,
    focusOnMapItemAtom,
    filteredCirclesAtom,
    mapStyleAtom,
} from "components/Atoms";
import { Map } from "react-map-gl";
import { GeolocateControl, NavigationControl } from "react-map-gl";
import { CircleMapEdges, CircleMarker, CirclesMapMarkers, LocationPickerMarker, ConnectionsEdges } from "components/MapMarkers";
import mapboxgl from "mapbox-gl";
import config from "Config";
//#endregion

// eslint-disable-next-line import/no-webpack-loader-syntax
mapboxgl.workerClass = require("worker-loader!mapbox-gl/dist/mapbox-gl-csp-worker").default;

export const CircleMap = ({ height, onMapClick, children }, ref) => {
    const [mapStyle] = useAtom(mapStyleAtom);
    const [focusOnMapItem, setFocusOnMapItem] = useAtom(focusOnMapItemAtom);
    const mapboxToken = config.mapBoxToken;
    const [isMobile] = useAtom(isMobileAtom);
    const defaultViewport = {
        width: "100%",
        height: "100%",
        // longitude: 10.4035224563641,
        // latitude: 11.393780175539534,
        zoom: 1.8,
        bearing: 0,
    };
    const [, setIsMapInitialized] = useState(false);
    const [mapViewport, setMapViewport] = useState(defaultViewport);
    const mapRef = useRef(null);

    const [circle] = useAtom(circleAtom);
    const [filteredCircles] = useAtom(filteredCirclesAtom);
    const [locationPickerActive] = useAtom(locationPickerActiveAtom);
    const [locationPickerPosition, setLocationPickerPosition] = useAtom(locationPickerPositionAtom);

    //const { current: mapbox } = useMap();
    const fog = {
        color: "rgb(117, 164, 214)", // Lower atmosphere
        "high-color": "rgb(36, 92, 223)", // Upper atmosphere
        "horizon-blend": 0.02, // Atmosphere thickness (default 0.2 at low zooms)
        //"space-color": "rgba(0, 0, 0, 0)",
        "space-color": mapStyle !== "street" ? "rgb(6, 9, 14)" : "rgb(242, 247, 255)", // Background color
        "star-intensity": mapStyle !== "street" ? 0.1 : 0.0, // Background star brightness (default 0.35 at low zoooms )
    };
    const geolocateControlStyle = {
        left: 10,
        bottom: 10,
    };

    const initializeMap = () => {
        setIsMapInitialized(true);
    };

    useEffect(() => {
        if (!focusOnMapItem) return;

        let zoom = focusOnMapItem.zoom ?? 15;
        let location = getLatlng(focusOnMapItem.item.base);
        let transitionDuration = focusOnMapItem.transitionDuration ?? 500;

        setMapViewport({ ...mapViewport, latitude: location.latitude, longitude: location.longitude, zoom, transitionDuration });

        setFocusOnMapItem(null);
    }, [focusOnMapItem, setFocusOnMapItem, mapViewport]);

    const focusItem = (item) => {
        let location = getLatlng(item.base);
        setMapViewport({ ...mapViewport, latitude: location.latitude, longitude: location.longitude, zoom: 15, transitionDuration: 500 });
    };

    const updateViewport = (vp) => {
        setMapViewport(vp);
    };

    useImperativeHandle(ref, () => ({
        focusItem: (item) => {
            focusItem(item);
        },
    }));

    const mapClick = (evt) => {
        if (locationPickerActive) {
            setLocationPickerPosition([evt.lngLat.lng, evt.lngLat.lat]);
        }

        if (onMapClick) {
            onMapClick(evt);
        }
    };

    const getMapStyle = () => {
        switch (mapStyle) {
            default:
            case "satellite":
                return "mapbox://styles/timaolsson/clfe29gyd000o01o3ray8f97m";
            //return "mapbox://styles/mapbox/satellite-streets-v11";
            case "streets":
                return "mapbox://styles/exmakina-admin/ckur9npyof1t318rzrisvj2n2";
            case "satellite-no-labels":
                return "mapbox://styles/timaolsson/clfe29gyd000o01o3ray8f97m";
        }
    };

    return (
        <Flex align="center" height={`${height}px`} width="100%" backgroundColor="#1f2327">
            {/* #06090e, #c9dcfd */}
            <Map
                {...mapViewport}
                ref={mapRef}
                width="100%"
                height="100%"
                mapStyle={getMapStyle()}
                onMove={(evt) => updateViewport(evt.viewState)}
                mapboxAccessToken={mapboxToken}
                onLoad={initializeMap}
                onClick={mapClick}
                antialias={true}
                projection="globe"
                fog={fog}
            >
                <GeolocateControl
                    style={geolocateControlStyle}
                    position={isMobile ? "bottom-right" : "bottom-right"}
                    positionOptions={{ enableHighAccuracy: true }}
                    trackUserLocation={true}
                    auto
                />

                {/* <NavigationControl /> */}

                {circle && filteredCircles?.length > 0 && <CircleMapEdges circle={circle} circles={filteredCircles} />}
                {circle && circle?.id === "global" && <ConnectionsEdges />}
                {circle && <CircleMarker circle={circle} />}
                {filteredCircles?.length > 0 && <CirclesMapMarkers circles={filteredCircles} />}
                {locationPickerActive && locationPickerPosition && <LocationPickerMarker position={locationPickerPosition} />}

                {children}
            </Map>
        </Flex>
    );
};

export default forwardRef(CircleMap);
