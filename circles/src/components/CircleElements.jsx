//#region imports
import React, { forwardRef, useState, useEffect, useRef, useMemo, Suspense } from "react";
import {
    CircularProgress,
    CircularProgressLabel,
    Flex,
    Box,
    VStack,
    Text,
    Image,
    Icon,
    HStack,
    Popover,
    Link,
    Textarea,
    PopoverContent,
    PopoverTrigger,
    PopoverArrow,
    Button,
    Portal,
    CloseButton,
    useToast,
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    Fade,
    useDisclosure,
    useOutsideClick,
    Tooltip,
    Card,
    CardBody,
} from "@chakra-ui/react";
import { useNavigateNoUpdates, useLocationNoUpdates } from "@/components/RouterUtils";
import { IoAdd } from "react-icons/io5";
import i18n from "@/i18n/Localization";
import {
    getImageKitUrl,
    isConnectedOrPending,
    isConnected,
    hasUpdates,
    singleLineEllipsisStyle,
    twoLineEllipsisStyle,
    getCircleTypes,
    toastInfo,
    log,
    getMetaImage,
    isActiveInVideoConference,
    getDistanceString,
    getLatlng,
    isCircleActive,
    isWithinActiveThreshold,
    fromFsDate,
    isAdmin,
    getRelationSet,
} from "@/components/Helpers";
import { Scrollbars } from "react-custom-scrollbars-2";
import { routes, openCircle, focusCircle, openAboutCircle } from "@/components/Navigation";
import { CirclePreview } from "@/components/CirclePreview";
import { RiLinksLine, RiShareLine, RiLiveFill } from "react-icons/ri";
import { FacebookShareButton, TwitterShareButton, FacebookIcon, TwitterIcon } from "react-share";
import { QRCodeCanvas } from "qrcode.react";
import { GrGallery } from "react-icons/gr";
import { FaMapMarkedAlt, FaVideo } from "react-icons/fa";
import { useAtom } from "jotai";
import {
    isMobileAtom,
    userAtom,
    userDataAtom,
    displayModeAtom,
    circleAtom,
    circlesAtom,
    circleConnectionsAtom,
    connectPopupAtom,
    isConnectingAtom,
    toggleAboutAtom,
    focusOnMapItemAtom,
    userLocationAtom,
    showHistoricCirclesAtom,
    toggleSettingsAtom,
    previewCircleAtom,
    toggleWidgetEventAtom,
} from "@/components/Atoms";
import { displayModes, defaultCoverHeight } from "@/components/Constants";
import axios from "axios";
import { HiOutlineBellSlash, HiOutlineBellAlert, HiCog8Tooth } from "react-icons/hi2";
import { AiFillStar, AiOutlineStar } from "react-icons/ai";
import { IoIosLink } from "react-icons/io";
import { ImQrcode } from "react-icons/im";
import { TbChartCircles } from "react-icons/tb";
import { MdOutlineClose, MdHistory } from "react-icons/md";
import { RiMapPinFill } from "react-icons/ri";
import { BsIncognito, BsPlus } from "react-icons/bs";
import { TbMessage } from "react-icons/tb";
import { getPreciseDistance } from "geolib";
import { BiInfoCircle } from "react-icons/bi";
import { IoInformationCircle } from "react-icons/io5";
import ReactMarkdown from "react-markdown";
import gfm from "remark-gfm";
import ResizeTextarea from "react-textarea-autosize";
//#endregion

export const buttonHighlight = "#bdbdbddd";

export const CardIf = ({ noCard, children, noBody, ...props }) => {
    return noCard ? (
        children
    ) : (
        <Card marginLeft="5px" marginRight="5px" {...props}>
            {noBody ? children : <CardBody>{children}</CardBody>}
        </Card>
    );
};

export const CircleProfilePicture = ({ circle, size, ...props }) => {
    const borderWidth = 3;
    const sizePx = `${size}px`;
    const sizeWithoutBorder = size - borderWidth * 2 - (circle?.id === "global" ? 5 : 0);

    return (
        <Flex
            backgroundColor="white"
            borderRadius="50%"
            width={sizePx}
            height={sizePx}
            flexShrink="0"
            flexGrow="0"
            alignItems="center"
            justifyContent="center"
            position="absolute"
            top={`-${size / 3}px`}
            {...props}
            zIndex="200"
        >
            <CirclePicture
                circle={circle}
                size={sizeWithoutBorder}
                hasPopover={false}
                parentCircleSizeRatio={3.75}
                parentCircleOffset={3}
            />
        </Flex>
    );
};

export const ShareButtonMenu = ({ circle, children, referrer }) => {
    const location = useLocationNoUpdates();
    const [isMobile] = useAtom(isMobileAtom);
    const [absoluteLocation, setAbsoluteLocation] = useState();
    const [absoluteQrLocation, setAbsoluteQrLocation] = useState();

    const { isOpen: menuIsOpen, onOpen: menuOnOpen, onClose: menuOnClose } = useDisclosure();
    const menuBoxRef = useRef(null);

    useOutsideClick({
        ref: menuBoxRef,
        handler: () => menuOnClose(),
    });

    const toast = useToast();

    //const iconSize = isMobile ? 20 : 26;
    const iconSize = 20;
    const iconSizePx = iconSize + "px";

    const copyPageLink = () => {
        navigator.clipboard.writeText(absoluteLocation).then(
            function () {
                toastInfo(toast, i18n.t("Copied to clipboard"));
            },
            function (err) {}
        );
        menuOnClose();
    };

    const downloadQrCode = () => {
        // generate download with use canvas and stream
        const canvas = document.getElementById("qr-code");
        const pngUrl = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
        let downloadLink = document.createElement("a");
        downloadLink.href = pngUrl;
        downloadLink.download = `qr.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        menuOnClose();
    };

    useEffect(() => {
        log("ShareButtonMenu.useEffect 1", -1);
        const urlParams = new URLSearchParams(window.location.search);

        if (referrer) {
            urlParams.set("referrerId", referrer.id);
        }

        var hasParams = Array.from(urlParams).length > 0;
        var urlWithParams = hasParams
            ? window.location.href.split("?")[0] + "?" + urlParams.toString()
            : window.location.href;

        urlParams.set("qrCode", "true");
        var urlWithQrParams = window.location.href.split("?")[0] + "?" + urlParams.toString();
        setAbsoluteLocation((current) => urlWithParams);
        setAbsoluteQrLocation((current) => urlWithQrParams);
    }, [location, referrer]);

    const size = isMobile ? "20px" : "24px";

    return (
        <>
            <Flex
                position="relative"
                width={iconSize + 8 + "px"}
                height={iconSize + 8 + "px"}
                backgroundColor="#f4f4f4dd"
                _hover={{ backgroundColor: buttonHighlight }}
                borderRadius="50%"
                justifyContent="center"
                alignItems="center"
                onClick={menuOnOpen}
                cursor="pointer"
            >
                <Icon width={iconSizePx} height={iconSizePx} color={"#333"} as={RiShareLine} />
            </Flex>
            {menuIsOpen && (
                <Box
                    ref={menuBoxRef}
                    className="notificationsBoxParent"
                    zIndex="55"
                    position="absolute"
                    borderRadius="20px"
                    overflow="hidden"
                    top="43px"
                    right="-50px"
                    width="220px"
                    backgroundColor="white"
                    height="200px"
                >
                    <Fade in={menuIsOpen} height="100%" width="100%">
                        <Box className="notificationsBox" height="100%" width="100%">
                            <Flex flexDirection="column">
                                <Box height="50px" _hover={{ backgroundColor: "#e8f3fadd" }} padding="10px">
                                    <FacebookShareButton url={absoluteLocation} beforeOnClick={menuOnClose}>
                                        <HStack align="center">
                                            <FacebookIcon size={32} round />
                                            <Text>{i18n.t("Share on Facebook")}</Text>
                                        </HStack>
                                    </FacebookShareButton>
                                </Box>

                                <Box height="50px" _hover={{ backgroundColor: "#e8f3fadd" }} padding="10px">
                                    <TwitterShareButton url={absoluteLocation} beforeOnClick={menuOnClose}>
                                        <HStack align="center">
                                            <TwitterIcon size={32} round />
                                            <Text>{i18n.t("Share on Twitter")}</Text>
                                        </HStack>
                                    </TwitterShareButton>
                                </Box>

                                <Box
                                    height="50px"
                                    _hover={{ backgroundColor: "#e8f3fadd" }}
                                    padding="10px"
                                    onClick={copyPageLink}
                                    cursor="pointer"
                                >
                                    <HStack spacing="12px">
                                        <IoIosLink size={28} />
                                        <Text>{i18n.t("Copy link to page")}</Text>
                                    </HStack>
                                </Box>
                                <Box
                                    height="50px"
                                    _hover={{ backgroundColor: "#e8f3fadd" }}
                                    padding="10px"
                                    onClick={downloadQrCode}
                                    cursor="pointer"
                                >
                                    <HStack spacing="12px">
                                        <ImQrcode size={28} />
                                        <Text>{i18n.t("Download QR code")}</Text>
                                        <QRCodeCanvas
                                            id="qr-code"
                                            size={400}
                                            includeMargin={true}
                                            value={absoluteQrLocation}
                                            hidden
                                        />
                                    </HStack>
                                </Box>
                            </Flex>
                        </Box>
                    </Fade>
                </Box>
            )}
        </>
    );
};

export const FloatingAddButton = () => {
    const [circle] = useAtom(circleAtom);
    const [isMobile] = useAtom(isMobileAtom);
    const navigate = useNavigateNoUpdates();
    const size = isMobile ? "46px" : "54px";

    return (
        <VStack position="fixed" right="18px" bottom={isMobile ? "100px" : "100px"} zIndex="50">
            <Flex
                backgroundColor="#c242bbdd"
                _hover={{ backgroundColor: "#e94ce1dd" }}
                width={size}
                height={size}
                borderRadius="50%"
                cursor="pointer"
                alignItems="center"
                justifyContent="center"
                onClick={() => navigate(routes.circle(circle).new)}
            >
                <Icon width="28px" height="28px" color="white" as={IoAdd} />
            </Flex>
        </VStack>
    );
};

export const MessageButton = ({ circle, inPreview, ...props }) => {
    const navigate = useNavigateNoUpdates();
    const [user] = useAtom(userAtom);
    const [isMobile] = useAtom(isMobileAtom);
    const [, setToggleWidgetEvent] = useAtom(toggleWidgetEventAtom);
    const [, setPreviewCircle] = useAtom(previewCircleAtom);
    const iconSize = 20;
    const iconSizePx = iconSize + "px";
    const [, setFocusOnMapItem] = useAtom(focusOnMapItemAtom);

    const onOpenChat = () => {
        // init set circle
        axios.post(`/circles/${circle.id}/init_set`).catch((err) => {
            console.error(err);
        });

        let relationSet = getRelationSet(user, circle);
        openCircle(navigate, relationSet);
        // focusCircle(relationSet, setFocusOnMapItem);
        setPreviewCircle(null);
        setToggleWidgetEvent({ name: "chat", value: true });
        setToggleWidgetEvent({ name: "about", value: true });
    };

    if (!user) return;

    return (
        <Tooltip label="Send private messages" aria-label="A tooltip">
            <Flex
                position="relative"
                width={iconSize + 8 + "px"}
                height={iconSize + 8 + "px"}
                backgroundColor={"#f4f4f4dd"}
                _hover={{ backgroundColor: buttonHighlight }}
                borderRadius="50%"
                justifyContent="center"
                alignItems="center"
                cursor="pointer"
                onClick={onOpenChat}
                {...props}
            >
                <Icon width={iconSizePx} height={iconSizePx} color={"#333"} as={TbMessage} />
            </Flex>
        </Tooltip>
    );
};

export const LocationButton = ({ circle, inPreview, ...props }) => {
    const [, setFocusOnMapItem] = useAtom(focusOnMapItemAtom);
    const [userLocation] = useAtom(userLocationAtom);
    const [user] = useAtom(userAtom);
    const [, setToggleAbout] = useAtom(toggleAboutAtom);
    const iconSize = 20;
    const iconSizePx = iconSize + "px";

    const circleLocation = useMemo(() => {
        let activeLocation = circle?.activity?.location && isWithinActiveThreshold(circle?.activity?.last_activity);
        let loc = activeLocation ? circle?.activity?.location : circle?.base;
        if (!loc) return null;
        return getLatlng(loc);
    }, [circle?.activity?.location, circle?.activity?.last_activity, circle?.base]);

    const distance = useMemo(() => {
        if (circleLocation === null) return null;
        if (circle?.id === user?.id) return null;
        if (!userLocation?.latitude || !userLocation.longitude) return null;

        var preciseDistance = getPreciseDistance(userLocation, circleLocation);
        return preciseDistance;
    }, [circleLocation, userLocation, circle?.id, user?.id]);

    if (circleLocation === null) return;

    return (
        <Tooltip label="Location - click to go to circle location" aria-label="A tooltip">
            <Flex
                height={iconSize + 8 + "px"}
                width={distance ? "auto" : iconSize + 8 + "px"}
                borderRadius="20px"
                paddingLeft={distance ? "2px" : "0px"}
                paddingRight={distance ? "5px" : "0px"}
                //backgroundColor="#c242bb"
                backgroundColor={inPreview ? "#f4f4f4dd" : "none"}
                _hover={{ backgroundColor: buttonHighlight }}
                align="center"
                flexDirection="row"
                justifyContent="center"
                cursor="pointer"
                onClick={(event) => {
                    event.stopPropagation();
                    setFocusOnMapItem({ item: circle });
                    openAboutCircle(circle, setToggleAbout);
                }}
                {...props}
            >
                <Icon width={iconSizePx} height={iconSizePx} color="#333" as={RiMapPinFill} />
                {distance !== undefined && distance > 0 && (
                    <Text fontWeight="700" color="#333" fontSize="12px" marginLeft="2px">
                        {getDistanceString(distance)}
                    </Text>
                )}
            </Flex>
        </Tooltip>
    );
};

export const FavoriteButton = ({ circle, inPreview, ...props }) => {
    const [isMobile] = useAtom(isMobileAtom);
    const [user] = useAtom(userAtom);
    const [userData] = useAtom(userDataAtom);
    //const iconSize = isMobile ? 20 : 26;
    const iconSize = 20;
    const iconSizePx = iconSize + "px";
    const [favoriteSetting, setFavoriteSetting] = useState(false);

    useEffect(() => {
        if (!userData?.circle_settings) {
            setFavoriteSetting(false);
        } else {
            setFavoriteSetting(userData.circle_settings[circle.id]?.favorite);
        }
    }, [circle?.id, userData?.circle_settings]);

    const toggleFavorite = () => {
        if (!circle?.id) {
            return;
        }

        let favorite = favoriteSetting;
        if (favorite === true) {
            favorite = false;
        } else {
            favorite = true;
        }
        setFavoriteSetting(favorite);

        // update notification settings
        axios
            .post(`/circles/${user.id}/settings`, {
                circleId: circle.id,
                settings: { favorite: favorite },
            })
            .catch((err) => {
                console.error(err);
            });
    };

    if (!user?.id || (circle?.type !== "set" && !isConnected(userData, circle?.id, ["connected_mutually_to"]))) return;

    return (
        <Tooltip label="Favorite - add circle to favorites" aria-label="A tooltip">
            <Flex
                position="relative"
                width={iconSize + 8 + "px"}
                height={iconSize + 8 + "px"}
                backgroundColor={inPreview ? "#f4f4f4dd" : "none"}
                _hover={{ backgroundColor: buttonHighlight }}
                borderRadius="50%"
                justifyContent="center"
                alignItems="center"
                onClick={toggleFavorite}
                cursor="pointer"
                {...props}
            >
                <Icon
                    width={iconSizePx}
                    height={iconSizePx}
                    color={"#333"}
                    as={favoriteSetting === true ? AiFillStar : AiOutlineStar}
                />
            </Flex>
        </Tooltip>
    );
};

export const SettingsButton = ({ circle, ...props }) => {
    const iconSize = 20;
    const iconSizePx = iconSize + "px";
    const [, setToggleSettings] = useAtom(toggleSettingsAtom);
    const [userData] = useAtom(userDataAtom);

    const toggleSettings = () => {
        if (!circle?.id) {
            return;
        }
        setToggleSettings(true);
    };

    const showSettings = () => {
        return isAdmin(circle, userData);
    };

    if (!showSettings()) return;

    return (
        <Tooltip label="Settings - open circle settings" aria-label="A tooltip">
            <Flex
                position="relative"
                width={iconSize + 8 + "px"}
                height={iconSize + 8 + "px"}
                //backgroundColor={inPreview ? "#f4f4f4dd" : "none"}
                _hover={{ backgroundColor: buttonHighlight }}
                borderRadius="50%"
                justifyContent="center"
                alignItems="center"
                onClick={toggleSettings}
                cursor="pointer"
                {...props}
            >
                <Icon width={iconSizePx} height={iconSizePx} color={"white"} as={HiCog8Tooth} />
            </Flex>
        </Tooltip>
    );
};

export const AboutButton = ({ circle, ...props }) => {
    const iconSize = 20;
    const iconSizePx = iconSize + "px";
    const [previewCircle, setPreviewCircle] = useAtom(previewCircleAtom);
    const [, toggleWidgetEvent] = useAtom(toggleWidgetEventAtom);
    const [, toggleAbout] = useAtom(toggleAboutAtom);
    const [userData] = useAtom(userDataAtom);
    const [currentCircle] = useAtom(circleAtom);

    const doToggleAbout = () => {
        if (!circle?.id) {
            return;
        }
        if (currentCircle?.id === circle?.id) {
            if (previewCircle) {
                setPreviewCircle(null);
            } else {
                toggleWidgetEvent({ name: "about" });
            }
        } else {
            if (previewCircle?.id !== circle?.id) {
                setPreviewCircle(circle);
                toggleWidgetEvent({ name: "about", value: true, toggleAboutCircle: circle });
            } else {
                toggleWidgetEvent({ name: "about", toggleAboutCircle: circle });
            }
        }
    };

    return (
        <Tooltip label="About - open circle information" aria-label="A tooltip">
            <Flex
                position="relative"
                width={iconSize + 8 + "px"}
                height={iconSize + 8 + "px"}
                //backgroundColor={inPreview ? "#f4f4f4dd" : "none"}
                _hover={{ backgroundColor: buttonHighlight }}
                borderRadius="50%"
                justifyContent="center"
                alignItems="center"
                onClick={doToggleAbout}
                cursor="pointer"
                {...props}
            >
                <Icon width={iconSizePx} height={iconSizePx} color={"white"} as={IoInformationCircle} />
            </Flex>
        </Tooltip>
    );
};

export const NewSessionButton = ({ circle, onClick, ...props }) => {
    const iconSize = 20;
    const iconSizePx = iconSize + "px";
    const inHeader = true;
    const height = "24px";

    return (
        <Tooltip label="Create new chat session" aria-label="A tooltip">
            <Button
                colorScheme="blue"
                borderRadius="25px"
                lineHeight="0"
                padding="0px 5px 0px 8px"
                variant="ghost"
                backgroundColor="#ffffff"
                color="#333"
                border="1px solid #e7e7e7"
                height={height}
                onClick={onClick}
                position="relative"
                {...props}
            >
                <HStack spacing="4px">
                    <BsPlus size={inHeader ? "16px" : "12px"} />
                    <Text fontSize={inHeader ? "13px" : "11px"} fontWeight="700" paddingRight="6px">
                        New Session
                    </Text>
                </HStack>
            </Button>
        </Tooltip>
    );
};

export const AutoResizeTextarea = React.forwardRef((props, ref) => {
    return (
        <Textarea
            minH="unset"
            overflow="hidden"
            w="100%"
            resize="none"
            ref={ref}
            minRows={1}
            as={ResizeTextarea}
            {...props}
        />
    );
});

export const CircleLink = ({ node, href, mentions, children, fontSize = "15px", ...props }) => {
    const [, setToggleAbout] = useAtom(toggleAboutAtom);
    const [user] = useAtom(userAtom);

    const extractCircleId = (url) => {
        const regex = /.*codo\.earth\/circles\/([^\/?]+)/;
        const match = url.match(regex);
        return match ? match[1] : null;
    };

    const hrefStr = useMemo(() => {
        if (href === "javascript:void(0)") {
            // parse href from node
            let str = node?.properties?.href;
            // format str
            if (str.startsWith("%5B")) return str;
        } else {
            return href;
        }
    }, [href, node]);

    // check if link references a circle
    const circle = useMemo(() => {
        if (!hrefStr) return null;
        let circleId = extractCircleId(hrefStr);
        if (!circleId) return null;

        // find circle in circles
        let circle = mentions?.find((c) => c.id === circleId);
        return circle;
    }, [hrefStr, mentions]); // only need update if user.id changes hence warning

    const circleTitle = useMemo(() => {
        if (!circle) return null;
        if (!children) return null;

        let title = children.toString();
        if (title.includes(circle.name)) return null;
        return title + ": ";
    }, [circle, children]);

    if (circle) {
        return (
            <Popover trigger="hover" gutter="0" isLazy>
                <PopoverTrigger>
                    <Flex
                        cursor="pointer"
                        display="inline-flex"
                        align="center"
                        // verticalAlign="middle" works when picture was present
                        onClick={() => openAboutCircle(circle, setToggleAbout)}
                    >
                        {circleTitle && (
                            <Text fontSize={fontSize} marginRight="5px" fontWeight="700">
                                {circleTitle}
                            </Text>
                        )}
                        <Text fontSize={fontSize} fontWeight="700">
                            {circle.name}
                        </Text>
                    </Flex>
                </PopoverTrigger>

                <Portal>
                    <PopoverContent backgroundColor="transparent" borderColor="transparent" width="450px">
                        <Box zIndex="160">
                            <PopoverArrow />
                            {/* <Suspense fallback={<Box />}> */}
                            <CirclePreview
                                key={circle.id}
                                item={circle}
                                onClick={() => openAboutCircle(circle, setToggleAbout)}
                            />
                            {/* </Suspense> */}
                        </Box>
                    </PopoverContent>
                </Portal>
            </Popover>
        );
    } else {
        return (
            <Link href={hrefStr} fontSize={fontSize} {...props} color="blue" target="_blank">
                {children}
            </Link>
        );
    }
};

export const NotificationsBell = ({ circle, inPreview, ...props }) => {
    const [isMobile] = useAtom(isMobileAtom);
    const [user] = useAtom(userAtom);
    const [userData] = useAtom(userDataAtom);
    //const iconSize = isMobile ? 20 : 26;
    const iconSize = 20;
    const iconSizePx = iconSize + "px";

    const [notificationSetting, setNotificationSetting] = useState(null);

    useEffect(() => {
        if (!userData?.circle_settings) {
            setNotificationSetting(false);
        } else {
            setNotificationSetting(userData.circle_settings[circle.id]?.notifications);
        }
    }, [circle?.id, userData?.circle_settings]);

    const toggleNotifications = () => {
        if (!circle?.id) {
            return;
        }

        let settings = notificationSetting;
        if (settings === "off") {
            settings = "on";
        } else {
            settings = "off";
        }
        setNotificationSetting(settings);

        // update notification settings
        axios
            .post(`/circles/${user.id}/settings`, {
                circleId: circle.id,
                settings: { notifications: settings },
            })
            .catch((err) => {
                console.error(err);
            });
    };

    if (!user?.id || (circle?.type !== "set" && !isConnected(userData, circle?.id, ["connected_mutually_to"]))) return;

    return (
        <Tooltip label="Notification - turn notifications from this circle on/off" aria-label="A tooltip">
            <Flex
                position="relative"
                width={iconSize + 8 + "px"}
                height={iconSize + 8 + "px"}
                backgroundColor={inPreview ? "#f4f4f4dd" : "none"}
                _hover={{ backgroundColor: buttonHighlight }}
                borderRadius="50%"
                justifyContent="center"
                alignItems="center"
                onClick={toggleNotifications}
                cursor="pointer"
                {...props}
            >
                <Icon
                    width={iconSizePx}
                    height={iconSizePx}
                    color={"#333"}
                    as={notificationSetting === "off" ? HiOutlineBellSlash : HiOutlineBellAlert}
                />
            </Flex>
        </Tooltip>
    );
};

export const ModalPopup = ({ children, fullscreen, onClose, mapInteract = false, ...props }) => {
    const [isMobile] = useAtom(isMobileAtom);

    return fullscreen ? (
        <Box
            position="fixed"
            width="100vw"
            height={mapInteract ? "auto" : "100vh"}
            backgroundColor="white"
            zIndex="99"
            top={mapInteract ? defaultCoverHeight.mobile : "0"}
            overflow="auto"
            padding="10px"
        >
            {children}
        </Box>
    ) : (
        <>
            {!mapInteract && (
                <Box position="fixed" width="100vw" height="100vh" backgroundColor="#181818b0" zIndex="99" top="0" />
            )}
            <Flex
                position="fixed"
                width="100vw"
                height="100vh"
                zIndex="100"
                justifyContent="center"
                top={mapInteract ? "auto" : "0"}
                bottom={mapInteract ? "20px" : "auto"}
                pointerEvents={mapInteract ? "none" : "auto"}
            >
                <Scrollbars>
                    <Flex width="100%" justifyContent={"center"}>
                        <Box
                            position="relative"
                            backgroundColor="white"
                            borderRadius="25px"
                            maxWidth="570px"
                            minWidth="570px"
                            marginTop="60px"
                            paddingLeft="25px"
                            paddingRight="25px"
                            paddingTop="15px"
                            paddingBottom="15px"
                            boxShadow="2px 3px 5px #999"
                            pointerEvents="auto"
                            {...props}
                        >
                            {children}
                            <CloseButton position="absolute" top="10px" right="10px" onClick={onClose} />
                        </Box>
                    </Flex>
                </Scrollbars>
            </Flex>
        </>
    );
};

export const DatePickerInput = forwardRef(({ value, onClick }, ref) => (
    <Box border="1px solid #e2e8f0" height="40px" borderRadius="0.375rem" onClick={onClick} ref={ref} align="center">
        <Text textAlign="left" lineHeight="40px" marginLeft="16px">
            {new Date(value).toLocaleDateString()}
        </Text>
    </Box>
));

export const CirclePanel = ({ children, title }) => {
    const [isMobile] = useAtom(isMobileAtom);

    return (
        <Box align="left" marginTop="10px" backgroundColor="#ffffffaa" borderRadius="7px" padding="5px">
            <Text fontWeight="bold">{title}</Text>
            {children}
        </Box>
    );
};

export const CircleTagsPanel = () => {
    const [circle] = useAtom(circleAtom);
    if (!circle?.tags || circle?.tags?.length <= 0) return null;

    return (
        <CirclePanel title={i18n.t("Tags")}>
            <CircleTags circle={circle} showAll={true} wrap="wrap" />
        </CirclePanel>
    );
};

export const QuickLinks = ({ circle }) => {
    const location = useLocationNoUpdates();

    if (!circle?.social_media) return null;

    return (
        <Flex
            flexDirection="row"
            flexWrap="wrap"
            gap="6px"
            maxWidth="125px"
            marginTop="5px"
            height="25px"
            overflow="hidden"
        >
            {circle.social_media.facebook && (
                <Link href={circle.social_media.facebook} target="_blank">
                    <Image src={"/social_facebook20.png"} className="social-media-icon" />
                </Link>
            )}
            {circle.social_media.twitter && (
                <Link href={circle.social_media.twitter} target="_blank">
                    <Image src={"/social_twitter20.png"} className="social-media-icon" />
                </Link>
            )}
            {circle.social_media.instagram && (
                <Link href={circle.social_media.instagram} target="_blank">
                    <Image src={"/social_instagram20.png"} className="social-media-icon" />
                </Link>
            )}
            {circle.social_media.youtube && (
                <Link href={circle.social_media.youtube} target="_blank">
                    <Image src={"/social_youtube20.png"} className="social-media-icon" />
                </Link>
            )}
            {circle.social_media.tiktok && (
                <Link href={circle.social_media.tiktok} target="_blank">
                    <Image src={"/social_tiktok20.png"} className="social-media-icon" />
                </Link>
            )}
            {circle.social_media.linkedin && (
                <Link href={circle.social_media.linkedin} target="_blank">
                    <Image src={"/social_linkedin20.png"} className="social-media-icon" />
                </Link>
            )}
            {circle.social_media.medium && (
                <Link href={circle.social_media.medium} target="_blank">
                    <Image src={"/social_medium20.png"} className="social-media-icon" />
                </Link>
            )}
            {circle.social_media.link1 && (
                <Link href={circle.social_media.link1} target="_blank">
                    <Image src={"/social_link20.png"} className="social-media-icon" />
                </Link>
            )}
            {circle.social_media.link2 && (
                <Link href={circle.social_media.link2} target="_blank">
                    <Image src={"/social_link20.png"} className="social-media-icon" />
                </Link>
            )}
            {circle.social_media.link3 && (
                <Link href={circle.social_media.link3} target="_blank">
                    <Image src={"/social_link20.png"} className="social-media-icon" />
                </Link>
            )}
        </Flex>
    );
};

export const QuickLinksPanel = () => {
    const [circle] = useAtom(circleAtom);
    if (!circle?.social_media) return null;

    return (
        <CirclePanel title={i18n.t("Quick Links")}>
            <QuickLinks circle={circle} />
        </CirclePanel>
    );
};

export const CircleFundingPanel = () => {
    const [circle] = useAtom(circleAtom);
    if (!circle?.funding) return null;

    return (
        <CirclePanel title={i18n.t("Funding")}>
            {circle?.funding?.open_collective && (
                <Box marginBottom="10px">
                    <a href={`https://opencollective.com/${circle?.funding?.open_collective}/donate`} target="_blank">
                        <Image
                            src={`https://opencollective.com/${circle?.funding?.open_collective}/donate/button@2x.png?color=blue`}
                            width="300px"
                        />
                    </a>
                </Box>
            )}
        </CirclePanel>
    );
};

export const CircleMembersPanel = ({ circle }) => {
    const [circles] = useAtom(circlesAtom);
    const [circleConnections] = useAtom(circleConnectionsAtom);

    useEffect(() => {
        if (!circle?.id) return;

        // get connections and combine it with active circles, the connections we get once (probably in parent circle)
        // this should perhaps be done at a higher level

        // we need total number of members somehow

        // show 6 members and then show "and x more"
        // sort by last_active date

        // get user connections to circle
        // sort by last online
        // last online is not updated in connections
    }, [circle?.id]);

    if (!circle?.id) return null;

    let members = [];
    if (circle.id === "global") {
        members = circles.filter((x) => x.type === "user" && x.picture);
    } else {
        members = circles.filter((x) => x.type === "user" && x.picture);
        // const circleTypes = getCircleTypes(circle.type, "user");
        // members = circleConnections.filter((x) => x.circle_types === circleTypes && x.display_circle?.picture).map((x) => x.display_circle);
    }
    members.sort((a, b) => fromFsDate(b.activity.last_activity) - fromFsDate(a.activity.last_activity));
    if (members.length <= 0) return null;

    const size = 44;
    const sizePx = size + "px";
    const spacing = 6;
    const spacingPx = spacing + "px";

    return (
        <CirclePanel title={i18n.t(`Members [${circle?.type}]`)}>
            <Flex flexWrap="wrap">
                {members.map((member) => (
                    <Box
                        key={member.id}
                        width={sizePx}
                        height={sizePx}
                        marginRight={spacingPx}
                        marginBottom={spacingPx}
                    >
                        <CirclePicture
                            circle={member}
                            hasPopover={true}
                            size={size}
                            isActive={isCircleActive(member)}
                        />
                    </Box>
                ))}
            </Flex>
        </CirclePanel>
    );
};

export const MetaData = ({ data }) => {
    const [isMobile] = useAtom(isMobileAtom);

    const renderMetaData = (meta, i) => {
        switch (meta.type) {
            case "image":
                return (
                    <Box key={i} marginBottom="2px">
                        <Image src={meta.url} />
                    </Box>
                );
            default:
                return meta.title || meta.description ? (
                    <Box key={i} marginBottom="2px">
                        <Box fontSize="14px" borderLeft="3px solid #f15bee" paddingLeft="5px">
                            {meta.site_name &&
                                (!isMobile ? (
                                    <Link href={meta.url} target="_blank">
                                        <Text fontSize="12px" fontWeight="700" color="#872985">
                                            {meta.site_name}
                                        </Text>
                                    </Link>
                                ) : (
                                    <Text fontSize="12px" fontWeight="700" color="#872985">
                                        {meta.site_name}
                                    </Text>
                                ))}
                            <Text fontWeight="700">{meta.title}</Text>
                            <Text>{meta.description}</Text>
                            {meta.images?.[0] && (
                                <Link href={meta.url} target="_blank">
                                    <Image src={meta.images[0]} />
                                </Link>
                            )}
                        </Box>
                    </Box>
                ) : null;
        }
    };

    if (!data) return null;

    return data.map((meta, i) => renderMetaData(meta, i));
};

export const CircleRightPanel = ({ section }) => {
    const [isMobile] = useAtom(isMobileAtom);

    switch (section) {
        case "home":
            return (
                <Box
                    flex={isMobile ? "initial" : "1"}
                    order={isMobile ? "0" : "3"}
                    maxWidth={isMobile ? "none" : "270px"}
                    paddingTop={isMobile ? "0px" : "10px"}
                >
                    <QuickLinksPanel />
                    <CircleFundingPanel />
                    <CircleTagsPanel />
                    <CircleMembersPanel />
                </Box>
            );

        default:
        case "chat":
        case "circles":
            return isMobile ? null : (
                <Box
                    flex={isMobile ? "initial" : "1"}
                    order={isMobile ? "0" : "3"}
                    maxWidth={isMobile ? "none" : "270px"}
                    paddingTop={isMobile ? "0px" : "10px"}
                >
                    <QuickLinksPanel />
                    <CircleFundingPanel />
                    <CircleTagsPanel />
                    <CircleMembersPanel />
                </Box>
            );
    }
};

export const DisplayModeButtons = ({ ...props }) => {
    const [isMobile] = useAtom(isMobileAtom);
    const [displayMode, setDisplayMode] = useAtom(displayModeAtom);
    const iconCircleSize = isMobile ? "38px" : "38px";
    const iconSize = isMobile ? "22px" : "22px";
    const [user] = useAtom(userAtom);
    const [userData] = useAtom(userDataAtom);
    const [currentIncognitoMode, setCurrentIncognitoMode] = useState(null);
    const incognitoMode = useMemo(() => {
        if (currentIncognitoMode !== null) {
            return currentIncognitoMode;
        } else {
            return userData?.incognito;
        }
    }, [currentIncognitoMode, userData?.incognito]);
    const [showHistoricCircles, setShowHistoricCircles] = useAtom(showHistoricCirclesAtom);

    if (!user) return null;

    const toggleIncognitoMode = () => {
        let newIncognitoMode = !incognitoMode;
        // update user data
        axios
            .put(`/circles/${user.id}`, {
                circlePrivateData: {
                    incognito: !incognitoMode,
                },
            })
            .catch((err) => {
                console.error(err);
            });
        // clear current activity
        if (newIncognitoMode) {
            axios.delete(`/circles/${user.id}/activity`).catch((err) => {
                console.error(err);
            });
        }
        setCurrentIncognitoMode(newIncognitoMode);
    };

    const toggleShowHistoricCircles = () => {
        setShowHistoricCircles(!showHistoricCircles);
    };

    return (
        <Flex
            gap="5px"
            padding="5px"
            // right={isMobile ? (displayMode === displayModes.map ? "40px" : "10px") : "60px"}
            bottom={isMobile ? "0px" : "5px"}
            width="100%"
            align="center"
            justifyContent="center"
            {...props}
        >
            <Tooltip
                pointerEvents="auto"
                label="Incognito mode - you are not seen as online and your active location is not shown"
                aria-label="A tooltip"
            >
                <Flex
                    // backgroundColor="#f4f4f4"
                    backgroundColor={incognitoMode ? "#314b8f" : "#3c3d42"}
                    _hover={{ backgroundColor: "#3175ad" }}
                    width={iconCircleSize}
                    height={iconCircleSize}
                    borderRadius="50%"
                    cursor="pointer"
                    alignItems="center"
                    justifyContent="center"
                    pointerEvents="auto"
                    onClick={() => toggleIncognitoMode()}
                >
                    <Icon width={iconSize} height={iconSize} color="white" as={BsIncognito} cursor="pointer" />
                </Flex>
            </Tooltip>
            {/* HISTORIC123
            <Tooltip pointerEvents="auto" label="Show historic - also show circles not currently active" aria-label="A tooltip">
                <Flex
                    // backgroundColor="#f4f4f4"
                    backgroundColor={showHistoricCircles ? "#314b8f" : "#3c3d42"}
                    _hover={{ backgroundColor: "#3175ad" }}
                    width={iconCircleSize}
                    height={iconCircleSize}
                    borderRadius="50%"
                    cursor="pointer"
                    alignItems="center"
                    justifyContent="center"
                    pointerEvents="auto"
                    onClick={() => toggleShowHistoricCircles()}
                >
                    <Icon width={iconSize} height={iconSize} color="white" as={MdHistory} cursor="pointer" />
                </Flex>
            </Tooltip> */}
        </Flex>
    );
};

export const CircleCover = ({ circle, coverWidth, coverHeight, nullIfMissing, ...props }) => {
    const type = circle?.type;
    const cover = circle?.cover;
    const metaData = circle?.meta_data;

    const getCover = () => {
        if (cover) return cover;
        let metaImage = getMetaImage(metaData);
        if (metaImage) return metaImage;
        return null;
    };

    if (nullIfMissing && !getCover()) return null;

    if (circle?.type === "set") {
        return (
            <Flex
                position="relative"
                flexDirection={"row"}
                overflow="hidden"
                width={coverWidth ? `${coverWidth}px` : "100%"}
                height={`${coverHeight}px`}
                {...props}
            >
                <Image
                    position="absolute"
                    top="0"
                    left="0"
                    width={"100%"}
                    height={"100%"}
                    src={getImageKitUrl(
                        circle[circle.circle_ids[0]].cover ?? getDefaultCircleCover(circle),
                        coverWidth,
                        coverHeight
                    )}
                    backgroundColor="white"
                    objectFit="cover"
                />
                <Image
                    width={"100%"}
                    height={"100%"}
                    src={getImageKitUrl(
                        circle[circle.circle_ids[1]].cover ?? getDefaultCircleCover(circle),
                        coverWidth,
                        coverHeight
                    )}
                    backgroundColor="white"
                    objectFit="cover"
                    // style={{
                    //     WebkitMaskImage: "linear-gradient(to right, transparent 45%, black 55%)",
                    //     maskImage: "linear-gradient(to right, transparent 45%, black 55%)",
                    // }}

                    style={{
                        WebkitMaskImage: "linear-gradient(to bottom right, transparent 45%, white 55%)",
                        maskImage: "linear-gradient(to bottom right, transparent 45%, white 55%)",
                    }}
                />
            </Flex>
        );
    }

    return (
        <Image
            width={coverWidth ? `${coverWidth}px` : "100%"}
            height={`${coverHeight}px`}
            src={getImageKitUrl(getCover() ?? getDefaultCircleCover(circle), coverWidth, coverHeight)}
            backgroundColor="white"
            objectFit="cover"
            {...props}
        />
    );
};

export const CircleNameAndPicture = ({
    circle,
    size,
    fontSize = "16px",
    hasPopover,
    popoverPlacement,
    disableClick,
    isActive = true,
    ...props
}) => {
    const getNameFontSize = (name) => {
        if (!name) return "17px";
        if (name.length < 16) return "17px";
        if (name.length < 19) return "15px";
        if (name.length < 24) return "14px";
        return "14px";
    };

    return (
        <Flex flexDirection="row" align="center" width="100%">
            <CirclePicture
                circle={circle}
                size={size}
                hasPopover={hasPopover}
                popoverPlacement={popoverPlacement}
                disableClick={disableClick}
                isActive={isActive}
            />
            {circle.type !== "set" && (
                <Box flex="1" align="left" overflow="hidden">
                    <Text
                        fontSize={fontSize}
                        fontWeight="bold"
                        color="black"
                        style={singleLineEllipsisStyle}
                        marginLeft="8px"
                    >
                        {circle.name}
                    </Text>
                </Box>
            )}
            {circle.type === "set" && (
                <Box align="left" flex="1" overflow="hidden">
                    <Text
                        style={singleLineEllipsisStyle}
                        fontSize={fontSize}
                        fontWeight="bold"
                        marginLeft="8px"
                        color="black"
                    >
                        {circle[circle.circle_ids[0]].name + " & " + circle[circle.circle_ids[1]].name}
                    </Text>
                </Box>
            )}
        </Flex>
    );
};

export const getDefaultCirclePicture = (item) => {
    switch (item?.type) {
        case "event":
            return "/default-event-picture.png";
        default:
        case "circle":
            return "/default-circle-picture.png";
        case "user":
            return "/default-user-picture.png";
        case "tag":
            return "/default-tag-picture.png";
        case "link":
            return "/default-link-picture.png";
        case "post":
            return "/default-user-picture.png";
    }
};

export const getDefaultCircleCover = (item) => {
    switch (item?.type) {
        default:
        case "circle":
            return "/default-circle-cover.png";
        case "event":
            return "/default-event-cover.png";
        case "user":
            return "/default-user-cover.png";
    }
};

export const getCirclePicture = (item, picture, size) => {
    if (item?.id === "global") {
        return picture ?? getDefaultCirclePicture(item);
    }
    return getImageKitUrl(picture ?? getDefaultCirclePicture(item), size, size);
};

export const getCircleCover = (item, cover, width, height) => {
    if (item?.id === "global") {
        return cover ?? getDefaultCircleCover(item);
    }
    return getImageKitUrl(cover ?? getDefaultCircleCover(item), width, height);
};

export const CirclePicture = ({
    circle,
    size,
    hasPopover,
    popoverPlacement,
    disableClick,
    parentCircleSizeRatio = 3,
    parentCircleOffset = 0,
    isActive = true,
    showIfInVideoSession = true,
    inChat = false,
    circleBorderColors = [],
    ...props
}) => {
    const navigate = useNavigateNoUpdates();
    const [userData] = useAtom(userDataAtom);
    const [isMobile] = useAtom(isMobileAtom);
    const [, setToggleAbout] = useAtom(toggleAboutAtom);

    const onClick = (item) => {
        //log(JSON.stringify(item, null, 2), 0);
        //log(item?.name, 0, true);
        if (disableClick) return;

        openAboutCircle(item, setToggleAbout);
        //openCircle(navigate, circle);
    };

    const inActiveOpacity = 0.5;

    const borderWidth = 2;
    const imageWidth = size - circleBorderColors.length * (borderWidth * 2);
    const imageOffset = circleBorderColors.length * borderWidth;

    const isHexagon = (inCircle) => {
        return false;
        //return inCircle?.type === "user";
    };

    const getShapeStyle = (inCircle) => {
        if (!isHexagon(inCircle)) {
            // circle
            return {
                borderRadius: "50%",
            };
        } else {
            // hexagon
            return {
                clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
            };
        }
    };

    const HexagonBorder = ({ size, color, ...props }) => (
        <svg width={size} height={size} viewBox="-2 -2 104 104" fill="none" {...props}>
            <path d="M50 0 L100 25 L100 75 L50 100 L0 75 L0 25 L50 0" fill="white" stroke={color} strokeWidth="4" />
        </svg>
    );

    const MultipleHexagonBorders = ({ size, colors, leftOffset = 0 }) => (
        <>
            {colors.map((color, index) => (
                <HexagonBorder
                    key={index}
                    size={size - 4 * index} // Adjust size for each border
                    color={color}
                    style={{ position: "absolute", top: `${2 * index}px`, left: `${2 * index + leftOffset}px` }}
                />
            ))}
        </>
    );

    const MultipleCircleBorders = ({ size, colors, leftOffset = 0 }) => (
        <>
            {colors.map((color, index) => (
                <Box
                    key={index}
                    position="absolute"
                    top={`${2 * index}px`}
                    left={`${2 * index + leftOffset}px`}
                    width={`${size - 4 * index}px`}
                    height={`${size - 4 * index}px`}
                    borderRadius="50%"
                    border={`2px solid ${color}`}
                />
            ))}
        </>
    );

    const circles = (
        circle?.type === "set" ? circle.circle_ids.map((x) => circle?.[x]) : circle ? [circle] : []
    ).filter((x) => x?.id);
    const setOffset = size / 3;
    const width = circle?.type === "set" ? size * circles.length - setOffset : size;
    const height = size;

    return hasPopover && !isMobile ? (
        // <Box width={`${size}px`} height={`${size}px`} position="relative" flexShrink="0" flexGrow="0">
        <Popover isLazy trigger="hover" gutter="0">
            <PopoverTrigger>
                <Box width={`${size}px`} height={`${size}px`} position="relative" flexShrink="0" flexGrow="0">
                    {circles.map((item, index) => (
                        <Box key={item.id}>
                            {isHexagon(item) ? (
                                <MultipleHexagonBorders
                                    size={size}
                                    colors={circleBorderColors}
                                    leftOffset={index * (size - setOffset)}
                                />
                            ) : (
                                <MultipleCircleBorders
                                    size={size}
                                    colors={circleBorderColors}
                                    leftOffset={index * (size - setOffset)}
                                />
                            )}
                            <Image
                                position="absolute"
                                top={`${imageOffset}px`}
                                left={`${imageOffset + index * (size - setOffset)}px`}
                                width={`${imageWidth}px`}
                                height={`${imageWidth}px`}
                                src={getCirclePicture(item, item?.picture, size)}
                                flexShrink="0"
                                flexGrow="0"
                                style={getShapeStyle(item)}
                                objectFit="cover"
                                onClick={item ? () => onClick(item) : undefined}
                                cursor={!disableClick ? "pointer" : "inherit"}
                                fallbackSrc={getCirclePicture(item, getDefaultCirclePicture(item), size)}
                                backgroundColor="white"
                                // opacity={isActive ? "1" : inActiveOpacity}
                                {...props}
                            />

                            {hasUpdates(userData, item, "any") && (
                                <Box
                                    width={`${size / 7}px`}
                                    height={`${size / 7}px`}
                                    backgroundColor="#ff6499"
                                    borderRadius="50%"
                                    position="absolute"
                                    bottom="0px"
                                    right="0px"
                                ></Box>
                            )}

                            {showIfInVideoSession && isActiveInVideoConference(item) && (
                                <Box
                                    position="absolute"
                                    bottom={`${parentCircleOffset}px`}
                                    right={`${parentCircleOffset}px`}
                                >
                                    <RiLiveFill color="red" size={`${size / parentCircleSizeRatio}px`} />
                                </Box>
                            )}
                        </Box>
                    ))}
                </Box>
            </PopoverTrigger>
            <Portal>
                <PopoverContent backgroundColor="transparent" borderColor="transparent" width="450px">
                    <Box
                        zIndex="160"
                        onClick={circle ? () => onClick(circle) : undefined}
                        cursor={onClick ? "pointer" : "inherit"}
                        pointerEvents="auto"
                    >
                        <PopoverArrow />
                        <CirclePreview
                            item={circle}
                            inChat={inChat}
                            onClick={circle ? () => onClick(circle) : undefined}
                        />
                    </Box>
                </PopoverContent>
            </Portal>
        </Popover>
    ) : (
        <Box width={`${width}px`} height={`${height}px`} position="relative" flexShrink="0" flexGrow="0">
            {circles.map((item, index) => (
                <Box key={item.id}>
                    {isHexagon(item) ? (
                        <MultipleHexagonBorders
                            size={size}
                            colors={circleBorderColors}
                            leftOffset={index * (size - setOffset)}
                        />
                    ) : (
                        <MultipleCircleBorders
                            size={size}
                            colors={circleBorderColors}
                            leftOffset={index * (size - setOffset)}
                        />
                    )}
                    <Image
                        position="absolute"
                        top={`${imageOffset}px`}
                        left={`${imageOffset + index * (size - setOffset)}px`}
                        width={`${imageWidth}px`}
                        height={`${imageWidth}px`}
                        src={getCirclePicture(item, item?.picture, size)}
                        flexShrink="0"
                        flexGrow="0"
                        style={getShapeStyle(item)}
                        objectFit="cover"
                        onClick={item ? () => onClick(item) : undefined}
                        cursor={!disableClick ? "pointer" : "inherit"}
                        // fallbackSrc={getCirclePicture(item, getDefaultCirclePicture(item), size)}
                        backgroundColor="white"
                        // opacity={isActive ? "1" : inActiveOpacity}
                        {...props}
                    />

                    {hasUpdates(userData, item, "any") && (
                        <Box
                            width={`${size / 7}px`}
                            height={`${size / 7}px`}
                            backgroundColor="#ff6499"
                            borderRadius="50%"
                            position="absolute"
                            bottom="0px"
                            right="0px"
                        ></Box>
                    )}

                    {showIfInVideoSession && isActiveInVideoConference(item) && (
                        <Box position="absolute" bottom={`${parentCircleOffset}px`} right={`${parentCircleOffset}px`}>
                            <RiLiveFill color="red" size={`${size / parentCircleSizeRatio}px`} />
                        </Box>
                    )}
                </Box>
            ))}
        </Box>
    );
};

export const LargeConnectButton = ({ circle }) => {
    const [isMobile] = useAtom(isMobileAtom);
    const [userData] = useAtom(userDataAtom);
    const [user] = useAtom(userAtom);
    const userIsConnected = isConnectedOrPending(userData, circle?.id);
    const [, setConnectPopup] = useAtom(connectPopupAtom);
    const [isConnecting] = useAtom(isConnectingAtom);

    if (userIsConnected) return null;

    return (
        <Flex
            flexDirection="column"
            position={isMobile ? "static" : "absolute"}
            right="0"
            justifyContent="center"
            height="50px"
            zIndex="10"
        >
            <HStack align="center" height="40px">
                <Button
                    width="150px"
                    colorScheme="blue"
                    borderRadius="25px"
                    lineHeight="0"
                    backgroundColor="#389bf8"
                    color="white"
                    isDisabled={isConnecting}
                    onClick={() => setConnectPopup({ source: user, target: circle, option: "connect" })}
                    position="relative"
                >
                    <HStack marginRight="13px">
                        <RiLinksLine size="18px" />
                        <Text>{i18n.t(`Default connect [${circle?.type}]`)}</Text>
                    </HStack>
                </Button>
            </HStack>
        </Flex>
    );
};

export const OpenButton = ({ circle, ...props }) => {
    const navigate = useNavigateNoUpdates();
    const height = "28px";
    const [, setFocusOnMapItem] = useAtom(focusOnMapItemAtom);

    return (
        <Tooltip label={"Enter into circle"} aria-label="A tooltip">
            <Flex
                height={height}
                borderRadius="25px"
                lineHeight="0"
                backgroundColor="#389bf8"
                color="white"
                onClick={(event) => {
                    event.stopPropagation();
                    openCircle(navigate, circle);
                    // focusCircle(circle, setFocusOnMapItem);
                }}
                position="relative"
                align="center"
                justifyContent="center"
                _hover={{
                    backgroundColor: "var(--chakra-colors-blue-600);",
                }}
                _active={{
                    backgroundColor: "var(--chakra-colors-blue-700);",
                }}
                cursor="pointer"
                padding="0px 5px 0px 5px"
                {...props}
            >
                <Text fontWeight="700" fontSize="13px" marginLeft="4px" marginRight="4px">
                    {i18n.t(`Open`)}
                </Text>
            </Flex>
        </Tooltip>
    );
};

export const SimilarityIndicator = ({ circle, ...props }) => {
    const score = circle.score ?? 0;
    const percent = ((score + 1) / 2) * 100; // convert score from [-1,1] to [0,100]

    const getBarColor = (percent) => {
        return percent > 50 ? "green" : "red";
    };

    if (!circle.score) return;

    return (
        <Box width="28px" height="28px" {...props}>
            <CircularProgress value={percent} color={getBarColor(percent)} size="28px">
                <CircularProgressLabel>{percent.toFixed(0) + "%"}</CircularProgressLabel>
            </CircularProgress>
        </Box>
    );
};

export const BoxIf = ({ children, noBox, ...props }) => {
    return noBox ? children : <Box {...props}>{children}</Box>;
};

export const ScrollbarsIf = ({ children, noScrollbars }) => {
    return noScrollbars ? children : <Scrollbars autoHide>{children}</Scrollbars>;
};

export const CircleHeader = ({ circle, onClose, inPreview, inChat, onClickSpace, ...props }) => {
    const [isMobile] = useAtom(isMobileAtom);
    const [user] = useAtom(userAtom);
    const [userData] = useAtom(userDataAtom);

    const [currentCircle] = useAtom(circleAtom);
    const userIsConnected = useMemo(() => isConnected(userData, circle?.id), [userData, circle?.id]);
    const showOpen = useMemo(
        () => userIsConnected && currentCircle?.id !== circle?.id,
        [userIsConnected, currentCircle?.id, circle?.id]
    );

    const iconSize = 12;
    const spacingPx = "4px";

    if (!circle) return null;

    return (
        <Flex flex="initial" order="0" align="left" flexDirection="column" width="100%" height={"32px"} {...props}>
            <Flex flexDirection="row" width="100%" align="center">
                <Flex flexDirection="row" width="100%" position="relative" align="center">
                    {inChat && (
                        <Box
                            flexGrow="1"
                            height="28px"
                            cursor={onClickSpace ? "pointer" : "auto"}
                            onClick={onClickSpace}
                        />
                    )}
                    {showOpen && <OpenButton circle={circle} marginLeft={inPreview ? "10px" : "0px"} />}
                    <LocationButton
                        circle={circle}
                        inPreview={inPreview}
                        marginLeft={!showOpen && inPreview ? "10px" : showOpen ? spacingPx : "0px"}
                    />
                    {!inChat && (
                        <Box
                            flexGrow="1"
                            height="28px"
                            cursor={onClickSpace ? "pointer" : "auto"}
                            onClick={onClickSpace}
                        />
                    )}
                    {(circle?.type === "user" || circle?.type === "ai_agent") && circle?.id !== user?.id && (
                        <MessageButton circle={circle} inPreview={inPreview} marginLeft={spacingPx} />
                    )}
                    <FavoriteButton circle={circle} inPreview={inPreview} marginLeft={spacingPx} />
                    {(circle?.type === "set" || isConnected(userData, circle.id, ["connected_mutually_to"])) && (
                        <NotificationsBell circle={circle} inPreview={inPreview} marginLeft={spacingPx} />
                    )}
                    {/* <ShareButtonMenu circle={circle} /> */}
                    {circle?.id !== "global" && circle?.type !== "set" && (
                        <ConnectButton
                            circle={circle}
                            inHeader={true}
                            fadeBackground={false}
                            inPreview={inPreview}
                            marginLeft={spacingPx}
                        />
                    )}
                    {inPreview && <Box width="10px" />}

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
                            marginLeft={spacingPx}
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
            </Flex>
        </Flex>
    );
};

export const CircleTags = ({ circle, inSelect, showAll = false, size = "md", wrap = "nowrap" }) => {
    const navigate = useNavigateNoUpdates();
    const [user] = useAtom(userAtom);

    const isOverlap = (causeId) => {
        return user?.tags?.some((x) => x.id === causeId);
    };
    const tagColor = (tag) => {
        let overlap = isOverlap(tag?.id);
        if (!overlap) {
            if (tag.is_custom) {
                return "#c9c1d9";
            } else {
                return "#9cb5f7";
            }
        } else {
            if (tag.is_custom) {
                return "#a9d9a4";
            } else {
                return "#50cb7c";
            }
        }
    };

    const smallSize = size === "sm" || size === "tiny";

    const getFontSize = () => {
        switch (size) {
            default:
            case "md":
                return "14px";
            case "sm":
                return "12px";
            case "tiny":
                return "10px";
        }
    };

    const hoverColor = (tag) => {
        let overlap = isOverlap(tag?.id);
        if (!overlap) {
            if (tag.is_custom) {
                return "#c9c1d9";
            } else {
                return "#799af5";
            }
        } else {
            if (tag.is_custom) {
                return "#a9d9a4";
            } else {
                return "#26c95f";
            }
        }
    };

    return (
        circle?.tags?.length > 0 && (
            <Flex flexWrap={wrap}>
                {circle.tags?.slice(0, showAll ? 10000 : 3)?.map((tag) => (
                    <Box
                        key={tag.id}
                        fontSize={getFontSize()}
                        padding={smallSize ? "2px 6px 2px 6px" : "2px 13px 2px 10px"}
                        margin={smallSize ? "0px 4px 0px 0px" : "0px 4px 4px 2px"}
                        cursor={tag.is_custom ? "auto" : "pointer"}
                        background={tagColor(tag)}
                        _hover={{ backgroundColor: hoverColor(tag) }}
                        color="white"
                        height="auto"
                        borderRadius="20px"
                        onClick={
                            tag.is_custom
                                ? (event) => {
                                      event.stopPropagation();
                                  }
                                : (event) => {
                                      if (inSelect) return;

                                      event.stopPropagation();
                                      openCircle(navigate, { id: tag.id, host: "circles" });
                                  }
                        }
                    >
                        <Text style={singleLineEllipsisStyle}>{tag.text}</Text>
                    </Box>
                ))}
            </Flex>
        )
    );
};

export const getConnectLabel = (circleType, connectType) => {
    switch (connectType) {
        case "owner_of":
            return i18n.t("Owner");
        case "admin_of":
            return i18n.t("Admin");
        case "moderator_of":
            return i18n.t("Moderator");
        case "connected_mutually_to":
            switch (circleType) {
                default:
                case "project":
                case "circle":
                    return i18n.t("Member");
                case "user":
                    return i18n.t("Contact");
                case "event":
                    return i18n.t("Attendee");
                case "tag":
                    return i18n.t("Supporter");
            }
        case "connected_mutually_to_request":
            return i18n.t(`Request [${circleType}]`);
        case "connected_to":
            return i18n.t("Follower");
        case "creator_of":
            return i18n.t("Creator");
        default:
            return i18n.t("Connected");
    }
};

export const CircleRichText = ({ mentions, mentionsFontSize = "14px", children }) => {
    return (
        <ReactMarkdown
            className="embedMarkdownContent"
            //plugins={[gfm]}
            remarkPlugins={[gfm]}
            components={{
                a: ({ node, ...props }) => {
                    return (
                        <CircleLink node={node} href={props.href} fontSize={mentionsFontSize} mentions={mentions}>
                            {props.children}
                        </CircleLink>
                    );
                },
            }}
        >
            {children}
        </ReactMarkdown>
    );
};

export const ConnectButton = ({
    circle,
    inHeader = false,
    fadeBackground = true,
    hoverFadeColor = "#ddd8db",
    inPreview,
    ...props
}) => {
    const [user] = useAtom(userAtom);
    const [userData] = useAtom(userDataAtom);
    const [isMobile] = useAtom(isMobileAtom);
    const [, setConnectPopup] = useAtom(connectPopupAtom);
    //const height = inHeader && !isMobile ? "40px" : "19px";
    const height = "28px";

    const getConnectionStatus = () => {
        if (!circle?.id) return i18n.t("Connected");

        if (isConnected(userData, circle?.id, ["owner_of"])) {
            return i18n.t("Owner");
        } else if (isConnected(userData, circle?.id, ["admin_of"])) {
            return i18n.t("Admin");
        } else if (isConnected(userData, circle?.id, ["moderator_of"])) {
            return i18n.t("Moderator");
        } else if (isConnected(userData, circle?.id, ["connected_mutually_to"])) {
            switch (circle?.type) {
                default:
                case "project":
                case "circle":
                    return i18n.t("Member");
                case "user":
                    return i18n.t("Contact");
                case "event":
                    return i18n.t("Attendee");
                case "tag":
                    return i18n.t("Supporter");
            }
        } else if (isConnected(userData, circle?.id, ["connected_to"])) {
            return i18n.t("Follower");
        } else if (isConnected(userData, circle?.id, ["creator_of"])) {
            return i18n.t("Creator");
        } else if (isConnected(userData, circle?.id, ["connected_mutually_to_request"])) {
            return i18n.t(`Pending approval`);
        } else {
            return i18n.t("Connected");
        }
    };

    if (circle?.id === user?.id) return null;

    return (
        <Box {...props}>
            {isConnected(userData, circle?.id) ? (
                <Flex flexDirection="row" position="relative">
                    {fadeBackground && (
                        <>
                            <Box
                                backgroundImage="linear-gradient(to right, transparent, #ffffff);"
                                width="10px"
                                height={height}
                                position="absolute"
                                left="-15px"
                                _groupHover={{
                                    backgroundImage: `linear-gradient(to right, transparent, ${hoverFadeColor});`,
                                }}
                            ></Box>
                            <Box
                                backgroundColor="white"
                                width="15px"
                                height={height}
                                position="absolute"
                                left="-5px"
                                _groupHover={{
                                    backgroundColor: hoverFadeColor,
                                }}
                            ></Box>
                        </>
                    )}
                    <Button
                        colorScheme="blue"
                        borderRadius="25px"
                        lineHeight="0"
                        padding="0px 5px 0px 8px"
                        variant="ghost"
                        backgroundColor="#ffffff"
                        color="#333"
                        border="1px solid #e7e7e7"
                        height={height}
                        onClick={(event) => {
                            event.stopPropagation();
                            setConnectPopup({ source: user, target: circle, option: "list" });
                        }}
                        position="relative"
                    >
                        <HStack spacing={inHeader ? "8px" : "4px"}>
                            <Text fontSize={inHeader ? "13px" : "11px"} fontWeight="700">
                                {getConnectionStatus()}
                            </Text>
                            <RiLinksLine size={inHeader ? "16px" : "12px"} />
                        </HStack>
                    </Button>
                </Flex>
            ) : (
                <Box>
                    <Flex
                        height={height}
                        borderRadius={inHeader ? "25px" : "50%"}
                        lineHeight="0"
                        backgroundColor="#389bf8"
                        color="white"
                        onClick={(event) => {
                            event.stopPropagation();
                            if (inHeader) {
                                setConnectPopup({ source: user, target: circle, option: "connect" });
                            } else {
                                setConnectPopup({ source: user, target: circle, option: "list" });
                            }
                        }}
                        position="relative"
                        align="center"
                        justifyContent="center"
                        _hover={{
                            backgroundColor: "var(--chakra-colors-blue-600);",
                        }}
                        _active={{
                            backgroundColor: "var(--chakra-colors-blue-700);",
                        }}
                        cursor="pointer"
                    >
                        <HStack marginRight={inHeader ? "13px" : "0px"} marginLeft={inHeader ? "13px" : "0px"}>
                            <RiLinksLine size={inHeader ? "16px" : "12px"} />
                            {inHeader && (
                                <Text fontSize="14px" fontWeight="400">
                                    {i18n.t(`Default connect [${circle?.type}]`)}
                                </Text>
                            )}
                        </HStack>
                    </Flex>
                </Box>
            )}
        </Box>
    );
};
