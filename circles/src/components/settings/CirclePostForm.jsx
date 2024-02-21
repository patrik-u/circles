//#region imports
import { useRef, useState, useEffect, useMemo } from "react";
import { Form, Field, Formik } from "formik";
import { components } from "react-select";
import Select from "react-select";
import {
    Box,
    Tooltip,
    FormControl,
    Icon,
    FormLabel,
    InputRightElement,
    Input,
    Textarea,
    FormErrorMessage,
    Flex,
    InputGroup,
    HStack,
    VStack,
    Text,
    Checkbox,
    Button,
    IconButton,
    Select as ChakraSelect,
    useToast,
} from "@chakra-ui/react";
import { CheckIcon } from "@chakra-ui/icons";
import { adminCircles, combineDateAndTime, fromFsDate, log } from "@/components/Helpers";
import { CirclePicture, MetaData, NewSessionButton } from "@/components/CircleElements";
import axios from "axios";
import { i18n, LanguagePicker } from "@/i18n/Localization";
import ReactQuill from "react-quill";
import DatePicker from "react-datepicker";
import { DatePickerInput } from "@/components/CircleElements";
import { useAtom } from "jotai";
import { userAtom, requestUserConnectionsAtom, userConnectionsAtom, saveIdAtom } from "@/components/Atoms";
import "react-datepicker/dist/react-datepicker.css";
import "react-quill/dist/quill.snow.css";
import CircleListItem from "@/components/CircleListItem";
import { IoInformationCircleSharp } from "react-icons/io5";
import DocumentEditor from "@/components/document/DocumentEditor";
//#endregion

export const CirclePostForm = ({ isUpdateForm, circle, isGuideForm, onNext, onUpdate, onCancel }) => {
    const [user] = useAtom(userAtom);
    const [saveId] = useAtom(saveIdAtom);
    const toast = useToast();
    const [isInitialized, setIsInitialized] = useState(false);
    const contentDescriptionLength = 150;
    const createCircleInitialRef = useRef();

    const getPostContext = () => {
        if (circle?.parent_circle && circle?.parent_circle?.id !== "global") {
            return `Post in ${circle.parent_circle.name}`;
        } else {
            return `Post to Everyone`;
        }
    };

    if (!circle) return null;

    return (
        <Formik
            enableReinitialize={true}
            initialValues={{
                content: circle.content ?? "",
            }}
            onSubmit={async (values, actions) => {
                log("submitting form", 0, true);
                if (isUpdateForm) {
                    // update circle
                    let updatedCircleData = {
                        content: values.content,
                        parent_circle: circle?.parent_circle,
                        type: "post",
                    };

                    // update circle data
                    let putCircleResult = null;
                    try {
                        putCircleResult = await axios.put(`/circles/${circle.id}`, {
                            circleData: updatedCircleData,
                        });
                    } catch (err) {
                        console.error(err);
                    }

                    if (putCircleResult && !putCircleResult.data?.error) {
                        toast({
                            title: i18n.t("Settings updated"),
                            status: "success",
                            position: "top",
                            duration: 4500,
                            isClosable: true,
                        });
                    } else {
                        //console.log(circleId);
                        //console.log(JSON.stringify(putCircleResult.data, null, 2));
                        toast({
                            title: i18n.t("Failed to update settings"),
                            status: "error",
                            position: "top",
                            duration: 4500,
                            isClosable: true,
                        });
                    }

                    //setSelectedCircle({ ...selectedCircle, circle: { ...selectedCircle.circle, name: values.name, description: values.description } });
                    if (onUpdate) {
                        onUpdate(updatedCircleData);
                    }
                    if (onNext) {
                        onNext();
                    }
                    actions.setSubmitting(false);
                    return;
                }

                // create new circle
                let newCircleData = {
                    content: values.content,
                    parent_circle: circle?.parent_circle,
                    type: "post",
                };

                let putCircleResult = null;
                try {
                    putCircleResult = await axios.post(`/circles`, newCircleData);
                } catch (err) {
                    console.error(err);
                }

                // console.log(
                //     JSON.stringify(putCircleResult.data, null, 2)
                // );

                if (putCircleResult && !putCircleResult.data?.error) {
                    toast({
                        title: i18n.t("Circle created"),
                        status: "success",
                        position: "top",
                        duration: 4500,
                        isClosable: true,
                    });

                    if (onUpdate) {
                        onUpdate(putCircleResult.data.circle);
                    }
                } else {
                    toast({
                        title: i18n.t("Unable to create circle"),
                        status: "error",
                        position: "top",
                        duration: 4500,
                        isClosable: true,
                    });
                    onCancel();
                    actions.setSubmitting(false);
                    return;
                }

                actions.setSubmitting(false);

                // proceed to next step
                if (onNext) {
                    onNext();
                }
            }}
            validate={(values) => {
                const errors = {};
                return errors;
            }}
        >
            {({ values, errors, touched, isSubmitting }) => (
                <Form style={{ width: "100%" }}>
                    <Flex flexDirection="row" align="center">
                        <CirclePicture circle={user} size={40} hasPopover={false} />
                        <Flex flexDirection="column" marginLeft="10px">
                            <Text fontSize="16px" fontWeight="bold">
                                {user.name}
                            </Text>
                            <Flex flexDirection="row" align="center">
                                <Text fontSize="12px">Post in</Text>
                                <CirclePicture
                                    circle={circle?.parent_circle}
                                    size={16}
                                    hasPopover={false}
                                    marginLeft="2px"
                                />
                                <Text fontSize="12px" marginLeft="4px">
                                    {circle?.parent_circle?.name}
                                </Text>
                            </Flex>
                        </Flex>
                    </Flex>
                    <Field name="content">
                        {({ field, form }) => (
                            <FormControl isInvalid={form.errors.content && form.touched.content}>
                                <InputGroup>
                                    <Flex marginTop="20px" flexDirection="column" flexGrow="1">
                                        <Textarea
                                            {...field}
                                            id="content"
                                            ref={createCircleInitialRef}
                                            placeholder="Share your story"
                                            maxLength="70000"
                                            resize="none" // Prevents manual resizing
                                            overflow="auto" // Adds scrollbar when exceeded max height
                                            h="auto" // Initial height to auto to grow with content
                                            minH="100px" // Minimum height
                                            maxH="300px" // Maximum height before scrolling
                                            border="0" // Makes it borderless
                                            fontSize="18px"
                                            margin="0px"
                                            padding="0px"
                                            _focus={{ boxShadow: "none" }} // Removes focus outline to maintain borderless appearance
                                        />
                                    </Flex>
                                </InputGroup>
                                <FormErrorMessage>{form.errors.content}</FormErrorMessage>
                            </FormControl>
                        )}
                    </Field>

                    <VStack align="center">
                        <Box>
                            <HStack align="center" marginTop="10px">
                                <Button
                                    colorScheme="blue"
                                    mr={3}
                                    borderRadius="25px"
                                    isLoading={isSubmitting}
                                    isDisabled={saveId}
                                    type="submit"
                                    lineHeight="0"
                                    width={isGuideForm ? "150px" : "auto"}
                                >
                                    {isUpdateForm === true
                                        ? isGuideForm
                                            ? i18n.t("Continue")
                                            : i18n.t("Save")
                                        : i18n.t(`Post`)}
                                </Button>
                                {isUpdateForm !== true && (
                                    <Button
                                        variant="ghost"
                                        borderRadius="25px"
                                        onClick={onCancel}
                                        isDisabled={isSubmitting}
                                        lineHeight="0"
                                    >
                                        {i18n.t("Cancel")}
                                    </Button>
                                )}
                            </HStack>
                        </Box>
                    </VStack>
                </Form>
            )}
        </Formik>
    );
};

export default CirclePostForm;
