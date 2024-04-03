//#region imports
import React, { useEffect, useMemo } from "react";
import { Box, VStack, Text, Flex, HStack } from "@chakra-ui/react";
import { openCircle } from "@/components/Navigation";
import {
    log,
    getDateAndTimeLong,
    getDateLong,
    singleLineEllipsisStyle,
    twoLineEllipsisStyle,
    isActiveInCircle,
} from "@/components/Helpers";
import { useAtom } from "jotai";
import {
    isMobileAtom,
    circleAtom,
    circlesFilterAtom,
    previewCircleAtom,
    userAtom,
    toggleWidgetEventAtom,
} from "@/components/Atoms";
import { useLocationNoUpdates, useNavigateNoUpdates } from "@/components/RouterUtils";
import {
    CircleCover,
    CirclePicture,
    CircleHeader,
    QuickLinks,
    CircleMembersPanel,
    CircleRichText,
} from "@/components/CircleElements";
import { Scrollbars } from "react-custom-scrollbars-2";
import { CircleTags } from "@/components/CircleElements";
import { ActiveInCircle, RelationSetInfo } from "@/components/CirclePreview";
import ReactMarkdown from "react-markdown";
import { AboutButton, CircleLink } from "@/components/CircleElements";
//#endregion

export const UserDashboard = ({ onClose }) => {
    log("UserPanel.render", -1);

    const [user] = useAtom(userAtom);
    const [isMobile] = useAtom(isMobileAtom);
    const [currentCircle] = useAtom(circleAtom);
    const [previewCircle] = useAtom(previewCircleAtom);
    const [, setToggleWidgetEvent] = useAtom(toggleWidgetEventAtom);
    const circle = user;
    const location = useLocationNoUpdates();
    const navigate = useNavigateNoUpdates();
    const [, setFocusOnMapItem] = useAtom(focusOnMapItemAtom);

    const CircleQuestion = ({ question }) => {
        return (
            <Box position="relative" borderRadius="15px" padding="0" align="start" marginBottom="10px">
                <Text fontSize="18px" fontWeight="700" marginLeft="0px" marginBottom="5px">
                    {question.label}
                </Text>
                <Text>{question.answer}</Text>
            </Box>
        );
    };

    const getNameFontSize = (name) => {
        if (!name) return "17px";
        if (name.length < 16) return "17px";
        if (name.length < 19) return "15px";
        if (name.length < 24) return "14px";
        return "14px";
    };

    return (
        <>
            {circle && (
                <Box
                    bgGradient="linear(to-r,#d3d1d3,#ffffff)"
                    borderRadius="10px"
                    margin={isMobile ? "0px" : "10px 0px 10px 10px"}
                    padding="5px"
                    flexGrow="1"
                    pointerEvents="auto"
                    position="relative"
                    overflow="hidden"
                    height="100%"
                >
                    {/* <CircleHeader circle={circle} onClose={onClose} /> */}
                    <Scrollbars autoHide>
                        <CircleCover circle={circle} coverHeight={184} borderRadius="7px" />

                        {/* <Flex flexDirection="row" marginLeft="20px" onClick={onLogoClick} alignItems="center" pointerEvents="auto" cursor="pointer"> */}
                        <Flex height="54px" width="100%" flexDirection="row" position="relative">
                            <Box width="calc(50% - 38px)" overflow="hidden">
                                {circle.type !== "set" && (
                                    <Flex flexDirection={"column"} marginLeft="5px" marginTop="5px">
                                        {circle?.parent_circle && (
                                            <Text
                                                fontSize={"12px"}
                                                fontWeight="bold"
                                                color="#5d5d5d"
                                                _hover={{ color: "#904893" }}
                                                noOfLines={1}
                                                lineHeight="13px"
                                                cursor="pointer"
                                                onClick={() => {
                                                    openCircle(navigate, circle.parent_circle);
                                                    // focusCircle(circle.parent_circle, setFocusOnMapItem);
                                                    setToggleWidgetEvent({ name: "about", value: true });
                                                }}
                                            >
                                                {circle?.parent_circle?.name}
                                            </Text>
                                        )}
                                        <Text
                                            fontSize={getNameFontSize(circle.name)}
                                            fontWeight="bold"
                                            color="black"
                                            style={twoLineEllipsisStyle}
                                            lineHeight="18px"
                                        >
                                            {circle.name}
                                        </Text>
                                    </Flex>
                                )}
                            </Box>
                            <Box
                                flexGrow="1"
                                align="center"
                                position="absolute"
                                width={circle?.type === "set" ? "127px" : "76px"}
                                height="76px"
                                left={circle?.type === "set" ? "119px" : "144px"}
                                top="-38px"
                            >
                                <CirclePicture
                                    circle={circle}
                                    size={76}
                                    hasPopover={false}
                                    parentCircleSizeRatio={3.75}
                                    parentCircleOffset={3}
                                    disableClick={true}
                                    // circleBorderColors={["#ffffff"]}
                                />
                            </Box>
                            <Box flexGrow="1" />
                            <QuickLinks circle={circle} />
                        </Flex>

                        {circle.type === "set" && (
                            <Box align="center">
                                <Text fontSize="17px" fontWeight="bold" marginLeft="5px" color="black">
                                    {circle[circle.circle_ids[0]].name + " & " + circle[circle.circle_ids[1]].name}
                                </Text>
                            </Box>
                        )}

                        {circle.description && (
                            <Box
                                align="left"
                                marginTop="10px"
                                backgroundColor="#ffffffaa"
                                borderRadius="7px"
                                padding="5px"
                            >
                                <CircleRichText mentions={circle.mentions}>{circle.description}</CircleRichText>
                            </Box>
                        )}

                        {circle.tags && (
                            <Box
                                align="left"
                                marginTop="10px"
                                backgroundColor="#ffffffaa"
                                borderRadius="7px"
                                padding="5px"
                            >
                                <Text fontWeight="bold">Tags</Text>
                                <CircleTags circle={circle} showAll={true} wrap="wrap" />
                            </Box>
                        )}

                        {circle.mission && (
                            <Box
                                align="left"
                                marginTop="10px"
                                backgroundColor="#ffffffaa"
                                borderRadius="7px"
                                padding="5px"
                            >
                                <Text fontWeight="bold">Mission</Text>
                                <CircleRichText mentions={circle.mentions}>{circle.mission}</CircleRichText>
                            </Box>
                        )}

                        {circle.offers && (
                            <Box
                                align="left"
                                marginTop="10px"
                                backgroundColor="#ffffffaa"
                                borderRadius="7px"
                                padding="5px"
                            >
                                <Text fontWeight="bold">Offers</Text>
                                <CircleRichText mentions={circle.mentions}>{circle.offers}</CircleRichText>
                            </Box>
                        )}

                        {circle.needs && (
                            <Box
                                align="left"
                                marginTop="10px"
                                backgroundColor="#ffffffaa"
                                borderRadius="7px"
                                padding="5px"
                            >
                                <Text fontWeight="bold">Needs</Text>
                                <CircleRichText mentions={circle.mentions}>{circle.needs}</CircleRichText>
                            </Box>
                        )}

                        {circle.content && (
                            <Box
                                align="left"
                                marginTop="10px"
                                backgroundColor="#ffffffaa"
                                borderRadius="7px"
                                padding="5px"
                            >
                                <Text fontWeight="bold">About</Text>
                                <CircleRichText mentions={circle.mentions}>{circle.content}</CircleRichText>
                            </Box>
                        )}

                        {circle.questions && (
                            <Box backgroundColor="#ffffffaa" padding="5px" borderRadius="7px" marginTop="10px">
                                {circle.questions.question0 && <CircleQuestion question={circle.questions.question0} />}
                                {circle.questions.question1 && <CircleQuestion question={circle.questions.question1} />}
                                {circle.questions.question2 && <CircleQuestion question={circle.questions.question2} />}
                            </Box>
                        )}

                        {/* <CircleMembersPanel circle={circle} /> */}

                        {circle.id === "global" && (
                            <Box
                                align="left"
                                marginTop="10px"
                                backgroundColor="#ffffffaa"
                                borderRadius="7px"
                                padding="5px"
                            >
                                <Text fontWeight="bold">Version</Text>
                                <Text>{import.meta.env.VITE_APP_VERSION}</Text>
                            </Box>
                        )}
                        <Box height="35px"></Box>
                    </Scrollbars>
                </Box>
            )}
        </>
    );
};

export default UserDashboard;
