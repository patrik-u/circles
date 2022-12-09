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

export const CircleBaseForm = ({ circle, isUpdateForm, onCancel, onNext, onUpdate }) => {
    const [isSavingLocation, setIsSavingLocation] = useState(false);
    const [displayMode, setDisplayMode] = useAtom(displayModeAtom);
    const [previousDisplayMode, setPreviousDisplayMode] = useState(null);
    const [locationPickerActive, setLocationPickerActive] = useAtom(locationPickerActiveAtom);
    const [locationPickerPosition] = useAtom(locationPickerPositionAtom);
    const toast = useToast();

    useEffect(() => {
        setDisplayMode(displayModes.map);
        setLocationPickerActive(true);

        return () => {
            setLocationPickerActive(false);
        };
    }, [setDisplayMode, setLocationPickerActive]);

    log("locationPickerActive: " + locationPickerActive);

    const onSaveBase = async () => {
        if (locationPickerPosition && typeof locationPickerPosition[0] === "number" && typeof locationPickerPosition[1] === "number") {
            // save location
            setIsSavingLocation(true);

            // update circle data
            let newBase = new GeoPoint(locationPickerPosition[1], locationPickerPosition[0]);
            let updatedCircleData = { base: newBase };
            await axios.put(`/circles/${circle.id}`, {
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

    if (!circle) return null;

    return (
        <VStack align="center">
            <Text className="screenHeader">{i18n.t(`Choose ${circle.type} location`)}</Text>
            <Text>{i18n.t(`Place ${circle.type} location`)}</Text>
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

export default CircleBaseForm;
