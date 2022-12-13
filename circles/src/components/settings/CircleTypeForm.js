//#region imports
import { useContext, useRef, useState, forwardRef, useEffect, useMemo, lazy } from "react";
import { Form, Field, Formik } from "formik";
import MultiSelect, { components } from "react-select";
import Select from "react-select";
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
import { db, storage } from "components/Firebase";
import { toastError, toastSuccess, singleLineEllipsisStyle, log, adminCircles, combineDateAndTime } from "components/Helpers";

import { routes } from "components/Navigation";
import { ConnectionNotification } from "components/Notifications";
import axios from "axios";
import { i18n, LanguagePicker } from "i18n/Localization";
import ReactQuill from "react-quill";
import DatePicker from "react-datepicker";
import { DatePickerInput } from "components/CircleElements";
import { WithContext as ReactTags } from "react-tag-input";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { RiLinksLine, RiDeleteBinLine } from "react-icons/ri";
import { AiOutlineEdit } from "react-icons/ai";
import { useNavigateNoUpdates, useLocationNoUpdates } from "components/RouterUtils";
import { useAtom } from "jotai";
import {
    isMobileAtom,
    userAtom,
    userDataAtom,
    displayModeAtom,
    showNetworkLogoAtom,
    signInStatusAtom,
    circleAtom,
    circlesAtom,
    circleConnectionsAtom,
    locationPickerActiveAtom,
    locationPickerPositionAtom,
} from "components/Atoms";
import "react-datepicker/dist/react-datepicker.css";
import "react-quill/dist/quill.snow.css";
import CircleListItem from "components/CircleListItem";
//#endregion

export const CircleTypeForm = ({ type, onCancel, onNext, onUpdate }) => {
    const [user] = useAtom(userAtom);
    const [circle] = useAtom(circleAtom);

    return (
        <Formik
            initialValues={{ type: type ?? "circle" }}
            onSubmit={async (values, actions) => {
                console.log("Submitting");
                actions.setSubmitting(false);
                let newCircle = { type: values.type, language: i18n.language, chat_is_public: true };
                if (circle) {
                    newCircle.parent_circle = circle;
                }

                onUpdate(newCircle);

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
                                                            <Image src="/circle-default-option.png" width="100px" height="100px" />
                                                            <VStack align="start" spacing="0px">
                                                                <Text fontWeight="700">{i18n.t("Circle")}</Text>
                                                                <Text textAlign="left">{i18n.t("Circle of people gathering around a common cause")}</Text>
                                                            </VStack>
                                                        </HStack>
                                                    </Radio>
                                                    <Radio onChange={onChange} value="event">
                                                        <HStack spacing="10px">
                                                            <Image src="/circle-event-option.png" width="100px" height="100px" />
                                                            <VStack align="start" spacing="0px">
                                                                <Text fontWeight="700">{i18n.t("Event")}</Text>
                                                                <Text textAlign="left">{i18n.t("Event that takes place at a certain date")}</Text>
                                                            </VStack>
                                                        </HStack>
                                                    </Radio>
                                                    <Radio onChange={onChange} value="room">
                                                        <HStack spacing="10px">
                                                            <Image src="/circle-room-option.png" width="100px" height="100px" />
                                                            <VStack align="start" spacing="0px">
                                                                <Text fontWeight="700">{i18n.t("Room")}</Text>
                                                                <Text textAlign="left">{i18n.t("Room description")}</Text>
                                                            </VStack>
                                                        </HStack>
                                                    </Radio>

                                                    {user?.is_admin && (
                                                        <Radio onChange={onChange} value="link">
                                                            <HStack spacing="10px">
                                                                <Image src="/circle-link-option.png" width="100px" height="100px" />
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
                                                                <Image src="/circle-tag-option.png" width="100px" height="100px" />
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

export default CircleTypeForm;
