import { useEffect, useState, useRef, useMemo, useContext } from "react";
import { useThreebox } from "./ThreeboxProvider";
// important!
import { THREE } from "threebox-plugin";
import { useMap } from "react-map-gl";
import { log } from "./Helpers";

export const Flag = {
    obj: "/flag.gltf",
    type: "gltf",
    scale: 45,
    units: "meters",
    rotation: { x: 90, y: 0, z: 0 },
    anchor: "center",
};

export const Eiffel = {
    obj: "/eiffel.glb",
    type: "gltf",
    scale: { x: 5621.06, y: 6480.4, z: 5621.06 },
    units: "meters",
    rotation: { x: 90, y: 0, z: 0 },
    anchor: "center",
};

export const ThreeboxObject = ({ type, position, fixedScale }) => {
    const threebox = useThreebox();
    const { current: mapbox } = useMap();
    const [model, _setModel] = useState();
    const activeModelRef = useRef(model);

    const setModel = (model) => {
        _setModel(model);
        activeModelRef.current = model;
    };

    const getPosition = (p) => {
        var pos;
        if (Array.isArray(p)) {
            pos = p;
        } else if (!p) {
            pos = [0, 0];
        } else if (p.latitude && p.longitude) {
            pos = [p.longitude, p.latitude];
        } else {
            pos = [0, 0];
        }
        return pos;
    };

    const onSelectedChange = () => {
        console.log("object selected");
    };

    const onRender = () => {
        if (fixedScale && activeModelRef.current) {
            // scale model according to zoom
            const s = 1000 / Math.pow(2, mapbox.getZoom());
            activeModelRef.current.scale.set(s, s, s);
        }
    };

    /** When the object changes remove it from map */
    useEffect(() => {
        log("ThreeboxObject.useEffect 1");
        if (mapbox && threebox && mapbox) {
            if (model) {
                threebox.remove(model);
            }

            if (!type) {
                type = Flag;
            }

            //console.log("Adding threebox object");
            threebox.loadObj(type, function (model) {
                var pos;
                if (Array.isArray(position)) {
                    pos = position;
                } else if (!position) {
                    pos = [0, 0];
                } else if (position.latitude && position.longitude) {
                    pos = [position.longitude, position.latitude];
                } else {
                    pos = [0, 0];
                }

                model.setCoords(pos);
                //model.fixedZoom = true;
                model.addTooltip("Din bas", true);
                model.castShadow = true;
                setModel(model);
                threebox.add(model);

                // optional add callbacks for events for selection
                model.addEventListener("SelectedChange", onSelectedChange, false);

                setModel(model);
                //activeModelRef.current = model;
                mapbox.on("render", onRender);
                //mapbox.on("ViewportChange");

                // loadedObj.addEventListener('Wireframed', onWireframed, false);
                // loadedObj.addEventListener('IsPlayingChanged', onIsPlayingChanged, false);
                // loadedObj.addEventListener('ObjectDragged', onDraggedObject, false);
                // loadedObj.addEventListener('ObjectMouseOver', onObjectMouseOver, false);
                // loadedObj.addEventListener('ObjectMouseOut', onObjectMouseOut, false);
            });

            // TODO listen to mapbox change in zoom and adjust scale of object accordingly
        }
        return () => {
            if (mapbox) {
                mapbox.off("render", onRender);
            }

            // remove object
            if (activeModelRef.current) {
                activeModelRef.current.removeEventListener("SelectedChange", onSelectedChange);
                if (threebox) {
                    threebox.remove(activeModelRef.current);
                }
                activeModelRef.current = null;
            }
        };
    }, [mapbox, threebox]);

    useEffect(() => {
        log("ThreeboxObject.useEffect 2");
        if (model) {
            model.setCoords(getPosition(position));
        }
    }, [position]);

    return null;
};

export default ThreeboxObject;
