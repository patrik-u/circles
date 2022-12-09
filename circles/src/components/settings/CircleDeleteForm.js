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
import { allQuestions, displayModes } from "components/Constants";
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
    requestUserConnectionsAtom,
    userConnectionsAtom,
} from "components/Atoms";
import "react-datepicker/dist/react-datepicker.css";
import "react-quill/dist/quill.snow.css";
//#endregion

export const CircleDeleteForm = ({ circle }) => {
    const toast = useToast();
    const navigate = useNavigateNoUpdates();
    const deleteCircleInitialRef = useRef();

    if (!circle) return null;

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

export default CircleDeleteForm;
