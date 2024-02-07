//#region imports
import React, { lazy } from "react";
import { Box, Flex, Text, Icon } from "@chakra-ui/react";
import i18n from "@/i18n/Localization";
import { Routes, Route, matchPath } from "react-router-dom";
import { routes } from "@/components/Navigation";
import { Scrollbars } from "react-custom-scrollbars-2";
import { useNavigateNoUpdates, useLocationNoUpdates } from "@/components/RouterUtils";
import { useAtom } from "jotai";
import { isMobileAtom, circleAtom, circleDataAtom, circleDashboardExpandedAtom } from "@/components/Atoms";
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
    const [circleDashboardExpanded] = useAtom(circleDashboardExpandedAtom);

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
            margin="0px"
            // padding="5px"
            // flexGrow="1"
            pointerEvents="auto"
            position="relative"
            overflow="hidden"
            // height={isBaseSettings() ? "200px" : "100%"}
            height={"100%"}
            width="auto"
        >
            <Flex
                flexGrow="1"
                height="100%"
                position="relative"
                left="0px"
                flexDirection={!circleDashboardExpanded ? "column" : "row"}
                top="0px"
            >
                <Box marginLeft="2px" backgroundColor="white" borderRadius="0px 7px 7px 0px" flexGrow="1">
                    <Scrollbars autoHide>
                        <Box paddingLeft="15px" paddingRight="15px">
                            <Routes>
                                <Route path="/" element={<CircleContentForm isUpdateForm={true} circle={circle} />} />
                                <Route
                                    path="/images"
                                    element={<CircleImagesForm isUpdateForm={true} circle={circle} />}
                                />
                                <Route
                                    path="/mission"
                                    element={<CircleMissionForm isUpdateForm={true} circle={circle} />}
                                />
                                <Route path="/tags" element={<CircleTagsForm isUpdateForm={true} circle={circle} />} />
                                <Route
                                    path="/questions"
                                    element={<CircleQuestionsForm isUpdateForm={true} circle={circle} />}
                                />
                                <Route path="/base" element={<CircleBaseForm isUpdateForm={true} circle={circle} />} />
                                <Route path="/offersandneeds" element={<CircleOffersAndNeedsForm circle={circle} />} />
                                <Route path="/socialmedia" element={<CircleQuickLinksForm circle={circle} />} />
                                <Route path="/connections" element={<CircleConnectionsForm circle={circle} />} />
                                <Route
                                    path="/ai"
                                    element={
                                        <CircleAiForm circle={circle} circleData={circleData} isUpdateForm={true} />
                                    }
                                />
                                {/* <Route path="/settings/funding" element={<CircleFundingForm circle={circle} />} /> */}
                                <Route path="/misc" element={<CircleDeleteForm circle={circle} />} />
                            </Routes>
                        </Box>
                    </Scrollbars>
                </Box>

                <Flex
                    position={"relative"}
                    flexDirection={!circleDashboardExpanded ? "row" : "column"}
                    height={!circleDashboardExpanded ? "50px" : "100%"}
                    backgroundColor="#fdfdfd"
                    width={!circleDashboardExpanded ? "100%" : "130px"}
                    flexShrink="0"
                    order="-1"
                    borderRadius="7px 0px 0px 7px"
                >
                    <Scrollbars autoHide height={!circleDashboardExpanded ? "50px" : "100%"} width="100%">
                        <Flex
                            height={!circleDashboardExpanded ? "50px" : "auto"}
                            marginLeft={!circleDashboardExpanded ? "10px" : "0px"}
                            flexDirection={!circleDashboardExpanded ? "row" : "column"}
                            marginTop={!circleDashboardExpanded ? "0px" : "15px"}
                            align="center"
                        >
                            {adminNavigationItems().map((navItem, i) => (
                                <Flex
                                    key={navItem.route}
                                    width={!circleDashboardExpanded ? "auto" : "110px"}
                                    align="center"
                                    justifyContent="center"
                                    borderRadius="50px"
                                    cursor="pointer"
                                    height="30px"
                                    paddingLeft="10px"
                                    paddingRight="10px"
                                    flexShrink="0"
                                    marginLeft={!circleDashboardExpanded ? "0px" : "5px"}
                                    marginRight={!circleDashboardExpanded ? "0px" : "5px"}
                                    marginTop={!circleDashboardExpanded ? "0px" : "5px"}
                                    marginBottom={!circleDashboardExpanded ? "0px" : "5px"}
                                    color={isMatch[i] ? (!circleDashboardExpanded ? "white" : "#585858") : "#757575"}
                                    fontWeight={isMatch[i] ? "700" : "500"}
                                    bg={isMatch[i] ? (!circleDashboardExpanded ? "#c242bb" : "#d5d5d5") : "transparent"}
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

                {onClose && (
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
                )}
            </Flex>
        </Box>
    );
};

export default CircleSettings;
