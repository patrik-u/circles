/* global google */
//#region imports
import React, { useState, useEffect, useContext, useRef, useMemo } from "react";
import {
    Flex,
    Box,
    Text,
    Menu,
    Image,
    MenuButton,
    MenuDivider,
    MenuItem,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    Spinner,
    Button,
    Center,
    Avatar,
    Icon,
    Checkbox,
    Table,
    TableCaption,
    Thead,
    Tr,
    Td,
    Th,
    Tfoot,
    Tbody,
    Heading,
    LinkOverlay,
    MenuList,
    useToast,
    HStack,
    VStack,
    LinkBox,
    useDisclosure,
} from "@chakra-ui/react";
import { getPreciseDistance } from "geolib";
import ThreeboxMap from "./components/ThreeboxMap";
import UserContext from "./components/UserContext";
import IsMobileContext from "./components/IsMobileContext";
import db, { auth } from "./components/Firebase";
import * as Sentry from "@sentry/react";
import { Scrollbars } from "react-custom-scrollbars-2";
import { GoogleAuthProvider, onAuthStateChanged, onIdTokenChanged, signInWithCredential } from "firebase/auth";
import axios from "axios";
import { isMobile as detectIsMobile } from "react-device-detect";
import { toastError, log } from "./components/Helpers";
import Graph from "./components/Graph";
import { collection, doc, onSnapshot, query, where } from "firebase/firestore";
import { Routes, Navigate, Route, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { Circle, CircleMarker, CirclesMapMarkers, CircleConnections, CircleMapEdges, CreateNewCircle } from "screens/Circle";
import { CircleContentForm, CircleImagesForm, CircleTagsForm, CircleBaseForm, CircleQuestionsForm } from "./components/CircleSettingsForms";
import AppAdmin from "./screens/AppAdmin";
import i18n from "i18n/Localization";
import Notifications from "./components/Notifications";
import { FaSatellite, FaMapMarkedAlt } from "react-icons/fa";
import { IoAdd, IoList, IoMap } from "react-icons/io5";
import { BiNetworkChart } from "react-icons/bi";
import { Step, Steps, useSteps } from "chakra-ui-steps";
import {
    LeftNavigator,
    BottomNavigator,
    CirclePicture,
    CircleCover,
    routes,
    openCircle,
    clusterConnections,
    parseCircleId,
    defaultContentWidth,
    isConnected,
    BlueBar,
    getConnectLabel,
} from "./components/Navigation";
import default_user_picture from "./assets/images/default-user-picture.png";
import config from "./Config";
import { LoginRegisterMenu } from "./components/LoginForms";
import useWindowDimensions from "./components/useWindowDimensions";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper";
import { Marker } from "react-map-gl";
import { BsArrowRight } from "react-icons/bs";
import { RiLinksLine } from "react-icons/ri";
import { AiOutlineDisconnect } from "react-icons/ai";
import PrivacyPolicy from "./components/PrivacyPolicy";
//#endregion

//#region components

const LocationPickerMarker = ({ position }) => {
    // useEffect(() => {
    //     console.log(JSON.stringify(position, null, 2));
    // }, [position]);

    return (
        <>
            {position[0] && position[1] && (
                <Marker offset={[0, -24]} latitude={position[1]} longitude={position[0]} className="circle-marker">
                    <Image src={require("./assets/images/marker2.png")} />
                </Marker>
            )}
        </>
    );
};

const FloatingActionButtons = ({ displayMode, setDisplayMode, satelliteMode, setSatelliteMode, mapOnly, circle }) => {
    const isMobile = useContext(IsMobileContext);
    const navigate = useNavigate();

    return (
        <VStack position="absolute" right="18px" bottom={isMobile ? "300px" : "30px"} zIndex="50">
            {isMobile && !mapOnly && (
                <>
                    <Flex
                        backgroundColor="#c242bbdd"
                        _hover={{ backgroundColor: "#e94ce1dd" }}
                        width="54px"
                        height="54px"
                        borderRadius="50%"
                        cursor="pointer"
                        alignItems="center"
                        justifyContent="center"
                        onClick={() => navigate(routes.circle(circle?.id ?? "earth").new)}
                    >
                        <Icon width="28px" height="28px" color="white" as={IoAdd} />
                    </Flex>
                    <Flex
                        backgroundColor="#f4f4f4dd"
                        _hover={{ backgroundColor: "#f5f5f5dd" }}
                        width="48px"
                        height="48px"
                        borderRadius="50%"
                        cursor="pointer"
                        alignItems="center"
                        justifyContent="center"
                        onClick={() => setDisplayMode(displayMode === "map" ? "list" : "map")}
                    >
                        <Icon width="28px" height="28px" color="black" as={displayMode === "map" ? IoList : IoMap} cursor="pointer" />
                    </Flex>
                </>
            )}

            {(!isMobile || displayMode === "map" || displayMode === "graph") && (
                <Flex cursor="pointer" alignItems="center" justifyContent="center" flexDirection="column">
                    <Flex
                        backgroundColor="#f4f4f4dd"
                        _hover={{ backgroundColor: "#f5f5f5dd" }}
                        borderRadius="50%"
                        cursor="pointer"
                        width="48px"
                        height="48px"
                        alignItems="center"
                        justifyContent="center"
                    >
                        <Icon
                            width="28px"
                            height="28px"
                            color="black"
                            as={satelliteMode ? FaMapMarkedAlt : FaSatellite}
                            onClick={() => {
                                if (displayMode === "map") {
                                    setSatelliteMode(!satelliteMode);
                                }
                                setDisplayMode("map");
                            }}
                            cursor="pointer"
                        />
                    </Flex>
                </Flex>
            )}

            <Flex cursor="pointer" alignItems="center" justifyContent="center" flexDirection="column">
                <Flex
                    backgroundColor="#f4f4f4dd"
                    _hover={{ backgroundColor: "#f5f5f5dd" }}
                    borderRadius="50%"
                    cursor="pointer"
                    width="48px"
                    height="48px"
                    alignItems="center"
                    justifyContent="center"
                >
                    <Icon width="28px" height="28px" color="black" as={BiNetworkChart} onClick={() => setDisplayMode("graph")} cursor="pointer" />
                </Flex>
            </Flex>
        </VStack>
    );
};

const ProfileMenu = ({ onSignOutClick, circle, setCircle }) => {
    const user = useContext(UserContext);
    const navigate = useNavigate();
    const isMobile = useContext(IsMobileContext);
    const circlePictureSize = isMobile ? "30px" : "60px";
    const { isOpen: profileMenuIsOpen, onOpen: profileMenuOnOpen, onClose: profileMenuOnClose } = useDisclosure();

    return (
        <Menu closeOnBlur="true" onClose={profileMenuOnClose} onOpen={profileMenuOnOpen} isOpen={profileMenuIsOpen}>
            <MenuButton as={Button} rounded={"full"} variant={"link"} cursor={"pointer"} minW={0}>
                <Avatar size={"sm"} w={circlePictureSize} h={circlePictureSize} src={user?.picture ? user?.picture : default_user_picture} />
            </MenuButton>
            <MenuList alignItems={"center"} borderRadius="20" zIndex="60">
                <br />
                <Center>
                    <Avatar
                        alignSelf="center"
                        cursor="pointer"
                        size={"2xl"}
                        src={user?.picture ?? default_user_picture}
                        onClick={() => {
                            profileMenuOnClose();
                            openCircle(navigate, user, user.id, circle, setCircle);
                        }}
                    />
                </Center>
                <br />
                <Center
                    cursor="pointer"
                    onClick={() => {
                        profileMenuOnClose();
                        openCircle(navigate, user, user.id, circle, setCircle);
                    }}
                >
                    <strong>{user.name}</strong>
                </Center>
                <br />
                <MenuDivider />
                <MenuItem onClick={() => navigate(routes.circle(user.id).home)}>{i18n.t("my profile")}</MenuItem>
                <MenuItem onClick={() => navigate(routes.circle(user.id).settings.home)}>{i18n.t("my settings")}</MenuItem>
                <MenuDivider />
                <Center>
                    <Button
                        onClick={onSignOutClick}
                        display="inline-flex"
                        fontSize={"sm"}
                        fontWeight={600}
                        color={"#333"}
                        href={"#"}
                        variant="outline"
                        borderRadius="full"
                    >
                        {i18n.t("log out")}
                    </Button>
                </Center>
            </MenuList>
        </Menu>
    );
};

const TopMenu = ({ circle, setCircle, onSignOutClick, isSigningIn, isSignedIn, gsiScriptLoaded, satelliteMode, displayMode }) => {
    const isMobile = useContext(IsMobileContext);
    const { windowWidth } = useWindowDimensions();
    const user = useContext(UserContext);
    const navigate = useNavigate();
    const iconSize = isMobile ? "24px" : "30px";
    const circlePictureSize = isMobile ? "30px" : "63px";
    const isMapActive = displayMode === "map" || displayMode === "graph";

    const onBack = () => {
        navigate(routes.home);
    };

    return (
        <Flex
            className="fixedSize"
            align="center"
            flexBasis={isMobile ? "40px" : "90px"}
            height={isMobile ? "40px" : "90px"}
            maxHeight={isMobile ? "40px" : "90px"}
            //style={{ background: isMobile ? "linear-gradient(to left top, #c463c0, #4883f8)" : "transparent" }}
            backgroundColor="transparent"
            position="absolute"
            top="0px"
            right={isMobile ? (isMapActive ? "40px" : "0px") : "50px"}
            zIndex="1000"
            width={isMobile ? (isMapActive ? "calc(100% - 40px)" : "100%") : "calc(100% - 50px)"}
            pointerEvents={isMobile && isMapActive ? "none" : "auto"}
        >
            {isMobile && circle && circle.id !== "earth" && (
                <Box marginLeft="6px" pointerEvents="auto">
                    <Flex flexGrow="1" flexDirection="row" justifyContent="flex-start" align="center">
                        {circle?.parent_circle ? (
                            <Image
                                src={circle.parent_circle.picture}
                                width={isMobile ? "20px" : "50px"}
                                height={isMobile ? "20px" : "50px"}
                                // marginRight={isMobile ? "5px" : "10px"}
                                onClick={() => openCircle(navigate, user, circle.parent_circle.id, circle, setCircle)}
                                cursor="pointer"
                                position="absolute"
                                top="7px"
                                //top={isMobile ? "21px" : "7px"}
                                left="10px"
                            />
                        ) : (
                            <Image
                                src="/earth.png"
                                width={isMobile ? "20px" : "50px"}
                                height={isMobile ? "20px" : "50px"}
                                // marginRight={isMobile ? "5px" : "10px"}
                                onClick={() => navigate(routes.home)}
                                cursor="pointer"
                                position="absolute"
                                top="7px"
                                //top={isMobile ? "21px" : "7px"}
                                left="10px"
                            />
                        )}
                    </Flex>
                </Box>
            )}

            <Box flex="1" />

            <Box
                align="center"
                marginRight={isMobile ? "12px" : "25px"}
                backgroundColor={isMobile ? (isMapActive ? "transparent" : "#ffffffee") : "transparent"}
                borderRadius="10px"
                paddingLeft="10px"
                pointerEvents="auto"
            >
                {user && (
                    <HStack spacing={isMobile ? "20px" : "50px"} align="center">
                        {/* <Points satelliteMode={satelliteMode} /> */}

                        <Notifications satelliteMode={satelliteMode} circle={circle} setCircle={setCircle} />

                        <ProfileMenu onSignOutClick={onSignOutClick} circle={circle} setCircle={setCircle} />
                    </HStack>
                )}

                {isSigningIn && <Spinner color={satelliteMode && !isMobile ? "white" : "#333"} marginRight="10px" />}

                <LoginRegisterMenu satelliteMode={satelliteMode} gsiScriptLoaded={gsiScriptLoaded} isSigningIn={isSigningIn} isSignedIn={isSignedIn} />
            </Box>
        </Flex>
    );
};

const CircleCoverCaurosel = ({ isMobile, circle, embed, setIsEmbedLoading }) => {
    const onNextFrame = (callback) => {
        setTimeout(function () {
            requestAnimationFrame(callback);
        });
    };

    useEffect(() => {
        if (!embed) {
            setIsEmbedLoading(false);
        }
    }, [embed, setIsEmbedLoading]);

    const slideChange = () => {
        if (embed) {
            setIsEmbedLoading(false);
        }
    };

    return (
        <>
            {circle?.cover && (
                <Box width="100%" height="100%" zIndex="50" position="absolute" top="0px" pointerEvents="none">
                    <Swiper
                        slidesPerView="auto"
                        navigation={true}
                        loop={true}
                        modules={[Navigation, Pagination]}
                        pagination={{
                            clickable: true,
                        }}
                        onSlideChange={slideChange}
                    >
                        <SwiperSlide>
                            <Box backgroundColor={circle.cover_background ?? "#f7f7f7"} width="100%" height="100%" pointerEvents="auto">
                                <CircleCover circle={circle} objectFit="contain" backgroundColor={circle.cover_background ?? "#f7f7f7"} />
                            </Box>
                        </SwiperSlide>
                        <SwiperSlide></SwiperSlide>
                    </Swiper>
                </Box>
            )}
        </>
    );
};

const NewUserGuide = ({ onClose }) => {
    const user = useContext(UserContext);
    const isMobile = useContext(IsMobileContext);
    const allSteps = useMemo(
        () => ({
            default: { id: "default", label: "Default" },
            tnc: { id: "tnc", label: i18n.t("Terms and conditions") },
            welcome: { id: "welcome", label: i18n.t("Welcome") },
            about: { id: "about", label: i18n.t("About") },
            images: { id: "images", label: i18n.t("Images") },
            tags: { id: "tags", label: i18n.t("Tags") },
            questions: { id: "questions", label: i18n.t("Questions") },
            location: { id: "location", label: i18n.t("base") },
            complete: { id: "complete", label: i18n.t("Congratulations") },
        }),
        []
    );
    const [agreedToTnc, setAgreedToTnc] = useState(false);
    const [agreedToEmailUpdates, setAgreedToEmailUpdates] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [steps, setSteps] = useState([]);
    const [activeStep, setActiveStep] = useState(allSteps.default);
    const [hasBeenInitialized, setHasBeenInitialized] = useState(false);
    const toast = useToast();

    useEffect(() => {
        log("NewUserGuide.useEffect 1");
        if (!user?.id || hasBeenInitialized) return;
        setHasBeenInitialized(true);
        let isProd = config.environment === "prod";
        let ignoreCheck = false; //!isProd;
        let profileSteps = [];
        if (!user.agreed_to_tnc || ignoreCheck) {
            // user hasn't agreed to terms and conditions
            profileSteps.push(allSteps.tnc);
        }
        if (!user.completed_guide || ignoreCheck) {
            profileSteps.push(allSteps.welcome);
            if (!user.description || ignoreCheck) {
                profileSteps.push(allSteps.about);
            }
            if ((!user.picture && !user.cover) || ignoreCheck) {
                profileSteps.push(allSteps.images);
            }
            if (!user.tags || user.tags?.length <= 0 || ignoreCheck) {
                profileSteps.push(allSteps.tags);
            }
            if (!user.questions || !user.questions?.question0 || !user.questions?.question1 || !user.questions?.question2 || ignoreCheck) {
                profileSteps.push(allSteps.questions);
            }
            if (!user.base || ignoreCheck) {
                //profileSteps.push(allSteps.location);
            }
        }
        profileSteps.push(allSteps.complete);

        if (profileSteps.length <= 0) {
            onClose();
        }

        setSteps(profileSteps);
        setActiveStep(profileSteps[0]);
        // if profile has no picture or cover prompt them to choose
    }, [
        user?.id,
        user?.agreed_to_tnc,
        user?.completed_guide,
        user?.description,
        user?.picture,
        user?.cover,
        user?.tags,
        user?.questions,
        user?.base,
        hasBeenInitialized,
        allSteps,
        onClose,
    ]);

    const next = () => {
        let nextIndex = steps.indexOf(activeStep) + 1;
        if (nextIndex >= steps.length) {
            onClose();
        } else {
            setActiveStep(steps[nextIndex]);
        }
    };

    const onAgreeToTncClick = () => {
        if (!agreedToTnc) return;

        setIsSaving(true);

        // update user data
        axios
            .put(`/circles/${user.id}`, {
                circlePrivateData: {
                    agreed_to_tnc: agreedToTnc,
                    agreed_to_email_updates: agreedToEmailUpdates,
                },
            })
            .then((x) => {
                let result = x.data;
                if (result.error) {
                    toastError(toast, JSON.stringify(result.error, null, 2));
                    next();
                } else {
                    next();
                }
                setIsSaving(false);
            })
            .catch((error) => {
                setIsSaving(false);
            });
    };

    const complete = () => {
        // confirm user has completed guide
        axios
            .put(`/circles/${user.id}`, {
                circlePrivateData: {
                    completed_guide: true,
                },
            })
            .then((x) => {})
            .catch((error) => {});
        next();
    };

    const getActiveStepComponent = () => {
        switch (activeStep.id) {
            case allSteps.tnc.id:
                return (
                    <Box>
                        <VStack align="start">
                            <Text className="screenHeader" alignSelf="center">
                                {i18n.t(`Terms  and conditions`)}
                            </Text>
                            <Box
                                width="100%"
                                height="300px"
                                borderRadius="5px"
                                border="1px solid"
                                borderColor="var(--chakra-colors-gray-200)"
                                backgroundColor="#f7f7f7"
                            >
                                <Scrollbars>
                                    <PrivacyPolicy omitHeader={true} />
                                </Scrollbars>
                            </Box>
                            <Checkbox isChecked={agreedToTnc} onChange={(e) => setAgreedToTnc(e.target.checked)}>
                                I agree to the Terms and Conditions and Privacy Policy
                            </Checkbox>
                            <Checkbox isChecked={agreedToEmailUpdates} onChange={(e) => setAgreedToEmailUpdates(e.target.checked)}>
                                I agree to be sent email updates from Circles (optional)
                            </Checkbox>
                        </VStack>
                        <Flex flexDirection="column" flexGrow="1" align="center" marginTop="10px">
                            <Button
                                marginTop="10px"
                                width="150px"
                                colorScheme="blue"
                                borderRadius="25px"
                                lineHeight="0"
                                backgroundColor="#389bf8"
                                color="white"
                                isDisabled={!agreedToTnc || isSaving}
                                onClick={onAgreeToTncClick}
                                position="relative"
                            >
                                {isSaving ? <Spinner /> : <Text>{i18n.t(`Confirm`)}</Text>}
                            </Button>
                        </Flex>
                    </Box>
                );

            case allSteps.welcome.id:
                return (
                    <Box>
                        <Text className="screenHeader" alignSelf="center" textAlign="center">
                            {i18n.t(`Welcome`)}
                        </Text>
                        <Text>Welcome to Circles, please take a few minutes to fill out your change maker profile. </Text>
                        <Flex flexDirection="column" flexGrow="1" align="center" marginTop="10px">
                            <Button
                                width="150px"
                                colorScheme="blue"
                                borderRadius="25px"
                                lineHeight="0"
                                backgroundColor="#389bf8"
                                color="white"
                                isDisabled={isSaving}
                                onClick={next}
                                position="relative"
                            >
                                {isSaving ? <Spinner /> : <Text>{i18n.t(`Continue`)}</Text>}
                            </Button>
                        </Flex>
                    </Box>
                );

            case allSteps.about.id:
                return (
                    <Box>
                        <VStack align="start">
                            <CircleContentForm
                                isUpdateForm={true}
                                language={user.language}
                                circleId={user.id}
                                name={user.name}
                                description={user.description}
                                content={user.content}
                                type="user"
                                isGuideForm={true}
                                onNext={next}
                            />
                        </VStack>
                    </Box>
                );

            case allSteps.images.id:
                return (
                    <Box>
                        <VStack align="start">
                            <CircleImagesForm
                                isUpdateForm={true}
                                picture={user.picture}
                                cover={user.cover}
                                circleId={user.id}
                                name={user.name}
                                description={user.description}
                                type="user"
                                isGuideForm={true}
                                onNext={next}
                            />
                        </VStack>
                    </Box>
                );

            case allSteps.tags.id:
                return (
                    <Box>
                        <VStack align="start">
                            <CircleTagsForm isUpdateForm={true} circle={user} isGuideForm={true} onNext={next} />
                        </VStack>
                    </Box>
                );

            case allSteps.questions.id:
                return (
                    <Box>
                        <VStack align="start">
                            <CircleQuestionsForm isUpdateForm={true} circle={user} isGuideForm={true} onNext={next} />
                        </VStack>
                    </Box>
                );

            case allSteps.complete.id:
                return (
                    <Box>
                        <Text className="screenHeader" alignSelf="center" textAlign="center">
                            {i18n.t(`Congratulations`)}
                        </Text>
                        <Text>Thank you for completing your change maker profile. You can change your settings at any time in your user settings.</Text>
                        <Flex flexDirection="column" flexGrow="1" align="center" marginTop="10px">
                            <Button
                                width="150px"
                                colorScheme="blue"
                                borderRadius="25px"
                                lineHeight="0"
                                backgroundColor="#389bf8"
                                color="white"
                                isDisabled={isSaving}
                                onClick={complete}
                                position="relative"
                            >
                                {isSaving ? <Spinner /> : <Text>{i18n.t(`Let's get started`)}</Text>}
                            </Button>
                        </Flex>
                    </Box>
                );
            default:
                break;
        }
    };

    return (
        <ModalContent borderRadius="25px">
            {activeStep.id !== "tnc" && <ModalCloseButton />}
            <ModalBody>
                <Box marginTop="10px">{getActiveStepComponent()}</Box>
                <Flex flexDirection="column" flexGrow="1" align="center" marginBottom="20px" marginTop="20px">
                    <HStack align="center">
                        {steps.map((x, i) => (
                            <Box
                                key={x.id}
                                width="10px"
                                height="10px"
                                borderRadius="50%"
                                backgroundColor={i <= steps.indexOf(activeStep) ? "#5062ff" : "#d3d3d3"}
                            ></Box>
                        ))}
                    </HStack>
                </Flex>
            </ModalBody>
        </ModalContent>
    );
};

//#endregion

const App = () => {
    //#region fields
    const [userPublic, setUserPublic] = useState(null);
    const [userData, setUserData] = useState(null);
    const [userConnections, setUserConnections] = useState([]);
    const [connectionsToUser, setConnectionsToUser] = useState([]);
    const user = useMemo(() => {
        if (userPublic) {
            // merge user connections of the same type
            let connections = clusterConnections(userConnections);
            let clusteredConnectionsToUser = clusterConnections(connectionsToUser, true);
            return {
                ...userData,
                ...userPublic,
                connections: connections ?? [],
                connectionsToUser: clusteredConnectionsToUser ?? [],
                public: userPublic,
                data: userData,
            };
        } else {
            return null;
        }
    }, [userPublic, userData, userConnections, connectionsToUser]);

    const [filterConnected, setFilterConnected] = useState(false);
    const [isSignedIn, setIsSignedIn] = useState(false);
    const [isSigningIn, setIsSigningIn] = useState(true);
    const [hasSignedOut, setHasSignedOut] = useState(false);
    const [gsiScriptLoaded, setGsiScriptLoaded] = useState(false);
    const [isMobile, setIsMobile] = useState(detectIsMobile);
    const [displayMode, setDisplayMode] = useState(isMobile ? "list" : "map");
    const [uid, setUid] = useState(null);
    const [circle, setCircle] = useState(null);
    const [circles, setCircles] = useState(null);
    const [userLocation, setUserLocation] = useState({ latitude: undefined, longitude: undefined });
    const mapRef = useRef(null);
    const toast = useToast();
    const [locationPickerActive, setLocationPickerActive] = useState(false);
    const [locationPickerPosition, setLocationPickerPosition] = useState();
    const { isOpen: mustLogInIsOpen, onOpen: mustLogInOnOpen, onClose: mustLogInOnClose } = useDisclosure();
    const mustLogInInitialRef = useRef();
    const addItemInitialRef = useRef();
    const location = useLocation();
    const [satelliteMode, setSatelliteMode] = useState(true);
    const [searchParams, setSearchParams] = useSearchParams();
    const embed = searchParams.get("embed") === "true";
    const mapOnly = searchParams.get("mapOnly") === "true";
    const hideCard = searchParams.get("hideCard") === "true";
    const selectedCircleId = parseCircleId(location.pathname);
    const [isEmbedLoading, setIsEmbedLoading] = useState(embed);

    const connectInitialRef = useRef(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const { isOpen: connectIsOpen, onOpen: connectOnOpen, onClose: connectOnClose } = useDisclosure();
    const [connectSource, setConnectSource] = useState();
    const [connectTarget, setConnectTarget] = useState();
    const [connectOption, setConnectOption] = useState("follow");
    const { isOpen: newProfileIsOpen, onOpen: newProfileOnOpen, onClose: newProfileOnClose } = useDisclosure();

    //#endregion

    //#region methods

    const onConnect = (source, target, option) => {
        if (!isSignedIn) {
            mustLogInOnOpen();
            return;
        }

        // verify source is valid
        if (!source || !target || !user) return;
        if (source.id !== user.id) return;

        setConnectSource(source);
        setConnectTarget(target);
        setConnectOption(option);

        // show popup to connect
        connectOnOpen();
    };

    const onSignedInWithGoogle = async (response) => {
        try {
            // authenticate user with google token
            let credential = GoogleAuthProvider.credential(response.credential);
            await signInWithCredential(auth, credential);
        } catch (error) {
            console.error("sign in with google failed", error);
            return;
        }
    };

    // initializes google sign in
    const initializeGSI = () => {
        if (!window.google || gsiScriptLoaded) {
            return;
        }

        google.accounts.id.initialize({
            client_id: config.googleId,
            cancel_on_tap_outside: false,
            callback: onSignedInWithGoogle,
            auto_select: true,
            context: "signin",
        });
        google.accounts.id.prompt((notification) => {
            if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
                // try next provider
                setIsSigningIn(false);
            } else if (notification.isDismissedMoment()) {
                // google successfully retrieves credentials or want to skip the retrieval flow
                //console.log(notification.getDismissedReason())
                //setIsSigningIn(true);
            } else {
                //setIsSigningIn(true);
            }
        });

        setGsiScriptLoaded(true);
    };

    // detects if desktop resizes to switch to mobile
    const onWindowResize = () => {
        setIsMobile(window.innerWidth <= 768);
    };

    const onSignedOut = () => {
        if (uid !== null) {
            setUid((previousUid) => null);
        }
        setUserPublic((previousUser) => null);
        setUserData((previousUser) => null);
        setIsSignedIn(false);
        setIsSigningIn(false);
    };

    const onSignOut = () => {
        auth.signOut();
        setHasSignedOut(true);
        setIsSignedIn(false);
        setUid(null);
        setUserPublic(null);
        setUserData(null);
    };

    const onMapClick = (e) => {
        if (locationPickerActive) {
            // update position of picked location
            setLocationPickerPosition([e.lngLat.lng, e.lngLat.lat]);
        }
    };

    const getUserLocationSuccess = (location) => {
        // only update if location has changed more than 100 meters
        let newUserLocation = { latitude: location.coords.latitude, longitude: location.coords.longitude };
        if (userLocation.latitude && userLocation.longitude) {
            var preciseDistance = getPreciseDistance(userLocation, newUserLocation);
            log(
                `getUserLocationSuccess (diff: ${preciseDistance}, lat: ${location.coords.latitude}, lon: ${location.coords.longitude}, acc: ${location.coords.accuracy})`,
                0
            );
            // don't update if distance hasn't changed more than 50m
            if (preciseDistance < 100) return;
        }

        log(`getUserLocationSuccess (lat: ${location.coords.latitude}, lon: ${location.coords.longitude}, acc: ${location.coords.accuracy})`, 0);
        setUserLocation({ latitude: location.coords.latitude, longitude: location.coords.longitude });
    };

    const getUserLocationError = (error) => {
        log(`getUserLocationError: ${error.message}`, 0);
        // try again
        navigator.geolocation.getCurrentPosition(getUserLocationSuccess, getUserLocationError, {
            enableHighAccuracy: false,
            maximumAge: Infinity,
        });
    };

    const focusItem = (circle) => {
        mapRef.current.focusItem(circle);
    };

    //#endregion

    //#region useEffects
    // initialize firebase sign in
    useEffect(() => {
        log("useEffect 6", 0);
        const unsubscribeOnAuthStateChanged = onAuthStateChanged(auth, async (inUser) => {
            // event called when user is authenticated or when user is no longer authenticated
            if (inUser) {
                log("user authenticated in firebase", 0);

                Sentry.addBreadcrumb({
                    category: "auth",
                    message: "User authenticated in firebase",
                    level: Sentry.Severity.Info,
                });

                // set user data
                let uid = inUser.uid;
                let idToken = await inUser.getIdToken();
                axios.defaults.headers.common["Authorization"] = `Bearer ${idToken}`;

                log("setting uid " + uid, 0);
                setUid(uid);
            } else {
                // happens if the user has lost connection or isn't signed in yet
                log("user not authenticated in firebase", 0);

                Sentry.addBreadcrumb({
                    category: "auth",
                    message: "User not authenticated in firebase",
                    level: Sentry.Severity.Info,
                });

                log("setting uid " + null, 0);
                setUid(null);
                setIsSigningIn(false);
            }
        });

        const unsubscribeOnIdTokenChanged = onIdTokenChanged(auth, async (inUser) => {
            if (inUser) {
                // token is refreshed
                let idToken = await inUser.getIdToken();
                axios.defaults.headers.common["Authorization"] = `Bearer ${idToken}`;
            }
        });

        if (!detectIsMobile) {
            window.addEventListener("resize", onWindowResize);
        }

        return () => {
            // @ts-ignore
            window.google?.accounts.id.cancel();
            document.getElementById("google-client-script")?.remove();
            if (!detectIsMobile) {
                window.removeEventListener("resize", onWindowResize);
            }
            if (unsubscribeOnAuthStateChanged) {
                unsubscribeOnAuthStateChanged();
            }
            if (unsubscribeOnIdTokenChanged) {
                unsubscribeOnIdTokenChanged();
            }
        };
    }, []);

    useEffect(() => {
        log("useEffect 7", 0);
        let watchPositionId = null;
        if (!isSigningIn) {
            // request permission to get geolocation
            if (!embed && navigator.geolocation) {
                if (navigator.permissions && navigator.permissions.query) {
                    navigator.permissions.query({ name: "geolocation" }).then(function (result) {
                        log(`Query geolocation result: ${result.state}`, 0);
                        if (result.state === "granted") {
                            // do a fast call and a more high precision later
                            navigator.geolocation.getCurrentPosition(getUserLocationSuccess, getUserLocationError, {
                                enableHighAccuracy: false,
                                timeout: 2000,
                                maximumAge: Infinity,
                            });

                            watchPositionId = navigator.geolocation.watchPosition(getUserLocationSuccess);
                        } else if (result.state === "prompt") {
                            navigator.geolocation.getCurrentPosition(getUserLocationSuccess, getUserLocationError, {
                                enableHighAccuracy: true,
                                timeout: 60000,
                                maximumAge: 0,
                            });

                            watchPositionId = navigator.geolocation.watchPosition(getUserLocationSuccess);
                            //console.log(result.state);
                        } else if (result.state === "denied") {
                            // TODO show instructions to enable location
                        }
                        result.onchange = function () {
                            log(`Query geolocation change: ${result.state}`, 0);
                        };
                    });
                } else {
                    // iOS safari
                    // do a fast call and a more high precision later
                    navigator.geolocation.getCurrentPosition(getUserLocationSuccess, getUserLocationError, {
                        enableHighAccuracy: false,
                        timeout: 2000,
                        maximumAge: Infinity,
                    });

                    watchPositionId = navigator.geolocation.watchPosition(getUserLocationSuccess);
                }
            } else {
                log("geo location not available", 0);
            }
        }

        return () => {
            if (watchPositionId) {
                navigator.geolocation.clearWatch(watchPositionId);
            }
        };
    }, [isSigningIn, embed]);

    // initialize sign in
    useEffect(() => {
        log("useEffect 8", 0);
        let unsubscribeGetUserConnections = null;
        let unsubscribeGetUserData = null;
        let unsubscribeGetUser = null;
        let firstGetUser = true;
        let firstGetUserData = true;
        let firstGetUserConnections = true;

        if (uid) {
            axios
                .get(`/signin`)
                .then((getUserResult) => {
                    let userData = getUserResult.data;
                    if (userData.error) {
                        if (uid !== null) {
                            setUid((previousUid) => null);
                        }
                        setUserPublic((previousUser) => null);
                        setUserData((previousUser) => null);
                        setIsSignedIn(false);
                        setIsSigningIn(false);
                        toastError(toast, i18n.t("error1"));
                        Sentry.captureException(userData.error);
                        return;
                    }

                    setUserPublic((previousUser) => ({ ...userData.public, id: uid }));
                    setUserData((previousUser) => userData.data);
                    setUserConnections((previousUser) => userData.connections);
                    setConnectionsToUser((previousUser) => userData.connectionsToUser);

                    // subscribe to user public data
                    unsubscribeGetUser = onSnapshot(doc(db, "circles", uid), (doc) => {
                        var updatedUser = doc.data();

                        // ignore setting user data first time as we've already done so
                        if (firstGetUser) {
                            firstGetUser = false;
                            return;
                        }

                        //console.log("getting updated user data: ", JSON.stringify(updatedUserPublic, null, 2));
                        setUserPublic((currentUser) => ({
                            ...updatedUser,
                            id: doc.id,
                        }));
                    });

                    // subscribe to user data
                    var q = query(collection(db, "circle_data"), where("circle_id", "==", uid));
                    unsubscribeGetUserData = onSnapshot(q, (snap) => {
                        const updatedUserData = snap.docs.map((doc) => doc.data())[0];

                        // ignore setting user detail data first time as we've already done so
                        if (firstGetUserData) {
                            firstGetUserData = false;
                            return;
                        }

                        //console.log("getting updated user details: ", JSON.stringify(updatedUserDetails, null, 2));
                        if (snap.docs[0] != null) {
                            setUserData((currentUser) => updatedUserData);
                        }
                    });

                    log("subscribing to user connections", 0);

                    // subscribe to user connections
                    var q2 = query(collection(db, "connections"), where("circle_ids", "array-contains", uid));
                    unsubscribeGetUserConnections = onSnapshot(q2, (snap) => {
                        // ignore setting user connection data first time as we've already done so
                        if (firstGetUserConnections) {
                            firstGetUserConnections = false;
                            return;
                        }

                        const connections = snap.docs?.map((doc) => doc.data()) ?? [];
                        const updatedUserConnections = connections.filter((x) => x.source.id === uid);
                        const updatedConnectionsToUser = connections.filter((x) => x.target.id === uid);

                        //console.log("getting updated user details: ", JSON.stringify(updatedUserDetails, null, 2));
                        if (updatedUserConnections) {
                            log("updating user connections", 0);
                            setUserConnections((currentUser) => updatedUserConnections);
                        }
                        if (updatedConnectionsToUser) {
                            setConnectionsToUser((currentUser) => updatedConnectionsToUser);
                        }
                    });

                    setIsSignedIn(true);
                    setIsSigningIn(false);
                    setHasSignedOut(false);

                    let isProd = config.environment === "prod";
                    let alwaysShowGuide = false; //!isProd;

                    // show new profile guide
                    if (!userData?.data?.agreed_to_tnc || !userData?.data?.completed_guide || alwaysShowGuide) {
                        newProfileOnOpen();
                    }
                })
                .catch((error) => {
                    toastError(toast, i18n.t("error1"));
                    if (uid !== null) {
                        setUid((previousUid) => null);
                    }
                    setUserPublic((previousUser) => null);
                    setUserData((previousUser) => null);
                    setIsSignedIn(false);
                    setIsSigningIn(false);
                    Sentry.captureException(error);
                });
        } else {
            //onSignedOut(); // causes loop
        }

        return () => {
            if (unsubscribeGetUser) {
                unsubscribeGetUser();
            }
            if (unsubscribeGetUserData) {
                unsubscribeGetUserData();
            }
            if (unsubscribeGetUserConnections) {
                unsubscribeGetUserConnections();
            }
        };
    }, [uid, toast, newProfileOnOpen]);

    // initialize Sentry crash reporting
    useEffect(() => {
        log("useEffect 9", 0);
        Sentry.setUser(user?.id ? { id: user.id, username: user.name, email: user.email } : null);
    }, [user?.id, user?.name, user?.email]);

    useEffect(() => {
        log("useEffect 11", 0);
        Sentry.addBreadcrumb({
            category: "navigation",
            message: `Switching to page ${location.pathname}`,
            level: Sentry.Severity.Info,
        });
        // CONNECT123 we can track circle history here
    }, [location]);

    // initialize google one tap
    useEffect(() => {
        // TODO only do this if regular sign-in failed
        log("useEffect 5", 0);
        if (isSignedIn || isSigningIn || hasSignedOut || embed) return;

        const el = document.createElement("script");
        el.setAttribute("src", "https://accounts.google.com/gsi/client");
        el.async = true;
        el.onload = () => initializeGSI();
        el.id = "google-client-script";
        document.querySelector("body").appendChild(el);

        return () => {
            window.google?.accounts.id.cancel();
            document.getElementById("google-client-script")?.remove();
        };
    }, [isSigningIn, isSignedIn, hasSignedOut, embed]);

    const [contentWidth, setContentWidth] = useState(isMobile ? "100%" : defaultContentWidth);

    // useEffect(() => {
    //     console.log("circle=" + JSON.stringify(circle, null, 2));
    // }, [circle]);

    //#endregion

    return (
        <UserContext.Provider value={user}>
            <IsMobileContext.Provider value={isMobile}>
                <Flex
                    width="100vw"
                    minWidth="100vw"
                    maxWidth="100vw"
                    height="100%"
                    minHeight="100%"
                    maxHeight="100%"
                    flexDirection="row"
                    overflow="hidden"
                    background={embed ? "transparent" : "white"}
                >
                    {/* Blue bar (pinned users and circles) */}
                    {!isMobile && <BlueBar selectedCircleId={selectedCircleId} isSigningIn={isSigningIn} circle={circle} setCircle={setCircle} />}

                    {!isMobile && !mapOnly && <LeftNavigator circle={circle} setCircle={setCircle} isSigningIn={isSigningIn} />}

                    {/* Content panel */}
                    <Flex flexDirection="column" width={contentWidth} maxWidth={contentWidth} minWidth={contentWidth}>
                        {!mapOnly && isMobile && (
                            <TopMenu
                                circle={circle}
                                setCircle={setCircle}
                                onSignOutClick={onSignOut}
                                isSigningIn={isSigningIn}
                                isSignedIn={isSignedIn}
                                gsiScriptLoaded={gsiScriptLoaded}
                                satelliteMode={satelliteMode}
                                displayMode={displayMode}
                            />
                        )}
                        <Scrollbars autoHide>
                            <Routes>
                                <Route
                                    path="/circle/:circleId/*"
                                    element={
                                        <Circle
                                            circle={circle}
                                            setCircle={setCircle}
                                            circles={circles}
                                            setCircles={setCircles}
                                            displayMode={displayMode}
                                            setDisplayMode={setDisplayMode}
                                            isSignedIn={isSignedIn}
                                            isSigningIn={isSigningIn}
                                            mustLogInOnOpen={mustLogInOnOpen}
                                            userLocation={userLocation}
                                            locationPickerPosition={locationPickerPosition}
                                            setLocationPickerActive={setLocationPickerActive}
                                            setLocationPickerPosition={setLocationPickerPosition}
                                            focusItem={focusItem}
                                            filterConnected={filterConnected}
                                            setFilterConnected={setFilterConnected}
                                            setContentWidth={setContentWidth}
                                            onConnect={onConnect}
                                            isConnecting={isConnecting}
                                        />
                                    }
                                />
                                <Route path="/appAdmin" element={<AppAdmin />} />
                                <Route path="/graph" element={<></>} />
                                <Route path="*" element={<Navigate to="/circle/earth" replace />} />
                            </Routes>
                        </Scrollbars>
                        {isMobile && !mapOnly && <BottomNavigator circle={circle} />}
                    </Flex>

                    {/* Map panel */}
                    {displayMode === "map" && (
                        <Box id="mapRegion" width="100%" height="100%" minHeight="100%" position={isMobile ? "absolute" : "relative"}>
                            {!mapOnly && !isMobile && (
                                <TopMenu
                                    circle={circle}
                                    setCircle={setCircle}
                                    onSignOutClick={onSignOut}
                                    isSigningIn={isSigningIn}
                                    isSignedIn={isSignedIn}
                                    gsiScriptLoaded={gsiScriptLoaded}
                                    satelliteMode={satelliteMode}
                                />
                            )}

                            {!isEmbedLoading && (
                                <ThreeboxMap ref={mapRef} onMapClick={onMapClick} satelliteMode={satelliteMode}>
                                    {circle && circles?.length > 0 && <CircleMapEdges circle={circle} circles={circles} />}
                                    {circle && <CircleMarker circle={circle} />}
                                    {circles?.length > 0 && <CirclesMapMarkers circles={circles} />}
                                    {locationPickerActive && locationPickerPosition && <LocationPickerMarker position={locationPickerPosition} />}
                                </ThreeboxMap>
                            )}
                        </Box>
                    )}

                    {/* Graph panel */}
                    {displayMode === "graph" && (
                        <Box id="graphRegion" width="100%" height="100%" minHeight="100%" position={isMobile ? "absolute" : "relative"}>
                            <Graph circle={circle} />
                        </Box>
                    )}

                    {/* Floating action buttons */}
                    <FloatingActionButtons
                        displayMode={displayMode}
                        setDisplayMode={setDisplayMode}
                        setSatelliteMode={setSatelliteMode}
                        satelliteMode={satelliteMode}
                        mapOnly={mapOnly}
                    />

                    {/* Circle connections */}
                    <Modal initialFocusRef={connectInitialRef} isOpen={connectIsOpen} onClose={connectOnClose} size="xl" isLazy>
                        <ModalOverlay />
                        <ModalContent borderRadius="25px">
                            <ModalHeader>
                                <Flex>
                                    <Box flexShrink="0" marginRight="5px">
                                        <HStack spacing="10px">
                                            <CirclePicture circle={connectSource} size={30} />
                                            <RiLinksLine size={18} />
                                            <CirclePicture circle={connectTarget} size={30} />
                                        </HStack>
                                    </Box>
                                    <Text marginLeft="10px">
                                        {i18n.t("Connections to")} {connectTarget?.name}
                                    </Text>
                                </Flex>
                            </ModalHeader>
                            <ModalCloseButton />
                            <ModalBody marginBottom="20px">
                                <CircleConnections
                                    source={connectSource}
                                    target={connectTarget}
                                    option={connectOption}
                                    isConnecting={isConnecting}
                                    setIsConnecting={setIsConnecting}
                                    onClose={connectOnClose}
                                />
                            </ModalBody>
                        </ModalContent>
                    </Modal>

                    {/* Change maker profile guide */}
                    <Modal isOpen={newProfileIsOpen} onClose={newProfileOnClose} size="xl" isLazy closeOnOverlayClick={false}>
                        <ModalOverlay />
                        <NewUserGuide onClose={newProfileOnClose} />
                    </Modal>

                    {/* Modal popup - Must be logged in */}
                    <Modal initialFocusRef={mustLogInInitialRef} isOpen={mustLogInIsOpen} onClose={mustLogInOnClose} size="lg">
                        <ModalOverlay />
                        <ModalContent borderRadius="25px">
                            <ModalHeader>{i18n.t("You need to be logged in")}</ModalHeader>
                            <ModalCloseButton />
                            <ModalBody>
                                <Text fontSize="18px">{i18n.t("You need to be logged in to do this")}</Text>
                            </ModalBody>

                            <ModalFooter>
                                <Button ref={mustLogInInitialRef} colorScheme="blue" mr={3} borderRadius="25px" onClick={mustLogInOnClose}>
                                    {i18n.t("Ok")}
                                </Button>
                            </ModalFooter>
                        </ModalContent>
                    </Modal>
                </Flex>
            </IsMobileContext.Provider>
        </UserContext.Provider>
    );
};

export default App;
