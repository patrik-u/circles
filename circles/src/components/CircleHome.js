//#region imports
import React, { useEffect, useContext, useRef, useState } from "react";
import { Box, Menu, MenuButton, MenuItem, MenuList, Flex, HStack, VStack, Text, Image, Icon, Link, Button, useToast } from "@chakra-ui/react";
import i18n from "i18n/Localization";
import { log, fromFsDate, getDateWithoutTime, getDateAndTimeLong, getDateLong, toastInfo, isConnected, isFollowing, getLatlng } from "components/Helpers";
import { getPreciseDistance } from "geolib";
import { RiLinksLine, RiShareLine } from "react-icons/ri";
import { GiRoundStar } from "react-icons/gi";
import { IoIosLink } from "react-icons/io";
import { ImQrcode } from "react-icons/im";
import { FacebookShareButton, TwitterShareButton, FacebookIcon, TwitterIcon } from "react-share";
import { QRCodeCanvas } from "qrcode.react";
import { useAtom } from "jotai";
import {
    isMobileAtom,
    userAtom,
    userDataAtom,
    showNetworkLogoAtom,
    signInStatusAtom,
    circleAtom,
    circleConnectionsAtom,
    userLocationAtom,
    filteredCirclesAtom,
    circlesFilterAtom,
} from "components/Atoms";
import { useNavigateNoUpdates, useLocationNoUpdates } from "components/RouterUtils";
//#endregion

const ShareButtonMenu = ({ children, referrer }) => {
    const location = useLocationNoUpdates();
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

const CircleHome = () => {
    log("CircleHome.render", -1);

    const [isMobile] = useAtom(isMobileAtom);
    const [circle] = useAtom(circleAtom);
    const [circlesFilter, setCirclesFilter] = useAtom(circlesFilterAtom);
    const location = useLocationNoUpdates();

    useEffect(() => {
        if (!circlesFilter.types) return;
        let { types: _, ...newFilter } = circlesFilter;
        setCirclesFilter(newFilter);
    }, [circlesFilter, setCirclesFilter]);

    // useEffect(() => {
    //     log("CircleHome.useEffect 1", 0);
    //     if (!circle?.type || !circleConnections) {
    //         setUnfilteredCircles([]);
    //         return;
    //     }

    //     // filter connections
    //     setUnfilteredCircles(circleConnections.map((x) => x.display_circle));
    // }, [circleConnections, circle?.id, circle?.type]);

    // useEffect(() => {
    //     log("CircleHome.useEffect 2", 0);
    //     let listCircles = unfilteredCircles; //!filterConnected ? unfilteredCircles : unfilteredCircles.filter((x) => user?.connections?.some((y) => y.target.id === x.id));

    //     // filter all past events
    //     let startDate = getDateWithoutTime(); // today
    //     listCircles = listCircles.filter((x) => x.type !== "event" || fromFsDate(x.starts_at) > startDate);

    //     if (!userLocation) {
    //         setCircles(listCircles);
    //         return;
    //     }

    //     let newFilteredCircles = [];
    //     if (userLocation.latitude && userLocation.longitude) {
    //         for (var circle of listCircles.filter((x) => x.base)) {
    //             var circleLocation = getLatlng(circle.base);
    //             var preciseDistance = getPreciseDistance(userLocation, circleLocation);
    //             newFilteredCircles.push({ ...circle, distance: preciseDistance });
    //         }

    //         newFilteredCircles.sort((a, b) => a.distance - b.distance);
    //         for (var circlesWithNoBase of listCircles.filter((x) => !x.base)) {
    //             newFilteredCircles.push(circlesWithNoBase);
    //         }
    //     } else {
    //         newFilteredCircles = listCircles;
    //     }

    //     setCircles(newFilteredCircles);
    // }, [unfilteredCircles, userLocation, setCircles]);

    const CircleQuestion = ({ question }) => {
        return (
            <Box
                position="relative"
                borderRadius="15px"
                padding="0"
                align="start"
                marginTop="20px"
                marginLeft={isMobile ? "15px" : "0px"}
                marginRight={isMobile ? "15px" : "0px"}
            >
                <Text fontSize="18px" fontWeight="700" marginLeft="0px" marginBottom="5px">
                    {question.label}
                </Text>
                <Text>{question.answer}</Text>
            </Box>
        );
    };

    return (
        <>
            {circle && (
                <Box marginBottom="60px">
                    <VStack spacing="0px">
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
                        </VStack>
                    </VStack>

                    {circle.content && (
                        <Box align="left" marginLeft={isMobile ? "15px" : "0px"} marginRight={isMobile ? "15px" : "0px"} marginTop="10px">
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
            )}
        </>
    );
};

export default CircleHome;
