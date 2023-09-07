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

export const CircleOffersAndNeedsForm = ({ isUpdateForm, circle, isGuideForm, onNext, onUpdate, onCancel }) => {
    const [user] = useAtom(userAtom);
    const [saveId] = useAtom(saveIdAtom);
    const toast = useToast();
    const createCircleInitialRef = useRef();
    const [isInitialized, setIsInitialized] = useState(false);

    const offersLength = 400;
    const needsLength = 400;

    if (!circle) return null;

    return (
        <Formik
            enableReinitialize={true}
            initialValues={{
                offers: circle.offers ?? "",
                needs: circle.needs ?? "",
            }}
            onSubmit={async (values, actions) => {
                log("submitting form", 0, true);

                if (isGuideForm) {
                    if (circle.offers === values.offers && circle.needs === values.needs) {
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
                    offers: values.offers,
                    needs: values.needs,
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

                //setSelectedCircle({ ...selectedCircle, circle: { ...selectedCircle.circle, name: values.name, description: values.description } });
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
                if (values.offers && values.offers.length > 1000) {
                    errors.offers = i18n.t("Offers can't contain more than 1000 characters");
                }
                if (values.needs && values.needs.length > 1000) {
                    errors.offers = i18n.t("Needs can't contain more than 1000 characters");
                }

                return errors;
            }}
        >
            {({ values, errors, touched, isSubmitting }) => (
                <Form style={{ width: "100%" }}>
                    <VStack align="center">
                        <Text className="screenHeader">{i18n.t("Offers and needs")}</Text>

                        <VStack align="center" spacing="25px" width="100%" marginLeft="25px" marginRight="25px">
                            <Field name="offers">
                                {({ field, form }) => (
                                    <FormControl isInvalid={form.errors.offers && form.touched.offers}>
                                        <Flex flexDirection="row" alignSelf="start">
                                            <Text>{i18n.t(`Offers`)}</Text>
                                            <Tooltip
                                                label={
                                                    circle?.type === "user" || circle?.type === "ai_agent"
                                                        ? `Share the skills, resources, or expertise you can offer to the community. What can you contribute or help with?`
                                                        : `List the collective strengths, resources, or services this ${circle?.type} can offer to members and the broader community. How can this ${circle?.type} be of service?`
                                                }
                                                aria-label="A tooltip"
                                            >
                                                <Flex flexDirection="row" align="center" marginLeft="5px">
                                                    <Icon as={IoInformationCircleSharp} color="#3182ce" />
                                                </Flex>
                                            </Tooltip>
                                        </Flex>
                                        <Text position="absolute" right="0px" top="5px" fontSize="12px" color="#bbb">
                                            {form?.values?.offers ? form.values.offers.length : 0} / 1000
                                        </Text>
                                        <InputGroup>
                                            <Textarea {...field} id="offers" resize="none" maxLength="1000" />
                                            {!form.errors.offers && form.touched.offers && <InputRightElement children={<CheckIcon color="green.500" />} />}
                                        </InputGroup>
                                        <FormErrorMessage>{form.errors.offers}</FormErrorMessage>
                                    </FormControl>
                                )}
                            </Field>

                            <Field name="needs">
                                {({ field, form }) => (
                                    <FormControl isInvalid={form.errors.needs && form.touched.needs}>
                                        <Flex flexDirection="row" alignSelf="start">
                                            <Text>{i18n.t(`Needs`)}</Text>
                                            <Tooltip
                                                label={
                                                    circle?.type === "user" || circle?.type === "ai_agent"
                                                        ? `Highlight any specific needs or support you're seeking. What can the community assist you with?`
                                                        : `Specify the resources, support, or contributions required for this ${circle?.type}'s mission or goals. What would help propel this ${circle?.type} forward?`
                                                }
                                                aria-label="A tooltip"
                                            >
                                                <Flex flexDirection="row" align="center" marginLeft="5px">
                                                    <Icon as={IoInformationCircleSharp} color="#3182ce" />
                                                </Flex>
                                            </Tooltip>
                                        </Flex>
                                        <Text position="absolute" right="0px" top="5px" fontSize="12px" color="#bbb">
                                            {form?.values?.needs ? form.values.needs.length : 0} / 1000
                                        </Text>
                                        <InputGroup>
                                            <Textarea {...field} id="needs" resize="none" maxLength="1000" />
                                            {!form.errors.needs && form.touched.needs && <InputRightElement children={<CheckIcon color="green.500" />} />}
                                        </InputGroup>
                                        <FormErrorMessage>{form.errors.needs}</FormErrorMessage>
                                    </FormControl>
                                )}
                            </Field>
                        </VStack>
                        <Box>
                            <HStack align="center" marginTop="10px">
                                <Button colorScheme="blue" mr={3} borderRadius="25px" isLoading={isSubmitting} type="submit" lineHeight="0">
                                    {isUpdateForm === true
                                        ? isGuideForm
                                            ? !values?.needs && !values?.offers
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

export default CircleOffersAndNeedsForm;
