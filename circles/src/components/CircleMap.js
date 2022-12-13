//#region imports
import React, { useState, useRef, useImperativeHandle, forwardRef } from "react";
import { Flex } from "@chakra-ui/react";
import { getLatlng } from "components/Helpers";
import { useAtom } from "jotai";
import { isMobileAtom, circleAtom, locationPickerActiveAtom, locationPickerPositionAtom, filteredCirclesAtom } from "components/Atoms";
import { Map } from "react-map-gl";
import { GeolocateControl, NavigationControl } from "react-map-gl";
import { CircleMapEdges, CircleMarker, CirclesMapMarkers, LocationPickerMarker } from "components/MapMarkers";
import mapboxgl from "mapbox-gl";
//#endregion

// eslint-disable-next-line import/no-webpack-loader-syntax
mapboxgl.workerClass = require("worker-loader!mapbox-gl/dist/mapbox-gl-csp-worker").default;

export const CircleMap = ({ height, onMapClick, children }, ref) => {
    const satelliteMode = true;
    const mapboxToken = "pk.eyJ1IjoiZXhtYWtpbmEtYWRtaW4iLCJhIjoiY2t1cjJkOWJuMDB0MDJvbWYweWx5emR0dSJ9.elxjxO7DHA2UyXs0j7GTHA";
    const [isMobile] = useAtom(isMobileAtom);
    const defaultViewport = {
        width: "100%",
        height: "100%",
        longitude: 10.4035224563641,
        latitude: 11.393780175539534,
        zoom: 2.2,
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
        color: "rgb(186, 210, 235)", // Lower atmosphere
        "high-color": "rgb(36, 92, 223)", // Upper atmosphere
        "horizon-blend": 0.02, // Atmosphere thickness (default 0.2 at low zooms)
        "space-color": satelliteMode ? "rgb(6, 9, 14)" : "rgb(242, 247, 255)", // Background color
        "star-intensity": satelliteMode ? 0.2 : 0.0, // Background star brightness (default 0.35 at low zoooms )
    };
    const geolocateControlStyle = {
        right: 10,
        top: 10,
    };

    const initializeMap = () => {
        setIsMapInitialized(true);
    };

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

    return (
        <Flex align="center" height={`${height}px`} width="100%" backgroundColor="#06090e">
            <Map
                {...mapViewport}
                ref={mapRef}
                width="100%"
                height="100%"
                mapStyle={satelliteMode ? "mapbox://styles/mapbox/satellite-streets-v11" : "mapbox://styles/exmakina-admin/ckur9npyof1t318rzrisvj2n2"}
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
                    position={isMobile ? "top-left" : "top-right"}
                    positionOptions={{ enableHighAccuracy: true }}
                    top="20px"
                    trackUserLocation={true}
                    auto
                />

                <NavigationControl />

                {circle && filteredCircles?.length > 0 && <CircleMapEdges circle={circle} circles={filteredCircles} />}
                {circle && <CircleMarker circle={circle} />}
                {filteredCircles?.length > 0 && <CirclesMapMarkers circles={filteredCircles} />}
                {locationPickerActive && locationPickerPosition && <LocationPickerMarker position={locationPickerPosition} />}

                {children}
            </Map>
        </Flex>
    );
};

export default forwardRef(CircleMap);
