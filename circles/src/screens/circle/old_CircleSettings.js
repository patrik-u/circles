//#region imports
import React, { useEffect, useContext } from "react";
import { Box, Flex, Text, useToast } from "@chakra-ui/react";
import {
    CircleImagesForm,
    CircleTagsForm,
    CircleBaseForm,
    CircleSocialMediaForm,
    CircleContentForm,
    EventContentForm,
    CircleDeleteForm,
    CircleConnectionsSettings,
    CircleQuestionsForm,
} from "../settings/old_CircleSettingsForms";
import i18n from "i18n/Localization";
import UserContext from "../../components/UserContext";
import { log } from "../../components/old_Helpers";
import IsMobileContext from "../../components/IsMobileContext";
import { Routes, Route, useNavigate, useLocation, matchPath } from "react-router-dom";
import { CircleHeader } from "../../components/CircleElements";
import { routes } from "../../components/Navigation";
import { defaultContentWidth } from "../../components/Constants";
import { Scrollbars } from "react-custom-scrollbars-2";
import { useNavigateNoUpdates, useLocationNoUpdates } from "components/RouterUtils";
//#endregion

const CircleSettings = ({
    circle,
    setCircle,
    displayMode,
    isSignedIn,
    isSigningIn,
    mustLogInOnOpen,
    locationPickerPosition,
    setLocationPickerActive,
    setContentWidth,
    onConnect,
}) => {
    const navigate = useNavigateNoUpdates();
    const location = useLocationNoUpdates();
    const isMobile = useContext(IsMobileContext);
    const user = useContext(UserContext);
    const toast = useToast();
    const contentWidth = "555px";

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

    useEffect(() => {
        log("CircleSettings.useEffect 1", 0);
        if (circle?.type === "user" ? isMatch[4] : isMatch[3]) {
            setLocationPickerActive(true);
        } else {
            setLocationPickerActive(false);
        }

        return () => {
            setLocationPickerActive(false);
        };
    }, [isMatch, setLocationPickerActive, circle?.type]);

    useEffect(() => {
        log("CircleSettings.useEffect 2", 0);
        if (isMobile) return;

        setContentWidth(contentWidth);
        return () => {
            setContentWidth(defaultContentWidth);
        };
    }, [isMobile, setContentWidth]);

    return (
        circle && (
            <>
                <CircleHeader hideToolbar={true} circle={circle} setCircle={setCircle} title="settings" onConnect={onConnect} width={contentWidth} />
                <Flex
                    flexGrow="1"
                    width="100%"
                    height={isMobile ? "calc(100% - 74px)" : "calc(100% - 74px)"}
                    position="relative" // mobile123 "absolute"
                    left="0px"
                    flexDirection={isMobile ? "column" : "row"}
                    top="0px"
                >
                    <Routes>
                        <Route
                            path="/"
                            element={
                                <Flex flexGrow="1" align="center" flexDirection="column">
                                    <Scrollbars>
                                        <Flex width="100%" maxWidth="800px" flexDirection="column" flexWrap="nowrap">
                                            <Box flex="initial" order="0" marginTop="25px" marginLeft="25px" marginRight="25px" marginBottom="60px">
                                                {(circle.type === "circle" || circle.type === "user" || circle.type === "tag" || circle.type === "room") && (
                                                    <CircleContentForm
                                                        isUpdateForm={true}
                                                        language={circle.language}
                                                        circleId={circle.id}
                                                        name={circle.name}
                                                        description={circle.description}
                                                        content={circle.content}
                                                        type={circle.type}
                                                        parentCircle={circle.parent_circle}
                                                        chatIsPublic={circle.chat_is_public}
                                                    />
                                                )}
                                                {circle.type === "event" && (
                                                    <EventContentForm
                                                        isUpdateForm={true}
                                                        language={circle.language}
                                                        circleId={circle.id}
                                                        name={circle.name}
                                                        description={circle.description}
                                                        content={circle.content}
                                                        parentCircle={circle.parent_circle}
                                                        chatIsPublic={circle.chat_is_public}
                                                    />
                                                )}
                                            </Box>
                                        </Flex>
                                    </Scrollbars>
                                </Flex>
                            }
                        />
                        <Route
                            path="/images"
                            element={
                                <Flex flexGrow="1" align="center" flexDirection="column" marginBottom="50px">
                                    <Scrollbars>
                                        <Flex width="100%" maxWidth="800px" flexDirection="column" flexWrap="nowrap">
                                            <Box flex="initial" order="0" marginTop="25px" marginLeft="25px" marginRight="25px" marginBottom="60px">
                                                <CircleImagesForm
                                                    isUpdateForm={true}
                                                    picture={circle.picture}
                                                    cover={circle.cover}
                                                    circleId={circle.id}
                                                    name={circle.name}
                                                    description={circle.description}
                                                    type={circle.type}
                                                />
                                            </Box>
                                        </Flex>
                                    </Scrollbars>
                                </Flex>
                            }
                        />
                        <Route
                            path="/tags"
                            element={
                                <Flex flexGrow="1" align="center" flexDirection="column" marginBottom="50px">
                                    <Scrollbars>
                                        <Flex width="100%" maxWidth="800px" flexDirection="column" flexWrap="nowrap">
                                            <Box flex="initial" order="0" marginTop="25px" marginLeft="25px" marginRight="25px" marginBottom="60px">
                                                <CircleTagsForm isUpdateForm={true} circle={circle} />
                                            </Box>
                                        </Flex>
                                    </Scrollbars>
                                </Flex>
                            }
                        />
                        <Route
                            path="/questions"
                            element={
                                <Flex flexGrow="1" align="center" flexDirection="column" marginBottom="50px">
                                    <Scrollbars>
                                        <Flex width="100%" maxWidth="800px" flexDirection="column" flexWrap="nowrap">
                                            <Box flex="initial" order="0" marginTop="25px" marginLeft="25px" marginRight="25px" marginBottom="60px">
                                                <CircleQuestionsForm isUpdateForm={true} circle={circle} />
                                            </Box>
                                        </Flex>
                                    </Scrollbars>
                                </Flex>
                            }
                        />
                        <Route
                            path="/base"
                            element={
                                <Flex flexGrow="1" align="center" flexDirection="column" marginBottom="50px">
                                    <Scrollbars>
                                        <Flex width="100%" maxWidth="800px" flexDirection="column" flexWrap="nowrap">
                                            <Box flex="initial" order="0" marginTop="25px" marginLeft="25px" marginRight="25px" marginBottom="60px">
                                                <CircleBaseForm
                                                    isUpdateForm={true}
                                                    base={circle.base}
                                                    circleId={circle.id}
                                                    locationPickerPosition={locationPickerPosition}
                                                    type={circle.type}
                                                />
                                            </Box>
                                        </Flex>
                                    </Scrollbars>
                                </Flex>
                            }
                        />
                        <Route
                            path="/socialmedia"
                            element={
                                <Flex flexGrow="1" align="center" flexDirection="column" marginBottom="50px">
                                    <Scrollbars>
                                        <Flex width="100%" maxWidth="800px" flexDirection="column" flexWrap="nowrap">
                                            <Box flex="initial" order="0" marginTop="25px" marginLeft="25px" marginRight="25px" marginBottom="60px">
                                                <CircleSocialMediaForm circle={circle} />
                                            </Box>
                                        </Flex>
                                    </Scrollbars>
                                </Flex>
                            }
                        />
                        <Route
                            path="/connections"
                            element={
                                <Flex flexGrow="1" align="center" flexDirection="column" marginBottom="50px">
                                    <Scrollbars>
                                        <Flex width="100%" maxWidth="800px" flexDirection="column" flexWrap="nowrap">
                                            <Box flex="initial" order="0" marginTop="25px" marginLeft="25px" marginRight="25px" marginBottom="60px">
                                                <CircleConnectionsSettings circle={circle} />
                                            </Box>
                                        </Flex>
                                    </Scrollbars>
                                </Flex>
                            }
                        />
                        <Route
                            path="/misc"
                            element={
                                <Flex flexGrow="1" align="center" flexDirection="column" marginBottom="50px">
                                    <Scrollbars>
                                        <Flex width="100%" maxWidth="800px" flexDirection="column" flexWrap="nowrap">
                                            <Box flex="initial" order="0" marginTop="25px" marginLeft="25px" marginRight="25px" marginBottom="60px">
                                                <CircleDeleteForm circle={circle} />
                                            </Box>
                                        </Flex>
                                    </Scrollbars>
                                </Flex>
                            }
                        />
                    </Routes>

                    <Flex
                        position={isMobile ? "absolute" : "relative"}
                        flexDirection={isMobile ? "row" : "column"}
                        height={isMobile ? "50px" : "auto"}
                        bottom={isMobile ? "0px" : "auto"}
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
            </>
        )
    );
};

export default CircleSettings;
