//#region imports
import { AiFillHome, AiOutlineGlobal } from "react-icons/ai";
import { RiAdminLine } from "react-icons/ri";
import { MdSettings, MdFeed } from "react-icons/md";
import { FaCalendarAlt, FaVideo } from "react-icons/fa";
import { HiUsers } from "react-icons/hi";
import { BsChatText } from "react-icons/bs";
import { BiNetworkChart } from "react-icons/bi";
import i18n from "i18n/Localization";
import { isAdmin, isConnected } from "components/Helpers";
//#endregion

export const routes = {
    home: "/",
    circle: (circle) => ({
        home: `/${circle?.host ?? "circles"}/${circle?.id}`,
        chat: `/${circle?.host ?? "circles"}/${circle?.id}/chat`,
        users: `/${circle?.host ?? "circles"}/${circle?.id}/users`,
        rooms: `/${circle?.host ?? "circles"}/${circle?.id}/rooms`,
        circles: `/${circle?.host ?? "circles"}/${circle?.id}/circles`,
        events: `/${circle?.host ?? "circles"}/${circle?.id}/events`,
        links: `/${circle?.host ?? "circles"}/${circle?.id}/links`,
        posts: `/${circle?.host ?? "circles"}/${circle?.id}/posts`,
        new: `/${circle?.host ?? "circles"}/${circle?.id}/new`,
        settings: {
            home: `/${circle?.host ?? "circles"}/${circle?.id}/settings`,
            about: `/${circle?.host ?? "circles"}/${circle?.id}/settings`,
            images: `/${circle?.host ?? "circles"}/${circle?.id}/settings/images`,
            tags: `/${circle?.host ?? "circles"}/${circle?.id}/settings/tags`,
            questions: `/${circle?.host ?? "circles"}/${circle?.id}/settings/questions`,
            base: `/${circle?.host ?? "circles"}/${circle?.id}/settings/base`,
            socialmedia: `/${circle?.host ?? "circles"}/${circle?.id}/settings/socialmedia`,
            connections: `/${circle?.host ?? "circles"}/${circle?.id}/settings/connections`,
            funding: `/${circle?.host ?? "circles"}/${circle?.id}/settings/funding`,
            misc: `/${circle?.host ?? "circles"}/${circle?.id}/settings/misc`,
        },
        admin: `/${circle?.host ?? "circles"}/${circle?.id}/admin`,
    }),
    // graph: "/graph",
};

export const openCircle = (navigate, circle, section) => {
    if (!circle?.id) return;
    let path = routes.circle(circle);
    navigate(section ? path[section] : path.home);
};

export const getNavigationItems = (circle, isAdmin) => {
    let id = circle?.id;
    let navigationItems = [];
    navigationItems.push({ route: routes.circle(circle).home, name: i18n.t("Home"), icon: AiFillHome, switchOffMap: true, matchSubPaths: false, category: "home" });

    navigationItems.push({
        route: routes.circle(circle).posts,
        name: i18n.t("Posts"),
        icon: MdFeed,
        switchOffMap: true,
        matchSubPaths: true,
        category: "posts",
    });
    navigationItems.push({
        route: routes.circle(circle).chat,
        name: i18n.t("Chat"),
        icon: BsChatText,
        switchOffMap: true,
        matchSubPaths: true,
        category: "chat",
    });
    navigationItems.push({
        route: routes.circle(circle).circles,
        name: i18n.t("Circles"),
        icon: BiNetworkChart,
        switchOffMap: true,
        matchSubPaths: true,
        category: "circles",
    });
    navigationItems.push({
        route: routes.circle(circle).events,
        name: i18n.t("Events"),
        icon: FaCalendarAlt,
        switchOffMap: true,
        matchSubPaths: true,
        category: "events",
    });
    navigationItems.push({
        route: routes.circle(circle).rooms,
        name: i18n.t("Rooms"),
        switchOffMap: true,
        matchSubPaths: true,
        category: "rooms",
        image: "/room_icon.png",
    });
    if (isAdmin) {
        navigationItems.push({
            route: routes.circle(circle).links,
            name: i18n.t("Links"),
            icon: AiOutlineGlobal,
            switchOffMap: true,
            matchSubPaths: true,
            category: "links",
        });
    }
    navigationItems.push({ route: routes.circle(circle).users, name: i18n.t("Users"), icon: HiUsers, switchOffMap: true, matchSubPaths: true, category: "users" });
    navigationItems.push({
        route: routes.circle(circle).settings.home,
        name: i18n.t("Settings"),
        icon: MdSettings,
        requireAdmin: true,
        switchOffMap: true,
        matchSubPaths: true,
        category: "settings",
    });

    if (isAdmin) {
        navigationItems.push({ route: routes.circle(circle).admin, name: i18n.t("Admin"), icon: RiAdminLine, switchOffMap: true, matchSubPaths: true });
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
