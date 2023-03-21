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

export const CircleContentForm = ({ isUpdateForm, circle, isGuideForm, onNext, onUpdate, onCancel }) => {
    const [user] = useAtom(userAtom);
    const toast = useToast();
    const createCircleInitialRef = useRef();
    const [richContent, setRichContent] = useState(circle?.content ?? "");
    const [contentText, setContentText] = useState(circle?.content_text ?? "");
    const [richContentCharCount, setRichContentCharCount] = useState(0);
    const [isPublicSetting, setIsPublicSetting] = useState(circle?.is_public === true);
    const [pickedDate, setPickedDate] = useState(fromFsDate(circle.starts_at) ?? new Date());
    const [isAllDay, setIsAllDay] = useState(false);
    const [, setRequestUserConnections] = useAtom(requestUserConnectionsAtom);
    const [userConnections] = useAtom(userConnectionsAtom);
    const [parentCircles, setParentCircles] = useState([]);
    const [selectedParentCircle, setSelectedParentCircle] = useState();
    const [isInitialized, setIsInitialized] = useState(false);
    const handleChange = (e) => {
        setSelectedParentCircle(e);
    };

    const { Option } = components;
    const CircleOption = ({ ...props }) => {
        return (
            <Option {...props}>
                <CircleListItem item={props.data} inSelect={true} />
            </Option>
        );
    };

    const onRichContentChange = (richText, delta, source, editor) => {
        let text = editor.getText();
        setContentText(text);
        setRichContent(richText);
        setRichContentCharCount(text ? text.trim().length : 0);
    };

    useEffect(() => {
        setRequestUserConnections(true);
    }, [setRequestUserConnections]);

    useEffect(() => {
        if (selectedParentCircle || !userConnections || isInitialized) {
            return;
        }

        const parentCircle = circle?.parent_circle;
        const latestParentCircles = adminCircles(userConnections)
            ?.map((x) => {
                return { ...x, value: x.id, label: x.name };
            })
            ?.concat(user ? [{ ...user, value: user.id, label: user.name }] : []);
        setParentCircles(latestParentCircles);

        setSelectedParentCircle(parentCircle && latestParentCircles.some((x) => x.id === parentCircle?.id) ? { ...parentCircle, value: parentCircle.id, label: parentCircle.name } : null);
        setIsInitialized(true);
    }, [user, userConnections, setSelectedParentCircle, selectedParentCircle, circle?.parent_circle, isInitialized, isUpdateForm]);

    const contentDescriptionLength = 150;

    if (!circle) return null;

    return (
        <Formik
            enableReinitialize={true}
            initialValues={{
                name: circle.name ?? "",
                description: circle.description ?? "",
                language: circle.language,
                isPublic: circle.is_public === true,
                time: circle.time ?? "12:00",
            }}
            onSubmit={async (values, actions) => {
                if (isUpdateForm) {
                    // update circle
                    let updatedCircleData = {
                        name: values.name,
                        description: values.description,
                        parentCircle: selectedParentCircle,
                        isPublic: isPublicSetting,
                    };

                    if (circle.type === "event") {
                        updatedCircleData.startsAt = combineDateAndTime(pickedDate, values.time);
                        updatedCircleData.time = values.time;
                        updatedCircleData.isAllDay = isAllDay;
                    }

                    updatedCircleData.content = richContent;
                    if (contentText) {
                        updatedCircleData.content_text = contentText;
                        if (!updatedCircleData.description) {
                            // if no description, use first part of content
                            updatedCircleData.description = contentText.substring(0, contentDescriptionLength);
                            if (updatedCircleData.description.length >= contentDescriptionLength) {
                                updatedCircleData.description += "...";
                            }
                        }
                    }

                    if (!isGuideForm) {
                        updatedCircleData.language = values.language;
                    } else {
                        if (circle.name === values.name && circle.content === values.content) {
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
                    let putCircleResult = await axios.put(`/circles/${circle.id}`, {
                        circleData: updatedCircleData,
                    });

                    if (!putCircleResult.data?.error) {
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
                    language: values.language,
                    type: circle.type,
                    parentCircle: selectedParentCircle,
                    isPublic: isPublicSetting,
                };

                if (circle.type === "event") {
                    newCircleData.startsAt = combineDateAndTime(pickedDate, values.time);
                    newCircleData.time = values.time;
                    newCircleData.isAllDay = isAllDay;
                }

                newCircleData.content = richContent;
                if (contentText) {
                    newCircleData.content_text = contentText;
                    if (!newCircleData.description) {
                        // if no description, use first part of content
                        newCircleData.description = contentText.substring(0, contentDescriptionLength);
                        if (newCircleData.description.length >= contentDescriptionLength) {
                            newCircleData.description += "...";
                        }
                    }
                }

                let putCircleResult = await axios.post(`/circles`, newCircleData);

                // console.log(
                //     JSON.stringify(putCircleResult.data, null, 2)
                // );

                if (!putCircleResult.data?.error) {
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
                    log(JSON.stringify(putCircleResult.data.error, null, 2), 0, true);
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

                if (circle.type === "event") {
                    if (!isAllDay && !values.time) {
                        errors.time = i18n.t("Specify time");
                    }
                }

                return errors;
            }}
        >
            {({ values, errors, touched, isSubmitting }) => (
                <Form style={{ width: "100%" }}>
                    <VStack align="center">
                        <Text className="screenHeader">{isUpdateForm === true ? i18n.t("Name and description") : i18n.t(`Create new [${circle.type}]`)}</Text>

                        <VStack align="center" spacing="25px" width="100%" marginLeft="25px" marginRight="25px">
                            <Field name="name">
                                {({ field, form }) => (
                                    <FormControl isInvalid={form.errors.name && form.touched.name}>
                                        <FormLabel>{i18n.t(`Name of [${circle.type}]`)}</FormLabel>
                                        <Text position="absolute" right="0px" top="5px" fontSize="12px" color="#bbb">
                                            {form?.values?.name ? form.values.name.length : 0} / 50
                                        </Text>
                                        <InputGroup>
                                            <Input {...field} id="name" ref={createCircleInitialRef} type="text" maxLength="50" />
                                            {!form.errors.name && form.touched.name && <InputRightElement children={<CheckIcon color="green.500" />} />}
                                        </InputGroup>
                                        <FormErrorMessage>{form.errors.name}</FormErrorMessage>
                                    </FormControl>
                                )}
                            </Field>

                            {circle.type === "event" && (
                                <Flex width="100%">
                                    <VStack align="left" flexGrow="1" marginRight="10px">
                                        <Text textAlign="left">{i18n.t("Date")}</Text>
                                        <DatePicker selected={pickedDate} onChange={(d) => setPickedDate(d)} customInput={<DatePickerInput />} />
                                    </VStack>
                                    <Field name="time">
                                        {({ field, form }) => (
                                            <VStack align="left" flexGrow="1">
                                                <Text textAlign="left">{i18n.t("Time")}</Text>
                                                <ChakraSelect {...field} name="time" id="time" placeholder={i18n.t("Specify time")} isDisabled={isAllDay}>
                                                    {Array.prototype.concat
                                                        .apply(
                                                            [],
                                                            [...Array(24).keys()].map((x) => [
                                                                ("00" + x).slice(-2) + ":00",
                                                                ("00" + x).slice(-2) + ":15",
                                                                ("00" + x).slice(-2) + ":30",
                                                                ("00" + x).slice(-2) + ":45",
                                                            ])
                                                        )
                                                        .map((y) => (
                                                            <option key={y} value={y}>
                                                                {y}
                                                            </option>
                                                        ))}
                                                </ChakraSelect>
                                                <Checkbox isChecked={isAllDay} onChange={(e) => setIsAllDay(e.target.checked)}>
                                                    {i18n.t("All day")}
                                                </Checkbox>
                                                <FormControl isInvalid={form.errors.time && form.touched.time && !isAllDay}>
                                                    <FormErrorMessage>{form.errors.time}</FormErrorMessage>
                                                </FormControl>
                                            </VStack>
                                        )}
                                    </Field>
                                </Flex>
                            )}

                            {!isGuideForm && isUpdateForm && (
                                <Field name="description">
                                    {({ field, form }) => (
                                        <FormControl isInvalid={form.errors.description && form.touched.description}>
                                            <FormLabel>{i18n.t(`Description of [${circle.type}]`)}</FormLabel>
                                            <Text position="absolute" right="0px" top="5px" fontSize="12px" color="#bbb">
                                                {form?.values?.description ? form.values.description.length : 0} / 200
                                            </Text>
                                            <InputGroup>
                                                <Textarea {...field} id="description" resize="none" maxLength="200" />
                                                {!form.errors.description && form.touched.description && <InputRightElement children={<CheckIcon color="green.500" />} />}
                                            </InputGroup>
                                            <FormErrorMessage>{form.errors.description}</FormErrorMessage>
                                        </FormControl>
                                    )}
                                </Field>
                            )}

                            <Field name="content">
                                {({ field, form }) => (
                                    <FormControl isInvalid={form.errors.content && form.touched.content}>
                                        <FormLabel>{i18n.t(`[${circle.type}] content`)}</FormLabel>
                                        <Text position="absolute" right="0px" top="5px" fontSize="12px" color="#bbb">
                                            {richContentCharCount} / 100 000
                                        </Text>
                                        <ReactQuill theme="snow" value={richContent} onChange={onRichContentChange} minHeight="100px" maxWidth="100%" />
                                        <FormErrorMessage>{form.errors.content}</FormErrorMessage>
                                    </FormControl>
                                )}
                            </Field>

                            {!isGuideForm && parentCircles && (
                                <Flex flexDirection="column" width="100%">
                                    <Text textAlign="start">{i18n.t(`Parent circle`)}</Text>
                                    <Select options={parentCircles} components={{ Option: CircleOption }} value={selectedParentCircle} onChange={handleChange} textAlign="start" isClearable={true} />
                                </Flex>
                            )}

                            {!isGuideForm && (
                                <Flex flexDirection="row" alignSelf="start">
                                    <Field name="isPublic">
                                        {({ field, form }) => (
                                            <FormControl isInvalid={form.errors.isPublic && form.touched.isPublic}>
                                                <Checkbox isChecked={isPublicSetting} id="isPublic" onChange={(e) => setIsPublicSetting(e.target.checked)}>
                                                    {i18n.t(`Public ${circle?.type}`)}
                                                </Checkbox>
                                            </FormControl>
                                        )}
                                    </Field>
                                    <Tooltip label={`If public anyone can connect the ${circle?.type} and chat without approval from admins.`} aria-label="A tooltip">
                                        <Flex flexDirection="row" align="center" marginLeft="10px">
                                            <Icon as={IoInformationCircleSharp} color="#3182ce" />
                                        </Flex>
                                    </Tooltip>
                                </Flex>
                            )}

                            {!isGuideForm && (
                                <Flex flexDirection="row" width="100%">
                                    <Box flexGrow="1" flexShrink="0">
                                        <Field name="language">
                                            {({ field, form }) => (
                                                <FormControl isInvalid={form.errors.language && form.touched.language}>
                                                    <FormLabel>{i18n.t("Language")}</FormLabel>
                                                    <LanguagePicker field={field} />
                                                </FormControl>
                                            )}
                                        </Field>
                                    </Box>
                                </Flex>
                            )}
                        </VStack>
                        <Box>
                            <HStack align="center" marginTop="10px">
                                <Button colorScheme="blue" mr={3} borderRadius="25px" isLoading={isSubmitting} type="submit" lineHeight="0" width={isGuideForm ? "150px" : "auto"}>
                                    {isUpdateForm === true ? (isGuideForm ? i18n.t("Continue") : i18n.t("Save")) : i18n.t(`Create [${circle.type}] and continue`)}
                                </Button>
                                {isUpdateForm !== true && (
                                    <Button variant="ghost" borderRadius="25px" onClick={onCancel} isDisabled={isSubmitting} lineHeight="0">
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

export default CircleContentForm;
