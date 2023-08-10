import i18n from "../i18n/Localization";
import config from "../Config";
import { GeoPoint } from "firebase/firestore";
import sha256 from "js-sha256";

export const getSetId = (circleAId, circleBId) => {
    if (circleAId == null || circleBId == null) return null;

    // sort the IDs
    const sortedIds = [circleAId, circleBId].sort();

    // concatenate the sorted IDs
    const combinedId = sortedIds.join("_");

    // hash the combined ID using sha256
    const setId = sha256(combinedId);
    return setId;
};

export const getDefaultCirclePicture = (type) => {
    switch (type) {
        case "event":
            return "/default-event-picture.png";
        default:
        case "circle":
            return "/default-circle-picture.png";
        case "user":
            return "/default-user-picture.png";
        case "tag":
            return "/default-tag-picture.png";
        case "link":
            return "/default-link-picture.png";
        case "post":
            return "/default-user-picture.png";
    }
};

export const getCircleTypes = (sourceType, targetType) => {
    const types = [sourceType, targetType];
    return types.sort().join("_");
};

export const isConnected = (userData, circleId, types) => {
    if (!circleId || !userData) return false;
    if (userData.id === circleId) return true;

    if (!types) {
        types = [
            "connected_mutually_to",
            "connected_to",
            "owner_of",
            "admin_of",
            "moderator_of",
            "creator_of",
            "connected_mutually_to_request",
            "admin_of_request",
        ];
    }

    for (let type of types) {
        if (userData[type]?.includes(circleId)) {
            return true;
        }
    }
    return false;
};

export const isConnectedOrPending = (userData, circleId) => {
    if (!circleId || !userData) return false;
    return userData.id === circleId || userData.connected_mutually_to?.includes(circleId) || userData.connected_mutually_to_request?.includes(circleId);
};

export const hasUpdates = (userData, circle, category) => {
    // show update indicator if user is connected to circle and user data indicates user hasn't seen latest updates
    if (!userData || !circle || !category) return false;
    if (!isConnected(userData, circle?.id)) return false;

    let updatedAt = fromFsDate(circle.updates?.[category]);
    let seenAt = fromFsDate(userData.seen?.[circle.id]?.[category]);

    if (updatedAt && !seenAt) {
        return true;
    }

    return updatedAt > seenAt;
};

export const log = (message, logLevel = 0, highlight = false) => {
    // logLevel 0 = everything, 1 = important, 2 = production
    if (logLevel >= config.logLevel) {
        if (highlight) {
            const style = "background-color: darkblue; color: white; font-style: bold;";
            console.log("%c" + message, style);
        } else {
            console.log(message);
        }
    }
};

export const isPastEvent = (inEvent) => {
    let eventDate = fromFsDate(inEvent.starts_at);
    if (eventDate < new Date()) {
        return !(inEvent.is_all_day && isToday(eventDate));
    }
    return false;
};

export const getEventTime = (item) => {
    let eventStart = fromFsDate(item.starts_at);
    if (isToday(eventStart)) {
        // event is today
        if (item.is_all_day) {
            // event takes place today and is an all day event
            return i18n.t("Today");
        } else if (isPastEvent(item)) {
            // event takes place today and has already started
            return `${timeSince(fromFsDate(item.starts_at))} ${i18n.t("ago")}`;
        } else {
            // event takes place today and hasn't started
            return timeSince(fromFsDate(item.starts_at), true);
        }
    } else {
        // event isn't today
        if (isPastEvent(item)) {
            // event has already taken place
            return `${timeSince(fromFsDate(item.starts_at))} ${i18n.t("ago")}`;
        } else {
            // event has yet to start
            return timeSince(fromFsDate(item.starts_at), true);
        }
    }
};

export const getImageKitUrl = (url, width, height) => {
    if (!url) return null;

    const firebaseStorageUrl = "https://firebasestorage.googleapis.com/";
    let imageKitUrl = "";
    let imageKitEndpoint = config.imageKitEndpoint;
    if (url.startsWith("/")) {
        switch (config.environment) {
            default:
            case "dev":
                return url;
            case "dev-prod":
                return url;
            case "staging":
                imageKitEndpoint += "web-staging/";
                break;
            case "prod":
                imageKitEndpoint += "web-prod/";
                break;
        }
        imageKitUrl = imageKitEndpoint + url.slice(1);
    } else if (url.startsWith(firebaseStorageUrl)) {
        imageKitEndpoint += "storage/";
        imageKitUrl = url.replace(firebaseStorageUrl, imageKitEndpoint);
    } else {
        return url;
    }

    let imageKitParams = "";
    if (width || height) {
        imageKitParams += url.includes("?") ? "&" : "?";
        imageKitParams += "tr=";
        if (width) {
            imageKitParams += "w-" + width;
        }
        if (height) {
            if (width) {
                imageKitParams += ",";
            }
            imageKitParams += "h-" + height;
        }
    }
    imageKitUrl += imageKitParams;
    return imageKitUrl;
};

export const getGeoPoint = (loc) => {
    if (!loc) return null;
    if (loc.latitude) {
        return new GeoPoint(loc.latitude, loc.longitude);
    } else if (loc._latitude) {
        return new GeoPoint(loc._latitude, loc._longitude);
    }
    return null;
};

export const getRandomInt = (min, max) => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
};

export const lat = (item) => {
    if (!item) return 0;
    if (item.latitude) return item.latitude;
    if (item._latitude) return item._latitude;
    return 0;
};

export const lng = (item) => {
    if (!item) return 0;
    if (item.longitude) return item.longitude;
    if (item._longitude) return item._longitude;
    return 0;
};

export const getLocation = (item) => {
    let activeLocation = item?.activity?.location && isWithinActiveThreshold(item?.activity?.last_activity);
    let loc = activeLocation ? item?.activity?.location : item?.base;

    if (!loc) return null;
    return getLatlng(loc);
};

export const isToday = (date) => {
    let currentDate = new Date().setHours(0, 0, 0, 0);
    let compareDate = new Date(date).setHours(0, 0, 0, 0);
    return currentDate === compareDate;
};

export const isWithinMinutes = (date, minutes) => {
    let currentDate = new Date();
    let compareDate = fromFsDate(date);
    return Math.abs(currentDate - compareDate) / 60000 <= minutes;
};

export const isCircleActive = (circle) => {
    // users stay active for 10 minutes after last activity, the rest for 24 hours
    if (circle.type === "user") {
        return isWithinMinutes(circle?.activity?.last_activity, 10);
    } else {
        return isWithinMinutes(circle?.activity?.last_activity, 60 * 24);
    }
};

export const isWithinActiveThreshold = (lastActivity) => {
    return isWithinMinutes(lastActivity, 10);
};

export const isCircleOnline = (circle) => {
    return isWithinMinutes(circle?.activity?.last_online, 2);
};

export const isActiveInCircle = (circle) => {
    if (!circle) return false;
    if (circle.id === "global" || circle.type === "user" || circle.type === "set") return false;
    return isCircleActive(circle) && circle?.activity?.active_in_circle;
};

export const isActiveInVideoConference = (circle) => {
    return isWithinMinutes(circle?.activity?.active_in_video_conference, 2) || isWithinMinutes(circle?.activity?.active_video_conference, 2);
};

export const getRelationSet = (user, circle) => {
    if (!user || !circle) return null;

    let setId = getSetId(user.id, circle.id);
    const sortedIds = [user?.id, circle?.id].sort();
    let set = {
        type: "set",
        id: setId,
        [user.id]: user,
        [circle.id]: circle,
        set_size: 2,
        circle_ids: sortedIds,
        circle_types: getCircleTypes(user.type, circle.type),
    };
    return set;
};

// converts firestore date to javascript date
export const fromFsDate = (date) => {
    if (!date) return date;

    if (date._seconds) {
        return new Date(date._seconds * 1000);
    } else if (date.seconds) {
        return new Date(date.seconds * 1000);
    } else if (typeof date === "number") {
        return new Date(date);
    } else {
        return date;
    }
};

export const datesAreOnSameDay = (first, second) => {
    if (first === null || second === null) return false;
    let firstDate = fromFsDate(first);
    let secondDate = fromFsDate(second);
    if (!firstDate || !secondDate) return false;

    return (
        firstDate.getFullYear() === secondDate.getFullYear() && firstDate.getMonth() === secondDate.getMonth() && firstDate.getDate() === secondDate.getDate()
    );
};

export const combineDateAndTime = (date, time) => {
    const timeString = time + ":00";
    const year = date.getFullYear();
    const month = ("0" + (date.getMonth() + 1)).slice(-2);
    const day = ("0" + date.getDate()).slice(-2);
    const dateString = "" + year + "-" + month + "-" + day;
    const datec = dateString + "T" + timeString;
    return new Date(datec);
};

export const getDateWithoutTime = (date = new Date()) => {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

export const getDayAndMonth = (date = new Date()) => {
    return fromFsDate(date).toLocaleDateString(i18n.language, { month: "long", day: "numeric" });
};

export const getDateAndTimeLong = (date) => {
    return `${fromFsDate(date)?.toLocaleDateString?.(i18n.language, { month: "long", day: "numeric" })} ${i18n.t("clock_at")} ${fromFsDate(
        date
    )?.toLocaleTimeString?.(i18n.language, {
        hour: "2-digit",
        minute: "2-digit",
    })}`;
};

export const getDateLong = (date) => {
    return fromFsDate(date)?.toLocaleDateString?.(i18n.language, { month: "long", day: "numeric" });
};

export const capFirstLetter = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
};

export const singleLineEllipsisStyle = {
    WebkitLineClamp: 1,
    WebkitBoxOrient: "vertical",
    display: "-webkit-box",
    textOverflow: "ellipsis",
    overflow: "hidden",
};

export const twoLineEllipsisStyle = {
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    display: "-webkit-box",
    textOverflow: "ellipsis",
    overflow: "hidden",
};

export const timeSince = (date, timeUntil) => {
    if (typeof date !== "object") {
        date = new Date(date);
    }

    let seconds = 0;
    if (timeUntil) {
        seconds = Math.floor((date - new Date()) / 1000);
    } else {
        seconds = Math.floor((new Date() - date) / 1000);
    }
    var intervalType;

    var interval = Math.floor(seconds / 31536000);
    if (interval >= 1) {
        intervalType = interval == 1 ? i18n.t("year") : i18n.t("years");
    } else {
        interval = Math.floor(seconds / 2592000);
        if (interval >= 1) {
            intervalType = interval == 1 ? i18n.t("month") : i18n.t("months");
        } else {
            interval = Math.floor(seconds / 86400);
            if (interval >= 1) {
                intervalType = interval == 1 ? i18n.t("day") : i18n.t("days");
            } else {
                interval = Math.floor(seconds / 3600);
                if (interval >= 1) {
                    intervalType = interval == 1 ? i18n.t("hour") : i18n.t("hours");
                } else {
                    interval = Math.floor(seconds / 60);
                    if (interval >= 1) {
                        intervalType = interval == 1 ? i18n.t("minute") : i18n.t("minutes");
                    } else {
                        interval = seconds;
                        intervalType = interval == 1 ? i18n.t("second") : i18n.t("seconds");
                    }
                }
            }
        }
    }
    return interval + " " + intervalType;
};

export const validateEmail = (email) => {
    return /^[\w-.]+@([\w-]+.)+[\w-]{2,}$/.test(email);
};

export const validatePassword = (password) => {
    return /(?=.*[0-9a-zA-Z]).{6,}/.test(password);
};

export const getDistanceString = (distance) => {
    if (!distance) {
        return "";
    }
    if (distance < 1000) {
        return `${distance} m`;
    }
    if (distance > 100000) {
        return `${Math.round(distance / 1000) / 10} mil`;
    }
    return `${Math.round(distance / 100) / 10} km`;
};

export const getLatlng = (coords) => {
    if (!coords) return { latitude: 0, longitude: 0 };

    let lat = coords.latitude ?? coords._latitude ?? 0;
    let lng = coords.longitude ?? coords._longitude ?? 0;
    return { latitude: lat, longitude: lng };
};

export const getLngLatArray = (coords) => {
    let obj = getLatlng(coords);
    return [obj.longitude, obj.latitude];
};

export const toastError = (toast, title, description) => {
    if (typeof title !== "string") {
        title = JSON.stringify(title);
    }
    if (typeof description !== "string") {
        description = JSON.stringify(description);
    }

    toast({
        title: title,
        description: description,
        status: "error",
        position: "top",
        duration: 7500,
        isClosable: true,
        variant: "left-accent",
    });
};

export const toastInfo = (toast, title, description) => {
    if (typeof title !== "string") {
        title = JSON.stringify(title);
    }
    if (typeof description !== "string") {
        description = JSON.stringify(description);
    }

    toast({
        title: title,
        description: description,
        status: "info",
        position: "top",
        duration: 4500,
        isClosable: true,
        variant: "left-accent",
    });
};

export const toastWarning = (toast, title, description) => {
    if (typeof title !== "string") {
        title = JSON.stringify(title);
    }
    if (typeof description !== "string") {
        description = JSON.stringify(description);
    }

    toast({
        title: title,
        description: description,
        status: "warning",
        position: "top",
        duration: 4500,
        isClosable: true,
        variant: "left-accent",
    });
};

export const toastSuccess = (toast, title, description) => {
    if (typeof title !== "string") {
        title = JSON.stringify(title);
    }
    if (typeof description !== "string") {
        description = JSON.stringify(description);
    }

    toast({
        title: title,
        description: description,
        status: "success",
        position: "top",
        duration: 4500,
        isClosable: true,
    });
};

export const getMetaImage = (meta_data) => {
    if (!meta_data) return null;
    let item = meta_data.find((x) => x.images?.length > 0);
    if (item) return item.images[0];
    return null;
};

export const isAdmin = (circle, userData) => {
    if (!circle || !userData) return false;
    if (userData.id === circle.id) return true;

    return userData.admin_of?.includes(circle.id) || userData.owner_of?.includes(circle.id);
};

export const adminCircles = (userConnections) => {
    if (!userConnections) return [];
    let circles = userConnections.filter((x) => x.types?.includes("owner_of") || x.types?.includes("admin_of"));
    return circles?.map((x) => x.target) ?? [];
};

export const getConnectLabel = (circleType, connectType) => {
    switch (connectType) {
        case "owner_of":
            return i18n.t("Owner");
        case "admin_of":
            return i18n.t("Admin");
        case "moderator_of":
            return i18n.t("Moderator");
        case "connected_mutually_to":
            switch (circleType) {
                default:
                case "circle":
                    return i18n.t("Member");
                case "user":
                    return i18n.t("Contact");
                case "event":
                    return i18n.t("Attendee");
                case "tag":
                    return i18n.t("Supporter");
            }
        case "connected_mutually_to_request":
            return i18n.t(`Request [${circleType}]`);
        case "connected_to":
            return i18n.t("Follower");
        case "creator_of":
            return i18n.t("Creator");
        default:
            return i18n.t("Connected");
    }
};

// //  takes connections to same source or target and clusters them
// export const clusterConnections = (connections, clusterSource) => {
//     // merge user connections of the same type
//     let filteredConnections = [];
//     let connections_clone = connections;
//     try {
//         if (typeof structuredClone === "function") {
//             connections_clone = structuredClone(connections);
//         }
//     } catch {
//         connections_clone = connections;
//     }

//     if (Array.isArray(connections)) {
//         let seen = {};
//         filteredConnections = connections_clone?.filter((entry) => {
//             var previous;
//             var clusterId = clusterSource ? entry.source.id : entry.target.id;

//             // have we seen this label before?
//             if (seen.hasOwnProperty(clusterId)) {
//                 // yes, grab it and add this data to it
//                 previous = seen[clusterId];
//                 previous.type.push(entry.type);

//                 // don't keep this entry, we've merged it into the previous one
//                 return false;
//             }

//             // entry.type probably isn't an array; make it one for consistency
//             if (!Array.isArray(entry.type)) {
//                 entry.type = [entry.type];
//             }

//             // remember that we've seen it
//             seen[clusterId] = entry;
//             return true;
//         });
//     }
//     return filteredConnections;
// };

// export const isFollowing = (user, circle) => {
//     if (!circle || !user) return false;
//     return user?.connections?.some((x) => x.target.id === circle.id && x.type.includes("connected_to"));
// };

// export const isMutuallyConnected = (user, circle, includeRequests) => {
//     if (!circle || !user) return false;
//     return user?.connections?.some(
//         (x) => x.target.id === circle.id && (x.type.includes("connected_mutually_to") || (includeRequests && x.type.includes("connected_mutually_to_request")))
//     );
// };

// export const isMember = (userConnections, circleId) => {
//     return userConnections?.some((x) => x.target.id === circleId && x.type.includes("connected_mutually_to"));
// };

// export const getConnectionLabel = (user, item) => {
//     let connection = user?.connectionsToUser?.find((x) => x.source.id === item.id);
//     if (!connection) return null;
//     if (connection.type.includes("owned_by")) {
//         return i18n.t("Owned by you");
//     } else if (connection.type.includes("admin_by")) {
//         return i18n.t("Administered by you");
//     } else if (connection.type.includes("moderated_by")) {
//         return i18n.t("Moderated by you");
//     } else if (connection.type.includes("created_by")) {
//         return i18n.t("Created by you");
//     } else if (connection.type.includes("connected_to")) {
//         return i18n.t("Follows you");
//     } else if (connection.type.includes("connected_mutually_to")) {
//         return i18n.t("Connected to you");
//     } else {
//         return null;
//     }
// };

// export const isConnected = (user, circle) => {
//     return isConnectedId(user, circle?.id);
// };

// export const isConnectedId = (user, circleId) => {
//     if (!circleId || !user) return false;
//     return user?.connections?.some((x) => x.target.id === circleId);
// };

// export const isConnectedToUser = (user, item) => {
//     return user?.connectionsToUser?.some((x) => x.source.id === item.id);
// };
