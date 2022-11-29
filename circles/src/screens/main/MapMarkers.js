//#region imports
import React, { useContext, lazy, Suspense } from "react";
import { Box, Image, Popover, PopoverTrigger, PopoverContent, PopoverArrow } from "@chakra-ui/react";
import { lat, lng, mapNavigateTo, getLngLatArray, getImageKitUrl } from "components/Helpers";
import { Marker } from "react-map-gl";
import { circleDefaultRoute } from "components/Navigation";
import { CirclePicture } from "components/CircleElements";
import { Source, Layer } from "react-map-gl";
import { useAtom } from "jotai";
import { isMobileAtom, userAtom, userDataAtom, showNetworkLogoAtom, signInStatusAtom, circleAtom, circleIdAtom } from "components/Atoms";
import { useNavigateNoUpdates, useLocationNoUpdates } from "components/RouterUtils";
//#endregion

export const LocationPickerMarker = ({ position }) => {
    return (
        <>
            {position[0] && position[1] && (
                <Marker offset={[0, -24]} latitude={position[1]} longitude={position[0]} className="circle-marker">
                    <Image src="/marker2.png" width="48px" height="48px" />
                </Marker>
            )}
        </>
    );
};

export const CircleMapEdges = ({ circle, circles }) => {
    if (!circle?.base) return null;

    const getFeatures = () => {
        return circles
            .filter((x) => x.base)
            .map((x) => {
                return {
                    type: "Feature",
                    properties: {},
                    geometry: {
                        type: "LineString",
                        coordinates: [getLngLatArray(circle.base), getLngLatArray(x.base)],
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
                    //"line-color": "rgba(91, 115, 255, 1)",
                    "line-color": "rgba(255, 255, 255, 1)",
                    //"line-color": "rgba(63, 71, 121, 1)",
                    //"line-color": "rgba(97, 97, 97, 1)",
                    //"line-color": "rgba(116, 89, 41, 1)",
                    //"line-color": "rgba(35, 68, 255, 1)",
                    "line-width": 1,
                }}
            />
        </Source>
    );
};

export const CircleMarker = ({ circle }) => {
    return circle && <CircleMapMarker circle={circle} />;
};

const CirclePreview = lazy(() => import("screens/circle/CirclePreview"));

export const CircleMapMarker = ({ circle }) => {
    const [user] = useAtom(userAtom);
    const navigate = useNavigateNoUpdates();
    const getMarkerBackground = () => {
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

    return (
        circle?.base && (
            <Marker
                key={circle.id}
                offset={[0, -24]}
                latitude={lat(circle.base)}
                longitude={lng(circle.base)}
                className="circle-marker"
                onClick={() => mapNavigateTo(navigate, circleDefaultRoute(user, circle.id))}
            >
                <Image src={getImageKitUrl(getMarkerBackground())} width="48px" height="48px" />
                <Box
                    top="3px"
                    left="9px"
                    width="30px"
                    height="30px"
                    overflow="hidden"
                    flexShrink="0"
                    borderRadius="50%"
                    backgroundColor="white"
                    position="absolute"
                >
                    <CirclePicture circle={circle} size={30} />
                </Box>

                <Popover trigger="hover" gutter="0" isLazy>
                    <PopoverTrigger>
                        <Box position="absolute" width="48px" height="48px" top="0px" left="0px" />
                    </PopoverTrigger>
                    <PopoverContent backgroundColor="transparent" borderColor="transparent" width="450px">
                        <Box zIndex="160">
                            <PopoverArrow />
                            <Suspense fallback={<Box />}>
                                <CirclePreview key={circle.id} item={circle} />
                            </Suspense>
                        </Box>
                    </PopoverContent>
                </Popover>
            </Marker>
        )
    );
};

export const CirclesMapMarkers = ({ circles }) => {
    return (
        <>
            {circles
                ?.filter((item) => item.base)
                .map((item) => (
                    <CircleMapMarker key={item.id} circle={item} />
                ))}
        </>
    );
};

export default CircleMapMarker;
