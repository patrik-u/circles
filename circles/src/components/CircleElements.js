//#region imports
import React, { forwardRef, useState, useEffect, useRef } from "react";
import {
    Flex,
    Box,
    VStack,
    Text,
    Image,
    Icon,
    HStack,
    Popover,
    Link,
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
} from "@chakra-ui/react";
import { useNavigateNoUpdates, useLocationNoUpdates } from "components/RouterUtils";
import { IoAdd } from "react-icons/io5";
import i18n from "i18n/Localization";
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
} from "components/Helpers";
import { routes, openCircle } from "components/Navigation";
import { CirclePreview } from "components/CirclePreview";
import { RiLinksLine, RiShareLine } from "react-icons/ri";
import { FacebookShareButton, TwitterShareButton, FacebookIcon, TwitterIcon } from "react-share";
import { QRCodeCanvas } from "qrcode.react";
import { GrGallery } from "react-icons/gr";
import { FaMapMarkedAlt } from "react-icons/fa";
import { useAtom } from "jotai";
import { isMobileAtom, userAtom, userDataAtom, displayModeAtom, circleAtom, circleConnectionsAtom, connectPopupAtom, isConnectingAtom } from "components/Atoms";
import { displayModes } from "components/Constants";
import axios from "axios";
import { HiOutlineBellSlash, HiOutlineBellAlert } from "react-icons/hi2";
import { AiFillStar, AiOutlineStar } from "react-icons/ai";
import { IoIosLink } from "react-icons/io";
import { ImQrcode } from "react-icons/im";
//#endregion

const buttonHighlight = "#1fff50dd";

export const ShareButtonMenu = ({ children, referrer }) => {
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
    const iconSize = isMobile ? 20 : 26;
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
        var urlWithParams = hasParams ? window.location.href.split("?")[0] + "?" + urlParams.toString() : window.location.href;

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

                                <Box height="50px" _hover={{ backgroundColor: "#e8f3fadd" }} padding="10px" onClick={copyPageLink} cursor="pointer">
                                    <HStack spacing="12px">
                                        <IoIosLink size={28} />
                                        <Text>{i18n.t("Copy link to page")}</Text>
                                    </HStack>
                                </Box>
                                <Box height="50px" _hover={{ backgroundColor: "#e8f3fadd" }} padding="10px" onClick={downloadQrCode} cursor="pointer">
                                    <HStack spacing="12px">
                                        <ImQrcode size={28} />
                                        <Text>{i18n.t("Download QR code")}</Text>
                                        <QRCodeCanvas id="qr-code" size={400} includeMargin={true} value={absoluteQrLocation} hidden />
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
        <VStack position="fixed" right="18px" bottom={isMobile ? "80px" : "30px"} zIndex="50">
            <Flex
                backgroundColor="#c242bbdd"
                _hover={{ backgroundColor: "#e94ce1dd" }}
                width={size}
                height={size}
                borderRadius="50%"
                cursor="pointer"
                alignItems="center"
                justifyContent="center"
                onClick={() => navigate(routes.circle(circle?.id).new)}
            >
                <Icon width="28px" height="28px" color="white" as={IoAdd} />
            </Flex>
        </VStack>
    );
};

export const FavoriteButton = () => {
    const [circle] = useAtom(circleAtom);
    const [isMobile] = useAtom(isMobileAtom);
    const [user] = useAtom(userAtom);
    const [userData] = useAtom(userDataAtom);
    const iconSize = isMobile ? 20 : 26;
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
        axios.post(`/circles/${user.id}/settings`, {
            circleId: circle.id,
            settings: { favorite: favorite },
        });
    };

    if (!user?.id || !isConnected(userData, circle?.id, ["connected_mutually_to"])) return;

    return (
        <Flex
            position="relative"
            width={iconSize + 8 + "px"}
            height={iconSize + 8 + "px"}
            backgroundColor="#f4f4f4dd"
            _hover={{ backgroundColor: buttonHighlight }}
            borderRadius="50%"
            justifyContent="center"
            alignItems="center"
            onClick={toggleFavorite}
            cursor="pointer"
        >
            <Icon width={iconSizePx} height={iconSizePx} color={"#333"} as={favoriteSetting === true ? AiFillStar : AiOutlineStar} />
        </Flex>
    );
};

export const NotificationsBell = () => {
    const [circle] = useAtom(circleAtom);
    const [isMobile] = useAtom(isMobileAtom);
    const [user] = useAtom(userAtom);
    const [userData] = useAtom(userDataAtom);
    const iconSize = isMobile ? 20 : 26;
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
        axios.post(`/circles/${user.id}/settings`, {
            circleId: circle.id,
            settings: { notifications: settings },
        });
    };

    if (!user?.id || !isConnected(userData, circle?.id, ["connected_mutually_to"])) return;

    return (
        <Flex
            position="relative"
            width={iconSize + 8 + "px"}
            height={iconSize + 8 + "px"}
            backgroundColor="#f4f4f4dd"
            _hover={{ backgroundColor: buttonHighlight }}
            borderRadius="50%"
            justifyContent="center"
            alignItems="center"
            onClick={toggleNotifications}
            cursor="pointer"
        >
            <Icon width={iconSizePx} height={iconSizePx} color={"#333"} as={notificationSetting === "off" ? HiOutlineBellSlash : HiOutlineBellAlert} />
        </Flex>
    );
};

export const ModalPopup = ({ children, onClose, ...props }) => {
    return (
        <>
            <Box position="fixed" width="100vw" height="100vh" backgroundColor="#181818b0" zIndex="99" top="0" />
            <Flex position="fixed" width="100vw" zIndex="100" justifyContent="center" top="0">
                <Box
                    position="relative"
                    backgroundColor="white"
                    borderRadius="25px"
                    width="100%"
                    maxWidth="570px"
                    marginTop="60px"
                    paddingLeft="25px"
                    paddingRight="25px"
                    paddingTop="15px"
                    paddingBottom="15px"
                    {...props}
                >
                    {children}
                    <CloseButton position="absolute" top="10px" right="10px" onClick={onClose} />
                </Box>
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
        <Box align="left" marginLeft={{ base: "22px", md: "22px" }} marginBottom={{ base: "50px", md: "0px" }} paddingBottom={isMobile ? "0px" : "5px"}>
            <Text className="contentSubHeader">{title}</Text>
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
        <HStack spacing="10px" alignSelf="start">
            {circle.social_media.facebook && (
                <Link href={circle.social_media.facebook} target="_blank">
                    <Image src={"/social_facebook26x26.png"} className="social-media-icon" />
                </Link>
            )}
            {circle.social_media.twitter && (
                <Link href={circle.social_media.twitter} target="_blank">
                    <Image src={"/social_twitter26x26.png"} className="social-media-icon" />
                </Link>
            )}
            {circle.social_media.instagram && (
                <Link href={circle.social_media.instagram} target="_blank">
                    <Image src={"/social_instagram26x26.png"} className="social-media-icon" />
                </Link>
            )}
            {circle.social_media.youtube && (
                <Link href={circle.social_media.youtube} target="_blank">
                    <Image src={"/social_youtube26x26.png"} className="social-media-icon" />
                </Link>
            )}
            {circle.social_media.tiktok && (
                <Link href={circle.social_media.tiktok} target="_blank">
                    <Image src={"/social_tiktok26x26.png"} className="social-media-icon" />
                </Link>
            )}
            {circle.social_media.linkedin && (
                <Link href={circle.social_media.linkedin} target="_blank">
                    <Image src={"/social_linkedin26x26.png"} className="social-media-icon" />
                </Link>
            )}
            {circle.social_media.medium && (
                <Link href={circle.social_media.medium} target="_blank">
                    <Image src={"/social_medium26x26.png"} className="social-media-icon" />
                </Link>
            )}
            {circle.social_media.link1 && (
                <Link href={circle.social_media.link1} target="_blank">
                    <Image src={"/social_link26x26.png"} className="social-media-icon" />
                </Link>
            )}
            {circle.social_media.link2 && (
                <Link href={circle.social_media.link2} target="_blank">
                    <Image src={"/social_link26x26.png"} className="social-media-icon" />
                </Link>
            )}
            {circle.social_media.link3 && (
                <Link href={circle.social_media.link3} target="_blank">
                    <Image src={"/social_link26x26.png"} className="social-media-icon" />
                </Link>
            )}
            <Link href={location.pathname} target="_blank">
                <Image src={"/social_codo26x26.png"} className="social-media-icon" />
            </Link>
        </HStack>
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

export const CircleMembersPanel = () => {
    const [circle] = useAtom(circleAtom);
    const [circleConnections] = useAtom(circleConnectionsAtom);
    if (!circle?.id) return null;

    const circleTypes = getCircleTypes(circle.type, "user");
    const members = circleConnections.filter((x) => x.circle_types === circleTypes && x.display_circle.picture).map((x) => x.display_circle);

    if (members.length <= 0) return null;

    const size = 44;
    const sizePx = size + "px";
    const spacing = 6;
    const spacingPx = spacing + "px";

    return (
        <CirclePanel title={i18n.t(`Members [${circle?.type}]`)}>
            <Flex flexWrap="wrap">
                {members.map((member) => (
                    <Box key={member.id} width={sizePx} height={sizePx} marginRight={spacingPx} marginBottom={spacingPx}>
                        <CirclePicture circle={member} hasPopover={true} size={size} />
                    </Box>
                ))}
            </Flex>
        </CirclePanel>
    );
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
                    <CircleTagsPanel />
                    <CircleMembersPanel />
                </Box>
            );
    }
};

export const DisplayModeButtons = ({ ...props }) => {
    const [isMobile] = useAtom(isMobileAtom);
    const [displayMode, setDisplayMode] = useAtom(displayModeAtom);
    const iconCircleSize = isMobile ? "38px" : "48px";
    const iconSize = isMobile ? "22px" : "28px";

    return (
        <VStack
            position="absolute"
            right={isMobile ? (displayMode === displayModes.map ? "40px" : "10px") : "12px"}
            bottom={isMobile ? "10px" : displayMode === displayModes.map ? "26px" : "12px"}
            {...props}
        >
            <Flex
                backgroundColor="#f4f4f4dd"
                _hover={{ backgroundColor: buttonHighlight }}
                width={iconCircleSize}
                height={iconCircleSize}
                borderRadius="50%"
                cursor="pointer"
                alignItems="center"
                justifyContent="center"
                onClick={() => setDisplayMode(displayMode === displayModes.default ? displayModes.map : displayModes.default)}
            >
                <Icon
                    width={iconSize}
                    height={iconSize}
                    color="black"
                    as={displayMode === displayModes.default ? FaMapMarkedAlt : GrGallery}
                    cursor="pointer"
                />
            </Flex>
        </VStack>
    );
};

export const CircleCover = ({ type, cover, coverWidth, coverHeight, ...props }) => {
    const getDefaultCircleCover = () => {
        switch (type) {
            default:
            case "circle":
                return "/default-circle-cover.png";
            case "event":
                return "/default-event-cover.png";
            case "user":
                return "/default-user-cover.png";
        }
    };

    return (
        <Image
            width={coverWidth ? `${coverWidth}px` : "100%"}
            height={`${coverHeight}px`}
            src={getImageKitUrl(cover ?? getDefaultCircleCover(), coverWidth, coverHeight)}
            backgroundColor="white"
            objectFit="cover"
            {...props}
        />
    );
};

export const CirclePicture = ({ circle, size, hasPopover, popoverPlacement, disableClick, parentCircleSizeRatio = 3, parentCircleOffset = 0, ...props }) => {
    const navigate = useNavigateNoUpdates();
    const [userData] = useAtom(userDataAtom);
    const [isMobile] = useAtom(isMobileAtom);

    const getDefaultCirclePicture = () => {
        switch (circle.type) {
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
        }
    };

    const getCirclePicture = (picture) => {
        return getImageKitUrl(picture ?? getDefaultCirclePicture(), size, size);
    };

    const onClick = () => {
        if (disableClick) return;
        openCircle(navigate, circle?.id);
    };

    const onParentClick = () => {
        if (disableClick) return;
        openCircle(navigate, circle?.parent_circle?.id);
    };

    return hasPopover && !isMobile ? (
        <Box width={`${size}px`} height={`${size}px`} position="relative" flexShrink="0" flexGrow="0">
            <Popover isLazy trigger="hover" gutter="0">
                <PopoverTrigger>
                    <Image
                        width={`${size}px`}
                        height={`${size}px`}
                        src={getCirclePicture(circle?.picture)}
                        flexShrink="0"
                        flexGrow="0"
                        borderRadius="50%"
                        objectFit="cover"
                        onClick={onClick}
                        cursor={!disableClick ? "pointer" : "inherit"}
                        // fallbackSrc={getCirclePicture(getDefaultCirclePicture())}
                        {...props}
                    />
                </PopoverTrigger>
                <Portal>
                    <PopoverContent backgroundColor="transparent" borderColor="transparent" width="450px">
                        <Box zIndex="160" onClick={onClick} cursor={onClick ? "pointer" : "inherit"}>
                            <PopoverArrow />
                            <CirclePreview item={circle} />
                        </Box>
                    </PopoverContent>
                </Portal>
            </Popover>
        </Box>
    ) : (
        <Box width={`${size}px`} height={`${size}px`} position="relative" flexShrink="0" flexGrow="0">
            {circle && (
                <Image
                    width={`${size}px`}
                    height={`${size}px`}
                    src={getCirclePicture(circle?.picture)}
                    flexShrink="0"
                    flexGrow="0"
                    borderRadius="50%"
                    objectFit="cover"
                    onClick={onClick}
                    cursor={!disableClick ? "pointer" : "inherit"}
                    fallbackSrc={getCirclePicture(getDefaultCirclePicture())}
                    {...props}
                />
            )}
            {circle?.parent_circle && (
                <Image
                    position="absolute"
                    width={`${size / parentCircleSizeRatio}px`}
                    height={`${size / parentCircleSizeRatio}px`}
                    top={`${parentCircleOffset}px`}
                    left={`${parentCircleOffset}px`}
                    src={getCirclePicture(circle?.parent_circle?.picture)}
                    flexShrink="0"
                    flexGrow="0"
                    borderRadius="50%"
                    objectFit="cover"
                    onClick={onParentClick}
                    cursor={!disableClick ? "pointer" : "inherit"}
                    fallbackSrc={getCirclePicture(getDefaultCirclePicture())}
                    {...props}
                />
            )}

            {hasUpdates(userData, circle, "any") && (
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
        <Flex flexDirection="column" position={isMobile ? "static" : "absolute"} right="0" justifyContent="center" height="50px" zIndex="10">
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

export const CircleHeader = ({ circle }) => {
    const [isMobile] = useAtom(isMobileAtom);
    const [userData] = useAtom(userDataAtom);

    const getNameFontSize = (name) => {
        if (!isMobile || !name) return "32px";

        if (name.length <= 16) return "24px";
        if (name.length <= 17) return "23px";
        if (name.length <= 18) return "22px";
        if (name.length <= 19) return "20px";
        if (name.length <= 20) return "19px";
        return "19px";
    };

    if (!circle) return null;

    return (
        <Flex flex="initial" order="0" align="left" flexDirection="column" width="100%" height={isMobile ? "120px" : "140px"}>
            <Flex flexDirection="row" width="100%" align="center">
                <Flex align="left" flexDirection="column" width="100%" position="relative">
                    <Text style={twoLineEllipsisStyle} fontSize={getNameFontSize(circle?.name)} fontWeight="bold" marginTop={isMobile ? "0px" : "5px"}>
                        {circle?.name}
                    </Text>
                    <Box width="fit-content" borderRadius="20px" backgroundColor="gray.100" paddingLeft="10px" paddingRight="10px" marginBottom="10px">
                        <Text fontSize="14px" fontWeight="500">
                            {circle?.type}
                        </Text>
                    </Box>

                    <Text style={twoLineEllipsisStyle}>{circle?.description}</Text>

                    <HStack position="absolute" top={isMobile ? "-41px" : "5px"} right={isMobile ? "56px" : "0px"}>
                        <FavoriteButton />
                        {isConnected(userData, circle.id, ["connected_mutually_to"]) && <NotificationsBell />}
                        <ShareButtonMenu />
                        <ConnectButton circle={circle} inHeader={isMobile ? false : true} fadeBackground={!isMobile} />
                    </HStack>
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
                                      openCircle(navigate, tag.id);
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

export const ConnectButton = ({ circle, inHeader = false, fadeBackground = true, ...props }) => {
    const [user] = useAtom(userAtom);
    const [userData] = useAtom(userDataAtom);
    const [isMobile] = useAtom(isMobileAtom);
    const [, setConnectPopup] = useAtom(connectPopupAtom);
    const height = inHeader && !isMobile ? "40px" : "19px";

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
                                    backgroundImage: "linear-gradient(to right, transparent, #ddd8db);",
                                }}
                            ></Box>
                            <Box
                                backgroundColor="white"
                                width="15px"
                                height={height}
                                position="absolute"
                                left="-5px"
                                _groupHover={{
                                    backgroundColor: "#ddd8db",
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
                        <HStack spacing={inHeader ? "8px" : "4px"} marginRight={inHeader ? "5px" : "0px"} marginLeft={inHeader ? "10px" : "0px"}>
                            <Text fontSize={inHeader ? "14px" : "11px"} fontWeight="700">
                                {getConnectionStatus()}
                            </Text>
                            <RiLinksLine size={inHeader ? "18px" : "12px"} />
                        </HStack>
                    </Button>
                </Flex>
            ) : (
                <Box>
                    <Flex
                        width={inHeader ? "150px" : height}
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
                            <RiLinksLine size={inHeader ? "18px" : "12px"} />
                            {inHeader && <Text fontWeight="700">{i18n.t(`Default connect [${circle?.type}]`)}</Text>}
                        </HStack>
                    </Flex>
                </Box>
            )}
        </Box>
    );
};
