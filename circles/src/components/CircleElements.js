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
    getMetaImage,
} from "components/Helpers";
import { routes, openCircle, previewCircle } from "components/Navigation";
import { CirclePreview } from "components/CirclePreview";
import { RiLinksLine, RiShareLine } from "react-icons/ri";
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
} from "components/Atoms";
import { displayModes, defaultCoverHeight } from "components/Constants";
import axios from "axios";
import { HiOutlineBellSlash, HiOutlineBellAlert } from "react-icons/hi2";
import { AiFillStar, AiOutlineStar } from "react-icons/ai";
import { IoIosLink } from "react-icons/io";
import { ImQrcode } from "react-icons/im";
import { TbChartCircles } from "react-icons/tb";
import DonateToHolon from "components/Holons/DonateToHolon";
//#endregion

export const buttonHighlight = "#bdbdbddd";

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
            <CirclePicture circle={circle} size={sizeWithoutBorder} hasPopover={false} parentCircleSizeRatio={3.75} parentCircleOffset={3} />
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
                onClick={() => navigate(routes.circle(circle).new)}
            >
                <Icon width="28px" height="28px" color="white" as={IoAdd} />
            </Flex>
        </VStack>
    );
};

export const FavoriteButton = ({ circle }) => {
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
            {!mapInteract && <Box position="fixed" width="100vw" height="100vh" backgroundColor="#181818b0" zIndex="99" top="0" />}
            <Flex position="fixed" width="100vw" zIndex="100" justifyContent="center" top={mapInteract ? "auto" : "0"} bottom={mapInteract ? "20px" : "auto"}>
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
                    boxShadow="2px 3px 5px #999"
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
        <Flex flexDirection="row" flexWrap="wrap" gap="6px">
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
                        <Image src={`https://opencollective.com/${circle?.funding?.open_collective}/donate/button@2x.png?color=blue`} width="300px" />
                    </a>
                </Box>
            )}
            {circle?.funding?.holon && (
                <>
                    <DonateToHolon />
                </>
            )}
        </CirclePanel>
    );
};

export const CircleMembersPanel = () => {
    const [circle] = useAtom(circleAtom);
    const [circles] = useAtom(circlesAtom);
    const [circleConnections] = useAtom(circleConnectionsAtom);
    if (!circle?.id) return null;

    let members = [];
    if (circle.id === "global") {
        members = circles.filter((x) => x.type === "user" && x.picture);
    } else {
        const circleTypes = getCircleTypes(circle.type, "user");
        members = circleConnections.filter((x) => x.circle_types === circleTypes && x.display_circle?.picture).map((x) => x.display_circle);
    }
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
                            {meta.images?.map((img, j) => (
                                <Link key={j} href={meta.url} target="_blank">
                                    <Image src={img} />
                                </Link>
                            ))}
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
                onClick={() => setDisplayMode(displayModes.default)}
            >
                <Icon width={iconSize} height={iconSize} color="black" as={GrGallery} cursor="pointer" />
            </Flex>
            <Flex
                backgroundColor="#f4f4f4dd"
                _hover={{ backgroundColor: buttonHighlight }}
                width={iconCircleSize}
                height={iconCircleSize}
                borderRadius="50%"
                cursor="pointer"
                alignItems="center"
                justifyContent="center"
                onClick={() => setDisplayMode(displayModes.map)}
            >
                <Icon width={iconSize} height={iconSize} color="black" as={FaMapMarkedAlt} cursor="pointer" />
            </Flex>
            <Flex
                backgroundColor="#f4f4f4dd"
                _hover={{ backgroundColor: buttonHighlight }}
                width={iconCircleSize}
                height={iconCircleSize}
                borderRadius="50%"
                cursor="pointer"
                alignItems="center"
                justifyContent="center"
                onClick={() => setDisplayMode(displayModes.video)}
            >
                <Icon width={iconSize} height={iconSize} color="black" as={FaVideo} cursor="pointer" />
            </Flex>
            <Flex
                backgroundColor="#f4f4f4dd"
                _hover={{ backgroundColor: buttonHighlight }}
                width={iconCircleSize}
                height={iconCircleSize}
                borderRadius="50%"
                cursor="pointer"
                alignItems="center"
                justifyContent="center"
                onClick={() => setDisplayMode(displayModes.holon)}
            >
                <Icon width={iconSize} height={iconSize} color="black" as={TbChartCircles} cursor="pointer" />
            </Flex>
        </VStack>
    );
};

export const CircleCover = ({ type, cover, metaData, coverWidth, coverHeight, nullIfMissing, ...props }) => {
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

    const getCover = () => {
        if (cover) return cover;
        let metaImage = getMetaImage(metaData);
        if (metaImage) return metaImage;
        return null;
    };

    if (nullIfMissing && !getCover()) return null;

    return (
        <Image
            width={coverWidth ? `${coverWidth}px` : "100%"}
            height={`${coverHeight}px`}
            src={getImageKitUrl(getCover() ?? getDefaultCircleCover(), coverWidth, coverHeight)}
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
    const [, setToggleAbout] = useAtom(toggleAboutAtom);

    const getDefaultCirclePicture = () => {
        switch (circle?.type) {
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

    const getCirclePicture = (picture) => {
        if (circle?.id === "global") {
            return picture ?? getDefaultCirclePicture();
        }
        return getImageKitUrl(picture ?? getDefaultCirclePicture(), size, size);
    };

    const onClick = () => {
        if (disableClick) return;

        previewCircle(circle, setToggleAbout);
        //openCircle(navigate, circle);
    };

    const onParentClick = () => {
        if (disableClick) return;
        previewCircle(circle?.parent_circle, setToggleAbout);
        //openCircle(navigate, circle?.parent_circle);
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
                        fallbackSrc={getCirclePicture(getDefaultCirclePicture())}
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
            <Image
                width={`${size}px`}
                height={`${size}px`}
                src={getCirclePicture(circle?.picture)}
                flexShrink="0"
                flexGrow="0"
                borderRadius="50%"
                objectFit="cover"
                onClick={circle ? onClick : undefined}
                cursor={!disableClick ? "pointer" : "inherit"}
                fallbackSrc={getCirclePicture(getDefaultCirclePicture())}
                {...props}
            />

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
        <Flex flex="initial" order="0" align="left" flexDirection="column" width="100%" height={isMobile ? "40px" : "40px"}>
            <Flex flexDirection="row" width="100%" align="center">
                <Flex align="end" flexDirection="column" width="100%" position="relative">
                    <HStack>
                        <FavoriteButton circle={circle} />
                        {isConnected(userData, circle.id, ["connected_mutually_to"]) && <NotificationsBell circle={circle} />}
                        {/* <ShareButtonMenu circle={circle} /> */}
                        {circle?.id !== "global" && <ConnectButton circle={circle} inHeader={true} fadeBackground={false} />}
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

export const ConnectButton = ({ circle, inHeader = false, fadeBackground = true, hoverFadeColor = "#ddd8db", ...props }) => {
    const [user] = useAtom(userAtom);
    const [userData] = useAtom(userDataAtom);
    const [isMobile] = useAtom(isMobileAtom);
    const [, setConnectPopup] = useAtom(connectPopupAtom);
    //const height = inHeader && !isMobile ? "40px" : "19px";
    const height = "22px";

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
