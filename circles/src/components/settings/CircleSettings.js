//#region imports
import React, { useEffect, useContext, lazy } from "react";
import { Box, Flex, Text, useToast } from "@chakra-ui/react";
import i18n from "i18n/Localization";
import { log } from "components/Helpers";
import { Routes, Route, matchPath } from "react-router-dom";
import { CircleHeader } from "components/CircleElements";
import { routes } from "components/Navigation";
import { defaultContentWidth } from "components/Constants";
import { Scrollbars } from "react-custom-scrollbars-2";
import { useNavigateNoUpdates, useLocationNoUpdates } from "components/RouterUtils";
import { useAtom } from "jotai";
import {
    isMobileAtom,
    userAtom,
    userDataAtom,
    displayModeAtom,
    showNetworkLogoAtom,
    signInStatusAtom,
    circleAtom,
    circlesAtom,
    circleConnectionsAtom,
    locationPickerActiveAtom,
    locationPickerPositionAtom,
} from "components/Atoms";
//#endregion

const CircleContentForm = lazy(() => import("components/settings/CircleContentForm"));
// const CircleImagesForm = lazy(() => import("components/settings/CircleImagesForm"));
// const CircleTagsForm = lazy(() => import("components/settings/CircleTagsForm"));
// const CircleBaseForm = lazy(() => import("components/settings/CircleBaseForm"));
// const CircleSocialMediaForm = lazy(() => import("components/settings/CircleSocialMediaForm"));
// const CircleContentForm = lazy(() => import("components/settings/CircleContentForm"));
// const CircleDeleteForm = lazy(() => import("components/settings/CircleDeleteForm"));
// const CircleConnectionsSettings = lazy(() => import("components/settings/CircleConnectionsSettings"));
// const CircleQuestionsForm = lazy(() => import("components/settings/CircleQuestionsForm"));

const CircleSettings = () => {
    const navigate = useNavigateNoUpdates();
    const location = useLocationNoUpdates();
    const [isMobile] = useAtom(isMobileAtom);
    const [circle] = useAtom(circleAtom);

    const adminNavigationItems = () => {
        if (!circle) return [];
        switch (circle.type) {
            default:
            case "link":
            case "room":
            case "circle":
            case "event":
                return [
                    { route: routes.circle(circle.id).settings.about, name: i18n.t("circleadmin_about") },
                    { route: routes.circle(circle.id).settings.images, name: i18n.t("circleadmin_images") },
                    { route: routes.circle(circle.id).settings.tags, name: i18n.t("Tags") },
                    { route: routes.circle(circle.id).settings.base, name: i18n.t("circleadmin_base") },
                    { route: routes.circle(circle.id).settings.socialmedia, name: i18n.t("Quick Links") },
                    { route: routes.circle(circle.id).settings.connections, name: i18n.t("Connection Requests") },
                    { route: routes.circle(circle.id).settings.misc, name: i18n.t("Misc") },
                ];
            case "user":
                return [
                    { route: routes.circle(circle.id).settings.about, name: i18n.t("circleadmin_about") },
                    { route: routes.circle(circle.id).settings.images, name: i18n.t("circleadmin_images") },
                    { route: routes.circle(circle.id).settings.tags, name: i18n.t("Tags") },
                    { route: routes.circle(circle.id).settings.questions, name: i18n.t("Questions") },
                    { route: routes.circle(circle.id).settings.base, name: i18n.t("circleadmin_base") },
                    { route: routes.circle(circle.id).settings.connections, name: i18n.t("Connection Requests") },
                    { route: routes.circle(circle.id).settings.socialmedia, name: i18n.t("Quick Links") },
                ];
        }
    };

    const isMatch = adminNavigationItems().map((navItem) => matchPath(navItem.route, location.pathname) != null);

    if (!circle) return null;

    return (
        <Flex flexGrow="1" width="100%" position="relative" left="0px" flexDirection={isMobile ? "column" : "row"} top="0px">
            <Routes>
                <Route path="/" element={<CircleContentForm isUpdateForm={true} circle={circle} />} />
                {/* <Route path="/images" element={<CircleImagesForm isUpdateForm={true} circle={circle} />} />
                <Route path="/tags" element={<CircleTagsForm isUpdateForm={true} circle={circle} />} />
                <Route path="/questions" element={<CircleQuestionsForm isUpdateForm={true} circle={circle} />} />
                <Route path="/base" element={<CircleBaseForm isUpdateForm={true} circle={circle} />} />
                <Route path="/socialmedia" element={<CircleSocialMediaForm circle={circle} />} />
                <Route path="/connections" element={<CircleConnectionsSettings circle={circle} />} />
                <Route path="/misc" element={<CircleDeleteForm circle={circle} />} /> */}
            </Routes>

            <Flex
                position={"relative"}
                flexDirection={isMobile ? "row" : "column"}
                height={isMobile ? "50px" : "auto"}
                backgroundColor="#fdfdfd"
                width={isMobile ? "100%" : "120px"}
                order="-1"
            >
                <Scrollbars autoHide height={isMobile ? "50px" : "100%"} width="100%">
                    <Flex
                        height={isMobile ? "50px" : "auto"}
                        marginLeft={isMobile ? "10px" : "0px"}
                        flexDirection={isMobile ? "row" : "column"}
                        marginTop={isMobile ? "0px" : "15px"}
                        align="center"
                    >
                        {adminNavigationItems().map((navItem, i) => (
                            <Flex
                                key={navItem.route}
                                width={isMobile ? "auto" : "110px"}
                                align="center"
                                justifyContent="center"
                                borderRadius="50px"
                                cursor="pointer"
                                height="30px"
                                paddingLeft="10px"
                                paddingRight="10px"
                                flexShrink="0"
                                marginLeft={isMobile ? "0px" : "5px"}
                                marginRight={isMobile ? "0px" : "5px"}
                                marginTop={isMobile ? "0px" : "5px"}
                                marginBottom={isMobile ? "0px" : "5px"}
                                color={isMatch[i] ? (isMobile ? "white" : "#585858") : "#757575"}
                                fontWeight={isMatch[i] ? "700" : "500"}
                                bg={isMatch[i] ? (isMobile ? "#c242bb" : "#d5d5d5") : "transparent"}
                                onClick={() => navigate(navItem.route)}
                                flexDirection="column"
                            >
                                <Text fontSize={navItem.name.length > 15 ? "12px" : "14px"} textAlign="center" lineHeight="12px">
                                    {navItem.name}
                                </Text>
                            </Flex>
                        ))}
                    </Flex>
                </Scrollbars>
            </Flex>
        </Flex>
    );
};

export default CircleSettings;
