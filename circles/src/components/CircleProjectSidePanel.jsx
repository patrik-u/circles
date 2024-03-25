//#region imports
import React from "react";
import { Box, Text, Flex } from "@chakra-ui/react";
import { log } from "@/components/Helpers";
import { CircleCover, CirclePicture, CircleRichText } from "@/components/CircleElements";
//#endregion

const CircleProjectSidePanel = ({ project }) => {
    log("CircleProject.render", -1);

    if (!project) return;

    return (
        <Box>
            <Text>Project Side Panel</Text>
            <Text fontSize="20px" fontWeight="700" marginTop="20px">
                Name & Picture
            </Text>
            <Flex flexDirection="row" align="center">
                <CirclePicture circle={project} size={60} hasPopover={true} />
                <Text fontSize="28px" fontWeight="700" marginLeft="10px">
                    {project.name}
                </Text>
            </Flex>
            <Text fontSize="20px" fontWeight="700" marginTop="20px">
                Description
            </Text>
            {project.description && (
                <Box align="left" marginTop="10px" backgroundColor="#ffffffaa" borderRadius="7px" padding={"5px"}>
                    <CircleRichText mentions={project.mentions}>{project.description}</CircleRichText>
                </Box>
            )}
            <Text fontSize="20px" fontWeight="700" marginTop="20px">
                Cover Image
            </Text>
            <CircleCover circle={project} />
        </Box>
    );
};

export default CircleProjectSidePanel;
