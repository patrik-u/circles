//#region imports
import React, { useState, useEffect } from "react";
import { Box, Flex, VStack, Button, useToast, HStack, Input, Textarea } from "@chakra-ui/react";
import axios from "axios";
import { log } from "../../components/Helpers";
//#endregion

const CircleAdmin = () => {
    const toast = useToast();
    const [isPosting, setIsPosting] = useState(false);
    const [command, setCommand] = useState("");
    const [commandOutput, setCommandOutput] = useState("");

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
                setCommand("");
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

    return (
        <>
            <Flex flexGrow="1" width="100%" height="100%" align="center" flexDirection="column" padding="20px">
                <HStack spacing="10px" width="100%">
                    <Input value={command} onChange={handleChange} />
                    <Button colorScheme="red" borderRadius="25px" onClick={() => update(true)} isLoading={isPosting} width="100%">
                        Run
                    </Button>
                </HStack>
                <Box marginTop="10px" flexGrow="1" width="100%">
                    <Textarea value={commandOutput} height="100%" readOnly />
                </Box>
            </Flex>
        </>
    );
};

export default CircleAdmin;
