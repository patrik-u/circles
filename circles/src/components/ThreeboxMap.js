import { useState, useContext, useMemo, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { GeolocateControl, NavigationControl } from "react-map-gl";
import mapboxgl from "mapbox-gl";
import { useThreebox } from "./ThreeboxProvider";
import { Map, useMap } from "react-map-gl";
import { getLatlng, log } from "./old_Helpers";
import { useSearchParams } from "react-router-dom";
import IsMobileContext from "./IsMobileContext";

// eslint-disable-next-line import/no-webpack-loader-syntax
mapboxgl.workerClass = require("worker-loader!mapbox-gl/dist/mapbox-gl-csp-worker").default;

const ThreeboxMap = ({ onMapClick, children, satelliteMode }, ref) => {
    const mapboxToken = "pk.eyJ1IjoiZXhtYWtpbmEtYWRtaW4iLCJhIjoiY2t1cjJkOWJuMDB0MDJvbWYweWx5emR0dSJ9.elxjxO7DHA2UyXs0j7GTHA";
    const isMobile = useContext(IsMobileContext);
    const [searchParams, setSearchParams] = useSearchParams();
    const embed = searchParams.get("embed") === "true";
    const locale = searchParams.get("locale");

    const getDefaultViewport = () => {
        switch (locale) {
            case "sv":
                return {
                    width: "100%",
                    height: "100%",
                    longitude: 14.3549,
                    latitude: 59.351,
                    //zoom: 5.61,
                    //pitch: 60,
                    bearing: 0,
                };
            case "uk":
                return {
                    width: "100%",
                    height: "100%",
                    longitude: -4.2940066142747755,
                    latitude: 52.939510019964814,
                    //zoom: 5.61,
                    //pitch: 60,
                    bearing: 0,
                };
            default:
                return {
                    width: "100%",
                    height: "100%",
                    longitude: 10.4035224563641,
                    latitude: 11.393780175539534,
                    zoom: 2.2,
                    //pitch: 41.988833990229395,
                    bearing: 0,
                };
        }
    };

    const getDefaultEmbeddedViewport = () => {
        switch (locale) {
            case "sv":
                return {
                    width: "100%",
                    height: "100%",
                    longitude: isMobile ? 14.3549 : 10.3549,
                    latitude: isMobile ? 59.351 : 59.7,
                    zoom: 4.61,
                    //pitch: 60,
                    bearing: 0,
                };
            case "uk":
                return {
                    width: "100%",
                    height: "100%",
                    longitude: -4.2940066142747755,
                    latitude: 52.939510019964814,
                    zoom: 5.61,
                    //pitch: 60,
                    bearing: 0,
                };
            default:
                return {
                    width: "100%",
                    height: "100%",
                    longitude: 10.4035224563641,
                    latitude: 11.393780175539534,
                    zoom: 1.0781508077346502,
                    //pitch: 41.988833990229395,
                    bearing: 0,
                };
        }
    };

    const defaultViewport = getDefaultViewport();
    const defaultEmbeddedViewport = getDefaultEmbeddedViewport();

    const [isMapInitialized, setIsMapInitialized] = useState(false);
    const [isLayerInitialized, setIsLayerInitialized] = useState(false);
    const threebox = useThreebox();
    const { current: mapbox } = useMap();
    const [mapViewport, setMapViewport] = useState(embed ? defaultEmbeddedViewport : defaultViewport);
    const mapRef = useRef(null);

    const layer = useMemo(
        () =>
            threebox &&
            isMapInitialized && {
                id: "my-threebox-layer",
                type: "custom",
                renderingMode: "3d",
                onAdd: function () {},
                render: function () {
                    if (threebox) {
                        //threebox.setObjectsScale();
                        threebox.update();
                    }
                },
            },
        [threebox, isMapInitialized]
    );

    const fog = {
        color: "rgb(186, 210, 235)", // Lower atmosphere
        "high-color": "rgb(36, 92, 223)", // Upper atmosphere
        "horizon-blend": 0.02, // Atmosphere thickness (default 0.2 at low zooms)
        "space-color": satelliteMode ? "rgb(6, 9, 14)" : "rgb(242, 247, 255)", // Background color
        "star-intensity": satelliteMode ? 0.2 : 0.0, // Background star brightness (default 0.35 at low zoooms )
    };

    const initializeMap = () => {
        setIsMapInitialized(true);
    };

    useEffect(() => {
        log("ThreeboxMap.useEffect 1");
        if (mapbox && threebox && layer && isMapInitialized) {
            //mapbox.setProjection("globe"); // when globe projection exists
            // mapbox.projection = "globe";
            // mapbox._runtimeProjection = "globe";
            // mapbox.style.updateProjection();
            // mapbox._lazyInitEmptyStyle();
            // let projection = { name: "globe" };
            // mapbox.projection = projection;
            // mapbox._runtimeProjection = projection;
            //mapbox.style.updateProjection();
            // const prevProjection = mapbox.transform.projection;
            // const projectionChanged = this.map.transform.setProjection(this.map._runtimeProjection || (this.stylesheet ? this.stylesheet.projection : undefined));
            // const projection = this.map.transform.projection;

            // if (this._loaded) {
            //     if (projection.requiresDraping) {
            //         const hasTerrain = this.getTerrain() || this.stylesheet.terrain;
            //         if (!hasTerrain) {
            //             this.setTerrainForDraping();
            //         }
            //     } else if (this.terrainSetForDrapingOnly()) {
            //         this.setTerrain(null);
            //     }
            // }

            // mapbox.transform.setProjection(projection);
            // mapbox.transform.projection = "globe";
            // //mapbox.transform._calcMatrices();

            // //mapbox.style.dispatcher.broadcast("setProjection", this.map.transform.projectionOptions);
            // mapbox._update(true);
            // mapbox._transitionFromGlobe = false;

            //threebox.clear(); // play nice with new react hot loader
            //console.log("Adding threebox layer");

            // if (mapbox.getLayer("my-custom-layer")) {
            //     mapbox.removeLayer("my-custom-layer");
            // }
            // mapbox.addLayer(layer);
            console.log("*** is layer initialized **");
            setIsLayerInitialized(true);
        }
    }, [isMapInitialized, layer, mapbox, threebox]);

    useImperativeHandle(ref, () => ({
        focusItem: (item) => {
            focusItem(item);
        },
    }));

    const focusItem = (item) => {
        let location = getLatlng(item.base);
        setMapViewport({ ...mapViewport, latitude: location.latitude, longitude: location.longitude, zoom: 15, transitionDuration: 500 });
        //console.log(mapViewport.zoom);
    };

    const updateViewport = (vp) => {
        setMapViewport(vp);
    };

    const geolocateControlStyle = {
        right: 10,
        top: 10,
    };
    const mapClick = (evt) => {
        //log(JSON.stringify(mapViewport, null, 2), 0);
        //console.log(evt);
        if (onMapClick) {
            onMapClick(evt);
        }
    };

    return (
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
            {!embed && (
                <GeolocateControl
                    style={geolocateControlStyle}
                    position={isMobile ? "top-left" : "top-right"}
                    positionOptions={{ enableHighAccuracy: true }}
                    top="20px"
                    trackUserLocation={true}
                    auto
                />
            )}

            <NavigationControl />

            {children}
        </Map>
    );
};

export default forwardRef(ThreeboxMap);
