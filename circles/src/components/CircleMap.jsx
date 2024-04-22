//#region imports
import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef, useMemo } from "react";
import { Flex } from "@chakra-ui/react";
import { getLatlng, log, getLocation } from "@/components/Helpers";
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
} from "@/components/Atoms";
import { Map } from "react-map-gl";
import { GeolocateControl, NavigationControl } from "react-map-gl";
import {
    CircleMapEdges,
    CircleMarker,
    CirclesMapMarkers,
    LocationPickerMarker,
    ConnectionsEdges,
} from "@/components/MapMarkers";
import mapboxgl from "mapbox-gl";
import config from "@/Config";
import { useLocationNoUpdates } from "./RouterUtils";
import { tabs } from "./CircleDashboard";
import { useParams } from "react-router-dom";
import { disableMapAutoFocusAtom } from "./Atoms";
//#endregion

export const CircleMap = ({ width, height, onMapClick, children }, ref) => {
    const [mapStyle] = useAtom(mapStyleAtom);
    const [focusOnMapItem, setFocusOnMapItem] = useAtom(focusOnMapItemAtom);
    const mapboxToken = config.mapBoxToken;
    const [isMobile] = useAtom(isMobileAtom);
    const [disableMapAutoFocus, setDisableMapAutoFocus] = useAtom(disableMapAutoFocusAtom);

    // const defaultViewport = {
    //     width: "100%",
    //     height: "100%",
    //     // longitude: 10.4035224563641,
    //     // latitude: 11.393780175539534,
    //     zoom: 1.8,
    //     bearing: 0,
    // };
    const defaultViewport = {
        width: "100%",
        height: "100%",
        // longitude: 10.4035224563641,
        // latitude: 11.393780175539534,
        zoom: 1.8,
        // bearing: 10,
    };

    const [, setIsMapInitialized] = useState(false);
    const [mapViewport, setMapViewport] = useState(defaultViewport);
    const mapRef = useRef(null);

    const [circle] = useAtom(circleAtom);
    const [filteredCircles] = useAtom(filteredCirclesAtom);
    const [mergedSemanticSearchCircles] = useAtom(mergedSemanticSearchCirclesAtom);
    const [locationPickerActive] = useAtom(locationPickerActiveAtom);
    const [locationPickerPosition, setLocationPickerPosition] = useAtom(locationPickerPositionAtom);
    const [highlightedCircle] = useAtom(highlightedCircleAtom);
    const [previewCircle] = useAtom(previewCircleAtom);

    //const { current: mapbox } = useMap();
    const fog = {
        color: "rgb(117, 164, 214)", // Lower atmosphere
        "high-color": "rgb(36, 92, 223)", // Upper atmosphere
        "horizon-blend": 0.02, // Atmosphere thickness (default 0.2 at low zooms)
        //"space-color": "rgba(0, 0, 0, 0)",
        //"space-color": "#3c93da",
        //"space-color": "rgb(242, 247, 255)",
        // "space-color": "#5bb0ff",
        "space-color": mapStyle !== "street" ? "rgb(6, 9, 14)" : "rgb(242, 247, 255)", // Background color
        //"star-intensity": 0,
        "star-intensity": mapStyle !== "street" ? 0.1 : 0.0, // Background star brightness (default 0.35 at low zoooms )
    };
    const geolocateControlStyle = {
        left: 10,
        bottom: 10,
    };

    const initializeMap = () => {
        setIsMapInitialized(true);
    };

    const adjustZoomForViewport = (zoomFactor) => {
        // Dynamic adjustment factor based on viewport size
        const baseViewportSize = 850; // a reference viewport size for which the zoomFactor is accurate
        const currentViewportSize = Math.min(width, height);
        let sizeRatio = currentViewportSize / baseViewportSize;
        if (sizeRatio === 0) sizeRatio = 1;

        // Calculate dynamic adjustment factor based on the size ratio
        const dynamicAdjustmentFactor = Math.log2(1 / sizeRatio);

        log(
            "width: " + width + ", height: " + height + ", dynamicAdjustmentFactor: " + dynamicAdjustmentFactor,
            0,
            true
        );

        // Apply dynamic adjustment
        return zoomFactor - dynamicAdjustmentFactor;
    };

    const calculateMapBounds = (locations) => {
        // get minimum and maximum latitudes and longitudes
        let minLat = Math.min(...locations.map((loc) => loc.latitude));
        let maxLat = Math.max(...locations.map((loc) => loc.latitude));
        let minLng = Math.min(...locations.map((loc) => loc.longitude));
        let maxLng = Math.max(...locations.map((loc) => loc.longitude));

        // return the calculated bounds
        const bounds = {
            southwest: { latitude: minLat, longitude: minLng },
            northeast: { latitude: maxLat, longitude: maxLng },
        };

        return bounds;
    };

    const getMapBoundsForCircles = () => {
        // get all locations
        let locations = [];
        if (circle?.base) {
            locations.push(getLatlng(circle.base));
        }
        filteredCircles?.forEach((filteredCircle) => {
            if (filteredCircle.base) {
                locations.push(getLatlng(filteredCircle.base));
            }
        });

        if (locations.length <= 0) return false;

        // calculate bounds
        let mapBounds = calculateMapBounds(locations);
        return mapBounds;
    };

    useEffect(() => {
        const mapInstance = mapRef?.current?.getMap();
        if (!mapInstance || !circle) return;
        if (disableMapAutoFocus) return;

        let bounds = getMapBoundsForCircles();

        // calculate bound based on filtered circles

        console.log("bounds:", JSON.stringify(bounds, null, 2));
        // console.log("selected tab:", JSON.stringify(selectedTab, null, 2));
        if (bounds) {
            let lngLatBounds = [
                [bounds.southwest.longitude, bounds.southwest.latitude],
                [bounds.northeast.longitude, bounds.northeast.latitude],
            ];

            let transitionSpeed = 3;
            let transitionCurve = 2;

            mapInstance.fitBounds(lngLatBounds, {
                padding: { top: 100, bottom: 10, left: 30, right: 50 },
                animate: true,
                speed: transitionSpeed, // make the flying slow
                curve: transitionCurve, // change the speed at which it zooms out
                easing: (t) => t,
                essential: true,
            });
            return;
        }
    }, [filteredCircles, circle]);

    useEffect(() => {
        if (!focusOnMapItem) return;

        let transitionSpeed = focusOnMapItem.speed ?? 3;
        let transitionCurve = focusOnMapItem.curve ?? 2;
        const mapInstance = mapRef.current?.getMap();
        if (!mapInstance) return;

        let zoom = focusOnMapItem.zoom ?? 15;
        let location = getLocation(focusOnMapItem.item);

        if (!location) {
            if (focusOnMapItem.item?.id === "global") {
                location = { latitude: 0, longitude: 0 };
            } else {
                return;
            }
        }

        log("focusing on location: " + JSON.stringify(location) + ", zoom: " + zoom, 0, true);

        //setMapViewport({ ...mapViewport, latitude: location.latitude, longitude: location.longitude, zoom, transitionDuration });

        // fly to location

        mapInstance.flyTo({
            center: [location.longitude, location.latitude],
            zoom: zoom,
            speed: transitionSpeed, // make the flying slow
            curve: transitionCurve, // change the speed at which it zooms out
            easing: (t) => t,
        });

        setFocusOnMapItem(null);
    }, [focusOnMapItem, setFocusOnMapItem, mapViewport]);

    const focusItem = (item) => {
        let location = getLocation(item);
        if (!location) return;
        setMapViewport({
            ...mapViewport,
            latitude: location.latitude,
            longitude: location.longitude,
            zoom: 15,
            transitionDuration: 500,
        });
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
                //return "mapbox://styles/timaolsson/clfe29gyd000o01o3ray8f97m";
                return "mapbox://styles/mapbox/satellite-streets-v11";
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
                onDragStart={(evt) => {
                    log("onDrag", 0, true);
                    setDisableMapAutoFocus(true);
                }}
                onMove={(evt) => {
                    updateViewport(evt.viewState);
                }}
                mapboxAccessToken={mapboxToken}
                onLoad={initializeMap}
                onClick={mapClick}
                antialias={true}
                projection="globe"
                fog={fog}
            >
                {!isMobile && (
                    <GeolocateControl
                        style={geolocateControlStyle}
                        position={isMobile ? "bottom-right" : "bottom-right"}
                        positionOptions={{ enableHighAccuracy: true }}
                        trackUserLocation={true}
                        auto
                    />
                )}

                {/* <NavigationControl /> */}

                {circle && filteredCircles?.length > 0 && <CircleMapEdges circle={circle} circles={filteredCircles} />}
                {/* {circle && circle?.id === "global" && <ConnectionsEdges />} */}
                {circle && <CircleMarker circle={circle} />}
                {filteredCircles?.length > 0 && <CirclesMapMarkers circles={filteredCircles} ignoreIsActive={true} />}

                {locationPickerActive && locationPickerPosition && (
                    <LocationPickerMarker position={locationPickerPosition} />
                )}
                {highlightedCircle && (
                    <CircleMarker circle={highlightedCircle} highlighted={true} ignoreIsActive={true} />
                )}
                {previewCircle && <CircleMarker circle={previewCircle} highlighted={true} ignoreIsActive={true} />}

                {children}
            </Map>
        </Flex>
    );
};

export default forwardRef(CircleMap);
