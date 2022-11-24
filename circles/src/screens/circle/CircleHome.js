//#region imports
import React, { useEffect, useContext, useRef, useState } from "react";
import { Box, Menu, MenuButton, MenuItem, MenuList, Flex, HStack, VStack, Text, Image, Icon, Link, Button, useToast } from "@chakra-ui/react";
import i18n from "i18n/Localization";
import UserContext from "../../components/UserContext";
import { log, fromFsDate, getDateWithoutTime, getDateAndTimeLong, getDateLong, toastInfo, isMutuallyConnected, isFollowing } from "../../components/Helpers";
import IsMobileContext from "../../components/IsMobileContext";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { CircleHeader, CircleCover } from "../../components/CircleElements";
import { RiLinksLine, RiShareLine } from "react-icons/ri";
import { GiRoundStar } from "react-icons/gi";
import { IoIosLink } from "react-icons/io";
import { ImQrcode } from "react-icons/im";
import { FacebookShareButton, TwitterShareButton, FacebookIcon, TwitterIcon } from "react-share";
import { QRCodeCanvas } from "qrcode.react";
//#endregion

const ShareButtonMenu = ({ children, referrer }) => {
    const location = useLocation();
    const [absoluteLocation, setAbsoluteLocation] = useState();
    const [absoluteQrLocation, setAbsoluteQrLocation] = useState();
    const toast = useToast();

    const copyPageLink = () => {
        navigator.clipboard.writeText(absoluteLocation).then(
            function () {
                toastInfo(toast, i18n.t("Copied to clipboard"));
            },
            function (err) {}
        );
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
    };

    useEffect(() => {
        log("ShareButtonMenu.useEffect 1");
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

    return (
        <Menu closeOnBlur="true">
            <MenuButton
                as={Button}
                rounded={"full"}
                variant={"link"}
                cursor={"pointer"}
                minW={0}
                position="absolute"
                right="20px"
                bottom="-40px"
                overflow="hidden"
                zIndex="1"
            >
                <Flex flexDirection="row" align="center">
                    <RiShareLine size="24px" color="black" />
                </Flex>
            </MenuButton>
            <MenuList alignItems={"center"} borderRadius="10" width={{ base: "100%", md: "250px" }} overflow="hidden">
                <MenuItem>
                    <FacebookShareButton url={absoluteLocation}>
                        <HStack align="center">
                            <FacebookIcon size={32} round />
                            <Text>{i18n.t("Share on Facebook")}</Text>
                        </HStack>
                    </FacebookShareButton>
                </MenuItem>
                <MenuItem>
                    <TwitterShareButton url={absoluteLocation}>
                        <HStack align="center">
                            <TwitterIcon size={32} round />
                            <Text>{i18n.t("Share on Twitter")}</Text>
                        </HStack>
                    </TwitterShareButton>
                </MenuItem>
                <MenuItem icon={<IoIosLink size={28} />} onClick={copyPageLink}>
                    {i18n.t("Copy link to page")}
                </MenuItem>
                <MenuItem icon={<ImQrcode size={28} />} onClick={downloadQrCode}>
                    {i18n.t("Download QR code")}
                    <QRCodeCanvas id="qr-code" size={400} includeMargin={true} value={absoluteQrLocation} hidden />
                </MenuItem>
            </MenuList>
        </Menu>
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
    const isMobile = useContext(IsMobileContext);
    const userIsConnected = circle?.id === user?.id || isMutuallyConnected(user, circle, true);
    const userIsFollower = circle?.id === user?.id || isFollowing(user, circle);
    const location = useLocation();
    const pointsRef = useRef(null);
    const [searchParams, setSearchParams] = useSearchParams();
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

export default CircleHome;
