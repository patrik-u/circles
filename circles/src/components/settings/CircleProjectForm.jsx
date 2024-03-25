//#region imports
import React, { useRef, useState, useMemo } from "react";
import { Form, Field, Formik } from "formik";
import Select from "react-select";
import {
    Box,
    FormControl,
    FormLabel,
    InputRightElement,
    Input,
    FormErrorMessage,
    Flex,
    InputGroup,
    HStack,
    VStack,
    Text,
    Button,
    useToast,
} from "@chakra-ui/react";
import { CheckIcon } from "@chakra-ui/icons";
import { log } from "@/components/Helpers";
import axios from "axios";
import { i18n } from "@/i18n/Localization";
import { useAtom } from "jotai";
import { userAtom, saveIdAtom } from "@/components/Atoms";
import "react-datepicker/dist/react-datepicker.css";
import "react-quill/dist/quill.snow.css";
import DocumentEditor from "@/components/document/DocumentEditor";
//#endregion

export const CircleProjectForm = ({ isUpdateForm, circle, isGuideForm, onNext, onUpdate, onCancel }) => {
    const [user] = useAtom(userAtom);
    const [saveId] = useAtom(saveIdAtom);
    const toast = useToast();
    const createCircleInitialRef = useRef();
    const [richContent, setRichContent] = useState({
        id: circle?.id,
        content: circle?.content ?? "",
        lexical_content: circle?.lexical_content,
        version: circle?.version,
    });
    const richContentCharCount = useMemo(
        () => (richContent?.content ? richContent.content.trim().length : 0),
        [richContent]
    );
   

    const contentDescriptionLength = 150;

    if (!circle) return null;

    return (
        <Formik
            enableReinitialize={true}
            initialValues={{
                name: circle.name ?? "",
                description: circle.description ?? "",
            }}
            onSubmit={async (values, actions) => {
                log("submitting form", 0, true);
                if (isUpdateForm) {
                    // update circle
                    let updatedCircleData = {
                        name: values.name,
                        description: values.description,
                        parent_circle: circle?.parent_circle,
                    };

                    //log("updating circle content" + richContent.content, 0, true);
                    if (circle?.type !== "document") {
                        updatedCircleData.content = richContent.content;
                        updatedCircleData.lexical_content = richContent.lexical_content;
                        //log("updating circle lexical_content" + richContent.lexical_content, 0, true);
                        if (updatedCircleData.content) {
                            if (!updatedCircleData.description) {
                                // if no description, use first part of content
                                updatedCircleData.description = updatedCircleData.content.substring(
                                    0,
                                    contentDescriptionLength
                                );
                                if (updatedCircleData.description.length >= contentDescriptionLength) {
                                    updatedCircleData.description += "...";
                                }
                            }
                        }
                    }

                    if (!isGuideForm) {
                        updatedCircleData.language = values.language;
                    } else {
                        if (
                            circle.name === values.name &&
                            circle.description === values.description &&
                            circle.content === richContent.content
                        ) {
                            // nothing changed
                            actions.setSubmitting(false);
                            // proceed to next step
                            if (onNext) {
                                onNext();
                            }
                            return;
                        }
                    }

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
                }

                // create new circle
                let newCircleData = {
                    name: values.name,
                    description: values.description,
                    type: circle.type,
                    parent_circle: circle?.parent_circle,
                };


                newCircleData.content = richContent?.content ?? "";
                newCircleData.lexical_content = richContent?.lexical_content;
                if (newCircleData.content) {
                    if (!newCircleData.description) {
                        // if no description, use first part of content
                        newCircleData.description = newCircleData.content.substring(0, contentDescriptionLength);
                        if (newCircleData.description.length >= contentDescriptionLength) {
                            newCircleData.description += "...";
                        }
                    }
                }

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
                if (!values.name) {
                    errors.name = i18n.t("Enter name");
                } else if (values.name.length > 50) {
                    errors.name = i18n.t("Name can't contain more than 50 characters");
                }
                if (values.description && values.description.length > 200) {
                    errors.description = i18n.t("Description can't contain more than 200 characters");
                }

                if (richContentCharCount > 10000) {
                    errors.content = i18n.t("Content can't contain more than 100 000 characters");
                }

                return errors;
            }}
        >
            {({ values, errors, touched, isSubmitting }) => (
                <Form style={{ width: "100%" }}>
                    <VStack align="center">
                        <Text className="screenHeader">
                            {isUpdateForm === true
                                ? i18n.t("Name and description")
                                : i18n.t(`Create new [${circle.type}]`)}
                        </Text>

                        <VStack align="center" spacing="25px" width="100%" marginLeft="25px" marginRight="25px">
                            <Field name="name">
                                {({ field, form }) => (
                                    <FormControl isInvalid={form.errors.name && form.touched.name}>
                                        <FormLabel>{i18n.t(`Name of [${circle.type}]`)}</FormLabel>
                                        <Text position="absolute" right="0px" top="5px" fontSize="12px" color="#bbb">
                                            {form?.values?.name ? form.values.name.length : 0} / 50
                                        </Text>
                                        <InputGroup>
                                            <Input
                                                {...field}
                                                id="name"
                                                ref={createCircleInitialRef}
                                                type="text"
                                                maxLength="50"
                                            />
                                            {!form.errors.name && form.touched.name && (
                                                <InputRightElement children={<CheckIcon color="green.500" />} />
                                            )}
                                        </InputGroup>
                                        <FormErrorMessage>{form.errors.name}</FormErrorMessage>
                                    </FormControl>
                                )}
                            </Field>


                            {circle?.type !== "document" && (
                                <Box flexDirection="column" width="100%" position="relative">
                                    <FormLabel>{i18n.t(`[${circle.type}] content`)}</FormLabel>
                                    <DocumentEditor
                                        disableAutoSave={true}
                                        initialDocument={richContent}
                                        document={richContent}
                                        setDocument={setRichContent}
                                        condensed={true}
                                        height="300px"
                                        border="1px solid #E2E8F0"
                                        borderRadius="0.375rem"
                                    />
                                    <Text position="absolute" right="0px" top="5px" fontSize="12px" color="#bbb">
                                        {richContentCharCount} / 100 000
                                    </Text>
                                </Box>
                            )}

                        </VStack>
                    </VStack>
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
                                    : i18n.t(`Create [${circle.type}] and continue`)}
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
                </Form>
            )}
        </Formik>
    );
};

export default CircleProjectForm;
