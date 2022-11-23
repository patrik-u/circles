//#region imports
import { useContext, useRef, useState, forwardRef, useEffect, useMemo } from "react";
import { Form, Field, Formik } from "formik";
import MultiSelect, { components } from "react-select";
import Select from "react-select";
// chakra
import {
    Box,
    FormControl,
    FormLabel,
    InputRightElement,
    Input,
    Textarea,
    FormErrorMessage,
    Flex,
    Spinner,
    InputGroup,
    HStack,
    VStack,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalBody,
    ModalCloseButton,
    Text,
    Image,
    Icon,
    Checkbox,
    Button,
    Select as ChakraSelect,
    RadioGroup,
    Stack,
    Radio,
    StackDivider,
    useToast,
    useDisclosure,
} from "@chakra-ui/react";
import { CheckIcon } from "@chakra-ui/icons";
import { Scrollbars } from "react-custom-scrollbars-2";
import { FiFile } from "react-icons/fi";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { GeoPoint } from "firebase/firestore";
import { storage } from "./Firebase";
import { toastError, toastSuccess, singleLineEllipsisStyle, log } from "./Helpers";
import { useNavigate } from "react-router-dom";
import { routes, adminCircles } from "./Navigation";
import { ConnectionNotification } from "./Notifications";
import { CircleListItem } from "../screens/Circle";
import UserContext from "./UserContext";
import axios from "axios";
import { i18n, LanguagePicker } from "i18n/Localization";
import ReactQuill from "react-quill";
import DatePicker from "react-datepicker";
import { WithContext as ReactTags } from "react-tag-input";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { RiLinksLine, RiDeleteBinLine } from "react-icons/ri";
import { AiOutlineEdit } from "react-icons/ai";
import db from "./Firebase";
import "react-datepicker/dist/react-datepicker.css";
import "react-quill/dist/quill.snow.css";
//#endregion

export const DatePickerInput = forwardRef(({ value, onClick }, ref) => (
    <Box border="1px solid #e2e8f0" height="40px" borderRadius="0.375rem" onClick={onClick} ref={ref} align="center">
        <Text textAlign="left" lineHeight="40px" marginLeft="16px">
            {new Date(value).toLocaleDateString()}
        </Text>
    </Box>
));

const CombineDateAndTime = (date, time) => {
    const timeString = time + ":00";
    const year = date.getFullYear();
    const month = ("0" + (date.getMonth() + 1)).slice(-2);
    const day = ("0" + date.getDate()).slice(-2);
    const dateString = "" + year + "-" + month + "-" + day;
    const datec = dateString + "T" + timeString;
    return new Date(datec);
};

export const CircleTypeForm = ({ type, onCancel, onNext, onUpdate }) => {
    const user = useContext(UserContext);

    return (
        <Formik
            initialValues={{ type: type ?? "circle" }}
            onSubmit={async (values, actions) => {
                console.log("Submitting");
                actions.setSubmitting(false);
                onUpdate({ type: values.type });

                // proceed to next step
                if (onNext) {
                    onNext();
                }
            }}
            validate={(values) => {
                const errors = {};
                if (!values.type) {
                    errors.type = i18n.t("Choose type of circle");
                } else if (values.type === "tag" && !user?.is_admin) {
                    errors.type = "unauthorized";
                } else if (values.type !== "tag" && values.type !== "circle" && values.type !== "event" && values.type !== "room" && values.type !== "link") {
                    errors.type = i18n.t("Choose valid circle type");
                }
                return errors;
            }}
        >
            {({ values, errors, touched, isSubmitting }) => (
                <Form>
                    <VStack align="center">
                        <Text className="screenHeader">{i18n.t("Create new")}</Text>

                        <VStack align="center" spacing="25px" width="100%" marginLeft="25px" marginRight="25px">
                            <Field name="type">
                                {({ field, form }) => {
                                    const { onChange, ...rest } = field;
                                    return (
                                        <FormControl isInvalid={form.errors.type && form.touched.type}>
                                            <RadioGroup id="type" {...rest}>
                                                <Stack direction="column" divider={<StackDivider borderColor="gray.200" />}>
                                                    <Radio onChange={onChange} value="circle">
                                                        <HStack spacing="10px">
                                                            <Image src={require("../assets/images/circle-default-option.png")} width="100px" height="100px" />
                                                            <VStack align="start" spacing="0px">
                                                                <Text fontWeight="700">{i18n.t("Circle")}</Text>
                                                                <Text textAlign="left">{i18n.t("Circle of people gathering around a common cause")}</Text>
                                                            </VStack>
                                                        </HStack>
                                                    </Radio>
                                                    <Radio onChange={onChange} value="event">
                                                        <HStack spacing="10px">
                                                            <Image src={require("../assets/images/circle-event-option.png")} width="100px" height="100px" />
                                                            <VStack align="start" spacing="0px">
                                                                <Text fontWeight="700">{i18n.t("Event")}</Text>
                                                                <Text textAlign="left">{i18n.t("Event that takes place at a certain date")}</Text>
                                                            </VStack>
                                                        </HStack>
                                                    </Radio>
                                                    <Radio onChange={onChange} value="room">
                                                        <HStack spacing="10px">
                                                            <Image src={require("../assets/images/circle-room-option.png")} width="100px" height="100px" />
                                                            <VStack align="start" spacing="0px">
                                                                <Text fontWeight="700">{i18n.t("Room")}</Text>
                                                                <Text textAlign="left">{i18n.t("Room description")}</Text>
                                                            </VStack>
                                                        </HStack>
                                                    </Radio>

                                                    {user?.is_admin && (
                                                        <Radio onChange={onChange} value="link">
                                                            <HStack spacing="10px">
                                                                <Image src={require("../assets/images/circle-link-option.png")} width="100px" height="100px" />
                                                                <VStack align="start" spacing="0px">
                                                                    <Text fontWeight="700">{i18n.t("Link")}</Text>
                                                                    <Text textAlign="left">{i18n.t("Link description")}</Text>
                                                                </VStack>
                                                            </HStack>
                                                        </Radio>
                                                    )}

                                                    {user?.is_admin && (
                                                        <Radio onChange={onChange} value="tag">
                                                            <HStack spacing="10px">
                                                                <Image src={require("../assets/images/circle-tag-option.png")} width="100px" height="100px" />
                                                                <VStack align="start" spacing="0px">
                                                                    <Text fontWeight="700">{i18n.t("Tag")}</Text>
                                                                    <Text textAlign="left">{i18n.t("Tag description")}</Text>
                                                                </VStack>
                                                            </HStack>
                                                        </Radio>
                                                    )}
                                                </Stack>
                                            </RadioGroup>
                                            <FormErrorMessage>{form.errors.type}</FormErrorMessage>
                                        </FormControl>
                                    );
                                }}
                            </Field>
                        </VStack>
                        <Box>
                            <HStack align="center" marginTop="10px">
                                <Button colorScheme="blue" mr={3} borderRadius="25px" isLoading={isSubmitting} type="submit" lineHeight="0">
                                    {i18n.t("Continue")}
                                </Button>
                                <Button variant="ghost" borderRadius="25px" onClick={onCancel} isDisabled={isSubmitting} lineHeight="0">
                                    {i18n.t("Cancel")}
                                </Button>
                            </HStack>
                        </Box>
                    </VStack>
                </Form>
            )}
        </Formik>
    );
};

export const CircleContentForm = ({
    isUpdateForm,
    name,
    language,
    description,
    content,
    chatIsPublic,
    circleId,
    onCancel,
    onNext,
    onUpdate,
    type,
    isGuideForm,
    parentCircle,
}) => {
    const user = useContext(UserContext);
    const toast = useToast();
    const createCircleInitialRef = useRef();
    const [richContent, setRichContent] = useState(content ?? "");
    const [richContentCharCount, setRichContentCharCount] = useState(0);
    const [chatIsPublicSetting, setChatIsPublicSetting] = useState(chatIsPublic === true);

    const parentCircles = adminCircles(user)
        ?.map((x) => {
            return { ...x, value: x.id, label: x.name };
        })
        ?.concat(user ? [{ ...user.public, value: user.id, label: user.name }] : []);
    const [selectedParentCircle, setSelectedParentCircle] = useState(
        parentCircle && parentCircles.some((x) => x.id === parentCircle?.id) ? { ...parentCircle, value: parentCircle.id, label: parentCircle.name } : null
    );
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
        setRichContent(richText);
        setRichContentCharCount(text ? text.trim().length : 0);
    };

    return (
        <Formik
            initialValues={{ name: name ?? "", description: description ?? "", language: language, chatIsPublic: chatIsPublic === true }}
            onSubmit={async (values, actions) => {
                if (isUpdateForm) {
                    // update circle
                    let updatedCircleData = {
                        name: values.name,
                        description: values.description,
                        parentCircle: selectedParentCircle,
                        chatIsPublic: chatIsPublicSetting,
                    };

                    console.log("chatIsPublic: ", updatedCircleData.chatIsPublic);

                    if (!isGuideForm) {
                        updatedCircleData.content = richContent;
                        updatedCircleData.language = values.richContent;
                    } else {
                        if (name === values.name && description === values.description) {
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
                    let putCircleResult = await axios.put(`/circles/${circleId}`, {
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
                let putCircleResult = await axios.post(`/circles`, {
                    name: values.name,
                    description: values.description,
                    language: values.language,
                    type: type,
                    parentCircle: selectedParentCircle,
                    chatIsPublic: chatIsPublicSetting,
                });

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
                        <Text className="screenHeader">{isUpdateForm === true ? i18n.t("Name and description") : i18n.t(`Create new [${type}]`)}</Text>

                        <VStack align="center" spacing="25px" width="100%" marginLeft="25px" marginRight="25px">
                            <Field name="name">
                                {({ field, form }) => (
                                    <FormControl isInvalid={form.errors.name && form.touched.name}>
                                        <FormLabel>{i18n.t(`Name of [${type}]`)}</FormLabel>
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
                            <Field name="description">
                                {({ field, form }) => (
                                    <FormControl isInvalid={form.errors.description && form.touched.description}>
                                        <FormLabel>{i18n.t(`Description of [${type}]`)}</FormLabel>
                                        <Text position="absolute" right="0px" top="5px" fontSize="12px" color="#bbb">
                                            {form?.values?.description ? form.values.description.length : 0} / 200
                                        </Text>
                                        <InputGroup>
                                            <Textarea {...field} id="description" resize="none" maxLength="200" />
                                            {!form.errors.description && form.touched.description && (
                                                <InputRightElement children={<CheckIcon color="green.500" />} />
                                            )}
                                        </InputGroup>
                                        <FormErrorMessage>{form.errors.description}</FormErrorMessage>
                                    </FormControl>
                                )}
                            </Field>

                            {isUpdateForm && !isGuideForm && (
                                <Field name="content">
                                    {({ field, form }) => (
                                        <FormControl isInvalid={form.errors.content && form.touched.content}>
                                            <FormLabel>{i18n.t(`[${type}] content`)}</FormLabel>
                                            <Text position="absolute" right="0px" top="5px" fontSize="12px" color="#bbb">
                                                {richContentCharCount} / 100 000
                                            </Text>
                                            <ReactQuill theme="snow" value={richContent} onChange={onRichContentChange} minHeight="135px" maxWidth="100%" />
                                            <FormErrorMessage>{form.errors.content}</FormErrorMessage>
                                        </FormControl>
                                    )}
                                </Field>
                            )}

                            {parentCircles && (type === "circle" || type === "tag" || type === "room") && (
                                <Flex flexDirection="column" width="100%">
                                    <Text textAlign="start">{i18n.t(`Parent circle`)}</Text>
                                    <Select
                                        options={parentCircles}
                                        components={{ Option: CircleOption }}
                                        value={selectedParentCircle}
                                        onChange={handleChange}
                                        textAlign="start"
                                    />
                                </Flex>
                            )}

                            <Field name="chatIsPublic">
                                {({ field, form }) => (
                                    <FormControl isInvalid={form.errors.chatIsPublic && form.touched.chatIsPublic}>
                                        <Checkbox isChecked={chatIsPublicSetting} id="chatIsPublic" onChange={(e) => setChatIsPublicSetting(e.target.checked)}>
                                            {i18n.t(`Make chat public`)}
                                        </Checkbox>
                                    </FormControl>
                                )}
                            </Field>

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
                                <Button
                                    colorScheme="blue"
                                    mr={3}
                                    borderRadius="25px"
                                    isLoading={isSubmitting}
                                    type="submit"
                                    lineHeight="0"
                                    width={isGuideForm ? "150px" : "auto"}
                                >
                                    {isUpdateForm === true ? (isGuideForm ? i18n.t("Continue") : i18n.t("Save")) : i18n.t(`Create [${type}] and continue`)}
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

export const EventContentForm = ({
    isUpdateForm,
    name,
    language,
    dateTime,
    date,
    time,
    content,
    circleId,
    onCancel,
    onNext,
    onUpdate,
    parentCircle,
    chatIsPublic,
}) => {
    const user = useContext(UserContext);
    const toast = useToast();
    const navigate = useNavigate();
    const createEventInitialRef = useRef();
    const [pickedDate, setPickedDate] = useState(dateTime ?? new Date());
    const [isAllDay, setIsAllDay] = useState(false);
    const [chatIsPublicSetting, setChatIsPublicSetting] = useState(chatIsPublic === true);
    const parentCircles = adminCircles(user)
        ?.map((x) => {
            return { ...x, value: x.id, label: x.name };
        })
        ?.concat(user ? [{ ...user.public, value: user.id, label: user.name }] : []);
    const [selectedParentCircle, setSelectedParentCircle] = useState(
        parentCircle && parentCircles.some((x) => x.id === parentCircle?.id) ? { ...parentCircle, value: parentCircle.id, label: parentCircle.name } : null
    );
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

    return (
        <Formik
            initialValues={{ name: name ?? "", time: time ?? "12:00", content: content ?? "", language: language, chatIsPublic: chatIsPublic === true }}
            onSubmit={async (values, actions) => {
                if (isUpdateForm) {
                    // update circle
                    let updatedCircleData = {
                        name: values.name,
                        startsAt: CombineDateAndTime(pickedDate, values.time),
                        time: values.time,
                        isAllDay: isAllDay,
                        content: values.content,
                        language: values.language,
                        parentCircle: selectedParentCircle,
                        chatIsPublic: chatIsPublicSetting,
                    };

                    //console.log("updating event data", updatedEventData);

                    // update event data
                    let putEventResult = await axios.put(`/circles/${circleId}`, {
                        circleData: updatedCircleData,
                    });

                    if (!putEventResult.data?.error) {
                        toast({
                            title: i18n.t("Circle updated"),
                            status: "success",
                            position: "top",
                            duration: 4500,
                            isClosable: true,
                        });
                    } else {
                        //console.log(eventId);
                        //console.log(JSON.stringify(putEventResult.data, null, 2));
                        toast({
                            title: i18n.t("Unable to update circle"),
                            status: "error",
                            position: "top",
                            duration: 4500,
                            isClosable: true,
                        });
                    }

                    //setSelectedEvent({ ...selectedEvent, event: { ...selectedEvent.event, name: values.name, description: values.description } });
                    if (onUpdate) {
                        onUpdate(updatedCircleData);
                    }
                    actions.setSubmitting(false);
                    return;
                }

                // combine date and time
                // console.log(JSON.stringify(pickedDate, null, 2));
                // console.log(JSON.stringify(values.time, null, 2));
                // console.log(JSON.stringify(CombineDateAndTime(pickedDate, values.time), null, 2));

                // create new event
                let putCircleResult = await axios.post(`/circles`, {
                    name: values.name,
                    startsAt: CombineDateAndTime(pickedDate, values.time),
                    time: values.time,
                    content: values.content,
                    isAllDay: isAllDay,
                    language: values.language,
                    type: "event",
                    parentCircle: selectedParentCircle,
                    chatIsPublic: chatIsPublicSetting,
                });

                // console.log(
                //     JSON.stringify(putEventResult.data, null, 2)
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
                    errors.name = i18n.t("Enter name of event");
                } else if (values.name.length > 50) {
                    errors.name = i18n.t("Event name can't contain more than 50 characters");
                }
                if (!values.content) {
                    errors.content = i18n.t("Enter description of event");
                } else if (values.content.length > 10000) {
                    errors.content = i18n.t("Description can't contain more than 100 000 characters");
                }
                if (!isAllDay && !values.time) {
                    errors.time = i18n.t("Specify time");
                }

                // TODO validate date, time and location

                return errors;
            }}
        >
            {({ values, errors, touched, isSubmitting }) => (
                <Form>
                    <VStack align="center">
                        <Text className="screenHeader">{isUpdateForm === true ? i18n.t("Name and description") : i18n.t("Create new event")}</Text>

                        <VStack align="center" spacing="25px" width="100%" marginLeft="25px" marginRight="25px">
                            <Field name="name">
                                {({ field, form }) => (
                                    <FormControl isInvalid={form.errors.name && form.touched.name}>
                                        <FormLabel>{i18n.t("Name of event")}</FormLabel>
                                        <Text position="absolute" right="0px" top="5px" fontSize="12px" color="#bbb">
                                            {form?.values?.name ? form.values.name.length : 0} / 50
                                        </Text>
                                        <InputGroup>
                                            <Input {...field} id="name" ref={createEventInitialRef} type="text" maxLength="50" />
                                            {!form.errors.name && form.touched.name && <InputRightElement children={<CheckIcon color="green.500" />} />}
                                        </InputGroup>
                                        <FormErrorMessage>{form.errors.name}</FormErrorMessage>
                                    </FormControl>
                                )}
                            </Field>

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

                            <Field name="content">
                                {({ field, form }) => (
                                    <FormControl isInvalid={form.errors.content && form.touched.content}>
                                        <FormLabel>{i18n.t("Description of event")}</FormLabel>
                                        <Text position="absolute" right="0px" top="5px" fontSize="12px" color="#bbb">
                                            {form?.values?.content ? form.values.content.length : 0} / 10 000
                                        </Text>
                                        <InputGroup>
                                            <Textarea {...field} id="content" resize="vertical" maxLength="10000" height="200px" />
                                            {!form.errors.content && form.touched.content && <InputRightElement children={<CheckIcon color="green.500" />} />}
                                        </InputGroup>
                                        <FormErrorMessage>{form.errors.content}</FormErrorMessage>
                                    </FormControl>
                                )}
                            </Field>

                            {parentCircles && (
                                <Flex flexDirection="column" width="100%">
                                    <Text textAlign="start">{i18n.t(`Parent circle`)}</Text>
                                    <Select
                                        options={parentCircles}
                                        components={{ Option: CircleOption }}
                                        value={selectedParentCircle}
                                        onChange={handleChange}
                                        textAlign="start"
                                    />
                                </Flex>
                            )}

                            <Field name="chatIsPublic">
                                {({ field, form }) => (
                                    <FormControl isInvalid={form.errors.chatIsPublic && form.touched.chatIsPublic}>
                                        <Checkbox isChecked={chatIsPublicSetting} id="chatIsPublic" onChange={(e) => setChatIsPublicSetting(e.target.checked)}>
                                            {i18n.t(`Make chat public`)}
                                        </Checkbox>
                                    </FormControl>
                                )}
                            </Field>

                            <Flex flexDirection="row" width="100%">
                                <Box flexGrow="1" flexShrink="0" marginLeft="5px">
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
                        </VStack>
                        <Box>
                            <HStack align="center" marginTop="10px">
                                <Button colorScheme="blue" mr={3} borderRadius="25px" isLoading={isSubmitting} type="submit" lineHeight="0">
                                    {isUpdateForm === true ? i18n.t("Save") : i18n.t("Create event and continue")}
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

export const CircleTagsForm = ({ isUpdateForm, circle, onCancel, onNext, onUpdate, isGuideForm }) => {
    const user = useContext(UserContext);
    const toast = useToast();
    const createCircleInitialRef = useRef();
    const [isLoadingTags, setIsLoadingTags] = useState(false);
    const [isSavingTags, setIsSavingTags] = useState(false);
    const [suggestedTags, setSuggestedTags] = useState([]);
    const [tags, setTags] = useState(circle?.tags ?? []);
    const [hasUpdated, setHasUpdated] = useState(false);

    useEffect(() => {
        log("CircleTagsForm.useEffect 1");
        // get all tags
        setHasUpdated(false);
        setIsLoadingTags(true);
        const causesQuery = query(collection(db, "circles"), where("type", "==", "tag"));
        const unsubscribeGetTags = onSnapshot(causesQuery, (snap) => {
            const newTags = snap.docs.map((doc) => {
                var tag = doc.data();
                return {
                    id: doc.id,
                    ...tag,
                };
            });
            setSuggestedTags(newTags);
            setIsLoadingTags(false);
        });

        return () => {
            if (unsubscribeGetTags) {
                unsubscribeGetTags();
            }
            setIsLoadingTags(false);
        };
    }, []);

    const handleDelete = (i) => {
        setTags(tags.filter((tag, index) => index !== i));
    };

    const handleAddition = (tag) => {
        if (!tag.name) {
            // custom tag
            let id = tag.id.replace("#", "");
            tag.id = `ctag__${id}`;
            tag.text = id; // we differentiate custom tags by removing hashtags for now
            tag.is_custom = true;
            tag.name = id;
        }
        if (tags.some((x) => x.id === tag.id)) return;
        //console.log("Adding" + JSON.stringify(tag, null, 2));
        //#c9c1d9

        setHasUpdated(true);
        setTags([...tags, tag]);
    };

    const handleDrag = (tag, currPos, newPos) => {
        const newTags = tags.slice();

        newTags.splice(currPos, 1);
        newTags.splice(newPos, 0, tag);

        // re-render
        setHasUpdated(true);
        setTags(newTags);
    };

    const handleTagClick = (index) => {};

    const onSaveTags = async () => {
        if ((!isUpdateForm && tags?.length <= 0) || !hasUpdated) {
            // no need to do a save
            if (onNext) {
                onNext();
            }
            return;
        }

        setIsSavingTags(true);

        // update circle
        let updatedCircleData = {
            tags: tags,
        };

        // update circle data
        let putCircleResult = await axios.put(`/circles/${circle.id}`, {
            circleData: updatedCircleData,
        });

        setIsSavingTags(false);
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
            return;
        }

        setHasUpdated(false);

        if (onUpdate) {
            onUpdate(updatedCircleData);
        }
        // proceed to next step
        if (onNext) {
            onNext();
        }
    };

    const delimiters = [13, 9]; // comma=188, enter=13, tab=9

    return (
        <VStack align="center">
            <Text className="screenHeader">{i18n.t("Tags")}</Text>
            <Text>{i18n.t(`Tags text ${circle.type}`)}</Text>

            <Box align="center" width="100%" marginLeft="25px" marginRight="25px">
                <ReactTags
                    tags={tags}
                    suggestions={suggestedTags}
                    delimiters={delimiters}
                    handleDelete={handleDelete}
                    handleAddition={handleAddition}
                    handleDrag={handleDrag}
                    handleTagClick={handleTagClick}
                    placeholder={i18n.t("Type and press enter to add new tag")}
                    inputFieldPosition="top"
                    allowDeleteFromEmptyInput={false}
                />
            </Box>
            {/* <Text>Suggestions (click to add):</Text> */}
            <Box>
                <HStack align="center" marginTop="10px">
                    <Button
                        colorScheme="blue"
                        mr={3}
                        borderRadius="25px"
                        isLoading={isSavingTags}
                        lineHeight="0"
                        onClick={onSaveTags}
                        width={isGuideForm ? "150px" : "auto"}
                    >
                        {isUpdateForm === true ? (isGuideForm ? i18n.t("Continue") : i18n.t("Save")) : i18n.t("Save and continue")}
                    </Button>
                    {isUpdateForm !== true && (
                        <Button variant="ghost" borderRadius="25px" onClick={onCancel} isDisabled={isSavingTags} lineHeight="0">
                            {i18n.t("Close")}
                        </Button>
                    )}
                </HStack>
            </Box>
        </VStack>
    );
};

export const CircleImagesForm = ({ isUpdateForm, picture, cover, onCancel, onNext, circleId, onUpdate, name, description, type, isGuideForm }) => {
    const [selectedCirclePicture, setSelectedCirclePicture] = useState();
    const [selectedCircleCover, setSelectedCircleCover] = useState();
    const [circlePicturePreview, setCirclePicturePreview] = useState();
    const [circleCoverPreview, setCircleCoverPreview] = useState();
    const circlePictureUploadRef = useRef();
    const circleCoverUploadRef = useRef();
    const toast = useToast();

    const resetCirclePreviewImages = () => {
        setSelectedCirclePicture(null);
        setSelectedCircleCover(null);
        setCirclePicturePreview(null);
        setCircleCoverPreview(null);
    };

    const handleCirclePictureUploadClick = () => {
        circlePictureUploadRef.current?.click();
    };

    const handleCircleCoverUploadClick = () => {
        circleCoverUploadRef.current?.click();
    };

    return (
        <Formik
            initialValues={{ picture: picture ?? "", cover: cover ?? "" }}
            onSubmit={async (values, actions) => {
                let anyUpdated = false;
                // upload picture and cover image
                try {
                    if (!circleId) {
                        // shouldn't happen
                        toast({
                            title: i18n.t("Failed to update settings"),
                            status: "error",
                            position: "top",
                            duration: null,
                            isClosable: true,
                        });
                        actions.setSubmitting(false);
                        onCancel();
                        return;
                    }

                    //console.log("Saving circle images to circle ID:", circleId);

                    let pictureUrl = isUpdateForm === true ? picture : undefined;
                    if (values.picture) {
                        //console.log("want to update picture to:", values.picture);
                        //console.log("current picture:", picture);
                        // upload picture
                        if (isUpdateForm === false || values.picture !== picture) {
                            const pictureRef = ref(storage, `circles/${circleId}/public/picture`);
                            await uploadBytes(pictureRef, values.picture);
                            pictureUrl = await getDownloadURL(pictureRef);
                            anyUpdated = true;
                        }
                    }

                    let coverUrl = isUpdateForm === true ? cover : undefined;
                    if (values.cover) {
                        // upload cover
                        if (isUpdateForm === false || values.cover !== cover) {
                            const coverRef = ref(storage, `circles/${circleId}/public/cover`);
                            await uploadBytes(coverRef, values.cover);
                            coverUrl = await getDownloadURL(coverRef);
                            anyUpdated = true;
                        }
                    }

                    // update circle picture and cover image path
                    if (anyUpdated) {
                        let updatedCircleData = {};
                        if (pictureUrl) {
                            updatedCircleData.picture = pictureUrl;
                        }
                        if (coverUrl) {
                            updatedCircleData.cover = coverUrl;
                        }

                        //console.log("updating circle data", updatedCircleData);

                        // update circle data
                        let putCircleResult = await axios.put(`/circles/${circleId}`, {
                            circleData: updatedCircleData,
                        });

                        if (onUpdate) {
                            onUpdate(updatedCircleData);
                        }
                    }
                } catch (error) {
                    toast({
                        title: i18n.t("Images couldn't be uploaded"),
                        status: "error",
                        position: "top",
                        duration: 4500,
                        isClosable: true,
                    });
                }

                actions.setSubmitting(false);

                // proceed to next step
                if (onNext) {
                    onNext();
                }

                if (isUpdateForm && anyUpdated) {
                    toast({
                        title: i18n.t("Images saved"),
                        status: "success",
                        position: "top",
                        duration: 4500,
                        isClosable: true,
                    });
                }
            }}
            validate={(values) => {
                const errors = {};
                // TODO validate image sizes
                // console.log({
                //     fileName: values.picture.name,
                //     type: values.picture.type,
                //     size: `${values.picture.size} bytes`,
                // });
                return errors;
            }}
        >
            {({ values, errors, touched, isSubmitting, setFieldValue }) => (
                <Form style={{ width: "100%" }}>
                    <VStack align="center">
                        <Text className="screenHeader">{i18n.t(`Choose images for ${type}`)}</Text>

                        <Flex flexDirection="column">
                            <Box
                                className="circleItem"
                                align="center"
                                borderRadius="25px"
                                role="group"
                                color="black"
                                bg="white"
                                overflow="hidden"
                                position="relative"
                                border="1px solid #ebebeb"
                                height="300px"
                            >
                                <Box width="100%" height="40%" backgroundColor="#b9b9b9" overflow="hidden">
                                    {!isUpdateForm && circleCoverPreview && (
                                        <Image className="circle-overview-cover" src={circleCoverPreview} objectFit="cover" width="100%" height="100%" />
                                    )}

                                    {isUpdateForm && circleCoverPreview && (
                                        <Image className="circle-overview-cover" src={circleCoverPreview} objectFit="cover" width="100%" height="100%" />
                                    )}

                                    {isUpdateForm && !circleCoverPreview && cover && (
                                        <Image className="circle-overview-cover" src={cover} objectFit="cover" width="100%" height="100%" />
                                    )}
                                </Box>
                                <Box height="76px" position="relative" top="-38px">
                                    {!isUpdateForm && circlePicturePreview && (
                                        <Image marginTop="3.5px" className="circle-list-picture" src={circlePicturePreview} />
                                    )}

                                    {isUpdateForm && circlePicturePreview && (
                                        <Image marginTop="3.5px" className="circle-list-picture" src={circlePicturePreview} />
                                    )}
                                    {isUpdateForm && !circlePicturePreview && picture && (
                                        <Image marginTop="3.5px" className="circle-list-picture" src={picture} />
                                    )}

                                    {!circlePicturePreview && !picture && <Box marginTop="3.5px" className="circle-list-picture" backgroundColor="#999" />}
                                </Box>

                                <VStack align="center" spacing="12px" marginTop="-28px">
                                    <Text className="circle-list-title" fontSize="18px" fontWeight="500">
                                        {name}
                                    </Text>
                                    <Box>
                                        <Box marginLeft="10px" marginRight="10px">
                                            <Text fontSize="14px" maxWidth="170px">
                                                {description}
                                            </Text>
                                        </Box>
                                    </Box>
                                </VStack>
                            </Box>

                            <VStack align="center" spacing="25px" marginLeft="25px" marginRight="25px" marginTop="10px">
                                <Field name="picture">
                                    {({ field, form }) => (
                                        <FormControl isInvalid={form.errors.picture && form.touched.picture}>
                                            <FormLabel>{i18n.t("Logo")}</FormLabel>
                                            <InputGroup>
                                                <input
                                                    name="picture"
                                                    ref={circlePictureUploadRef}
                                                    type="file"
                                                    multiple={false}
                                                    accept="image/*"
                                                    hidden
                                                    onChange={(event) => {
                                                        let selectedFile = event.currentTarget.files[0];
                                                        setSelectedCirclePicture(selectedFile);
                                                        setFieldValue("picture", selectedFile);

                                                        let newPictureUrl = URL.createObjectURL(selectedFile);
                                                        setCirclePicturePreview(newPictureUrl);
                                                        form.touched.picture = true;
                                                    }}
                                                />
                                            </InputGroup>
                                            <HStack align="center" spacing="15px">
                                                <Button leftIcon={<Icon as={FiFile} />} onClick={handleCirclePictureUploadClick}>
                                                    {i18n.t("Choose logo")}
                                                </Button>
                                                {!form.errors.picture && form.touched.picture && <CheckIcon color="green.500" />}
                                            </HStack>
                                            <Text>{values?.file?.name}</Text>
                                            <FormErrorMessage>{form.errors.picture}</FormErrorMessage>
                                        </FormControl>
                                    )}
                                </Field>

                                <Field name="cover">
                                    {({ field, form }) => (
                                        <FormControl isInvalid={form.errors.cover && form.touched.cover}>
                                            <FormLabel>{i18n.t("Cover image")}</FormLabel>
                                            <InputGroup>
                                                <input
                                                    name="cover"
                                                    ref={circleCoverUploadRef}
                                                    type="file"
                                                    multiple={false}
                                                    accept="image/*"
                                                    hidden
                                                    onChange={(event) => {
                                                        let selectedFile = event.currentTarget.files[0];
                                                        setSelectedCircleCover(selectedFile);
                                                        setFieldValue("cover", selectedFile);

                                                        let newCoverUrl = URL.createObjectURL(selectedFile);
                                                        setCircleCoverPreview(newCoverUrl);
                                                        form.touched.cover = true;
                                                    }}
                                                />
                                            </InputGroup>

                                            <HStack align="center" marginTop="10px" spacing="15px">
                                                <Button leftIcon={<Icon as={FiFile} />} onClick={handleCircleCoverUploadClick}>
                                                    {i18n.t("Choose cover image")}
                                                </Button>
                                                {!form.errors.cover && form.touched.cover && <CheckIcon color="green.500" />}
                                            </HStack>

                                            <Text>{values?.file?.name}</Text>
                                            <FormErrorMessage>{form.errors.cover}</FormErrorMessage>
                                        </FormControl>
                                    )}
                                </Field>
                            </VStack>
                        </Flex>
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

export const allQuestions = [
    {
        id: "ideal-future",
        label: i18n.t("My ideal future looks like"),
        type: ["user"],
    },
    {
        id: "insufferable-present",
        label: i18n.t("My insufferable present is"),
        type: ["user"],
    },
    {
        id: "excited-about-now",
        label: i18n.t("Right now I'm excited about"),
        type: ["user"],
    },
    {
        id: "my-superpower",
        label: i18n.t("My superpower is"),
        type: ["user"],
    },
    {
        id: "role-of-species",
        label: i18n.t("I think the role of our species on the planet is"),
        type: ["user"],
    },
    {
        id: "my-biggest-fear-is",
        label: i18n.t("My biggest fear is"),
        type: ["user"],
    },
    {
        id: "adopted-ritual",
        label: i18n.t("One ritual I have adopted is"),
        type: ["user"],
    },
    {
        id: "lottery",
        label: i18n.t("If I won the lottery tomorrow I would"),
        type: ["user"],
    },
    {
        id: "ideal-world",
        label: i18n.t("My ideal world looks like"),
        type: ["user"],
    },
    {
        id: "president",
        label: i18n.t("If I were president, I would"),
        type: ["user"],
    },
    {
        id: "three-words",
        label: i18n.t("Three words to describe my personality are"),
        type: ["user"],
    },
    {
        id: "advice",
        label: i18n.t("My advice to my younger self would be"),
        type: ["user"],
    },
    {
        id: "vulnerable",
        label: i18n.t("I feel vulnerable when"),
        type: ["user"],
    },
    {
        id: "prediction",
        label: i18n.t("My best prediction for what the world will look like in 2100"),
        type: ["user"],
    },
    {
        id: "mantra",
        label: i18n.t("My mantra is"),
        type: ["user"],
    },
    {
        id: "values",
        label: i18n.t("The values I hold most sacred are"),
        type: ["user"],
    },
    {
        id: "changemaking",
        label: i18n.t("I got into changemaking because"),
        type: ["user"],
    },
    {
        id: "impactful-project",
        label: i18n.t("My most impactful project so far has been"),
        type: ["user"],
    },
    {
        id: "crazy-idea",
        label: i18n.t("My craziest idea is"),
        type: ["user"],
    },
    {
        id: "quote",
        label: i18n.t("A quote that means a lot to me is"),
        type: ["user"],
    },
    {
        id: "work-on",
        label: i18n.t("I really need to work on"),
        type: ["user"],
    },
    {
        id: "want-to-work-on",
        label: i18n.t("I really want to work on"),
        type: ["user"],
    },
    {
        id: "sport",
        label: i18n.t("My favorite sport is"),
        type: ["user"],
    },
    {
        id: "ilikewhenhumans",
        label: i18n.t("I like it when humans"),
        type: ["user"],
    },
    {
        id: "memory",
        label: i18n.t("A significant memory or moment in my life was"),
        type: ["user"],
    },
    {
        id: "peoplecomewhen",
        label: i18n.t("People come to me when they need"),
        type: ["user"],
    },
    {
        id: "happy",
        label: i18n.t("What makes me truly happy is"),
        type: ["user"],
    },
    {
        id: "look-up-to",
        label: i18n.t("A person I look up to is... because..."),
        type: ["user"],
    },
    {
        id: "poem",
        label: i18n.t("A poem I find meaningful"),
        type: ["user"],
    },
    {
        id: "inspires",
        label: i18n.t("What inspires me is"),
        type: ["user"],
    },
    {
        id: "intrinsic",
        label: i18n.t("My intrinsic motivation is"),
        type: ["user"],
    },
    {
        id: "music",
        label: i18n.t("My favorite music is"),
        type: ["user"],
    },
    {
        id: "food",
        label: i18n.t("My favorite food is"),
        type: ["user"],
    },
    {
        id: "inserviceof",
        label: i18n.t("I show up in service of"),
        type: ["user"],
    },
    {
        id: "favoriteproject",
        label: i18n.t("My favorite changemaking project in the world is"),
        type: ["user"],
    },
    {
        id: "weaknesses",
        label: i18n.t("The weaknesses of my greatest strength are"),
        type: ["user"],
    },
    {
        id: "favoritequestion",
        label: i18n.t("My favorite question is"),
        type: ["user"],
    },
];

export const CircleQuestionsForm = ({ isUpdateForm, circle, isGuideForm, onNext, onUpdate, onCancel }) => {
    const [isSavingQuestions, setIsSavingQuestions] = useState(false);
    const [questions, setQuestions] = useState();
    const [hasInitialized, setHasInitialized] = useState(false);
    const toast = useToast();

    useEffect(() => {
        log("CircleQuestionsForm.useEffect 1");
        if (!circle?.questions || hasInitialized) return;
        setQuestions(circle?.questions);
        setHasInitialized(true);
    }, [circle?.questions, hasInitialized]);

    const onSaveQuestions = () => {
        let circleData = { questions };

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
                        isDisabled={isGuideForm && !anyQuestionsAnswered()}
                        lineHeight="0"
                        onClick={onSaveQuestions}
                        width={isGuideForm ? "150px" : "auto"}
                    >
                        {isUpdateForm === true ? (isGuideForm ? i18n.t("Continue") : i18n.t("Save")) : i18n.t("Save and continue")}
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

export const CircleBaseForm = ({ isUpdateForm, onCancel, onNext, circleId, onUpdate, locationPickerPosition, base, type }) => {
    const [isSavingLocation, setIsSavingLocation] = useState(false);
    const toast = useToast();

    const onSaveBase = async () => {
        if (locationPickerPosition && typeof locationPickerPosition[0] === "number" && typeof locationPickerPosition[1] === "number") {
            // save location
            setIsSavingLocation(true);

            // update circle data
            let newBase = new GeoPoint(locationPickerPosition[1], locationPickerPosition[0]);
            let updatedCircleData = { base: newBase };
            let putCircleResult = await axios.put(`/circles/${circleId}`, {
                circleData: updatedCircleData,
            });

            setIsSavingLocation(false);

            if (onUpdate) {
                onUpdate(updatedCircleData);
            }
        }

        if (isUpdateForm) {
            toast({
                title: i18n.t("Location updated"),
                status: "success",
                position: "top",
                duration: 4500,
                isClosable: true,
            });
        }

        if (!isUpdateForm) {
            onNext();
        }
    };

    return (
        <VStack align="center">
            <Text className="screenHeader">{i18n.t(`Choose ${type} location`)}</Text>
            <Text>{i18n.t(`Place ${type} location`)}</Text>
            <Box>
                <HStack align="center" marginTop="10px">
                    <Button colorScheme="blue" mr={3} borderRadius="25px" lineHeight="0" isLoading={isSavingLocation} onClick={onSaveBase}>
                        {isUpdateForm ? i18n.t("Save") : i18n.t("Save and go to circle")}
                    </Button>
                    {!isUpdateForm && (
                        <Button variant="ghost" borderRadius="25px" onClick={onCancel} lineHeight="0" isDisabled={isSavingLocation}>
                            {i18n.t("Close")}
                        </Button>
                    )}
                </HStack>
            </Box>
        </VStack>
    );
};

export const CircleSocialMediaForm = ({ circle }) => {
    const toast = useToast();

    return (
        <Formik
            initialValues={{
                facebook: circle?.social_media?.facebook ?? "",
                instagram: circle?.social_media?.instagram ?? "",
                youtube: circle?.social_media?.youtube ?? "",
                tiktok: circle?.social_media?.tiktok ?? "",
                twitter: circle?.social_media?.twitter ?? "",
                linkedin: circle?.social_media?.linkedin ?? "",
                medium: circle?.social_media?.medium ?? "",
                link1: circle?.social_media?.link1 ?? "",
                link2: circle?.social_media?.link2 ?? "",
                link3: circle?.social_media?.link3 ?? "",
            }}
            onSubmit={async (values, actions) => {
                if (!circle) return;

                // update user name and description
                let new_social_media = {
                    facebook: values.facebook ?? "",
                    instagram: values.instagram ?? "",
                    youtube: values.youtube ?? "",
                    tiktok: values.tiktok ?? "",
                    twitter: values.twitter ?? "",
                    linkedin: values.linkedin ?? "",
                    medium: values.medium ?? "",
                    link1: values.link1 ?? "",
                    link2: values.link2 ?? "",
                    link3: values.link3 ?? "",
                };

                let updatedCircleData = { social_media: new_social_media };

                //console.log("updating user data", updatedUserData);

                // update user data
                let putCircleResult = await axios.put(`/circles/${circle.id}`, {
                    circleData: updatedCircleData,
                });

                if (!putCircleResult.data?.error) {
                    toast({
                        title: i18n.t("Circle updated"),
                        status: "success",
                        position: "top",
                        duration: 4500,
                        isClosable: true,
                    });
                } else {
                    toast({
                        title: i18n.t("Unable to update circle"),
                        description: putCircleResult.data.error,
                        status: "error",
                        position: "top",
                        duration: 4500,
                        isClosable: true,
                    });
                }

                actions.setSubmitting(false);
                return;
            }}
            validate={(values) => {
                const errors = {};
                if (values.facebook && values.facebook.length > 200) {
                    errors.facebook = i18n.t("Link can't contain more than 200 characters");
                }
                if (values.instagram && values.instagram.length > 200) {
                    errors.instagram = i18n.t("Link can't contain more than 200 characters");
                }
                if (values.youtube && values.youtube.length > 200) {
                    errors.youtube = i18n.t("Link can't contain more than 200 characters");
                }
                if (values.tiktok && values.tiktok.length > 200) {
                    errors.tiktok = i18n.t("Link can't contain more than 200 characters");
                }
                if (values.twitter && values.twitter.length > 200) {
                    errors.twitter = i18n.t("Link can't contain more than 200 characters");
                }
                if (values.linkedin && values.linkedin.length > 200) {
                    errors.linkedin = i18n.t("Link can't contain more than 200 characters");
                }
                if (values.medium && values.medium.length > 200) {
                    errors.medium = i18n.t("Link can't contain more than 200 characters");
                }
                if (values.link1 && values.link1.length > 200) {
                    errors.link1 = i18n.t("Link can't contain more than 200 characters");
                }
                if (values.link2 && values.link2.length > 200) {
                    errors.link2 = i18n.t("Link can't contain more than 200 characters");
                }
                if (values.link3 && values.link3.length > 200) {
                    errors.link3 = i18n.t("Link can't contain more than 200 characters");
                }
                return errors;
            }}
        >
            {({ values, errors, touched, isSubmitting }) => (
                <Form>
                    <VStack align="center">
                        <Text className="screenHeader">{i18n.t("Links")}</Text>

                        <VStack align="center" spacing="25px" width="100%" marginLeft="25px" marginRight="25px">
                            <Field name="facebook">
                                {({ field, form }) => (
                                    <FormControl isInvalid={form.errors.facebook && form.touched.facebook}>
                                        <FormLabel>Facebook</FormLabel>
                                        <Text position="absolute" right="0px" top="5px" fontSize="12px" color="#bbb">
                                            {form?.values?.facebook ? form.values.facebook.length : 0} / 200
                                        </Text>
                                        <InputGroup>
                                            <Input {...field} id="facebook" type="text" placeholder={i18n.t("Facebook example")} maxLength="200" />
                                            {!form.errors.facebook && form.touched.facebook && <InputRightElement children={<CheckIcon color="green.500" />} />}
                                        </InputGroup>
                                        <FormErrorMessage>{form.errors.facebook}</FormErrorMessage>
                                    </FormControl>
                                )}
                            </Field>
                            <Field name="twitter">
                                {({ field, form }) => (
                                    <FormControl isInvalid={form.errors.twitter && form.touched.twitter}>
                                        <FormLabel>Twitter</FormLabel>
                                        <Text position="absolute" right="0px" top="5px" fontSize="12px" color="#bbb">
                                            {form?.values?.twitter ? form.values.twitter.length : 0} / 200
                                        </Text>
                                        <InputGroup>
                                            <Input {...field} id="twitter" type="text" placeholder={i18n.t("Twitter example")} maxLength="200" />
                                            {!form.errors.twitter && form.touched.twitter && <InputRightElement children={<CheckIcon color="green.500" />} />}
                                        </InputGroup>
                                        <FormErrorMessage>{form.errors.twitter}</FormErrorMessage>
                                    </FormControl>
                                )}
                            </Field>
                            <Field name="instagram">
                                {({ field, form }) => (
                                    <FormControl isInvalid={form.errors.instagram && form.touched.instagram}>
                                        <FormLabel>Instagram</FormLabel>
                                        <Text position="absolute" right="0px" top="5px" fontSize="12px" color="#bbb">
                                            {form?.values?.instagram ? form.values.instagram.length : 0} / 200
                                        </Text>
                                        <InputGroup>
                                            <Input {...field} id="instagram" type="text" placeholder={i18n.t("Instagram example")} maxLength="200" />
                                            {!form.errors.instagram && form.touched.instagram && (
                                                <InputRightElement children={<CheckIcon color="green.500" />} />
                                            )}
                                        </InputGroup>
                                        <FormErrorMessage>{form.errors.instagram}</FormErrorMessage>
                                    </FormControl>
                                )}
                            </Field>
                            <Field name="youtube">
                                {({ field, form }) => (
                                    <FormControl isInvalid={form.errors.youtube && form.touched.youtube}>
                                        <FormLabel>YouTube</FormLabel>
                                        <Text position="absolute" right="0px" top="5px" fontSize="12px" color="#bbb">
                                            {form?.values?.youtube ? form.values.youtube.length : 0} / 200
                                        </Text>
                                        <InputGroup>
                                            <Input {...field} id="youtube" type="text" placeholder={i18n.t("YouTube example")} maxLength="200" />
                                            {!form.errors.youtube && form.touched.youtube && <InputRightElement children={<CheckIcon color="green.500" />} />}
                                        </InputGroup>
                                        <FormErrorMessage>{form.errors.youtube}</FormErrorMessage>
                                    </FormControl>
                                )}
                            </Field>
                            <Field name="tiktok">
                                {({ field, form }) => (
                                    <FormControl isInvalid={form.errors.tiktok && form.touched.tiktok}>
                                        <FormLabel>TikTok</FormLabel>
                                        <Text position="absolute" right="0px" top="5px" fontSize="12px" color="#bbb">
                                            {form?.values?.tiktok ? form.values.tiktok.length : 0} / 200
                                        </Text>
                                        <InputGroup>
                                            <Input {...field} id="tiktok" type="text" placeholder={i18n.t("TikTok example")} maxLength="200" />
                                            {!form.errors.tiktok && form.touched.tiktok && <InputRightElement children={<CheckIcon color="green.500" />} />}
                                        </InputGroup>
                                        <FormErrorMessage>{form.errors.tiktok}</FormErrorMessage>
                                    </FormControl>
                                )}
                            </Field>
                            <Field name="linkedin">
                                {({ field, form }) => (
                                    <FormControl isInvalid={form.errors.linkedin && form.touched.linkedin}>
                                        <FormLabel>LinkedIn</FormLabel>
                                        <Text position="absolute" right="0px" top="5px" fontSize="12px" color="#bbb">
                                            {form?.values?.linkedin ? form.values.linkedin.length : 0} / 200
                                        </Text>
                                        <InputGroup>
                                            <Input {...field} id="linkedin" type="text" placeholder={i18n.t("LinkedIn example")} maxLength="200" />
                                            {!form.errors.linkedin && form.touched.linkedin && <InputRightElement children={<CheckIcon color="green.500" />} />}
                                        </InputGroup>
                                        <FormErrorMessage>{form.errors.linkedin}</FormErrorMessage>
                                    </FormControl>
                                )}
                            </Field>
                            <Field name="medium">
                                {({ field, form }) => (
                                    <FormControl isInvalid={form.errors.medium && form.touched.medium}>
                                        <FormLabel>Medium</FormLabel>
                                        <Text position="absolute" right="0px" top="5px" fontSize="12px" color="#bbb">
                                            {form?.values?.medium ? form.values.medium.length : 0} / 200
                                        </Text>
                                        <InputGroup>
                                            <Input {...field} id="medium" type="text" placeholder={i18n.t("Medium example")} maxLength="200" />
                                            {!form.errors.medium && form.touched.medium && <InputRightElement children={<CheckIcon color="green.500" />} />}
                                        </InputGroup>
                                        <FormErrorMessage>{form.errors.medium}</FormErrorMessage>
                                    </FormControl>
                                )}
                            </Field>
                            <Field name="link1">
                                {({ field, form }) => (
                                    <FormControl isInvalid={form.errors.link1 && form.touched.link1}>
                                        <FormLabel>Custom link 1</FormLabel>
                                        <Text position="absolute" right="0px" top="5px" fontSize="12px" color="#bbb">
                                            {form?.values?.link1 ? form.values.link1.length : 0} / 200
                                        </Text>
                                        <InputGroup>
                                            <Input {...field} id="link1" type="text" placeholder={i18n.t("Link example")} maxLength="200" />
                                            {!form.errors.link1 && form.touched.link1 && <InputRightElement children={<CheckIcon color="green.500" />} />}
                                        </InputGroup>
                                        <FormErrorMessage>{form.errors.link1}</FormErrorMessage>
                                    </FormControl>
                                )}
                            </Field>
                            <Field name="link2">
                                {({ field, form }) => (
                                    <FormControl isInvalid={form.errors.link2 && form.touched.link2}>
                                        <FormLabel>Custom link 2</FormLabel>
                                        <Text position="absolute" right="0px" top="5px" fontSize="12px" color="#bbb">
                                            {form?.values?.link2 ? form.values.link2.length : 0} / 200
                                        </Text>
                                        <InputGroup>
                                            <Input {...field} id="link2" type="text" placeholder={i18n.t("Link example")} maxLength="200" />
                                            {!form.errors.link2 && form.touched.link2 && <InputRightElement children={<CheckIcon color="green.500" />} />}
                                        </InputGroup>
                                        <FormErrorMessage>{form.errors.link2}</FormErrorMessage>
                                    </FormControl>
                                )}
                            </Field>
                            <Field name="link3">
                                {({ field, form }) => (
                                    <FormControl isInvalid={form.errors.link3 && form.touched.link3}>
                                        <FormLabel>Custom link 3</FormLabel>
                                        <Text position="absolute" right="0px" top="5px" fontSize="12px" color="#bbb">
                                            {form?.values?.link3 ? form.values.link3.length : 0} / 200
                                        </Text>
                                        <InputGroup>
                                            <Input {...field} id="link3" type="text" placeholder={i18n.t("Link example")} maxLength="200" />
                                            {!form.errors.link3 && form.touched.link3 && <InputRightElement children={<CheckIcon color="green.500" />} />}
                                        </InputGroup>
                                        <FormErrorMessage>{form.errors.link3}</FormErrorMessage>
                                    </FormControl>
                                )}
                            </Field>
                        </VStack>
                        <Box>
                            <HStack align="center" marginTop="10px">
                                <Button colorScheme="blue" mr={3} borderRadius="25px" isLoading={isSubmitting} type="submit" lineHeight="0">
                                    {i18n.t("Spara")}
                                </Button>
                            </HStack>
                        </Box>
                    </VStack>
                </Form>
            )}
        </Formik>
    );
};

export const CircleDeleteForm = ({ circle }) => {
    const toast = useToast();
    const navigate = useNavigate();
    const deleteCircleInitialRef = useRef();

    return (
        <Formik
            initialValues={{ name_confirmation: "" }}
            onSubmit={async (values, actions) => {
                // upload picture and cover image
                try {
                    navigate(routes.home);

                    // delete circle
                    let putCircleResult = await axios.delete(`/circles/${circle.id}`, {
                        data: { name_confirmation: values.name_confirmation },
                    });

                    if (putCircleResult.data?.error) {
                        toast({
                            title: i18n.t("Circle couldn't be deleted"),
                            description: putCircleResult.data.error,
                            status: "error",
                            position: "top",
                            duration: 4500,
                            isClosable: true,
                        });
                    } else {
                        toast({
                            title: `${i18n.t("Circle")} ${circle.name} ${i18n.t("has been deleted")}`,
                            status: "success",
                            position: "top",
                            duration: 4500,
                            isClosable: true,
                        });
                    }
                } catch (error) {
                    toast({
                        title: i18n.t("Circle couldn't be deleted"),
                        description: error,
                        status: "error",
                        position: "top",
                        duration: 4500,
                        isClosable: true,
                    });
                }

                actions.setSubmitting(false);
            }}
            validate={(values) => {
                const errors = {};
                if (circle.name !== values.name_confirmation) {
                    errors.name_confirmation = i18n.t("Enter name of circle to confirm deletion");
                }
                return errors;
            }}
        >
            {({ values, errors, touched, isSubmitting, setFieldValue }) => (
                <Form>
                    <VStack align="center">
                        <Text className="screenHeader">{i18n.t("Delete circle")}</Text>

                        <VStack align="center" spacing="25px" width="100%" marginLeft="25px" marginRight="25px">
                            <Field name="name_confirmation">
                                {({ field, form }) => (
                                    <FormControl isInvalid={form.errors.name_confirmation && form.touched.name_confirmation}>
                                        <FormLabel>{i18n.t("Confirm deletion of circle by entering the name of the circle")}</FormLabel>
                                        <InputGroup>
                                            <Input {...field} id="name_confirmation" ref={deleteCircleInitialRef} type="text" maxLength="50" />
                                            {!form.errors.name_confirmation && form.touched.name_confirmation && (
                                                <InputRightElement children={<CheckIcon color="green.500" />} />
                                            )}
                                        </InputGroup>
                                        <FormErrorMessage>{form.errors.name_confirmation}</FormErrorMessage>
                                    </FormControl>
                                )}
                            </Field>
                        </VStack>
                        <Box>
                            <HStack align="center" marginTop="10px">
                                <Button colorScheme="red" mr={3} borderRadius="25px" isLoading={isSubmitting} type="submit" lineHeight="0">
                                    {i18n.t("Delete circle")}
                                </Button>
                            </HStack>
                        </Box>
                    </VStack>
                </Form>
            )}
        </Formik>
    );
};

export const CircleRequestToConnectForm = ({ circle, onClose, onNext }) => {
    const [isLoadingCircles, setIsLoadingCircles] = useState(true);
    const [isSendingRequests, setIsSendingRequests] = useState(false);
    const [circles, setCircles] = useState([]);
    const [selectedCircles, setSelectedCircles] = useState([]);
    const [inviteToBeAdmin, setInviteToBeAdmin] = useState(false);

    useEffect(() => {
        log("CircleRequestToConnectForm.useEffect 1");
        // get all circles in the system
        if (!circle?.id) return;
        setIsLoadingCircles(true);

        // subscribe to circle connection requests
        var q = query(collection(db, "circles"));
        let unsubscribeGetCircles = onSnapshot(q, (snap) => {
            const newCircles =
                snap.docs?.map((doc) => {
                    let data = doc.data();
                    return { id: doc.id, value: doc.id, label: data.name, ...data };
                }) ?? [];

            // TODO ignore circles that circle is already connected to
            // we already have this information in the parent form

            setCircles(newCircles.filter((x) => x.type !== "tag").sort((a, b) => a.name?.localeCompare(b.name)));

            // print system tags:
            // let tags = newCircles
            //     .filter((x) => x.type === "tag")
            //     .map((y) => y.name)
            //     .sort((a, b) => a.localeCompare(b));
            // console.log(JSON.stringify(tags, null, 2));

            setIsLoadingCircles(false);
        });

        return () => {
            if (unsubscribeGetCircles) {
                unsubscribeGetCircles();
            }
        };
    }, [circle?.id]);

    const toast = useToast();

    const sendRequestToConnect = async () => {
        setIsSendingRequests(true);
        //console.log(JSON.stringify(selectedCircles, null, 2));
        let errors = null;

        if (setInviteToBeAdmin && selectedCircles.length > 1) {
            toastError(toast, "Only one admin can be invited at a time");
            setIsSendingRequests(false);
            return;
        }

        for (const circleId of selectedCircles) {
            // send requests to each circle
            try {
                let res = await axios.post(`/circles/${circle.id}/connections`, {
                    targetId: circleId,
                    type: inviteToBeAdmin ? "admin_by" : "connected_mutually_to",
                    alwaysNotify: true,
                });

                let result = res.data;
                if (result.error) {
                    errors += result.error;
                    //toastError(toast, errorMessage, result.error);
                }
            } catch (error) {
                errors += JSON.stringify(error, null, 2);
                //toastError(toast, errorMessage, error);
            }
        }

        setInviteToBeAdmin(false);

        if (errors) {
            toastError(toast, "Failed to send request to all recipients", errors);
        } else {
            toastSuccess(toast, "Request sent to all recipients", errors);
        }

        setIsSendingRequests(false);
        setSelectedCircles([]);

        if (onNext) {
            onNext();
        }
    };

    const handleChange = (e) => {
        setSelectedCircles(Array.isArray(e) ? e.map((x) => x.value) : []);
    };

    const { Option } = components;
    const CircleOption = ({ ...props }) => {
        return (
            <Option {...props}>
                <CircleListItem item={props.data} inSelect={true} />
                {/* <HStack>
                    <CirclePicture circle={props.data} size={40} hasPopover={false} />
                    <Text>{props.data.label}</Text>
                </HStack> */}
            </Option>
        );
    };

    return isLoadingCircles ? (
        <Spinner />
    ) : (
        <Box marginTop="20px">
            <Text>
                {i18n.t(`[${circle.type}] Send request to connect`)} {i18n.t("to")}
            </Text>
            <MultiSelect
                isMulti
                options={circles}
                components={{ Option: CircleOption }}
                value={circles.filter((x) => selectedCircles.includes(x.id))}
                onChange={handleChange}
            />
            <Checkbox isChecked={inviteToBeAdmin} onChange={(e) => setInviteToBeAdmin(e.target.checked)}>
                {i18n.t("Invite to be admin")}
            </Checkbox>
            <Flex flexDirection="row" flexGrow="1" marginTop="10px">
                <Button
                    minWidth="150px"
                    colorScheme="blue"
                    borderRadius="25px"
                    lineHeight="0"
                    backgroundColor="#389bf8"
                    color="white"
                    isDisabled={isSendingRequests}
                    onClick={() => sendRequestToConnect()}
                    position="relative"
                >
                    <HStack marginRight="13px">
                        <RiLinksLine size="18px" />
                        {isSendingRequests ? <Spinner /> : <Text>{i18n.t(`[${circle.type}] Send request to connect`)}</Text>}
                    </HStack>
                </Button>

                <Box flexGrow="1" />
                {onClose && (
                    <Button variant="ghost" borderRadius="25px" onClick={onClose} isDisabled={isSendingRequests} lineHeight="0">
                        {i18n.t("Close")}
                    </Button>
                )}
            </Flex>
        </Box>
    );
};

export const CircleConnectionsSettings = ({ circle, isUpdateForm }) => {
    const user = useContext(UserContext);
    const toast = useToast();
    const [isLoadingConnections, setIsLoadingConnections] = useState(true);
    const isLoading = isLoadingConnections;
    const { isOpen: inviteFormIsOpen, onOpen: inviteFormOnOpen, onClose: inviteFormOnClose } = useDisclosure();
    const [connections, setConnections] = useState([]);
    const receivedConnectionRequests = useMemo(() => {
        return connections.filter((x) => x.target.id === circle.id && (x.type === "connected_mutually_to_request" || x.type === "admin_by_request"));
    }, [connections, circle?.id]);

    const sentConnectionRequests = useMemo(() => {
        return connections.filter((x) => x.source.id === circle.id && (x.type === "connected_mutually_to_request" || x.type === "admin_by_request"));
    }, [connections, circle?.id]);

    useEffect(() => {
        log("CircleConnectionsSettings.useEffect 1");
        if (!circle?.id) return;
        setIsLoadingConnections(true);

        // subscribe to circle connection requests
        var q = query(collection(db, "connections"), where("circle_ids", "array-contains", circle.id));
        let unsubscribeGetCircleConnections = onSnapshot(q, (snap) => {
            const newConnections = snap.docs?.map((doc) => ({ id: doc.id, ...doc.data() })) ?? [];
            setConnections(newConnections);
            setIsLoadingConnections(false);
        });

        return () => {
            if (unsubscribeGetCircleConnections) {
                unsubscribeGetCircleConnections();
            }
        };
    }, [circle?.id, toast]);

    const ConnectionRequests = ({ requests, isSentRequests }) => {
        const borderRadius = (i) => {
            let top = i === 0 ? "7px 7px" : "0px 0px";
            let bottom = i === connections.length - 1 ? "7px 7px" : "0px 0px";
            return `${top} ${bottom}`;
        };

        return requests.length > 0 ? (
            <>
                {requests.map((connection, i) => (
                    <Flex
                        key={connection.id}
                        flexGrow="1"
                        borderRadius={borderRadius(i)}
                        border="1px solid #e7e7e7"
                        borderWidth={i === 0 ? "1px" : "0px 1px 1px 1px"}
                        flexDirection="row"
                        align="center"
                    >
                        <ConnectionNotification
                            date={connection.created_at}
                            connectionId={connection.id}
                            connectionType={connection.type}
                            source={connection.source}
                            target={connection.target}
                            isSentRequests={isSentRequests}
                        />
                    </Flex>
                ))}
            </>
        ) : (
            <Text>{i18n.t(isSentRequests ? "No connection requests sent" : "No connection requests received")}</Text>
        );
    };

    return (
        <VStack align="center">
            <Text className="screenHeader">{i18n.t("Connection requests")}</Text>
            <Text className="screenHeader" fontSize="20px" fontWeight="700">
                {i18n.t("Received")}
            </Text>
            <Flex flexDirection="column" width="100%">
                <ConnectionRequests requests={receivedConnectionRequests} />
            </Flex>
            <Text className="screenHeader" fontSize="20px" fontWeight="700">
                {i18n.t("Sent")}
            </Text>
            <Flex flexDirection="column" width="100%">
                <ConnectionRequests requests={sentConnectionRequests} isSentRequests={true} />
                <CircleRequestToConnectForm circle={circle} />
            </Flex>
        </VStack>
    );
};
