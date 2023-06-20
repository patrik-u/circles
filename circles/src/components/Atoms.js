import { atom, useAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { signInStatusValues, displayModes, circleSubSections } from "./Constants";
import { isMobile as detectIsMobile } from "react-device-detect";
import { fromFsDate } from "components/Helpers";

// misc
export const isMobileAtom = atom(detectIsMobile);
export const displayModeAtom = atom(displayModes.map);
export const searchResultsShownAtom = atom(false);
export const newUserPopupAtom = atom(null);
export const newCirclePopupAtom = atom(null);
export const mapStyleAtom = atom("satellite");
export const focusOnMapItemAtom = atom(null);
export const toggleAboutAtom = atom(null);
export const toggleSettingsAtom = atom(null);
export const previewCircleAtom = atom(null);

// connection
export const connectPopupAtom = atom(null);
export const isConnectingAtom = atom(false);

// user account atoms
export const uidAtom = atom(null);
export const userAtom = atomWithStorage(null);
export const userDataAtom = atomWithStorage(null);
export const userConnectionsAtom = atom(null);
export const signInStatusAtom = atom(signInStatusValues.signingIn);
export const userLocationAtom = atom({ latitude: undefined, longitude: undefined });
export const requestUserConnectionsAtom = atom(false);
export const messageTokenAtom = atom(null);
export const circleSettingsAtom = atomWithStorage({});
export const navigationPanelPinnedAtom = atomWithStorage(false);

// circle atoms
export const circleAtom = atom(null);
export const circlesAtom = atom([]);
export const circleConnectionsAtom = atom([]);
export const homeExpandedAtom = atom(false);
export const chatCircleAtom = atom(null);
export const circlesFilterAtom = atom({});
export const circleSubSectionAtom = atom(circleSubSections.default);
export const filteredCirclesAtom = atom((get) => {
    const circles = get(circlesAtom);
    const filter = get(circlesFilterAtom);

    // TODO filter by location, tags, date, etc.

    let retCircles = filter?.types ? circles.filter((circle) => filter.types.includes(circle.type)) : circles;

    if (filter?.sortBy === "newest") {
        retCircles.sort((a, b) => fromFsDate(b.created_at) - fromFsDate(a.created_at));
    } else if (filter.sortBy === "proximity") {
        // TODO
    }

    return retCircles;
});

// location picker atoms
export const locationPickerActiveAtom = atom(false);
export const locationPickerPositionAtom = atom(null);

// Filtering logic:
// useEffect(() => {
//     log("Circles.useEffect 2", 0);
//     let listCircles = unfilteredCircles; //!filterConnected ? unfilteredCircles : unfilteredCircles.filter((x) => user?.connections?.some((y) => y.target.id === x.id));

//     if (type === "event") {
//         // filter all past events
//         let startDate = getDateWithoutTime(); // today
//         listCircles = listCircles.filter((x) => fromFsDate(x.starts_at) > startDate);
//     }

//     if (!userLocation) {
//         setCircles(listCircles);
//         return;
//     }

//     let newFilteredCircles = [];
//     if (userLocation.latitude && userLocation.longitude) {
//         for (var circle of listCircles.filter((x) => x.base)) {
//             var circleLocation = getLatlng(circle.base);
//             var preciseDistance = getPreciseDistance(userLocation, circleLocation);
//             newFilteredCircles.push({ ...circle, distance: preciseDistance });
//         }

//         newFilteredCircles.sort((a, b) => a.distance - b.distance);
//         for (var circlesWithNoBase of listCircles.filter((x) => !x.base)) {
//             newFilteredCircles.push(circlesWithNoBase);
//         }
//     } else {
//         newFilteredCircles = listCircles;
//     }

//     if (type === "event") {
//         // TODO if event we just sort by date and ignore proximity for now
//         newFilteredCircles.sort((a, b) => fromFsDate(a.starts_at) - fromFsDate(b.starts_at));
//     }

//     setCircles(newFilteredCircles);
// }, [unfilteredCircles, userLocation, setCircles, type]);
