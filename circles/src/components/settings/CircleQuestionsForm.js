//#region imports
import { useState, useEffect } from "react";
import {
    Box,
    Textarea,
    Flex,
    HStack,
    VStack,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalBody,
    ModalCloseButton,
    Text,
    Icon,
    Button,
    useToast,
    useDisclosure,
} from "@chakra-ui/react";
import { Scrollbars } from "react-custom-scrollbars-2";
import { toastError, toastSuccess, singleLineEllipsisStyle, log } from "components/Helpers";
import { allQuestions } from "components/Constants";
import axios from "axios";
import { i18n } from "i18n/Localization";
import { RiDeleteBinLine } from "react-icons/ri";
import { AiOutlineEdit } from "react-icons/ai";
import "react-datepicker/dist/react-datepicker.css";
import "react-quill/dist/quill.snow.css";
//#endregion

export const CircleQuestionsForm = ({ isUpdateForm, circle, isGuideForm, onNext, onUpdate, onCancel }) => {
    const [isSavingQuestions, setIsSavingQuestions] = useState(false);
    const [questions, setQuestions] = useState();
    const [hasInitialized, setHasInitialized] = useState(false);
    const toast = useToast();

    useEffect(() => {
        log("CircleQuestionsForm.useEffect 1", -1);
        if (!circle?.questions || hasInitialized) return;
        setQuestions(circle?.questions);
        setHasInitialized(true);
    }, [circle?.questions, hasInitialized]);

    const onSaveQuestions = () => {
        let circleData = { questions };

        if (isGuideForm && !anyQuestionsAnswered()) {
            if (onNext) {
                onNext();
            }
            return;
        }

        setIsSavingQuestions(true);

        // update circle data
        axios
            .put(`/circles/${circle.id}`, {
                circleData,
            })
            .then((x) => {
                let result = x.data;
                if (result.error) {
                    toastError(toast, "Failed to save answers");
                } else {
                    toastSuccess(toast, "Answers saved");
                    if (onNext) {
                        onNext();
                    }
                }
                setIsSavingQuestions(false);
            })
            .catch((error) => {
                toastError(toast, "Failed to save answers");
                setIsSavingQuestions(false);
            });
    };

    const QuestionForm = ({ index, setIsAnswering }) => {
        const { isOpen: promptIsOpen, onOpen: promptOnOpen, onClose: promptOnClose } = useDisclosure();
        const [question, setQuestion] = useState(questions?.[`question${index}`]);
        const [answer, setAnswer] = useState(questions?.[`question${index}`]?.answer);
        const [isSavingQuestion, setIsSavingQuestion] = useState(false);
        const toast = useToast();

        const openQuestionsList = () => {
            promptOnOpen();
        };

        const getShuffledQuestions = () => {
            let filteredQuestions = allQuestions.filter(
                (x) =>
                    x.type.includes(circle.type) && questions?.question1?.id !== x.id && questions?.question2?.id !== x.id && questions?.question3?.id !== x.id
            );
            let shuffledQuestions = filteredQuestions
                .map((value) => ({ value, sort: Math.random() }))
                .sort((a, b) => a.sort - b.sort)
                .map(({ value }) => value);
            return shuffledQuestions;
        };

        const pickQuestion = (question) => {
            setAnswer("");
            question.answer = "";
            question.to_delete = false;
            setQuestion(question);
            //promptOnClose();
        };

        const onCancelQuestion = () => {
            setQuestion(questions?.[`question${index}`]);
            setAnswer(questions?.[`question${index}`]?.answer);
            promptOnClose();
        };

        const editAnswer = () => {
            promptOnOpen();
        };

        const deleteAnswer = () => {
            onSaveQuestion(true);
        };

        const onSaveQuestion = (deleteAnswer) => {
            setIsSavingQuestion(true);

            let circleData = {
                questions: {
                    [`question${index}`]: { ...question, to_delete: true },
                },
            };

            //console.log("saving circleData:" + JSON.stringify(circleData, null, 2));

            if (!isGuideForm) {
                // update circle data
                axios
                    .put(`/circles/${circle.id}`, {
                        circleData,
                    })
                    .then((x) => {
                        let result = x.data;
                        if (result.error) {
                            toastError(toast, "Failed to save answer");
                        } else {
                            //toastSuccess(toast, "Answer saved");
                            promptOnClose();
                        }
                        setIsSavingQuestion(false);
                    })
                    .catch((error) => {
                        toastError(toast, "Failed to save answer");
                        setIsSavingQuestion(false);
                    });
            } else {
                setIsSavingQuestion(false);
                promptOnClose();
            }

            if (deleteAnswer) {
                setQuestion(null);
                setQuestions({ ...questions, [`question${index}`]: { ...question, to_delete: true } });
                setAnswer("");
            } else {
                setQuestion({ ...question, answer, to_delete: false });
                setQuestions({ ...questions, [`question${index}`]: { ...question, answer: answer, to_delete: false } });
            }
        };

        return (
            <Box width="100%">
                {(!question?.answer || question?.to_delete) && (
                    <Button width="100%" onClick={openQuestionsList}>
                        {i18n.t(`Click here to answer your [${index}] question`)}
                    </Button>
                )}
                {question?.answer && !question?.to_delete && (
                    <Box position="relative" borderRadius="15px" border="2px dashed #dcdcdc" padding="10px" align="start">
                        <Text fontWeight="700">{question.label}</Text>
                        <Text style={singleLineEllipsisStyle}>{question.answer}</Text>
                        <HStack position="absolute" top="-15px" right="0px">
                            <Flex
                                backgroundColor="#f4f4f4"
                                _hover={{ backgroundColor: "#f5f5f5" }}
                                width="30px"
                                height="30px"
                                borderRadius="50%"
                                cursor="pointer"
                                alignItems="center"
                                justifyContent="center"
                                onClick={editAnswer}
                            >
                                <Icon width="22px" height="22px" color="black" as={AiOutlineEdit} cursor="pointer" />
                            </Flex>
                            <Flex
                                backgroundColor="#f4f4f4"
                                _hover={{ backgroundColor: "#f5f5f5" }}
                                width="30px"
                                height="30px"
                                borderRadius="50%"
                                cursor="pointer"
                                alignItems="center"
                                justifyContent="center"
                                onClick={deleteAnswer}
                            >
                                <Icon width="22px" height="22px" color="black" as={RiDeleteBinLine} cursor="pointer" />
                            </Flex>
                        </HStack>
                    </Box>
                )}
                <Modal isOpen={promptIsOpen} onClose={promptOnClose} size="xl" isLazy closeOnOverlayClick={false}>
                    <ModalOverlay />
                    <ModalContent borderRadius="25px">
                        <ModalCloseButton />
                        <ModalBody marginBottom="20px">
                            {(!question || question.to_delete) && (
                                <Box width="100%">
                                    <Text className="screenHeader" textAlign="center" marginTop="10px">
                                        {i18n.t("Choose a question")}
                                    </Text>
                                    <Box minHeight="600px" height="600px">
                                        <Scrollbars>
                                            {getShuffledQuestions().map((x) => (
                                                <Button key={x.id} onClick={() => pickQuestion(x)} margin="3px">
                                                    {x.label}
                                                </Button>
                                            ))}
                                        </Scrollbars>
                                    </Box>
                                </Box>
                            )}
                            {question && !question.to_delete && (
                                <Box width="100%">
                                    <Text className="screenHeader" textAlign="center" marginTop="10px">
                                        {question.label}
                                    </Text>
                                    <Box position="relative">
                                        <Text position="absolute" right="0px" top="-18px" fontSize="12px" color="#bbb">
                                            {answer ? answer.length : 0} / 1000
                                        </Text>
                                        <Textarea value={answer} onChange={(event) => setAnswer(event.target.value)} resize="none" maxLength="1000" />
                                    </Box>
                                    <HStack align="center" marginTop="10px">
                                        <Button
                                            colorScheme="blue"
                                            mr={3}
                                            borderRadius="25px"
                                            isLoading={isSavingQuestion}
                                            lineHeight="0"
                                            onClick={() => onSaveQuestion(false)}
                                        >
                                            {i18n.t("ok")}
                                        </Button>
                                        <Button variant="ghost" borderRadius="25px" onClick={onCancelQuestion} isDisabled={isSavingQuestion} lineHeight="0">
                                            {i18n.t("Close")}
                                        </Button>
                                    </HStack>
                                </Box>
                            )}
                        </ModalBody>
                    </ModalContent>
                </Modal>
            </Box>
        );
    };

    const anyQuestionsAnswered = () => {
        if (questions?.question0 && !questions?.question0.to_delete) {
            return true;
        }
        if (questions?.question1 && !questions?.question1.to_delete) {
            return true;
        }
        if (questions?.question2 && !questions?.question2.to_delete) {
            return true;
        }
        return false;
    };

    return (
        <VStack align="center">
            <Text className="screenHeader">{i18n.t("Questions")}</Text>
            <Text>{i18n.t(`Questions text [${circle.type}]`)}</Text>

            <Box align="center" width="100%" marginLeft="25px" marginRight="25px">
                <VStack align="start" spacing="20px">
                    <QuestionForm index={0} />
                    <QuestionForm index={1} />
                    <QuestionForm index={2} />
                </VStack>
            </Box>
            <Box>
                <HStack align="center" marginTop="10px">
                    <Button
                        colorScheme="blue"
                        mr={3}
                        borderRadius="25px"
                        isLoading={isSavingQuestions}
                        lineHeight="0"
                        onClick={onSaveQuestions}
                        width={isGuideForm ? "150px" : "auto"}
                    >
                        {isUpdateForm === true
                            ? isGuideForm
                                ? !anyQuestionsAnswered()
                                    ? i18n.t("Skip")
                                    : i18n.t("Continue")
                                : i18n.t("Save")
                            : i18n.t("Save and continue")}
                    </Button>
                    {isUpdateForm !== true && (
                        <Button variant="ghost" borderRadius="25px" onClick={onCancel} isDisabled={isSavingQuestions} lineHeight="0">
                            {i18n.t("Close")}
                        </Button>
                    )}
                </HStack>
            </Box>
        </VStack>
    );
};

export default CircleQuestionsForm;
