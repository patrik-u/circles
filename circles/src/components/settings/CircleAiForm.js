//#region imports
import { useRef, useState, useEffect } from "react";
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
import { adminCircles, combineDateAndTime, fromFsDate, log } from "components/Helpers";

import axios from "axios";
import { i18n, LanguagePicker } from "i18n/Localization";
import ReactQuill from "react-quill";
import DatePicker from "react-datepicker";
import { DatePickerInput } from "components/CircleElements";
import { useAtom } from "jotai";
import { userAtom, requestUserConnectionsAtom, userConnectionsAtom } from "components/Atoms";
import "react-datepicker/dist/react-datepicker.css";
import "react-quill/dist/quill.snow.css";
import CircleListItem from "components/CircleListItem";
import { IoInformationCircleSharp } from "react-icons/io5";
//#endregion

export const CircleAiForm = ({ isUpdateForm, circle, circleData, isGuideForm, onNext, onUpdate, onCancel }) => {
    const toast = useToast();

    if (!circleData) return null;

    return (
        <Formik
            enableReinitialize={true}
            initialValues={{
                system_message: circleData.ai?.system_message ?? "",
            }}
            onSubmit={async (values, actions) => {
                // update circle
                let updatedCircleData = {
                    ai: {
                        system_message: values.system_message,
                    },
                };

                if (circleData.ai?.system_message === values.system_message) {
                    // nothing changed
                    actions.setSubmitting(false);
                    // proceed to next step
                    if (onNext) {
                        onNext();
                    }
                    return;
                }

                //console.log("updating circle data", updatedCircleData);

                // update circle data
                let putCircleResult = null;
                try {
                    putCircleResult = await axios.put(`/circles/${circle.id}`, {
                        circlePrivateData: updatedCircleData,
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

                if (onUpdate) {
                    onUpdate(updatedCircleData);
                }
                if (onNext) {
                    onNext();
                }
                actions.setSubmitting(false);
            }}
            validate={(values) => {
                const errors = {};
                if (values.system_message.length > 10000) {
                    errors.name = i18n.t("System message can't contain more than 10000 characters");
                }
                return errors;
            }}
        >
            {({ values, errors, touched, isSubmitting }) => (
                <Form style={{ width: "100%" }}>
                    <VStack align="center">
                        <Text className="screenHeader">{isUpdateForm === true ? i18n.t("Name and description") : i18n.t(`Create new [${circle.type}]`)}</Text>

                        <VStack align="center" spacing="25px" width="100%" marginLeft="25px" marginRight="25px">
                            <Field name="system_message">
                                {({ field, form }) => (
                                    <FormControl isInvalid={form.errors.system_message && form.touched.system_message}>
                                        <FormLabel>{i18n.t(`AI system message`)}</FormLabel>
                                        <Text position="absolute" right="0px" top="5px" fontSize="12px" color="#bbb">
                                            {form?.values?.system_message ? form.values.system_message.length : 0} / 10000
                                        </Text>
                                        <InputGroup>
                                            <Textarea {...field} id="system_message" resize="none" maxLength="200" />
                                            {!form.errors.system_message && form.touched.system_message && (
                                                <InputRightElement children={<CheckIcon color="green.500" />} />
                                            )}
                                        </InputGroup>
                                        <FormErrorMessage>{form.errors.system_message}</FormErrorMessage>
                                    </FormControl>
                                )}
                            </Field>
                        </VStack>
                        <Box>
                            <HStack align="center" marginTop="10px">
                                <Button
                                    colorScheme="blue"
                                    mr={3}
                                    borderRadius="25px"
                                    isLoading={isSubmitting}
                                    type="submit"
                                    lineHeight="0"
                                    width={isGuideForm ? "150px" : "auto"}
                                >
                                    {isUpdateForm === true ? (isGuideForm ? i18n.t("Continue") : i18n.t("Save")) : i18n.t("Save and continue")}
                                </Button>
                                {isUpdateForm !== true && (
                                    <Button variant="ghost" borderRadius="25px" onClick={onCancel} isDisabled={isSubmitting} lineHeight="0">
                                        {i18n.t("Close")}
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

export default CircleAiForm;
