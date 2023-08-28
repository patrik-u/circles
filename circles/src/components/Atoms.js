import { atom, useAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { signInStatusValues, displayModes, circleSubSections } from "./Constants";
import { isCircleActive } from "components/Helpers";
import { isMobile as detectIsMobile } from "react-device-detect";
import { fromFsDate, log } from "components/Helpers";

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
export const jitsiTokenAtom = atom(null);
export const inVideoConferenceAtom = atom(false);
export const toggleWidgetEventAtom = atom(null);
export const updateRelationAtom = atom(null);

// connection
export const connectPopupAtom = atom(null);
export const isConnectingAtom = atom(false);

// user account atoms
export const uidAtom = atom(null);
export const userAtom = atomWithStorage(null);
export const userDataAtom = atomWithStorage(null);
export const showHistoricCirclesAtom = atom(false);
export const userConnectionsAtom = atom(null);
export const signInStatusAtom = atom(signInStatusValues.signingIn);
export const userLocationAtom = atom({ latitude: undefined, longitude: undefined });
export const requestUserConnectionsAtom = atom(false);
export const messageTokenAtom = atom(null);
export const circleSettingsAtom = atomWithStorage({});
export const navigationPanelPinnedAtom = atomWithStorage(false);

// document
export const documentTreeAtom = atom([]);
export const documentNodesAtom = atom([]);
export const triggerSaveDocumentAtom = atom(null);
export const saveIdAtom = atom(null);
export const triggerAiTextCompletionAtom = atom(false);
export const aiTextCompletionActiveAtom = atom(false);
export const triggerClearEditorAtom = atom(false);
export const includeParagraphsAtom = atomWithStorage(true);

// circle atoms
export const circleHistoryAtom = atom({ history: [], position: -1 });
export const circleAtom = atom(null);
export const circleDataAtom = atom(null);
export const activeCirclesAtom = atom([]);
export const similarCirclesAtom = atom([]);
export const connectedCirclesAtom = atom([]);
export const mentionedCirclesAtom = atom([]);
export const circleConnectionsAtom = atom([]);
export const highlightedCircleAtom = atom(null);
export const semanticSearchCirclesAtom = atom([]);
export const homeExpandedAtom = atom(false);
export const chatCircleAtom = atom(null);
export const circlesFilterAtom = atom({});
export const circleSubSectionAtom = atom(circleSubSections.default);

export const mergedSemanticSearchCirclesAtom = atom((get) => {
    const semanticSearchCircles = get(semanticSearchCirclesAtom);
    let mergedCircles = [];
    for (var item of semanticSearchCircles) {
        // loop through all semantic search circles and add them to the list
        for (var circle of item.circles) {
            // check if circle already exists in the list if so update it
            let circleId = circle.id;
            let existingCircle = mergedCircles.find((x) => x.id === circleId);
            if (existingCircle) {
                existingCircle.colors.push(item.color);
                existingCircle.queries.push(item.query);

                // get average score
                existingCircle.score = (existingCircle.score + circle.score) / 2;
            } else {
                mergedCircles.push({ ...circle, colors: [item.color], queries: [item.query] });
            }
        }
    }
    return mergedCircles;
});

export const circlesAtom = atom((get) => {
    // gets active circles and circles from semantic search query and combines them to a single list
    const activeCircles = get(activeCirclesAtom);
    const similarCircles = get(similarCirclesAtom);
    const connectedCircles = get(connectedCirclesAtom);
    const mentionedCircles = get(mentionedCirclesAtom);
    const mergedSemanticSearchCircles = get(mergedSemanticSearchCirclesAtom);

    // remove duplicates here

    let circles = [...activeCircles];
    for (var circle of circles) {
        // clear colors and queries
        circle.colors = [];
        circle.queries = [];
        circle.categories = ["active"];
    }

    for (var item of mergedSemanticSearchCircles) {
        // loop through all semantic search circles and add them to the list
        let circleId = item.id;
        let existingCircle = circles.find((x) => x.id === circleId);
        if (existingCircle) {
            existingCircle.colors = item.colors;
            existingCircle.query = item.query;
            existingCircle.categories.push("search");
        } else {
            item.categories = ["search"];
            circles.push(item);
        }
    }

    // add similar circles not in list
    for (var similarCircle of similarCircles) {
        let circleId = similarCircle.id;
        let existingCircle = circles.find((x) => x.id === circleId);
        if (!existingCircle) {
            similarCircle.categories = ["similar"];
            circles.push(similarCircle);
        } else {
            existingCircle.categories.push("similar");
            // TODO maybe add color
        }

        if (!similarCircle.name) {
            log("similarCircle: " + JSON.stringify(similarCircle, null, 2), 0, true, similarCircle);
        }
    }

    // add connected circles not in list
    for (var connectedCircle of connectedCircles) {
        let circleId = connectedCircle.id;
        let existingCircle = circles.find((x) => x.id === circleId);
        if (!existingCircle) {
            connectedCircle.categories = ["connected"];
            circles.push(connectedCircle);
        } else {
            existingCircle.categories.push("connected");
            // TODO maybe add color
        }
    }

    // add mentioned circles not in list
    mentionedCircles.sort((a, b) => fromFsDate(b.mentioned_at ?? new Date("2000-01-01")) - fromFsDate(a.mentioned_at ?? new Date("2000-01-01")));
    for (var mentionedCircle of mentionedCircles) {
        let circleId = mentionedCircle.id;
        let existingCircle = circles.find((x) => x.id === circleId);
        if (!existingCircle) {
            mentionedCircle.categories = ["mentioned"];
            circles.push(mentionedCircle);
        } else {
            existingCircle.categories.push("mentioned");
            // TODO maybe add color
        }
    }

    return circles;
});

export const filteredCirclesAtom = atom((get) => {
    const circles = get(circlesAtom);
    const filter = get(circlesFilterAtom);

    // TODO filter by location, tags, date, active, etc.

    // filter by type
    let retCircles = filter?.types
        ? circles.filter((x) => filter.types.includes(x.type) && x.id !== "global")
        : circles.filter((x) => x.type !== "set" && x.type !== "ai_agent" && x.id !== "global");

    // filter by live/active
    retCircles = filter?.live ? retCircles.filter((circle) => isCircleActive(circle)) : retCircles;

    // filter by categories
    if (filter?.categories?.length > 0) {
        for (var x of filter?.categories) {
            let category = x;
            retCircles = retCircles.filter((x) => x.categories.includes(category));
        }
    }

    // TODO sorting by newest, proximity, similarity, etc.
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
