//#region imports
import React, { useEffect, useMemo } from "react";
import { Box, VStack, Text, Flex, HStack } from "@chakra-ui/react";
import { log, getDateAndTimeLong, getDateLong, singleLineEllipsisStyle, twoLineEllipsisStyle, isActiveInCircle } from "components/Helpers";
import { useAtom } from "jotai";
import { isMobileAtom, circleAtom, circlesFilterAtom, previewCircleAtom, userAtom } from "components/Atoms";
import { useLocationNoUpdates } from "components/RouterUtils";
import { CircleCover, CirclePicture, CircleHeader, QuickLinks, CircleMembersPanel } from "components/CircleElements";
import { Scrollbars } from "react-custom-scrollbars-2";
import { CircleTags } from "components/CircleElements";
import { ActiveInCircle, RelationSetInfo } from "components/CirclePreview";
//#endregion

const CircleAbout = ({ onClose }) => {
    log("CircleAbout.render", -1);

    const [user] = useAtom(userAtom);
    const [isMobile] = useAtom(isMobileAtom);
    const [currentCircle] = useAtom(circleAtom);
    const [previewCircle] = useAtom(previewCircleAtom);
    const circle = useMemo(() => previewCircle ?? currentCircle, [previewCircle, currentCircle]);
    const location = useLocationNoUpdates();

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
                    margin={isMobile ? "0px" : "0px 10px 10px 0px"}
                    padding="5px"
                    flexGrow="1"
                    pointerEvents="auto"
                    position="relative"
                    overflow="hidden"
                    height="100%"
                >
                    <CircleHeader circle={circle} onClose={onClose} />
                    <Scrollbars autoHide>
                        <CircleCover circle={circle} coverHeight={184} borderRadius="7px" />

                        {/* <Flex flexDirection="row" marginLeft="20px" onClick={onLogoClick} alignItems="center" pointerEvents="auto" cursor="pointer"> */}
                        <Flex height="44px" width="100%" flexDirection="row" position="relative">
                            <Box width="calc(50% - 38px)" overflow="hidden">
                                {circle.type !== "set" && (
                                    <Text
                                        fontSize={getNameFontSize(circle.name)}
                                        fontWeight="bold"
                                        marginLeft="5px"
                                        color="black"
                                        style={twoLineEllipsisStyle}
                                        marginTop="5px"
                                        lineHeight="18px"
                                    >
                                        {circle.name}
                                    </Text>
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

                        {/* </Flex> */}

                        {circle.type === "set" && (
                            <Box align="center">
                                <Text fontSize="17px" fontWeight="bold" marginLeft="5px" color="black">
                                    {circle[circle.circle_ids[0]].name + " & " + circle[circle.circle_ids[1]].name}
                                </Text>
                            </Box>
                        )}

                        <VStack spacing="0px">
                            <VStack align="center" className="circle-overview-content" spacing="16px" position="relative" top="0px">
                                <VStack spacing="0px">
                                    {circle.type === "event" && (
                                        <Text fontSize="18px" fontWeight="700" color="#cf1a1a" href={location.pathname} marginTop="0px">
                                            {circle.is_all_day ? getDateLong(circle.starts_at) : getDateAndTimeLong(circle.starts_at)}
                                        </Text>
                                    )}
                                </VStack>
                            </VStack>
                        </VStack>

                        {isActiveInCircle(circle) && circle?.type !== "set" && (
                            <ActiveInCircle item={circle} location={location} marginLeft="0px" marginRight="0px" />
                        )}

                        {circle?.id !== user?.id && (
                            <RelationSetInfo
                                circle={
                                    circle?.type === "set"
                                        ? circle?.circle_ids?.[0] !== user?.id
                                            ? circle?.[circle?.circle_ids?.[0]]
                                            : circle?.[circle?.circle_ids?.[1]]
                                        : circle
                                }
                                marginLeft="0px"
                                marginRight="0px"
                            />
                        )}

                        {circle.description && (
                            <Box align="left" marginTop="10px" backgroundColor="#ffffffaa" borderRadius="7px" padding="5px">
                                <div className="embedHtmlContent" dangerouslySetInnerHTML={{ __html: circle.description }} />
                            </Box>
                        )}

                        {circle.tags && (
                            <Box align="left" marginTop="10px" backgroundColor="#ffffffaa" borderRadius="7px" padding="5px">
                                <Text fontWeight="bold">Tags</Text>
                                <CircleTags circle={circle} showAll={true} wrap="wrap" />
                            </Box>
                        )}

                        {circle.content && (
                            <Box align="left" marginTop="10px" backgroundColor="#ffffffaa" borderRadius="7px" padding="5px">
                                <Text fontWeight="bold">About</Text>
                                <div className="embedHtmlContent" dangerouslySetInnerHTML={{ __html: circle.content }} />
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
                            <Box align="left" marginTop="10px" backgroundColor="#ffffffaa" borderRadius="7px" padding="5px">
                                <Text fontWeight="bold">Version</Text>
                                <Text>{process.env.REACT_APP_VERSION}</Text>
                            </Box>
                        )}
                        <Box height="35px"></Box>
                    </Scrollbars>
                </Box>
            )}
        </>
    );
};

export default CircleAbout;
