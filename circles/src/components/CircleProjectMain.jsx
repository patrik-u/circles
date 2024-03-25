//#region imports
import React from "react";
import { Box, Text } from "@chakra-ui/react";
import { log } from "@/components/Helpers";
//#endregion

const CircleProjectMain = ({ project }) => {
    log("CircleProject.render", -1);

    if (!project) return;

    return (
        <Box>
            <Text>Project Main</Text>
        </Box>
    );
};

export default CircleProjectMain;
