//#region imports
import { AiFillHome, AiOutlineGlobal } from "react-icons/ai";
import { RiAdminLine } from "react-icons/ri";
import { MdSettings } from "react-icons/md";
import { FaCalendarAlt } from "react-icons/fa";
import { HiUsers } from "react-icons/hi";
import { BsChatText } from "react-icons/bs";
import { BiNetworkChart } from "react-icons/bi";
import i18n from "i18n/Localization";
import { isAdmin, isConnected } from "components/Helpers";
//#endregion

export const routes = {
    home: "/",
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
        admin: `/circle/${id}/admin`,
    }),
    // graph: "/graph",
};

export const openCircle = (navigate, circleId, section) => {
    if (!circleId) return;
    let path = routes.circle(circleId);
    navigate(section ? path[section] : path.home);
};

export const getNavigationItems = (circleId, isAdmin) => {
    let id = circleId;
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
        image: "/room_icon.png",
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
        navigationItems.push({ route: routes.circle(id).admin, name: i18n.t("Admin"), icon: RiAdminLine, switchOffMap: true, matchSubPaths: true });
    }

    return navigationItems;
};

export const shouldShowNavItem = (navItem, circle, userData) => {
    if (circle == null) return true;
    if (navItem.requireAdmin && !isAdmin(circle, userData)) {
        return false;
    } else if (navItem.requireConnection && !isConnected(userData, circle?.id, ["connected_mutually_to"])) {
        return false;
    }
    return true;
};
