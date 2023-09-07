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
import { adminCircles, combineDateAndTime, fromFsDate, log } from "components/Helpers";

import axios from "axios";
import { i18n, LanguagePicker } from "i18n/Localization";
import ReactQuill from "react-quill";
import DatePicker from "react-datepicker";
import { DatePickerInput } from "components/CircleElements";
import { useAtom } from "jotai";
import { userAtom, requestUserConnectionsAtom, userConnectionsAtom, saveIdAtom } from "components/Atoms";
import "react-datepicker/dist/react-datepicker.css";
import "react-quill/dist/quill.snow.css";
import CircleListItem from "components/CircleListItem";
import { IoInformationCircleSharp } from "react-icons/io5";
import DocumentEditor from "components/document/DocumentEditor";
//#endregion

export const CircleMissionForm = ({ isUpdateForm, circle, isGuideForm, onNext, onUpdate, onCancel }) => {
    const toast = useToast();

    if (!circle) return null;

    return (
        <Formik
            enableReinitialize={true}
            initialValues={{
                mission: circle.mission ?? "",
            }}
            onSubmit={async (values, actions) => {
                log("submitting form", 0, true);

                if (isGuideForm) {
                    if (circle.mission === values.mission) {
                        // nothing changed
                        if (onNext) {
                            onNext();
                        }
                        actions.setSubmitting(false);
                        return;
                    }
                }

                // update circle
                let updatedCircleData = {
                    mission: values.mission,
                };
                //console.log("updating circle data", updatedCircleData);
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

                if (onUpdate) {
                    onUpdate(updatedCircleData);
                }
                if (onNext) {
                    onNext();
                }
                actions.setSubmitting(false);
                return;
            }}
            validate={(values) => {
                const errors = {};
                if (values.mission && values.mission.length > 1000) {
                    errors.mission = i18n.t("Mission can't contain more than 1000 characters");
                }

                return errors;
            }}
        >
            {({ values, errors, touched, isSubmitting }) => (
                <Form style={{ width: "100%" }}>
                    <VStack align="center">
                        <Text className="screenHeader">{i18n.t("Mission")}</Text>
                        <Text>
                            {circle?.type === "user" || circle?.type === "ai_agent"
                                ? `Define your personal purpose or the impact you aim to create. What drives you and guides your actions in this community?`
                                : `Articulate the core purpose or goal of this ${circle?.type}. What unites its participants and directs its endeavors?`}
                        </Text>

                        <VStack align="center" spacing="25px" width="100%" marginLeft="25px" marginRight="25px">
                            <Field name="mission">
                                {({ field, form }) => (
                                    <FormControl isInvalid={form.errors.mission && form.touched.mission}>
                                        <Text position="absolute" right="0px" top="5px" fontSize="12px" color="#bbb">
                                            {form?.values?.mission ? form.values.mission.length : 0} / 1000
                                        </Text>
                                        <InputGroup>
                                            <Textarea {...field} id="offers" resize="none" maxLength="1000" />
                                            {!form.errors.mission && form.touched.mission && <InputRightElement children={<CheckIcon color="green.500" />} />}
                                        </InputGroup>
                                        <FormErrorMessage>{form.errors.mission}</FormErrorMessage>
                                    </FormControl>
                                )}
                            </Field>
                        </VStack>
                        <Box>
                            <HStack align="center" marginTop="10px">
                                <Button colorScheme="blue" mr={3} borderRadius="25px" isLoading={isSubmitting} type="submit" lineHeight="0">
                                    {isUpdateForm === true
                                        ? isGuideForm
                                            ? !values?.mission
                                                ? i18n.t("Skip")
                                                : i18n.t("Continue")
                                            : i18n.t("Save")
                                        : i18n.t("Save and continue")}
                                </Button>
                            </HStack>
                        </Box>
                    </VStack>
                </Form>
            )}
        </Formik>
    );
};

export default CircleMissionForm;
