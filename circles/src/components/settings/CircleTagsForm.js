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
    requestUserConnectionsAtom,
    userConnectionsAtom,
} from "components/Atoms";
import "react-datepicker/dist/react-datepicker.css";
import "react-quill/dist/quill.snow.css";
//#endregion

export const CircleTagsForm = ({ isUpdateForm, circle, onCancel, onNext, onUpdate, isGuideForm }) => {
    const [user] = useAtom(userAtom);
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
        const tagsQuery = query(collection(db, "circles"), where("type", "==", "tag"));
        const unsubscribeGetTags = onSnapshot(tagsQuery, (snap) => {
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
            tag.text = "#" + id;
            tag.id = `ctag__${id}`;
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

    const delimiters = [188, 13, 9]; // comma=188, enter=13, tab=9

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

export default CircleTagsForm;
