// #region imports
import React, { useEffect, useState, lazy } from "react";
import {
  Box, Image, Flex, SimpleGrid, Text, Input,
  VStack,
  Button,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useDisclosure
} from "@chakra-ui/react";
import { CirclePicture } from "components/CircleElements";
import { getImageKitUrl, log, singleLineEllipsisStyle } from "components/Helpers";
import { openCircle } from "components/Navigation";
import { useNavigateNoUpdates } from "components/RouterUtils";
import { useAtom } from "jotai";
import { isMobileAtom, userAtom, userDataAtom, homeExpandedAtom, searchResultsShownAtom } from "components/Atoms";
import CircleSearchBox from "components/CircleSearch";
import { motion, AnimatePresence } from "framer-motion";
import { IoMdSend } from "react-icons/io";
// #endregion

const Circle = lazy(() => import("components/Circle"));

export const LandingPage = () => {
  log("LandingPage.render", -1);
  const [index, setIndex] = useState(0);
  const words = ["fight", "hope", "dream", "long"];
  const showNew = true;
  const navigate = useNavigateNoUpdates();
  const [conversation, setConversation] = useState([]);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [input, setInput] = useState("");

  const sendMessage = async () => {
    // Save user answer
    setAnswers([...answers, { text: input, from: "user" }]);
    setConversation([...conversation, { text: input, from: "user" }]);

    // Make API call
    try {
      // clear input
      setInput("");

      //const response = await apiClient.post("/ai-conversation", { message: input, conversationId: conversationId });

      // Save AI response
      //setConversation([...conversation, { text: response.data.message, from: "assistant" }]);
      setStep(step + 1);
    } catch (error) {
      console.error("Error in sendMessage:", error);
    }
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((index + 1) % words.length);
    }, 6500);
    return () => clearInterval(interval);
  }, [index, words.length]);

  return (
    <Flex justifyContent="center" align="center" flexDirection="column" fontSize="60px" color="white" fontWeight="700">
      <Image src={getImageKitUrl("/splash.jpg")} width="100%" height="100%" position="absolute" top="0px" left="0px" />
      <Flex flexDirection="row" align="center" zIndex="100" marginTop="190px">
        <Text>
          What do you
        </Text>
        <Flex flexDirection="column" alignItems="center" width="200px" marginLeft="0px" marginRight="0px">
          <Text fontStyle="italic" color="#ffffb9">

            <AnimatePresence mode="wait">
              <motion.span
                key={index}
                initial={{ opacity: 0, rotateX: 180 }}
                animate={{ opacity: 1, rotateX: 0 }}
                exit={{ opacity: 0, rotateX: -180 }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
              >

                {words[index]}

              </motion.span>
            </AnimatePresence>

          </Text>
        </Flex>
        <Text>
          for?
        </Text>
      </Flex>
      <Box position="relative">
        <Input variant="outline" zIndex="100" textAlign="center" fontSize="30px"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          width="400px"
          height="50px"
          style={{ caretShape: "block" }}
          color="#ededed" autoFocus={true}
          borderRadius="35px"
          _focus={{
            border: "1px solid #ffffb9",
          }}
          margin="0px"
          padding="0px"
          backgroundColor="#f2fff814"
          paddingLeft="20px"
          paddingRight="50px"
          placeholder={`I ${words[index]} for...`}
        />

        <Box position="absolute" right="20px" top="42px" zIndex="100" width="26px" height="26px" flexShrink="0" cursor="pointer">
          <IoMdSend size="26px" color="#ffffdc" onClick={sendMessage} />
        </Box>
      </Box>
    </Flex>
  );
};

export default LandingPage;
