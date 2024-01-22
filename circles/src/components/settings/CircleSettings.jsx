//#region imports
import React, { lazy } from "react";
import { Box, Flex, Text, Icon } from "@chakra-ui/react";
import i18n from "@/i18n/Localization";
import { Routes, Route, matchPath } from "react-router-dom";
import { routes } from "@/components/Navigation";
import { Scrollbars } from "react-custom-scrollbars-2";
import { useNavigateNoUpdates, useLocationNoUpdates } from "@/components/RouterUtils";
import { useAtom } from "jotai";
import { isMobileAtom, circleAtom, circleDataAtom } from "@/components/Atoms";
import { CircleContentForm } from "@/components/settings/CircleContentForm";
import { CircleImagesForm } from "@/components/settings/CircleImagesForm";
import { CircleTagsForm } from "@/components/settings/CircleTagsForm";
import { CircleQuestionsForm } from "@/components/settings/CircleQuestionsForm";
import { CircleBaseForm } from "@/components/settings/CircleBaseForm";
import { CircleQuickLinksForm } from "@/components/settings/CircleQuickLinksForm";
import { CircleConnectionsForm } from "@/components/settings/CircleConnectionsForm";
import { CircleFundingForm } from "@/components/settings/CircleFundingForm";
import { CircleDeleteForm } from "@/components/settings/CircleDeleteForm";
import { CircleAiForm } from "@/components/settings/CircleAiForm";
import { MdOutlineClose } from "react-icons/md";
import { CircleOffersAndNeedsForm } from "@/components/settings/CircleOffersAndNeedsForm";
import { CircleMissionForm } from "@/components/settings/CircleMissionForm";
//#endregion

// const CircleContentForm = lazy(() => import("@/components/settings/CircleContentForm"));
// const CircleImagesForm = lazy(() => import("@/components/settings/CircleImagesForm"));
// const CircleTagsForm = lazy(() => import("@/components/settings/CircleTagsForm"));
// const CircleQuestionsForm = lazy(() => import("@/components/settings/CircleQuestionsForm"));
// const CircleBaseForm = lazy(() => import("@/components/settings/CircleBaseForm"));
// const CircleQuickLinksForm = lazy(() => import("@/components/settings/CircleQuickLinksForm"));
// const CircleConnectionsForm = lazy(() => import("@/components/settings/CircleConnectionsForm"));
// const CircleFundingForm = lazy(() => import("@/components/settings/CircleFundingForm"));
// const CircleDeleteForm = lazy(() => import("@/components/settings/CircleDeleteForm"));

const CircleSettings = ({ onClose }) => {
    const navigate = useNavigateNoUpdates();
    const location = useLocationNoUpdates();
    const [isMobile] = useAtom(isMobileAtom);
    const [circle] = useAtom(circleAtom);
    const [circleData] = useAtom(circleDataAtom);

    const adminNavigationItems = () => {
        if (!circle) return [];
        switch (circle.type) {
            default:
            case "link":
            case "room":
            case "circle":
            case "project":
            case "post":
            case "event":
                return [
                    { route: routes.circle(circle).settings.about, name: i18n.t("circleadmin_about") },
                    { route: routes.circle(circle).settings.images, name: i18n.t("circleadmin_images") },
                    { route: routes.circle(circle).settings.mission, name: i18n.t("Mission") },
                    { route: routes.circle(circle).settings.tags, name: i18n.t("Tags") },
                    { route: routes.circle(circle).settings.base, name: i18n.t("circleadmin_base") },
                    { route: routes.circle(circle).settings.offersandneeds, name: i18n.t("Offers & Needs") },
                    { route: routes.circle(circle).settings.socialmedia, name: i18n.t("Quick Links") },
                    { route: routes.circle(circle).settings.connections, name: i18n.t("Connection Requests") },
                    // { route: routes.circle(circle).settings.funding, name: i18n.t("Funding") },
                    { route: routes.circle(circle).settings.misc, name: i18n.t("Misc") },
                ];
            case "user":
                return [
                    { route: routes.circle(circle).settings.about, name: i18n.t("circleadmin_about") },
                    { route: routes.circle(circle).settings.images, name: i18n.t("circleadmin_images") },
                    { route: routes.circle(circle).settings.mission, name: i18n.t("Mission") },
                    { route: routes.circle(circle).settings.tags, name: i18n.t("Tags") },
                    { route: routes.circle(circle).settings.base, name: i18n.t("circleadmin_base") },
                    { route: routes.circle(circle).settings.offersandneeds, name: i18n.t("Offers & Needs") },
                    { route: routes.circle(circle).settings.questions, name: i18n.t("Questions") },
                    { route: routes.circle(circle).settings.connections, name: i18n.t("Connection Requests") },
                    // { route: routes.circle(circle).settings.funding, name: i18n.t("Funding") },
                    { route: routes.circle(circle).settings.socialmedia, name: i18n.t("Quick Links") },
                ];
            case "ai_agent":
                return [
                    { route: routes.circle(circle).settings.about, name: i18n.t("circleadmin_about") },
                    { route: routes.circle(circle).settings.images, name: i18n.t("circleadmin_images") },
                    { route: routes.circle(circle).settings.mission, name: i18n.t("Mission") },
                    { route: routes.circle(circle).settings.tags, name: i18n.t("Tags") },
                    { route: routes.circle(circle).settings.base, name: i18n.t("circleadmin_base") },
                    { route: routes.circle(circle).settings.offersandneeds, name: i18n.t("Offers & Needs") },
                    { route: routes.circle(circle).settings.questions, name: i18n.t("Questions") },
                    { route: routes.circle(circle).settings.connections, name: i18n.t("Connection Requests") },
                    { route: routes.circle(circle).settings.ai, name: i18n.t("AI") },
                    { route: routes.circle(circle).settings.socialmedia, name: i18n.t("Quick Links") },
                ];
        }
    };

    const isBaseSettings = () => {
        return matchPath(routes.circle(circle).settings.base, location.pathname);
    };

    const isMatch = adminNavigationItems().map((navItem) => matchPath(navItem.route, location.pathname) != null);

    const iconSize = 12;

    if (!circle) return null;

    return (
        <Box
            bgGradient="linear(to-r,#d3d1d3,#ffffff)"
            borderRadius="10px"
            margin={isMobile ? "0px" : "0px 10px 10px 10px"}
            padding="5px"
            // flexGrow="1"
            pointerEvents="auto"
            position="relative"
            overflow="hidden"
            height={isBaseSettings() ? "200px" : "100%"}
            width="auto"
        >
            <Flex
                flexGrow="1"
                height={isMobile ? "100%" : "100%"}
                position="relative"
                left="0px"
                flexDirection={isMobile ? "column" : "row"}
                top="0px"
            >
                <Box marginLeft="2px" backgroundColor="white" borderRadius="0px 7px 7px 0px" flexGrow="1">
                    <Scrollbars autoHide>
                        <Box paddingLeft="15px" paddingRight="15px">
                            <Routes>
                                <Route path="/" element={<CircleContentForm isUpdateForm={true} circle={circle} />} />
                                <Route
                                    path="/settings/"
                                    element={<CircleContentForm isUpdateForm={true} circle={circle} />}
                                />
                                <Route
                                    path="/settings/images"
                                    element={<CircleImagesForm isUpdateForm={true} circle={circle} />}
                                />
                                <Route
                                    path="/settings/mission"
                                    element={<CircleMissionForm isUpdateForm={true} circle={circle} />}
                                />
                                <Route
                                    path="/settings/tags"
                                    element={<CircleTagsForm isUpdateForm={true} circle={circle} />}
                                />
                                <Route
                                    path="/settings/questions"
                                    element={<CircleQuestionsForm isUpdateForm={true} circle={circle} />}
                                />
                                <Route
                                    path="/settings/base"
                                    element={<CircleBaseForm isUpdateForm={true} circle={circle} />}
                                />
                                <Route
                                    path="/settings/offersandneeds"
                                    element={<CircleOffersAndNeedsForm circle={circle} />}
                                />
                                <Route
                                    path="/settings/socialmedia"
                                    element={<CircleQuickLinksForm circle={circle} />}
                                />
                                <Route
                                    path="/settings/connections"
                                    element={<CircleConnectionsForm circle={circle} />}
                                />
                                <Route
                                    path="/settings/ai"
                                    element={
                                        <CircleAiForm circle={circle} circleData={circleData} isUpdateForm={true} />
                                    }
                                />
                                {/* <Route path="/settings/funding" element={<CircleFundingForm circle={circle} />} /> */}
                                <Route path="/settings/misc" element={<CircleDeleteForm circle={circle} />} />
                            </Routes>
                        </Box>
                    </Scrollbars>
                </Box>

                <Flex
                    position={"relative"}
                    flexDirection={isMobile ? "row" : "column"}
                    height={isMobile ? "50px" : "100%"}
                    backgroundColor="#fdfdfd"
                    width={isMobile ? "100%" : "130px"}
                    flexShrink="0"
                    order="-1"
                    borderRadius="7px 0px 0px 7px"
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
                                    <Text
                                        fontSize={navItem.name.length > 15 ? "12px" : "14px"}
                                        textAlign="center"
                                        lineHeight="12px"
                                    >
                                        {navItem.name}
                                    </Text>
                                </Flex>
                            ))}
                        </Flex>
                    </Scrollbars>
                </Flex>

                <Flex
                    width={iconSize + 8 + "px"}
                    height={iconSize + 8 + "px"}
                    _hover={{ color: "#e6e6e6", transform: "scale(1.1)" }}
                    _active={{ transform: "scale(0.98)" }}
                    borderRadius="50%"
                    justifyContent="center"
                    alignItems="center"
                    onClick={onClose}
                    cursor="pointer"
                    position="absolute"
                    top="10px"
                    right="10px"
                >
                    <Icon
                        width={iconSize + 8 + "px"}
                        height={iconSize + 8 + "px"}
                        color={"#333"}
                        as={MdOutlineClose}
                        cursor="pointer"
                    />
                </Flex>
            </Flex>
        </Box>
    );
};

export default CircleSettings;
