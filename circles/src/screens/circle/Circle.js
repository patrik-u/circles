//#region imports
import React, { useEffect, useContext, lazy, Suspense, useMemo } from "react";
import {
    Flex,
    Box,
    Text,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    Button,
    useToast,
    HStack,
    useDisclosure,
    Image,
} from "@chakra-ui/react";
import db from "components/Firebase";
import axios from "axios";
import { log, fromFsDate, getDateWithoutTime, getImageKitUrl, singleLineEllipsisStyle } from "components/Helpers";
import { collection, doc, onSnapshot, query, where } from "firebase/firestore";
import { Routes, Route, useParams } from "react-router-dom";

import { CircleHeader, CircleCover } from "components/CircleElements";
import LeftMenu from "screens/main/LeftMenu";
import { useAtom } from "jotai";
import { isMobileAtom, userAtom, userDataAtom, showNetworkLogoAtom, signInStatusAtom, circleAtom, circleIdAtom } from "components/Atoms";
//#endregion

const CircleHome = lazy(() => import("./CircleHome"));

export const Circle = () => {
    log("Circle.render", -1);

    const { circleId } = useParams();
    const [isMobile] = useAtom(isMobileAtom);
    const [signInStatus] = useAtom(signInStatusAtom);
    const [, setShowNetworkLogo] = useAtom(showNetworkLogoAtom);
    const [circle, setCircle] = useAtom(circleAtom);

    useEffect(() => {
        setShowNetworkLogo(true);
    }, [setShowNetworkLogo]);

    useEffect(() => {
        if (!circleId) return;

        let unsubscribeGetCircle = null;

        // TODO axios call to get Circle

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

        return () => {
            if (unsubscribeGetCircle) {
                unsubscribeGetCircle();
            }
        };
    }, [circleId, setCircle]);

    const circlePictureSize = isMobile ? 120 : 160;

    const CircleProfilePicture = ({ picture, type, size, ...props }) => {
        const borderWidth = 3;
        const sizePx = `${size}px`;
        const sizeWithoutBorder = size - borderWidth * 2;
        const sizeWithoutBorderPx = `${sizeWithoutBorder}px`;

        const getDefaultCirclePicture = () => {
            switch (type) {
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
            >
                <Image
                    src={getImageKitUrl(circle?.picture ?? getDefaultCirclePicture(), sizeWithoutBorder, sizeWithoutBorder)}
                    borderRadius="50%"
                    width={sizeWithoutBorderPx}
                    height={sizeWithoutBorderPx}
                    objectFit="cover"
                />
            </Flex>
        );
    };

    const debugBg = false;

    return (
        <Flex flexDirection="column">
            {/* Cover image */}
            <CircleCover type={circle?.type} cover={circle?.cover} />
            <Box position="relative">
                <Box marginLeft={`${circlePictureSize + 10}px`}></Box>
            </Box>

            {/* Main Content */}
            <Flex width="100%" flexDirection={isMobile ? "column" : "row"} flexWrap={isMobile ? "nowrap" : "wrap"} justifyContent="center">
                <Box
                    flex={isMobile ? "initial" : "2"}
                    order={isMobile ? "0" : "2"}
                    maxWidth={isMobile ? "none" : "800px"}
                    backgroundColor={debugBg ? "lightgreen" : "transparent"}
                    position="relative"
                >
                    <CircleProfilePicture picture={circle?.picture} type={circle?.type} size={circlePictureSize} left={isMobile ? "10px" : "-180px"} />
                    {/* Header */}
                    <Box marginLeft={isMobile ? `${circlePictureSize + 20}px` : "0px"} marginTop={isMobile ? "3px" : "5px"}>
                        <CircleHeader circle={circle} />
                    </Box>

                    <Routes>
                        <Route path="/" element={<CircleHome />} />
                    </Routes>
                </Box>
                {!isMobile && (
                    <Box
                        flex={isMobile ? "initial" : "1"}
                        order={isMobile ? "0" : "1"}
                        align="right"
                        backgroundColor={debugBg ? "orange" : "transparent"}
                        maxWidth={isMobile ? "none" : "250px"}
                    >
                        <LeftMenu marginRight="40px" marginLeft="10px" paddingTop="140px" paddingBottom="60px" />
                    </Box>
                )}
                <Box
                    flex={isMobile ? "initial" : "1"}
                    order={isMobile ? "0" : "3"}
                    backgroundColor={debugBg ? "orange" : "transparent"}
                    maxWidth={isMobile ? "none" : "250px"}
                >
                    <Text fontWeight="500" align="center"></Text>
                </Box>
            </Flex>
        </Flex>
    );
};

export default Circle;
