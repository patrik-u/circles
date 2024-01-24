//#region imports
import React, { lazy, Suspense, useEffect, useMemo } from "react";
import { Box, Image, Popover, PopoverTrigger, PopoverContent, PopoverArrow } from "@chakra-ui/react";
import {
    lat,
    lng,
    getLngLatArray,
    getImageKitUrl,
    log,
    getCircleTypes,
    isWithinMinutes,
    isCircleActive,
    isActiveInVideoConference,
    getLocation,
    isActiveInCircle,
} from "@/components/Helpers";
import { Marker } from "react-map-gl";
import { openCircle, openAboutCircle } from "@/components/Navigation";
import { CirclePicture } from "@/components/CircleElements";
import { Source, Layer } from "react-map-gl";
import { useAtom } from "jotai";
import {
    userAtom,
    circleConnectionsAtom,
    filteredCirclesAtom,
    toggleAboutAtom,
    circlesFilterAtom,
    highlightedCircleAtom,
    previewCircleAtom,
} from "@/components/Atoms";
import { useNavigateNoUpdates, useQueryParamsNoUpdates } from "@/components/RouterUtils";
import { useSearchParams } from "react-router-dom";
import { CirclePreview } from "@/components/CirclePreview";
//#endregion

export const LocationPickerMarker = ({ position }) => {
    return (
        <>
            {position[0] && position[1] && (
                <Marker offset={[0, -24]} latitude={position[1]} longitude={position[0]} className="circle-marker">
                    <Image src={getImageKitUrl("/marker2.png", 48, 48)} width="48px" height="48px" />
                </Marker>
            )}
        </>
    );
};

export const ConnectionsEdges = () => {
    const [circleConnections] = useAtom(circleConnectionsAtom);
    const [filteredCircles] = useAtom(filteredCirclesAtom);

    const getFeatures = () => {
        return circleConnections
            .filter((x) => {
                if (!x?.source || !x?.target) {
                    //log(JSON.stringify(x, null, 2), 2, true);
                    return false;
                }
                let sourceLoc = getLocation(x.source);
                let targetLoc = getLocation(x.target);

                if (
                    sourceLoc &&
                    targetLoc &&
                    filteredCircles.some((a) => a.id === x.source.id) &&
                    filteredCircles.some((a) => a.id === x.target.id)
                ) {
                    return true;
                }
                return false;
            })
            .map((x) => {
                return {
                    type: "Feature",
                    properties: { circle_types: x.circle_types },
                    geometry: {
                        type: "LineString",
                        coordinates: [getLngLatArray(getLocation(x.source)), getLngLatArray(getLocation(x.target))],
                    },
                };
            });
    };

    const lineFeatures = {
        type: "FeatureCollection",
        features: getFeatures(),
    };

    return (
        <Source id="polylineLayer" type="geojson" data={lineFeatures}>
            <Layer
                id="lineLayer"
                type="line"
                source="my-data"
                layout={{
                    "line-join": "round",
                    "line-cap": "round",
                }}
                paint={{
                    "line-color": [
                        "match",
                        ["get", "circle_types"],
                        "user_user",
                        "rgba(106, 129, 255, 1)",
                        "rgba(255, 255, 255, 1)",
                    ],
                    "line-width": 1,
                }}
            />
        </Source>
    );
};

export const CircleMapEdges = ({ circle, circles }) => {
    if (circle?.id !== "global" && !getLocation(circle)) return null;

    const getFeatures = () => {
        return circles
            .filter((x) => getLocation(x))
            .map((x) => {
                //log(x.categories?.includes("similar").toString(), 0, true);
                return {
                    type: "Feature",
                    properties: {
                        circle_types: getCircleTypes(circle.type, x.type),
                        similar: (x.categories?.length === 1 && x.categories?.[0] === "similar").toString(),
                    },
                    geometry: {
                        type: "LineString",
                        coordinates: [getLngLatArray(getLocation(circle)), getLngLatArray(getLocation(x))],
                    },
                };
            });
    };

    const getGlobalFeatures = () => {
        return circles
            .map((x) => {
                if (!isActiveInCircle(x)) return null;

                let sourceLoc = getLocation(x);
                let targetLoc = getLocation(x.activity.active_in_circle);

                let targetCircle = circles.find((a) => a.id === x.activity.active_in_circle.id);
                if (!targetCircle) return null;
                if (!isCircleActive(targetCircle)) return null;
                if (targetCircle.id === "global") return null;

                if (sourceLoc && targetLoc) {
                    return { source: x, target: x.activity.active_in_circle };
                }
                return null;
            })
            .filter((x) => x)
            .map((x) => {
                return {
                    type: "Feature",
                    properties: {
                        circle_types: getCircleTypes(x.source.type, x.target.type),
                        similar: "false",
                    },
                    geometry: {
                        type: "LineString",
                        coordinates: [getLngLatArray(getLocation(x.source)), getLngLatArray(getLocation(x.target))],
                    },
                };
            });
    };

    const lineFeatures = {
        type: "FeatureCollection",
        features: circle?.id === "global" ? getGlobalFeatures() : getFeatures(),
    };

    return (
        <Source id="polylineLayer" type="geojson" data={lineFeatures}>
            <Layer
                id="lineLayer"
                type="line"
                source="my-data"
                layout={{
                    "line-join": "round",
                    "line-cap": "round",
                }}
                paint={{
                    //"line-color": "rgba(91, 115, 255, 1)",
                    "line-color": [
                        "match",
                        ["get", "circle_types"],
                        "user_user",
                        "rgba(106, 129, 255, 1)",
                        "rgba(255, 255, 255, 1)",
                    ],
                    //"line-color": "rgba(63, 71, 121, 1)",
                    //"line-color": "rgba(97, 97, 97, 1)",
                    //"line-color": "rgba(116, 89, 41, 1)",
                    //"line-color": "rgba(35, 68, 255, 1)",
                    "line-width": 1,
                    "line-dasharray": ["match", ["get", "similar"], "true", ["literal", [4, 8]], ["literal", [1, 0]]],
                }}
            />
        </Source>
    );
};

export const CircleMarker = ({ circle, highlighted }) => {
    return circle && <CircleMapMarker circle={circle} highlighted={highlighted} />;
};

export const CircleMapMarker = ({ circle, highlighted, ignoreIsActive }) => {
    const [user] = useAtom(userAtom);
    const navigate = useNavigateNoUpdates();
    const [, setToggleAbout] = useAtom(toggleAboutAtom);
    const [highlightedCircle] = useAtom(highlightedCircleAtom);
    const [previewCircle] = useAtom(previewCircleAtom);

    const getMarkerBackground = () => {
        if (highlighted) return "/marker4.png";
        switch (circle?.type) {
            default:
            case "circle":
                return "/marker2.png";
            case "event":
                return "/marker5.png";
            case "user":
                return "/marker3.png";
        }
    };

    const getMarkerColor = () => {
        if (highlighted) return "#ffe96a";
        // return last color
        if (circle?.colors?.length > 0) return circle.colors[0];
        // return default color
        return "white";
    };

    const getMarkerColors = () => {
        if (highlighted) {
            if (circle?.colors?.length > 0) return Array(circle.colors.length).fill("#ffe96a");
            return ["#ffe96a"];
        }
        if (circle?.colors?.length > 0) return circle.colors;
        // return default color
        return ["white"];
    };

    const isActive = () => {
        if (ignoreIsActive) return true;
        if (highlightedCircle?.id === circle?.id) return true;
        if (previewCircle?.id === circle?.id) return true;
        if (isCircleActive(circle)) return true;
        return false;
    };

    const borderWidth = 2;
    const markerSize = 30 + getMarkerColors().length * (borderWidth * 2);
    const anchorHeight = 15;
    const yOffset = (markerSize + anchorHeight) / 2;

    const loc = getLocation(circle);
    return (
        loc && (
            <Marker
                key={circle.id}
                offset={[0, -yOffset]}
                latitude={lat(loc)}
                longitude={lng(loc)}
                className="circle-marker"
                onClick={() => openAboutCircle(circle, setToggleAbout)}
            >
                <Box width={`${markerSize}px`} height={`${markerSize + anchorHeight}px`}></Box>
                <Box
                    width="1px"
                    height={`${anchorHeight}px`}
                    backgroundColor={getMarkerColor()}
                    position="absolute"
                    bottom="0px"
                    left={`${markerSize / 2 - 1}px`}
                ></Box>
                <Box top="0px" width={`${markerSize}px`} height={`${markerSize}px`} flexShrink="0" position="absolute">
                    <CirclePicture
                        circle={circle}
                        size={markerSize}
                        disableClick={true}
                        isActive={ignoreIsActive ? true : isCircleActive(circle)}
                        parentCircleSizeRatio={2}
                        parentCircleOffset={-3}
                        circleBorderColors={getMarkerColors()}
                    />
                </Box>

                <Popover trigger="hover" gutter="0" isLazy>
                    <PopoverTrigger>
                        <Box position="absolute" width="48px" height="48px" top="0px" left="0px" />
                    </PopoverTrigger>
                    <PopoverContent backgroundColor="transparent" borderColor="transparent" width="450px">
                        <Box zIndex="160">
                            <PopoverArrow />
                            <Suspense fallback={<Box />}>
                                <CirclePreview key={circle.id} item={circle} inMap={true} />
                            </Suspense>
                        </Box>
                    </PopoverContent>
                </Popover>
            </Marker>
        )
    );
};

export const CirclesMapMarkers = ({ circles, ignoreIsActive }) => {
    //const [circlesFilter] = useAtom(circlesFilterAtom);

    return (
        <>
            {circles
                ?.filter((item) => getLocation(item))
                .map((item) => (
                    <CircleMapMarker key={item.id} circle={item} ignoreIsActive={ignoreIsActive} />
                ))}
        </>
    );
};

export default CircleMapMarker;
