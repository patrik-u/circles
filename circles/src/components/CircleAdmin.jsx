//#region imports
import React, { useState } from "react";
import { Box, Flex, Button, useToast, HStack, Input, Textarea, Icon } from "@chakra-ui/react";
import axios from "axios";
import { log } from "@/components/Helpers";
import { useAtom } from "jotai";
import { isMobileAtom, circleAtom, toggleAboutAtom } from "@/components/Atoms";
import { MdOutlineClose } from "react-icons/md";
import { CircleRichText } from "@/components/CircleElements";
import Scrollbars from "react-custom-scrollbars-2";
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
                setCommandOutput(JSON.stringify(postTestResult.data, null, 2)?.replace(/\\n/g, "\n\n"));
                toast({
                    title: "Error running command",
                    status: "error",
                    position: "top",
                    duration: 4500,
                    isClosable: true,
                });
            } else {
                //setCommand("");
                setCommandOutput(JSON.stringify(postTestResult.data, null, 2)?.replace(/\\n/g, "\n\n"));
                toast({
                    title: "Command executed",
                    status: "success",
                    position: "top",
                    duration: 4500,
                    isClosable: true,
                });
            }
        } catch (error) {
            setCommandOutput(JSON.stringify(error, null, 2)?.replace(/\\n/g, "\n\n"));
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

    return (
        <Flex
            flexGrow="1"
            width="100%"
            height="100%"
            align="center"
            flexDirection="column"
            padding="10px"
            paddingBottom="40px"
        >
            <HStack spacing="10px" width="100%">
                <Input value={command} onChange={handleChange} backgroundColor="white" />
                <Box>
                    <Button
                        colorScheme="red"
                        borderRadius="25px"
                        onClick={() => update(true)}
                        isLoading={isPosting}
                        width="150px"
                    >
                        Run
                    </Button>
                </Box>
            </HStack>
            <Box marginTop="10px" flexGrow="1" width="100%">
                <Textarea value={commandOutput} height="100%" backgroundColor="white" readOnly resize="none" />
            </Box>
        </Flex>
    );
};

export default CircleAdmin;
