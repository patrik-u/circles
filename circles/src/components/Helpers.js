import i18n from "../i18n/Localization";
import config from "../Config";
import { GeoPoint } from "firebase/firestore";

export const getImageKitUrl = (url, width, height) => {
    if (!url) return null;

    let imageKitEndpoint = "https://ik.imagekit.io/circles/";
    let imageKitParams = "";
    if (width || height) {
        imageKitParams = "?tr=";
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
    const imageKitUrl = url.replace("https://firebasestorage.googleapis.com/", imageKitEndpoint) + imageKitParams;
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

export const isToday = (date) => {
    let currentDate = new Date().setHours(0, 0, 0, 0);
    let compareDate = new Date(date).setHours(0, 0, 0, 0);
    return currentDate === compareDate;
};

// converts firestore date to javascript date
export const fromFsDate = (date) => {
    if (!date) return date;

    if (date._seconds) {
        return new Date(date._seconds * 1000);
    } else if (date.seconds) {
        return new Date(date.seconds * 1000);
    } else {
        return date;
    }
};

export const mapNavigateTo = (navigate, path, embed) => {
    if (embed) {
        window.open(path, "_blank");
    } else {
        navigate(path);
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

export const getDateWithoutTime = (date = new Date()) => {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

export const getDayAndMonth = (date = new Date()) => {
    return fromFsDate(date).toLocaleDateString(i18n.language, { month: "long", day: "numeric" });
};

export const getDateAndTimeLong = (date) => {
    return `${fromFsDate(date)?.toLocaleDateString(i18n.language, { month: "long", day: "numeric" })} ${i18n.t("clock_at")} ${fromFsDate(
        date
    )?.toLocaleTimeString(i18n.language, { hour: "2-digit", minute: "2-digit" })}`;
};

export const getDateLong = (date) => {
    return fromFsDate(date)?.toLocaleDateString(i18n.language, { month: "long", day: "numeric" });
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
    return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email);
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
    toast({
        title: title,
        description: description,
        status: "success",
        position: "top",
        duration: 4500,
        isClosable: true,
    });
};

export const log = (message, logLevel = 0) => {
    // logLevel 0 = everything, 1 = important, 2 = production
    if (logLevel >= config.logLevel) {
        console.log(message);
    }
};
