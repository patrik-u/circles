//#region imports
import React, { useState, useEffect, useContext, useRef, useCallback } from "react";
import {
    Box,
    Flex,
    HStack,
    VStack,
    Spinner,
    Text,
    Image,
    Icon,
    Link,
    Popover,
    PopoverTrigger,
    PopoverContent,
    Button,
    PopoverArrow,
    useToast,
} from "@chakra-ui/react";
import social_facebook from "../assets/images/social_facebook26x26.png";
import social_instagram from "../assets/images/social_instagram26x26.png";
import social_twitter from "../assets/images/social_twitter26x26.png";
import social_youtube from "../assets/images/social_youtube26x26.png";
import social_tiktok from "../assets/images/social_tiktok26x26.png";
import social_linkedin from "../assets/images/social_linkedin26x26.png";
import social_medium from "../assets/images/social_medium26x26.png";
import social_codo from "../assets/images/social_codo26x26.png";
import social_link from "../assets/images/social_link26x26.png";
import {
    CircleTypeForm,
    CircleImagesForm,
    CircleTagsForm,
    CircleBaseForm,
    CircleSocialMediaForm,
    CircleContentForm,
    EventContentForm,
    CircleDeleteForm,
    CircleConnectionsSettings,
    CircleQuestionsForm,
} from "../components/CircleSettingsForms";
import i18n from "i18n/Localization";
import UserContext from "../components/UserContext";
import db from "../components/Firebase";
import axios from "axios";
import {
    timeSince,
    getLatlng,
    getDistanceString,
    log,
    lat,
    lng,
    fromFsDate,
    getDateWithoutTime,
    getDateAndTimeLong,
    getDateLong,
    mapNavigateTo,
    isToday,
    toastError,
    toastSuccess,
    getLngLatArray,
} from "../components/Helpers";
import { collection, doc, onSnapshot, query, where } from "firebase/firestore";
import IsMobileContext from "../components/IsMobileContext";
import { Marker } from "react-map-gl";
import { Routes, Route, useNavigate, useParams, useSearchParams, useLocation, matchPath } from "react-router-dom";
import {
    CircleHeader,
    CirclePicture,
    CircleCover,
    routes,
    ShareButtonMenu,
    openCircle,
    circleDefaultRoute,
    isMutuallyConnected,
    isFollowing,
    defaultContentWidth,
    CircleTags,
    ConnectButton,
    getConnectLabel,
} from "../components/Navigation";
import { Chat } from "./Chat";
import { HiClock } from "react-icons/hi";
import { RiMapPinFill, RiLinksLine } from "react-icons/ri";
import { GiRoundStar } from "react-icons/gi";
import { AiOutlineDisconnect } from "react-icons/ai";
import { Step, Steps, useSteps } from "chakra-ui-steps";
import { getPreciseDistance } from "geolib";
import { Scrollbars } from "react-custom-scrollbars-2";
import { Source, Layer } from "react-map-gl";
//#endregion

const isPastEvent = (inEvent) => {
    let eventDate = fromFsDate(inEvent.starts_at);
    if (eventDate < new Date()) {
        return !(inEvent.is_all_day && isToday(eventDate));
    }
    return false;
};

const getEventTime = (item) => {
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

export const CircleMapEdges = ({ circle, circles }) => {
    if (!circle?.base) return null;

    const getFeatures = () => {
        return circles
            .filter((x) => x.base)
            .map((x) => {
                return {
                    type: "Feature",
                    properties: {},
                    geometry: {
                        type: "LineString",
                        coordinates: [getLngLatArray(circle.base), getLngLatArray(x.base)],
                    },
                };
            });
    };

    const lineFeatures = {
        type: "FeatureCollection",
        features: getFeatures(),
    };

    return (
        <Source id="polylineLayer" type="geojson" data={lineFeatures}>
            <Layer
                id="lineLayer"
                type="line"
                source="my-data"
                layout={{
                    "line-join": "round",
                    "line-cap": "round",
                }}
                paint={{
                    //"line-color": "rgba(63, 71, 121, 1)",
                    //"line-color": "rgba(97, 97, 97, 1)",
                    "line-color": "rgba(91, 115, 255, 1)",
                    //"line-color": "rgba(116, 89, 41, 1)",
                    //"line-color": "rgba(35, 68, 255, 1)",
                    "line-width": 2,
                }}
            />
        </Source>
    );
};

const CircleHome = ({
    circle,
    setCircle,
    circles,
    setCircles,
    circleConnections,
    displayMode,
    events,
    subcircles,
    setDisplayMode,
    isSignedIn,
    isSigningIn,
    mustLogInOnOpen,
    focusItem,
    userLocation,
    onConnect,
    isConnecting,
}) => {
    const user = useContext(UserContext);
    const navigate = useNavigate();
    const isMobile = useContext(IsMobileContext);
    const userIsConnected = circle?.id === user?.id || isMutuallyConnected(user, circle, true);
    const userIsFollower = circle?.id === user?.id || isFollowing(user, circle);
    const toast = useToast();
    const location = useLocation();
    const pointsRef = useRef(null);
    const [searchParams, setSearchParams] = useSearchParams();
    const embed = searchParams.get("embed") === "true";
    const mapOnly = searchParams.get("mapOnly") === "true";

    useEffect(() => {
        log("CircleHome.useEffect 1", 0);
        if (!mapOnly && isMobile) {
            setDisplayMode("list");
        }

        let startDate = getDateWithoutTime(); // today
        setCircles(
            circleConnections
                ?.map((x) => x.display_circle)
                .filter((x) => {
                    // remove old events
                    if (x.type === "event") {
                        return fromFsDate(x.starts_at) > startDate;
                    } else {
                        return true;
                    }
                })
        );
    }, [setDisplayMode, isMobile, mapOnly, setCircles, circleConnections]);

    const CircleQuestion = ({ question }) => {
        return (
            <Box position="relative" borderRadius="15px" padding="0" align="start" marginLeft="22px" marginRight="22px" marginTop="20px">
                {/* <Image position="absolute" opacity="0.05" width="40px" top="-10px" left="0px" src={require("../assets/images/quotes.png")} /> */}
                <Text fontSize="18px" fontWeight="700" marginLeft="0px" marginBottom="5px">
                    {question.label}
                </Text>
                <Text>{question.answer}</Text>
            </Box>
        );
    };

    return (
        <>
            {circle && !mapOnly && (
                <Box flexGrow="1" width="100%" height="100%" align="center" position="relative" top="0px" left="0px" flexDirection="column">
                    <CircleHeader circle={circle} setCircle={setCircle} title="home" onConnect={onConnect} />
                    <Flex width="100%" flexDirection="column" flexWrap="nowrap" justifyContent="left">
                        <Box flex="initial" order="0" maxWidth="none" minWidth="none" marginBottom="20px">
                            <VStack spacing="0px">
                                {(!userIsConnected || !userIsFollower) && circle.id !== "earth" && (
                                    <>
                                        <Flex
                                            flexDirection="column"
                                            align="center"
                                            justifyContent="center"
                                            height="50px"
                                            position="fixed"
                                            backgroundColor="#ffffffee"
                                            width={isMobile ? "100%" : "435px"}
                                            flexGrow="1"
                                            zIndex="10"
                                        >
                                            <HStack align="center" height="40px">
                                                {!userIsConnected && (
                                                    <Button
                                                        width="150px"
                                                        colorScheme="blue"
                                                        borderRadius="25px"
                                                        lineHeight="0"
                                                        backgroundColor="#389bf8"
                                                        color="white"
                                                        isDisabled={isConnecting}
                                                        onClick={() => onConnect(user, circle, "connect")}
                                                        position="relative"
                                                    >
                                                        <HStack marginRight="13px">
                                                            <RiLinksLine size="18px" />
                                                            <Text>{i18n.t(`Default connect [${circle.type}]`)}</Text>
                                                        </HStack>
                                                    </Button>
                                                )}
                                                {!userIsFollower && (
                                                    <Button
                                                        width="150px"
                                                        colorScheme="blue"
                                                        borderRadius="25px"
                                                        lineHeight="0"
                                                        backgroundColor="#389bf8"
                                                        color="white"
                                                        isDisabled={isConnecting}
                                                        onClick={() => onConnect(user, circle, "follow")}
                                                        position="relative"
                                                    >
                                                        <HStack marginRight="13px">
                                                            <RiLinksLine size="18px" />
                                                            <Text>{i18n.t("Follow")}</Text>
                                                        </HStack>
                                                    </Button>
                                                )}
                                            </HStack>
                                        </Flex>
                                        <Box height="50px" />
                                    </>
                                )}

                                <Box height="200px" width="100%" maxWidth="700px" backgroundColor="#b9b9b9" position="relative">
                                    <CircleCover circle={circle} />
                                    <ShareButtonMenu referrer={user} />
                                </Box>
                                <VStack align="center" className="circle-overview-content" spacing="16px" position="relative" top="0px">
                                    <VStack spacing="0px">
                                        {circle.type === "event" && (
                                            <Text fontSize="18px" fontWeight="700" color="#cf1a1a" href={location.pathname} marginTop="0px">
                                                {circle.is_all_day ? getDateLong(circle.starts_at) : getDateAndTimeLong(circle.starts_at)}
                                            </Text>
                                        )}
                                        {/* TODO show all circle tags somewhere */}
                                        {/* <CircleTags circle={circle} setCircle={setCircle} size="md" /> */}
                                    </VStack>
                                    {circle.social_media && (
                                        <HStack spacing="10px" alignSelf="start" paddingLeft="20px">
                                            {circle.social_media.facebook && (
                                                <Link href={circle.social_media.facebook} target="_blank">
                                                    <Image src={social_facebook} className="social-media-icon" />
                                                </Link>
                                            )}
                                            {circle.social_media.twitter && (
                                                <Link href={circle.social_media.twitter} target="_blank">
                                                    <Image src={social_twitter} className="social-media-icon" />
                                                </Link>
                                            )}
                                            {circle.social_media.instagram && (
                                                <Link href={circle.social_media.instagram} target="_blank">
                                                    <Image src={social_instagram} className="social-media-icon" />
                                                </Link>
                                            )}
                                            {circle.social_media.youtube && (
                                                <Link href={circle.social_media.youtube} target="_blank">
                                                    <Image src={social_youtube} className="social-media-icon" />
                                                </Link>
                                            )}
                                            {circle.social_media.tiktok && (
                                                <Link href={circle.social_media.tiktok} target="_blank">
                                                    <Image src={social_tiktok} className="social-media-icon" />
                                                </Link>
                                            )}
                                            {circle.social_media.linkedin && (
                                                <Link href={circle.social_media.linkedin} target="_blank">
                                                    <Image src={social_linkedin} className="social-media-icon" />
                                                </Link>
                                            )}
                                            {circle.social_media.medium && (
                                                <Link href={circle.social_media.medium} target="_blank">
                                                    <Image src={social_medium} className="social-media-icon" />
                                                </Link>
                                            )}
                                            {circle.social_media.link1 && (
                                                <Link href={circle.social_media.link1} target="_blank">
                                                    <Image src={social_link} className="social-media-icon" />
                                                </Link>
                                            )}
                                            {circle.social_media.link2 && (
                                                <Link href={circle.social_media.link2} target="_blank">
                                                    <Image src={social_link} className="social-media-icon" />
                                                </Link>
                                            )}
                                            {circle.social_media.link3 && (
                                                <Link href={circle.social_media.link3} target="_blank">
                                                    <Image src={social_link} className="social-media-icon" />
                                                </Link>
                                            )}
                                            <Link href={location.pathname} target="_blank">
                                                <Image src={social_codo} className="social-media-icon" />
                                            </Link>
                                        </HStack>
                                    )}
                                    {/* <LatestConnections item={circle} circleId={circle.id} hasPopover={true} size={36} remainingFontSize="14px" /> */}
                                    <Box>
                                        <Text marginLeft="40px" marginRight="40px">
                                            {circle.description}
                                        </Text>
                                    </Box>
                                </VStack>
                            </VStack>

                            {circle.content && (
                                <Box marginLeft="22px" marginRight="22px" marginTop="20px" align="left">
                                    <div className="embedHtmlContent" dangerouslySetInnerHTML={{ __html: circle.content }} />
                                </Box>
                            )}

                            {circle.questions && (
                                <>
                                    {circle.questions.question0 && <CircleQuestion question={circle.questions.question0} />}
                                    {circle.questions.question1 && <CircleQuestion question={circle.questions.question1} />}
                                    {circle.questions.question2 && <CircleQuestion question={circle.questions.question2} />}
                                </>
                            )}
                        </Box>

                        <Box flex="initial" order="0" align="center" maxWidth="none" display="none">
                            <Box
                                ref={pointsRef}
                                align="left"
                                padding="10px"
                                paddingBottom="80px"
                                backgroundColor="#F4F4F4"
                                borderColor="#aaa"
                                borderWidth="1px 0px 0px 0px"
                            >
                                <HStack>
                                    <Icon
                                        width="36px"
                                        height="36px"
                                        color="#ffb545"
                                        //color="#ba9452"
                                        as={GiRoundStar}
                                    />
                                    <Text className="pointsText" color="#333" fontSize="36px" fontWeight="700">
                                        {circle?.points?.toLocaleString() ?? "0"}
                                    </Text>
                                </HStack>
                            </Box>
                        </Box>
                    </Flex>
                </Box>
            )}
        </>
    );
};

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
    const navigate = useNavigate();
    const location = useLocation();
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

export const CircleMarker = ({ circle }) => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const embed = searchParams.get("embed") === "true";

    return circle && <CircleMapMarker circle={circle} navigate={navigate} embed={embed} />;
};

export const CreateNewCircle = ({
    circle,
    setCircle,
    displayMode,
    setDisplayMode,
    locationPickerPosition,
    setLocationPickerPosition,
    setLocationPickerActive,
    isSignedIn,
    isSigningIn,
    mustLogInOnOpen,
    parentId,
}) => {
    const isMobile = useContext(IsMobileContext);
    const [createdCircle, setCreatedCircle] = useState({});
    const [isInitialized, setIsInitialized] = useState(false);
    const navigate = useNavigate();
    const user = useContext(UserContext);

    const createCircleSteps = [
        { label: i18n.t("Type") },
        { label: i18n.t("about") },
        { label: i18n.t("images") },
        { label: i18n.t("Tags") },
        { label: i18n.t("base") },
    ];
    const {
        nextStep: createCircleNextStep,
        reset: createCircleReset,
        activeStep: createCircleActiveStep,
    } = useSteps({
        initialStep: 0,
    });

    const onCreateCircleNextStep = () => {
        createCircleNextStep();

        // if active circle step is 1 at this point we're moving on to the third step - setting circle base, we activate the location picker
        setLocationPickerActive(createCircleActiveStep === 3);
        if (createCircleActiveStep === 4) {
            // we're finishing last step so switch to created circle
            navigate(routes.circle(createdCircle.id).home);
            setLocationPickerPosition(null);
            setLocationPickerActive(false);
        }
    };

    useEffect(() => {
        log("CreateNewCircle.useEffect 1", 0);
        if (isInitialized) return;
        if (!isSignedIn) {
            mustLogInOnOpen();
            return;
        }
        // for some reason it gets reset here we need to fix it
        setIsInitialized(() => true);
        if (isMobile) {
            setDisplayMode("list");
        }
        createCircleReset();
        setCreatedCircle(null);
    }, [createCircleReset, isSignedIn, mustLogInOnOpen, setDisplayMode, isInitialized, isMobile]);

    const onCreateCircleCloseClick = () => {
        setLocationPickerActive(false);
        setCreatedCircle(null);
        //setIsInitialized(false);
        openCircle(navigate, user, parentId ?? "earth", circle, setCircle);
    };

    const onCreateCircleUpdated = (updatedCircleData) => {
        setCreatedCircle((previusCreatedCircle) => ({ ...previusCreatedCircle, ...updatedCircleData }));
    };

    return (
        <Box flexGrow="1" width="100%" height="100%" align="center" position="relative" top="0px" backgroundColor="white">
            <Scrollbars>
                {/* Holy grail layout here */}

                <Flex width="100%" maxWidth="800px" flexDirection="column" flexWrap="nowrap">
                    <Box flex="initial" order="0" marginTop="25px" marginLeft="25px" marginRight="25px">
                        {!isMobile && (
                            <Steps activeStep={createCircleActiveStep} marginBottom="10px">
                                {createCircleSteps.map(({ label }, index) => (
                                    <Step key={label}></Step>
                                ))}
                            </Steps>
                        )}

                        {/* Create circle step 0 - set circle type */}
                        {createCircleActiveStep === 0 && (
                            <CircleTypeForm
                                isUpdateForm={false}
                                language={i18n.language}
                                onCancel={onCreateCircleCloseClick}
                                onNext={onCreateCircleNextStep}
                                onUpdate={onCreateCircleUpdated}
                            />
                        )}

                        {/* Create circle step 1 - set name and description */}
                        {createCircleActiveStep === 1 && (
                            <>
                                {(createdCircle?.type === "circle" || createdCircle?.type === "tag" || createdCircle?.type === "room") && (
                                    <CircleContentForm
                                        isUpdateForm={false}
                                        language={i18n.language}
                                        onCancel={onCreateCircleCloseClick}
                                        onNext={onCreateCircleNextStep}
                                        onUpdate={onCreateCircleUpdated}
                                        type={createdCircle.type}
                                        parentCircle={circle}
                                        chatIsPublic={true}
                                    />
                                )}
                                {createdCircle?.type === "event" && (
                                    <EventContentForm
                                        isUpdateForm={false}
                                        language={i18n.language}
                                        onCancel={onCreateCircleCloseClick}
                                        onNext={onCreateCircleNextStep}
                                        onUpdate={onCreateCircleUpdated}
                                        parentCircle={circle}
                                        chatIsPublic={true}
                                    />
                                )}
                            </>
                        )}

                        {/* Create circle step 2 - set picture and cover images */}
                        {createCircleActiveStep === 2 && (
                            <CircleImagesForm
                                isUpdateform={false}
                                onCancel={onCreateCircleCloseClick}
                                onNext={onCreateCircleNextStep}
                                onUpdate={onCreateCircleUpdated}
                                circleId={createdCircle.id}
                                name={createdCircle.name}
                                description={createdCircle.description}
                                type={createdCircle.type}
                            />
                        )}

                        {/* Create circle step 3 - choose tags */}
                        {createCircleActiveStep === 3 && (
                            <CircleTagsForm
                                isUpdateform={false}
                                onCancel={onCreateCircleCloseClick}
                                onNext={onCreateCircleNextStep}
                                onUpdate={onCreateCircleUpdated}
                                circle={createdCircle}
                            />
                        )}

                        {/* Create circle step 4 - set base */}
                        {createCircleActiveStep === 4 && (
                            <CircleBaseForm
                                isUpdateForm={false}
                                onCancel={onCreateCircleCloseClick}
                                onNext={onCreateCircleNextStep}
                                onUpdate={onCreateCircleUpdated}
                                circleId={createdCircle.id}
                                locationPickerPosition={locationPickerPosition}
                                type={createdCircle.type}
                            />
                        )}
                    </Box>
                </Flex>
            </Scrollbars>
        </Box>
    );
};

export const getDisconnectButtonText = (connection) => {
    switch (connection.type) {
        case "connected_to":
            return i18n.t("Unfollow");
        default:
        case "connected_mutually_to":
            return i18n.t(`Default disconnect [${connection.target.type}]`);
        case "connected_mutually_to_request":
            return i18n.t(`Remove request [${connection.target.type}]`);
    }
};

export const CircleConnectionsList = ({ connections, connect, disconnect, isConnecting }) => {
    const borderRadius = (i) => {
        let top = i === 0 ? "7px 7px" : "0px 0px";
        let bottom = i === connections.length - 1 ? "7px 7px" : "0px 0px";
        return `${top} ${bottom}`;
    };

    return (
        connections.length > 0 && (
            <>
                {connections.map((connection, i) => (
                    <Flex
                        key={connection.id}
                        flexGrow="1"
                        borderRadius={borderRadius(i)}
                        border="1px solid #e7e7e7"
                        borderWidth={i === 0 ? "1px" : "0px 1px 1px 1px"}
                        flexDirection="row"
                        align="center"
                    >
                        <Box width="190px" flexShrink="0" paddingTop="10px" paddingBottom="10px" paddingLeft="15px">
                            <Text fontWeight="700" fontSize="18px">
                                {getConnectLabel(connection.target.type, connection.type)}
                            </Text>
                            <Text fontSize="12px">{getDateAndTimeLong(connection.created_at)}</Text>
                        </Box>
                        <Box flexGrow="1">
                            {/* <Text fontSize="12px" fontWeight="700" color="#aaa">
                            Established at
                        </Text>
                        <Text fontSize="14px">{getDateAndTimeLong(connection.created_at)}</Text> */}
                        </Box>

                        {(connection.type === "connected_to" ||
                            connection.type === "connected_mutually_to" ||
                            connection.type === "connected_mutually_to_request") && (
                            <Box marginRight="10px">
                                <Button
                                    minWidth="150px"
                                    colorScheme="blue"
                                    borderRadius="25px"
                                    lineHeight="0"
                                    backgroundColor="#389bf8"
                                    color="white"
                                    isDisabled={isConnecting}
                                    position="relative"
                                    onClick={() => disconnect(connection.type)}
                                >
                                    <HStack marginRight="13px">
                                        {/* <RiLinksLine size="18px" /> */}
                                        <AiOutlineDisconnect size="18px" />
                                        <Text>{getDisconnectButtonText(connection)}</Text>
                                    </HStack>
                                </Button>
                            </Box>
                        )}
                    </Flex>
                ))}
            </>
        )
    );
};

export const CircleConnections = ({ source, target, option, isConnecting, setIsConnecting, onConnect, onClose }) => {
    const user = useContext(UserContext);
    const toast = useToast();
    const [isLoadingConnections, setIsLoadingConnections] = useState(true);
    const [isLoadingRequest, setIsLoadingRequest] = useState(true);
    const isLoading = isLoadingConnections || isLoadingRequest;
    const [connections, setConnections] = useState([]);
    const isConnected = connections?.some((x) => x.type === "connected_mutually_to" || x.type === "connected_mutually_to_request");
    const isFollowing = connections?.some((x) => x.type === "connected_to");

    const connect = useCallback(
        (type) => {
            setIsLoadingRequest(true);
            let errorMessage = `${i18n.t(type === "connected_to" ? "Unable to follow" : "Unable to connect to")} ${target.name}`;

            // send request to follow/connect
            axios
                .post(`/circles/${source.id}/connections`, {
                    targetId: target.id,
                    type,
                })
                .then((x) => {
                    let result = x.data;
                    if (result.error) {
                        toastError(toast, errorMessage, result.error);
                    } else if (type === "connected_to" || result.auto_approved) {
                        toastSuccess(toast, `${i18n.t(type === "connected_to" ? "Following" : `Connected to [${target.type}]`)} ${target.name}`);
                    } else if (type === "connected_mutually_to") {
                        toastSuccess(toast, `${i18n.t(`Request made to [${target.type}]`)} ${target.name}`);
                    }
                    setIsLoadingRequest(false);
                })
                .catch((error) => {
                    toastError(toast, errorMessage, error);
                    setIsLoadingRequest(false);
                });
        },
        [source, target, toast]
    );

    const disconnect = useCallback(
        (type) => {
            setIsLoadingRequest(true);
            let errorMessage = `${i18n.t(type === "connected_to" ? "Unable to unfollow" : "Unable to disconnect from")} ${target.name}`;

            // send request to unfollow
            axios
                .delete(`/circles/${source.id}/connections`, {
                    data: {
                        targetId: target.id,
                        type,
                    },
                })
                .then((x) => {
                    let result = x.data;
                    if (result.error) {
                        toastError(toast, errorMessage, result.error);
                    } else {
                        toastSuccess(toast, `${i18n.t(type === "connected_to" ? "Unfollowed" : `Disconnected from [${target.type}]`)} ${target.name}`);
                    }
                    setIsLoadingRequest(false);
                })
                .catch((error) => {
                    toastError(toast, errorMessage, error);
                    setIsLoadingRequest(false);
                });
        },
        [source, target, toast]
    );

    useEffect(() => {
        log("CircleConnections.useEffect 1", 0);
        if (!source?.id || !target?.id) return;
        if (option === "follow") {
            connect("connected_to");
        } else if (option === "connect") {
            connect("connected_mutually_to");
        } else {
            setIsLoadingRequest(false);
        }

        setIsLoadingConnections(true);

        // subscribe to circle connections
        var q = query(collection(db, "connections"), where("source.id", "==", source.id), where("target.id", "==", target.id));
        let unsubscribeGetCircleConnections = onSnapshot(q, (snap) => {
            const newConnections = snap.docs?.map((doc) => ({ id: doc.id, ...doc.data() })) ?? [];
            setConnections(newConnections);
            setIsLoadingConnections(false);
        });

        return () => {
            if (unsubscribeGetCircleConnections) {
                unsubscribeGetCircleConnections();
            }
        };
    }, [source?.id, target?.id, option, toast, connect]);

    return (
        <Box>
            {isLoading && <Spinner />}
            {!isLoading && (
                <>
                    <CircleConnectionsList connections={connections} connect={connect} disconnect={disconnect} isConnecting={isConnecting} />

                    <Flex flexDirection="row" flexGrow="1" marginTop="10px">
                        {(!isConnected || !isFollowing) && (
                            <HStack align="center" height="40px">
                                {!isConnected && (
                                    <Button
                                        minWidth="150px"
                                        colorScheme="blue"
                                        borderRadius="25px"
                                        lineHeight="0"
                                        backgroundColor="#389bf8"
                                        color="white"
                                        isDisabled={isConnecting}
                                        onClick={() => connect("connected_mutually_to")}
                                        position="relative"
                                    >
                                        <HStack marginRight="13px">
                                            <RiLinksLine size="18px" />
                                            <Text>{i18n.t(`Default connect [${target.type}]`)}</Text>
                                        </HStack>
                                    </Button>
                                )}
                                {!isFollowing && (
                                    <Button
                                        minWidth="150px"
                                        colorScheme="blue"
                                        borderRadius="25px"
                                        lineHeight="0"
                                        backgroundColor="#389bf8"
                                        color="white"
                                        isDisabled={isConnecting}
                                        onClick={() => connect("connected_to")}
                                        position="relative"
                                    >
                                        <HStack marginRight="13px">
                                            <RiLinksLine size="18px" />
                                            <Text>{i18n.t("Follow")}</Text>
                                        </HStack>
                                    </Button>
                                )}
                            </HStack>
                        )}
                        <Box flexGrow="1" />
                        {onClose && (
                            <Button variant="ghost" borderRadius="25px" onClick={onClose} isDisabled={isConnecting} lineHeight="0">
                                {i18n.t("Close")}
                            </Button>
                        )}
                    </Flex>
                </>
            )}
        </Box>
    );
};

export const Circle = ({
    circle,
    setCircle,
    circles,
    setCircles,
    circleConnections,
    setCircleConnections,
    displayMode,
    setDisplayMode,
    isSignedIn,
    isSigningIn,
    mustLogInOnOpen,
    userLocation,
    locationPickerPosition,
    setLocationPickerActive,
    setLocationPickerPosition,
    focusItem,
    filterConnected,
    setFilterConnected,
    setContentWidth,
    onConnect,
    isConnecting,
    setChatCircle,
}) => {
    const user = useContext(UserContext);
    const { circleId } = useParams();
    //const navigate = useNavigate();

    useEffect(() => {
        log("Circle.useEffect 1", 0);
        if (!circleId || circleId === "undefined") {
            //navigate(routes.home);
            setCircles([]);
            setCircleConnections([]);
            return;
        }

        let unsubscribeGetCircle = null;

        // subscribe to circle
        unsubscribeGetCircle = onSnapshot(doc(db, "circles", circleId), (doc) => {
            var newCircle = doc.data();
            if (!doc.exists) {
                // TODO display something about circle not existing
                return;
            }
            newCircle.id = doc.id;
            setCircle((currentCircle) => newCircle);
        });

        // show all connections on the map
        // subscribe to connected circles
        let q = query(collection(db, "connections"), where("circle_ids", "array-contains", circleId));

        let unsubscribeGetCircles = onSnapshot(q, (snap) => {
            let circleConnections = snap.docs.map((doc) => doc.data());

            // merge circle connections of the same type
            let connections = [];
            if (Array.isArray(circleConnections)) {
                let seen = {};
                connections = circleConnections?.filter((entry) => {
                    var previous;

                    // wether to use source or target depends
                    let parentCircleIsSource = entry.source.id === circleId;
                    let mergeId = parentCircleIsSource ? entry.target.id : entry.source.id;

                    // have we seen this label before?
                    if (seen.hasOwnProperty(mergeId)) {
                        // yes, grab it and add this data to it
                        previous = seen[mergeId];
                        previous.type.push(entry.type);

                        // don't keep this entry, we've merged it into the previous one
                        return false;
                    }

                    // entry.type probably isn't an array; make it one for consistency
                    if (!Array.isArray(entry.type)) {
                        entry.type = [entry.type];
                    }

                    entry.display_circle = parentCircleIsSource ? entry.target : entry.source;

                    // remember that we've seen it
                    seen[mergeId] = entry;
                    return true;
                });
            }

            setCircleConnections(connections);

            let startDate = getDateWithoutTime(); // today
            setCircles(
                connections
                    ?.map((x) => x.display_circle)
                    .filter((x) => {
                        // remove old events
                        if (x.type === "event") {
                            return fromFsDate(x.starts_at) > startDate;
                        } else {
                            return true;
                        }
                    })
            );
        });

        return () => {
            if (unsubscribeGetCircle) {
                unsubscribeGetCircle();
            }
            if (unsubscribeGetCircles) {
                unsubscribeGetCircles();
            }
            setCircles([]);
            setCircleConnections([]);
        };
    }, [circleId, setCircle, setDisplayMode, setCircles, setCircleConnections]);

    useEffect(() => {
        log("Circle.useEffect 2", 0);
        if (!user?.id || !circleId) return;
        if (circleId === "earth") return;

        log("Circle.seen");

        // mark circle as seen
        axios
            .post(`/seen`, {
                category: "any",
                circleId: circleId,
            })
            .then((x) => {})
            .catch((error) => {});
    }, [user?.id, circleId]);

    return circle ? (
        <Routes>
            <Route
                path="/"
                element={
                    <CircleHome
                        circle={circle}
                        setCircle={setCircle}
                        circles={circles}
                        setCircles={setCircles}
                        circleConnections={circleConnections}
                        displayMode={displayMode}
                        setDisplayMode={setDisplayMode}
                        isSignedIn={isSignedIn}
                        isSigningIn={isSigningIn}
                        mustLogInOnOpen={mustLogInOnOpen}
                        focusItem={focusItem}
                        userLocation={userLocation}
                        onConnect={onConnect}
                        isConnecting={isConnecting}
                    />
                }
            />
            <Route
                path="/circles/*"
                element={
                    <Circles
                        circle={circle}
                        setCircle={setCircle}
                        circles={circles}
                        setCircles={setCircles}
                        circleConnections={circleConnections}
                        displayMode={displayMode}
                        setDisplayMode={setDisplayMode}
                        userLocation={userLocation}
                        locationPickerPosition={locationPickerPosition}
                        setLocationPickerActive={setLocationPickerActive}
                        setLocationPickerPosition={setLocationPickerPosition}
                        isSignedIn={isSignedIn}
                        isSigningIn={isSigningIn}
                        mustLogInOnOpen={mustLogInOnOpen}
                        focusItem={focusItem}
                        filterConnected={filterConnected}
                        setFilterConnected={setFilterConnected}
                        onConnect={onConnect}
                        isConnecting={isConnecting}
                        type="circle"
                    />
                }
            />
            <Route
                path="/events/*"
                element={
                    <Circles
                        circle={circle}
                        setCircle={setCircle}
                        circles={circles}
                        setCircles={setCircles}
                        circleConnections={circleConnections}
                        displayMode={displayMode}
                        setDisplayMode={setDisplayMode}
                        userLocation={userLocation}
                        locationPickerPosition={locationPickerPosition}
                        setLocationPickerActive={setLocationPickerActive}
                        setLocationPickerPosition={setLocationPickerPosition}
                        isSignedIn={isSignedIn}
                        isSigningIn={isSigningIn}
                        mustLogInOnOpen={mustLogInOnOpen}
                        focusItem={focusItem}
                        filterConnected={filterConnected}
                        setFilterConnected={setFilterConnected}
                        onConnect={onConnect}
                        isConnecting={isConnecting}
                        type="event"
                    />
                }
            />
            <Route
                path="/rooms/*"
                element={
                    <Circles
                        circle={circle}
                        setCircle={setCircle}
                        circles={circles}
                        setCircles={setCircles}
                        circleConnections={circleConnections}
                        displayMode={displayMode}
                        setDisplayMode={setDisplayMode}
                        userLocation={userLocation}
                        locationPickerPosition={locationPickerPosition}
                        setLocationPickerActive={setLocationPickerActive}
                        setLocationPickerPosition={setLocationPickerPosition}
                        isSignedIn={isSignedIn}
                        isSigningIn={isSigningIn}
                        mustLogInOnOpen={mustLogInOnOpen}
                        focusItem={focusItem}
                        filterConnected={filterConnected}
                        setFilterConnected={setFilterConnected}
                        onConnect={onConnect}
                        isConnecting={isConnecting}
                        type="room"
                    />
                }
            />
            <Route
                path="/users/*"
                element={
                    <Circles
                        circle={circle}
                        setCircle={setCircle}
                        circles={circles}
                        setCircles={setCircles}
                        circleConnections={circleConnections}
                        displayMode={displayMode}
                        setDisplayMode={setDisplayMode}
                        userLocation={userLocation}
                        locationPickerPosition={locationPickerPosition}
                        setLocationPickerActive={setLocationPickerActive}
                        setLocationPickerPosition={setLocationPickerPosition}
                        isSignedIn={isSignedIn}
                        isSigningIn={isSigningIn}
                        mustLogInOnOpen={mustLogInOnOpen}
                        focusItem={focusItem}
                        filterConnected={filterConnected}
                        setFilterConnected={setFilterConnected}
                        onConnect={onConnect}
                        isConnecting={isConnecting}
                        type="user"
                    />
                }
            />
            <Route
                path="/settings/*"
                element={
                    <CircleSettings
                        circle={circle}
                        setCircle={setCircle}
                        setDisplayMode={setDisplayMode}
                        isSignedIn={isSignedIn}
                        isSigningIn={isSigningIn}
                        mustLogInOnOpen={mustLogInOnOpen}
                        locationPickerPosition={locationPickerPosition}
                        setLocationPickerActive={setLocationPickerActive}
                        setContentWidth={setContentWidth}
                        onConnect={onConnect}
                    />
                }
            />
            <Route
                path="/chat/*"
                element={<Chat circle={circle} setCircle={setCircle} onConnect={onConnect} setContentWidth={setContentWidth} setChatCircle={setChatCircle} />}
            />
            <Route
                path="new"
                element={
                    <CreateNewCircle
                        circle={circle}
                        setCircle={setCircle}
                        displayMode={displayMode}
                        setDisplayMode={setDisplayMode}
                        locationPickerPosition={locationPickerPosition}
                        setLocationPickerPosition={setLocationPickerPosition}
                        setLocationPickerActive={setLocationPickerActive}
                        isSignedIn={isSignedIn}
                        isSigningIn={isSigningIn}
                        mustLogInOnOpen={mustLogInOnOpen}
                        parentId={circleId}
                    />
                }
            />
        </Routes>
    ) : null;
};

// CONNECT123 TODO
const CircleItem = ({ item, onClick, focusItem, coverHeight, showBecomeMemberButton, ...props }) => {
    const user = useContext(UserContext);
    return (
        <Box
            key={item.id}
            className="circleItem"
            align="center"
            borderRadius="25px"
            role="group"
            color="black"
            cursor="pointer"
            bg="white"
            boxShadow="md"
            _hover={{
                bg: "#ddd8db",
                color: "black",
            }}
            overflow="hidden"
            position="relative"
            marginLeft="10px"
            marginRight="10px"
            {...props}
        >
            <Box height={coverHeight ?? "40%"} backgroundColor="#b9b9b9" overflow="hidden">
                <CircleCover circle={item} />
            </Box>
            <Box height="76px" position="relative" top="-38px">
                <CirclePicture circle={item} size={76} />
            </Box>

            <VStack align="center" spacing="0px" marginTop="-28px">
                <Text fontSize="18px" fontWeight="500">
                    {item.name}
                </Text>

                {/* <Box>
                    <LatestConnections item={item} circleId={item.id} hasPopover={true} marginTop="6px" />
                </Box> */}
                <Box>
                    <Box marginLeft="10px" marginRight="10px" marginTop="12px">
                        <Text fontSize="14px">{item.description}</Text>
                    </Box>
                </Box>
            </VStack>
            <Box
                position="absolute"
                onClick={() => {
                    if (showBecomeMemberButton) {
                        if (item.action_button_link) {
                            window.open(item.action_button_link, "_blank");
                        } else {
                            window.open(`https://cirklar.org/${item.id}?connect=true`, "_blank");
                        }
                    }
                    onClick();
                }}
                top="0px"
                left="0px"
                width="100%"
                height="100%"
            />

            {showBecomeMemberButton && (
                <Box width="100%" height="50px" position="absolute" bottom="0px" align="center">
                    <Button
                        width="150px"
                        colorScheme="blue"
                        borderRadius="25px"
                        lineHeight="0"
                        backgroundColor={item?.action_button_color ?? "#389bf8"}
                        color="white"
                        onClick={() => {
                            if (item.action_button_link) {
                                window.open(item.action_button_link, "_blank");
                            } else {
                                window.open(`https://cirklar.org/circles/${item.id}?connect=true`, "_blank");
                            }
                        }}
                    >
                        <Text>{i18n.t("Become member")}</Text>
                    </Button>
                </Box>
            )}

            {item.distance && (
                <Flex
                    position="absolute"
                    top="10px"
                    left="10px"
                    borderRadius="20px"
                    height="24px"
                    backgroundColor="#c242bb"
                    paddingLeft="4px"
                    paddingRight="7px"
                    align="center"
                    flexDirection="row"
                    justifyContent="center"
                    onClick={() => focusItem(item)}
                >
                    <Icon width="14px" height="14px" color="white" as={RiMapPinFill} cursor="pointer" marginRight="4px" />
                    <Text fontWeight="700" color="#fff" fontSize="14px">
                        {getDistanceString(item.distance)}
                    </Text>
                </Flex>
            )}
        </Box>
    );
};

// CONNECT123 TODO
export const CircleItemSmall = ({ item, onClick, focusItem, navigate, location, ...props }) => {
    const user = useContext(UserContext);
    return (
        <Flex
            key={item.id}
            height="95px"
            align="left"
            borderRadius="13px"
            role="group"
            color="black"
            cursor="pointer"
            bg="white"
            boxShadow="md"
            _hover={{
                bg: "#ddd8db",
                color: "black",
            }}
            overflow="hidden"
            position="relative"
            marginLeft="10px"
            marginRight="10px"
            flexDirection="row"
            flexGrow="0"
            flexShrink="0"
            {...props}
        >
            <Box width="140px" height="95px" flexShrink="0" flexGrow="0" backgroundColor="#b9b9b9" overflow="hidden" position="relative" borderRadius="13px">
                <CircleCover circle={item} coverWidth={140} />

                <CirclePicture circle={item} position="absolute" size={40} top="5px" right="5px" />

                <VStack position="absolute" top="5px" left="5px" align="left" spacing="2px">
                    {item.type === "event" && (
                        <Flex
                            borderRadius="20px"
                            height="18px"
                            backgroundColor="#c28b42"
                            paddingLeft="2px"
                            paddingRight="5px"
                            align="center"
                            flexDirection="row"
                            justifyContent="center"
                            onClick={() => focusItem(item)}
                        >
                            <Icon width="12px" height="12px" color="white" as={HiClock} cursor="pointer" marginRight="2px" />
                            <Text fontWeight="700" color="#fff" fontSize="10px">
                                {getEventTime(item)}
                            </Text>
                        </Flex>
                    )}

                    {item.distance && (
                        <Flex
                            borderRadius="20px"
                            height="18px"
                            backgroundColor="#c242bb"
                            paddingLeft="2px"
                            paddingRight="5px"
                            align="center"
                            flexDirection="row"
                            justifyContent="center"
                            onClick={() => focusItem(item)}
                        >
                            <Icon width="12px" height="12px" color="white" as={RiMapPinFill} cursor="pointer" marginRight="2px" />
                            <Text fontWeight="700" color="#fff" fontSize="10px">
                                {getDistanceString(item.distance)}
                            </Text>
                        </Flex>
                    )}
                </VStack>
            </Box>

            <VStack flexGrow="1" align="left" justifyContent="left" spacing="0px" marginLeft="15px" marginRight="15px">
                {item.type === "event" && (
                    <Text fontSize="14px" fontWeight="700" color={isPastEvent(item) ? "#8d8d8d" : "#cf1a1a"} href={location?.pathname} marginTop="0px">
                        {item.is_all_day ? getDateLong(item.starts_at) : getDateAndTimeLong(item.starts_at)}
                    </Text>
                )}
                <HStack marginTop="5px">
                    <Text fontSize="16px" fontWeight="700">
                        {item.name}
                    </Text>
                </HStack>
                <Box>
                    <Text fontSize="14px">{item.description}</Text>
                </Box>
            </VStack>

            <Box position="absolute" onClick={onClick} top="0px" left="0px" width="100%" height="100%" />
        </Flex>
    );
};

const singleLineEllipsisStyle = {
    WebkitLineClamp: 1,
    WebkitBoxOrient: "vertical",
    display: "-webkit-box",
    textOverflow: "ellipsis",
    overflow: "hidden",
};

export const CircleListItem = ({ item, setCircle, onClick, focusItem, navigate, location, onConnect, inSelect, ...props }) => {
    return (
        <Flex
            key={item.id}
            align="left"
            role="group"
            color="black"
            cursor="pointer"
            borderBottom="1px solid #ebebeb"
            bg={inSelect ? "transparent" : "white"}
            _hover={
                inSelect
                    ? {}
                    : {
                          bg: "#ddd8db",
                          color: "black",
                      }
            }
            overflow="hidden"
            position="relative"
            flexDirection="row"
            flexGrow="0"
            flexShrink="0"
            paddingBottom="10px"
            maxHeight="84px"
            onClick={onClick}
            {...props}
        >
            <Box margin="10px" minWidth="60px" minHeight="60px" position="relative">
                <CirclePicture circle={item} size={60} />
            </Box>

            <VStack
                flexGrow="1"
                align="left"
                justifyContent="left"
                spacing="0px"
                marginLeft="5px"
                marginRight="15px"
                marginTop={item.type === "event" ? "0px" : "10px"}
            >
                {item.type === "event" && (
                    <Text
                        textAlign="left"
                        fontSize="12px"
                        fontWeight="700"
                        color={isPastEvent(item) ? "#8d8d8d" : "#cf1a1a"}
                        href={location?.pathname}
                        marginTop="0px"
                    >
                        {item.is_all_day ? getDateLong(item.starts_at) : getDateAndTimeLong(item.starts_at)}
                    </Text>
                )}
                <HStack>
                    <Text
                        fontSize="16px"
                        fontWeight="700"
                        textAlign="left"
                        lineHeight={item.type === "event" ? "17px" : "inherit"}
                        marginTop={item.type === "event" ? "2px" : "0px"}
                        style={singleLineEllipsisStyle}
                    >
                        {item.name}
                    </Text>
                </HStack>

                <Box>
                    <Text fontSize="14px" textAlign="left" style={singleLineEllipsisStyle}>
                        {item.description}
                    </Text>
                </Box>
                <Box paddingTop={item.type === "event" ? "0px" : "4px"}>
                    <CircleTags circle={item} setCircle={setCircle} size="tiny" inSelect={inSelect} />
                </Box>
                {/* <Box>
                <LatestMembers item={item} circleId={item.id} size={16} hasPopover={true} marginTop="6px" spacing="4px" />
            </Box> */}
            </VStack>

            {!inSelect && <ConnectButton circle={item} onConnect={onConnect} position="absolute" bottom="5px" right="10px" />}

            <VStack position="absolute" top="0px" right="7px" align="left" spacing="2px">
                {item.type === "event" && (
                    <Flex
                        borderRadius="20px"
                        height="18px"
                        backgroundColor="white"
                        paddingLeft="2px"
                        paddingRight="5px"
                        align="center"
                        flexDirection="row"
                        justifyContent="center"
                        onClick={(event) => {
                            if (inSelect) return;

                            event.stopPropagation();
                            focusItem(item);
                        }}
                    >
                        <Icon width="14px" height="14px" color="#929292" as={HiClock} cursor="pointer" marginRight="2px" />
                        <Text fontWeight="700" color="#929292" fontSize="12px">
                            {getEventTime(item)}
                        </Text>
                    </Flex>
                )}

                {item.distance && (
                    <Flex
                        borderRadius="20px"
                        height="18px"
                        //backgroundColor="#c242bb"
                        backgroundColor="white"
                        paddingLeft="2px"
                        paddingRight="5px"
                        align="center"
                        flexDirection="row"
                        justifyContent="center"
                        onClick={(event) => {
                            if (inSelect) return;

                            event.stopPropagation();
                            focusItem(item);
                        }}
                    >
                        <Icon width="14px" height="14px" color="#929292" as={RiMapPinFill} cursor="pointer" marginRight="2px" />
                        <Text fontWeight="700" color="#929292" fontSize="12px">
                            {getDistanceString(item.distance)}
                        </Text>
                    </Flex>
                )}
            </VStack>
        </Flex>
    );
};

export const Circles = ({
    circle,
    setCircle,
    circles,
    setCircles,
    circleConnections,
    type,
    displayMode,
    setDisplayMode,
    userLocation,
    locationPickerPosition,
    setLocationPickerActive,
    setLocationPickerPosition,
    isSignedIn,
    isSigningIn,
    mustLogInOnOpen,
    focusItem,
    filterConnected,
    setFilterConnected,
    onConnect,
    isConnecting,
}) => {
    const isMobile = useContext(IsMobileContext);
    const user = useContext(UserContext);
    const navigate = useNavigate();
    const [unfilteredCircles, setUnfilteredCircles] = useState([]);
    const [searchParams, setSearchParams] = useSearchParams();
    const embed = searchParams.get("embed") === "true";
    const mapOnly = searchParams.get("mapOnly") === "true";
    const { circleId } = useParams();

    const getCircleTypes = (sourceType, targetType) => {
        const types = [sourceType, targetType];
        return types.sort().join("_");
    };

    useEffect(() => {
        log("Circles.useEffect 1", 0);
        if (!circle?.type || !circleConnections) {
            setUnfilteredCircles([]);
            return;
        }

        // filter connections
        const circleTypes = getCircleTypes(circle.type, type);
        setUnfilteredCircles(circleConnections.filter((x) => x.circle_types === circleTypes).map((x) => x.display_circle));
    }, [circleConnections, circleId, type, circle?.type]);

    useEffect(() => {
        log("Circles.useEffect 2", 0);
        if (!unfilteredCircles) {
            setCircles([]);
            return;
        }

        let listCircles = !filterConnected ? unfilteredCircles : unfilteredCircles.filter((x) => user?.connections?.some((y) => y.target.id === x.id));

        if (type === "event") {
            // filter all past events
            let startDate = getDateWithoutTime(); // today
            listCircles = listCircles.filter((x) => fromFsDate(x.starts_at) > startDate);
        }

        if (!userLocation) {
            setCircles(listCircles);
            return;
        }

        let newFilteredCircles = [];
        if (userLocation.latitude && userLocation.longitude) {
            for (var circle of listCircles.filter((x) => x.base)) {
                var circleLocation = getLatlng(circle.base);
                var preciseDistance = getPreciseDistance(userLocation, circleLocation);
                newFilteredCircles.push({ ...circle, distance: preciseDistance });
            }

            newFilteredCircles.sort((a, b) => a.distance - b.distance);
            for (var circlesWithNoBase of listCircles.filter((x) => !x.base)) {
                newFilteredCircles.push(circlesWithNoBase);
            }
        } else {
            newFilteredCircles = listCircles;
        }

        if (type === "event") {
            // TODO if event we just sort by date and ignore proximity for now
            newFilteredCircles.sort((a, b) => fromFsDate(a.starts_at) - fromFsDate(b.starts_at));
        }

        setCircles(newFilteredCircles);
    }, [unfilteredCircles, userLocation, setCircles, user?.connections, filterConnected, type]);

    useEffect(() => {
        log("Circles.useEffect 3", 0);
        let circleId = circle?.id;
        if (!user?.id || !circleId) return;
        if (circleId === "earth") return;

        log("Circles.seen");

        // mark circles as seen
        axios
            .post(`/seen`, {
                category: `${type}s`,
                circleId: circleId,
            })
            .then((x) => {})
            .catch((error) => {});
    }, [user?.id, circle?.id, type]);

    //#region components

    const CircleMapItem = ({ item, onClick }) => {
        const user = useContext(UserContext);

        return (
            <Box
                key={item.id}
                className="circleItem"
                align="center"
                width="157px"
                height="220px"
                borderRadius="13px"
                role="group"
                color="black"
                cursor="pointer"
                border="0px solid #ebebeb"
                bg="white"
                _hover={{
                    bg: "#fdfdfd",
                    color: "black",
                }}
                overflow="hidden"
                position="relative"
                boxShadow="md"
                margin="5px"
                flexShrink="0"
            >
                <Box height="40%" backgroundColor="#b9b9b9" overflow="hidden">
                    <CircleCover circle={item} coverWidth={157} />
                </Box>
                <Box height="44px" position="relative" top="-22px">
                    <CirclePicture circle={item} size={44} />
                </Box>

                <VStack align="center" spacing="0px" marginTop="-22px">
                    <Text className="circle-list-title" fontSize="12px" fontWeight="700">
                        {item.name}
                    </Text>
                    {/* <LatestConnections item={item} circleId={item.id} size={16} /> */}
                    {/* 
                <HStack
                    spacing="0px"
                    align="center"
                    className="circle-list-info"
                    color="#aaa"
                    _groupHover={{
                        color: "#888",
                    }}
                >
                    {item.members && <HiUser className="members-icon" />}
                    {item.members && <Text paddingLeft="2px">{item.members?.toLocaleString()}</Text>}
                    {item.followers && (
                        <Box paddingLeft="10px">
                            <HiEye className="followers-icon" />
                        </Box>
                    )}
                    {item.followers && <Text paddingLeft="2px">{item.followers?.toLocaleString()}</Text>}
                </HStack> */}
                    <Box>
                        <Box marginLeft="2px" marginRight="2px">
                            <Text fontSize="10px">{item.description}</Text>
                        </Box>
                    </Box>
                </VStack>
                <Box position="absolute" onClick={onClick} top="0px" left="0px" width="157px" height="220px" />
                {item.distance && (
                    <Flex
                        position="absolute"
                        top="5px"
                        right="5px"
                        borderRadius="20px"
                        height="20px"
                        backgroundColor="#c242bb"
                        paddingLeft="2px"
                        paddingRight="5px"
                        align="center"
                        flexDirection="row"
                        justifyContent="center"
                        onClick={() => focusItem(item)}
                    >
                        <Icon width="12px" height="12px" color="white" as={RiMapPinFill} cursor="pointer" marginRight="2px" />
                        <Text fontWeight="700" color="#fff" fontSize="12px">
                            {getDistanceString(item.distance)}
                        </Text>
                    </Flex>
                )}
            </Box>
        );
    };

    //#endregion

    return displayMode === "map" && isMobile ? (
        <>
            <CircleHeader
                circle={circle}
                setCircle={setCircle}
                createNew={() => navigate(routes.circle(circle.id).new)}
                filterConnected={filterConnected}
                setFilterConnected={setFilterConnected}
                title={type}
                onConnect={onConnect}
            />
            <Flex
                flexGrow="1"
                flexDirection="row"
                width="100%"
                height="230px"
                align="center"
                position="absolute"
                bottom="3px"
                left="0px"
                overflowX="auto"
                overflowY="hidden"
                zIndex="15"
                paddingLeft="15px"
            >
                {circles?.map((item) => (
                    <CircleMapItem key={item.id} item={item} onClick={() => openCircle(navigate, user, item.id, circle, setCircle)} />
                ))}
            </Flex>
        </>
    ) : (
        <>
            {!mapOnly && (
                <Box flexGrow="1" width="100%" height="100%" align="center" position="relative" top="0px" left="0px">
                    <Flex width="100%" flexDirection="column" flexWrap="nowrap">
                        <CircleHeader
                            circle={circle}
                            setCircle={setCircle}
                            createNew={() => navigate(routes.circle(circle.id).new)}
                            filterConnected={filterConnected}
                            setFilterConnected={setFilterConnected}
                            title={type}
                            onConnect={onConnect}
                        />
                        {circles?.length > 0 && <Box height="1px" backgroundColor="#ebebeb" />}

                        {circles?.map((item) => (
                            <CircleListItem
                                key={item.id}
                                item={item}
                                setCircle={setCircle}
                                onClick={() => openCircle(navigate, user, item.id, circle, setCircle)}
                                focusItem={focusItem}
                                onConnect={onConnect}
                            />
                        ))}

                        {circles?.length <= 0 && (
                            <Text marginLeft="12px" marginTop="10px" alignSelf="start">
                                {i18n.t(`No ${type}s`)}
                            </Text>
                        )}
                    </Flex>
                </Box>
            )}
        </>
    );
};

// CONNECT123 TODO
export const CircleMapMarker = ({ circle, navigate, embed }) => {
    const user = useContext(UserContext);
    const getMarkerBackground = () => {
        switch (circle?.type) {
            default:
            case "circle":
                return require("../assets/images/marker2.png");
            case "event":
                return require("../assets/images/marker5.png");
            case "user":
                return require("../assets/images/marker3.png");
        }
    };

    return (
        circle?.base && (
            <Marker
                key={circle.id}
                offset={[0, -24]}
                latitude={lat(circle.base)}
                longitude={lng(circle.base)}
                className="circle-marker"
                onClick={() => mapNavigateTo(navigate, circleDefaultRoute(user, circle.id), embed)}
            >
                <Image src={getMarkerBackground()} />
                <Box
                    top="3px"
                    left="9px"
                    width="30px"
                    height="30px"
                    overflow="hidden"
                    flexShrink="0"
                    borderRadius="50%"
                    backgroundColor="white"
                    position="absolute"
                >
                    <CirclePicture circle={circle} size={30} />
                </Box>

                <Popover trigger="hover" gutter="0" isLazy>
                    <PopoverTrigger>
                        <Box position="absolute" width="48px" height="48px" top="0px" left="0px" />
                    </PopoverTrigger>
                    <PopoverContent backgroundColor="transparent" borderColor="transparent" width="450px">
                        <Box zIndex="160">
                            <PopoverArrow />
                            <CircleItemSmall key={circle.id} item={circle} />
                        </Box>
                    </PopoverContent>
                </Popover>
            </Marker>
        )
    );
};

export const CirclesMapMarkers = ({ circles }) => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const embed = searchParams.get("embed") === "true";

    return (
        <>
            {circles
                ?.filter((item) => item.base)
                .map((item) => (
                    <CircleMapMarker key={item.id} circle={item} navigate={navigate} embed={embed} />
                ))}
        </>
    );
};

// CONNECT123 TODO
export const CircleCard = ({ circle, focusItem }) => {
    return (
        <Flex className="cardAspectRatio" height="100%" maxHeight="500px" align="center" flexDirection="row" pointerEvents="auto">
            {circle && <CircleItem item={circle} focusItem={focusItem} width="100%" height="90%" coverHeight="40%" showBecomeMemberButton="true" />}
        </Flex>
    );
};

export default Circles;
