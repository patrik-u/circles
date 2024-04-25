//#region imports
import React, { useEffect, useMemo } from "react";
import { Box, VStack, Text, Flex, HStack } from "@chakra-ui/react";
import { openCircle, focusCircle } from "@/components/Navigation";
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
    focusOnMapItemAtom,
    circleDashboardExpandedAtom,
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
import CircleAbout from "@/components/CircleAbout";
import Circles from "@/components/Circles";
import { useParams } from "react-router-dom";
import { BoxIf, ScrollbarsIf } from "./CircleElements";
import { altBg, expBgColor } from "./Constants";
import { NavigationTabs } from "./CircleDashboard";
//#endregion

const CircleHomeFeed = ({ onClose }) => {
    log("CircleHomeFeed.render", -1);

    const [circleDashboardExpanded, setCircleDashboardExpanded] = useAtom(circleDashboardExpandedAtom);
    const { hostId, circleId } = useParams();

    return (
        <Flex flexGrow="1" width="100%" height="100%" flexDirection={circleDashboardExpanded ? "row" : "column"}>
            <ScrollbarsIf noScrollbars={circleDashboardExpanded}>
                <BoxIf noBox={!circleDashboardExpanded} order="0" width="375px">
                    <CircleAbout noScrollbars={!circleDashboardExpanded} />
                </BoxIf>
                <BoxIf
                    noBox={!circleDashboardExpanded}
                    order="1"
                    flexGrow="1"
                    align="center"
                    backgroundColor={expBgColor}
                >
                    {circleDashboardExpanded && <NavigationTabs />}
                    <ScrollbarsIf noScrollbars={!circleDashboardExpanded}>
                        <Circles
                            type="post"
                            types={["post", "circle"]}
                            categories={circleId === "global" ? [] : ["connected", "subcircle"]}
                            noScrollbars={true}
                            sortBy="newest"
                            asCards={true}
                        />
                    </ScrollbarsIf>
                </BoxIf>
            </ScrollbarsIf>
        </Flex>
    );
};

export default CircleHomeFeed;
