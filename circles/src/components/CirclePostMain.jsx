//#region imports
import React from "react";
import { Flex, Box, Text, Icon, IconButton } from "@chakra-ui/react";
import { log } from "@/components/Helpers";
import CircleListItem from "./CircleListItem";
import { CardIf, ScrollbarsIf } from "./CircleElements";
import { IoChevronBack } from "react-icons/io5";
import { FiChevronLeft } from "react-icons/fi";
import { openCircle } from "./Navigation";
import { useNavigateNoUpdates } from "./RouterUtils";
import { useAtom } from "jotai";
import { circleAtom } from "./Atoms";
//#endregion

const BackToPrevious = ({ asCard }) => {
    const navigate = useNavigateNoUpdates();
    const [circle] = useAtom(circleAtom);

    return (
        <CardIf noCard={!asCard} marginTop="10px" marginBottom="2px" noBody={true}>
            <Box
                height="40px"
                display="flex"
                justifyContent="left"
                marginLeft={"10px"}
                marginTop="0px"
                alignItems="center"
            >
                <Icon
                    width={"16px"}
                    height={"16px"}
                    color={"black"}
                    as={IoChevronBack}
                    cursor="pointer"
                    onClick={() => {
                        openCircle(navigate, circle);
                        //window.history.back();
                    }}
                />
                {/* <IconButton
                    size="xs"
                    icon={<IoChevronBack />}
                    // icon={circleDashboardExpanded ? <FiChevronRight /> : <FiChevronLeft />}
                    // onClick={() => setCircleDashboardExpanded(!circleDashboardExpanded)}
                    isRound
                ></IconButton> */}

                <Text fontSize="18px" fontWeight="700" marginLeft="10px">
                    Post
                </Text>
            </Box>
        </CardIf>
    );
};

const CirclePostMain = ({ post }) => {
    log("CirclePostMain.render", -1);
    const noScrollbars = false;
    const asCards = true;
    const useCompactList = false;

    if (!post) return;

    return (
        <Flex
            flexGrow={noScrollbars ? "0" : "1"}
            width="100%"
            height={noScrollbars ? "auto" : "100%"}
            flexDirection={"column"}
            maxWidth="600px"
            backgroundColor={asCards ? "#ededed" : "transparent"}
            position="relative"
        >
            <BackToPrevious asCard={asCards} />

            <Flex flexGrow="1" flexDirection={"column"}>
                <ScrollbarsIf noScrollbars={noScrollbars}>
                    <CircleListItem item={post} asCard={asCards} isCompact={useCompactList} isPreview={false} />
                </ScrollbarsIf>
            </Flex>
        </Flex>
    );
};

export default CirclePostMain;
