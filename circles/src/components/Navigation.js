//#region imports
import { AiFillHome, AiOutlineGlobal } from "react-icons/ai";
import { RiAdminLine } from "react-icons/ri";
import { MdSettings } from "react-icons/md";
import { FaCalendarAlt } from "react-icons/fa";
import { HiUsers } from "react-icons/hi";
import { BsChatText } from "react-icons/bs";
import { BiNetworkChart } from "react-icons/bi";
import i18n from "i18n/Localization";
import { isAdmin, isConnected } from "./Helpers";
//#endregion

export const routes = {
    home: "/circle/earth/circles",
    circle: (id) => ({
        home: `/circle/${id}`,
        chat: `/circle/${id}/chat`,
        users: `/circle/${id}/users`,
        rooms: `/circle/${id}/rooms`,
        circles: `/circle/${id}/circles`,
        events: `/circle/${id}/events`,
        links: `/circle/${id}/links`,
        new: `/circle/${id}/new`,
        settings: {
            home: `/circle/${id}/settings`,
            about: `/circle/${id}/settings`,
            images: `/circle/${id}/settings/images`,
            tags: `/circle/${id}/settings/tags`,
            questions: `/circle/${id}/settings/questions`,
            base: `/circle/${id}/settings/base`,
            socialmedia: `/circle/${id}/settings/socialmedia`,
            connections: `/circle/${id}/settings/connections`,
            misc: `/circle/${id}/settings/misc`,
        },
    }),
    appAdmin: "/appAdmin",
    graph: "/graph",
};

export const getNavigationItems = (circleId, isAdmin) => {
    let id = circleId ?? "earth";
    let navigationItems = [];
    navigationItems.push({ route: routes.circle(id).home, name: i18n.t("Home"), icon: AiFillHome, switchOffMap: true, matchSubPaths: false, category: "home" });

    navigationItems.push({
        route: routes.circle(id).chat,
        name: i18n.t("Chat"),
        icon: BsChatText,
        switchOffMap: true,
        matchSubPaths: true,
        category: "chat",
    });
    navigationItems.push({
        route: routes.circle(id).circles,
        name: i18n.t("Circles"),
        icon: BiNetworkChart,
        switchOffMap: true,
        matchSubPaths: true,
        category: "circles",
    });
    navigationItems.push({
        route: routes.circle(id).events,
        name: i18n.t("Events"),
        icon: FaCalendarAlt,
        switchOffMap: true,
        matchSubPaths: true,
        category: "events",
    });
    navigationItems.push({
        route: routes.circle(id).rooms,
        name: i18n.t("Rooms"),
        switchOffMap: true,
        matchSubPaths: true,
        category: "rooms",
        image: require("../assets/images/room_icon.png"),
    });
    if (isAdmin) {
        navigationItems.push({
            route: routes.circle(id).links,
            name: i18n.t("Links"),
            icon: AiOutlineGlobal,
            switchOffMap: true,
            matchSubPaths: true,
            category: "links",
        });
    }
    navigationItems.push({ route: routes.circle(id).users, name: i18n.t("Users"), icon: HiUsers, switchOffMap: true, matchSubPaths: true, category: "users" });
    navigationItems.push({
        route: routes.circle(id).settings.home,
        name: i18n.t("Settings"),
        icon: MdSettings,
        requireAdmin: true,
        switchOffMap: true,
        matchSubPaths: true,
        category: "settings",
    });

    if (isAdmin) {
        navigationItems.push({ route: routes.appAdmin, name: i18n.t("Admin"), icon: RiAdminLine, switchOffMap: true, matchSubPaths: true });
    }

    return navigationItems;
};

export const shouldShowNavItem = (navItem, circle, user) => {
    if (circle == null) return true;
    if (navItem.requireAdmin && !isAdmin(circle, user)) {
        return false;
    } else if (navItem.requireConnection && !isConnected(user, circle)) {
        return false;
    } else if (navItem.requireSelf && circle.id !== user.id) {
        return false;
    }
    return true;
};

export const circleDefaultRoute = (user, circleId) => {
    // if (circleId === "earth") return routes.circle(circleId).circles;
    // if (circleId === user?.id) return routes.circle(circleId).circles;
    // let connection = user?.connections?.find((y) => y.target.id === circleId);
    // if (!connection) {
    //     return routes.circle(circleId).home;
    // }
    // switch (connection.target.type) {
    //     case "user":
    //         return routes.circle(circleId).home;
    //     case "circle":
    //         return routes.circle(circleId).chat;
    //     case "event":
    //         return routes.circle(circleId).home;
    //     case "tag":
    //         return routes.circle(circleId).home;
    //     default:
    //         return routes.circle(circleId).home;
    // }

    let connection = user?.connections?.find((y) => y.target.id === circleId);
    if (connection && connection.target.type === "room") {
        return routes.circle(circleId).chat;
    }

    // for now the default route for all circles is the home screen
    return routes.circle(circleId).home;
};

export const openCircle = (navigate, user, circleId, circle, setCircle, inSelect) => {
    if (circle?.id !== circleId) {
        setCircle(null);
    }

    navigate(circleDefaultRoute(user, circleId));
};

export const openCircleSection = (navigate, user, circleId, circle, setCircle, section) => {
    if (circle?.id !== circleId) {
        setCircle(null);
    }

    navigate(routes.circle(circleId)[section]);
};

export const parseCircleId = (path) => {
    var match = path.match(/\/circle\/([^/]*)/);
    if (match === null) return null;
    return match[1];
};
