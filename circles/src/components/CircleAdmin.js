//#region imports
import React, { useState } from "react";
import { Box, Flex, Button, useToast, HStack, Input, Textarea, Icon } from "@chakra-ui/react";
import axios from "axios";
import { log } from "components/Helpers";
import { useAtom } from "jotai";
import { isMobileAtom, circleAtom, toggleAboutAtom } from "components/Atoms";
import { MdOutlineClose } from "react-icons/md";
//#endregion

const CircleAdmin = ({ onClose }) => {
    const toast = useToast();
    const [isPosting, setIsPosting] = useState(false);
    const [command, setCommand] = useState("");
    const [commandOutput, setCommandOutput] = useState("");
    const [isMobile] = useAtom(isMobileAtom);

    const handleChange = (e) => {
        setCommand(e.target.value);
    };

    // calls update on server
    const update = async () => {
        setIsPosting(true);
        setCommandOutput("");

        try {
            let postTestResult = await axios.post(`/update`, { command });
            if (postTestResult.data?.error) {
                //console.log(JSON.stringify(postFollowerResult, null, 2));
                setCommandOutput(JSON.stringify(postTestResult.data, null, 2));
                toast({
                    title: "Error running command",
                    status: "error",
                    position: "top",
                    duration: 4500,
                    isClosable: true,
                });
            } else {
                //setCommand("");
                setCommandOutput(JSON.stringify(postTestResult.data, null, 2));
                toast({
                    title: "Command executed",
                    status: "success",
                    position: "top",
                    duration: 4500,
                    isClosable: true,
                });
            }
        } catch (error) {
            setCommandOutput(JSON.stringify(error, null, 2));
            toast({
                title: "Error running command",
                status: "error",
                position: "top",
                duration: 4500,
                isClosable: true,
            });
            log(error, 0);
        }

        //console.log(JSON.stringify(postTestResult.data, null, 2));

        setIsPosting(false);
    };

    const iconSize = 12;

    return (
        <Box
            bgGradient="linear(to-r,#d3d1d3,#ffffff)"
            borderRadius="10px"
            margin={isMobile ? "0px" : "0px 10px 10px 10px"}
            padding="5px"
            // flexGrow="1"
            pointerEvents="auto"
            position="relative"
            overflow="hidden"
            height={"100%"}
            width="auto"
        >
            <Box
                bgGradient="linear(to-r,#d3d1d3,#ffffff)"
                borderRadius="10px"
                padding={isMobile ? "0px" : "10px 10px 10px 10px"}
                // flexGrow="1"
                pointerEvents="auto"
                position="relative"
                overflow="hidden"
                height={"100%"}
                width="auto"
            >
                <Flex flexGrow="1" width="100%" height="100%" align="center" flexDirection="column">
                    <HStack spacing="10px" width="100%">
                        <Input value={command} onChange={handleChange} backgroundColor="white" />
                        <Box>
                            <Button colorScheme="red" borderRadius="25px" onClick={() => update(true)} isLoading={isPosting} width="200px" marginRight="40px">
                                Run
                            </Button>
                        </Box>
                    </HStack>
                    <Box marginTop="10px" flexGrow="1" width="100%">
                        <Textarea value={commandOutput} height="100%" backgroundColor="white" readOnly />
                    </Box>

                    <Flex
                        width={iconSize + 8 + "px"}
                        height={iconSize + 8 + "px"}
                        _hover={{ color: "#e6e6e6", transform: "scale(1.1)" }}
                        _active={{ transform: "scale(0.98)" }}
                        borderRadius="50%"
                        justifyContent="center"
                        alignItems="center"
                        onClick={onClose}
                        cursor="pointer"
                        position="absolute"
                        top="10px"
                        right="10px"
                    >
                        <Icon width={iconSize + 8 + "px"} height={iconSize + 8 + "px"} color={"#333"} as={MdOutlineClose} cursor="pointer" />
                    </Flex>
                </Flex>
            </Box>
        </Box>
    );
};

export default CircleAdmin;
