//#region imports
import React, { useEffect } from "react";
import { Box, VStack, Text } from "@chakra-ui/react";
import { log, getDateAndTimeLong, getDateLong } from "components/Helpers";
import { useAtom } from "jotai";
import { isMobileAtom, circleAtom, circlesFilterAtom } from "components/Atoms";
import { useLocationNoUpdates } from "components/RouterUtils";
//#endregion

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
