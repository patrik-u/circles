//#region imports
import { useRef, useState, useEffect, useMemo, useCallback } from "react";
import { Form, Field, Formik } from "formik";
import { components } from "react-select";
import Select from "react-select";
import {
    Box,
    Image,
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
import { adminCircles, combineDateAndTime, fromFsDate, log } from "@/components/Helpers";
import { CirclePicture, MetaData, NewSessionButton } from "@/components/CircleElements";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/components/Firebase";
import axios from "axios";
import { i18n, LanguagePicker } from "@/i18n/Localization";
import ReactQuill from "react-quill";
import DatePicker from "react-datepicker";
import { DatePickerInput } from "@/components/CircleElements";
import { useAtom } from "jotai";
import { userAtom, requestUserConnectionsAtom, userConnectionsAtom, saveIdAtom } from "@/components/Atoms";
import "react-datepicker/dist/react-datepicker.css";
import "react-quill/dist/quill.snow.css";
import CircleListItem from "@/components/CircleListItem";
import { IoInformationCircleSharp } from "react-icons/io5";
import DocumentEditor from "@/components/document/DocumentEditor";
import { useDropzone } from "react-dropzone";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { DeleteIcon } from "@chakra-ui/icons";
import { IoMdImages } from "react-icons/io";
//#endregion

const sliderSettings = {
    dots: true,
    infinite: false,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: true,
};

export const MediaUpload = ({ initialFiles = [], onFileChange, ...props }) => {
    const [files, setFiles] = useState([]);
    const toast = useToast();
    const filesRef = useRef(files);
    const sliderRef = useRef(null);

    useEffect(() => {
        filesRef.current = files;
    }, [files]);

    const onDrop = useCallback((acceptedFiles) => {
        const mappedFiles = acceptedFiles.map((file) =>
            Object.assign(file, {
                preview: URL.createObjectURL(file),
            })
        );

        // ignore duplicates
        const filteredMappedFiles = mappedFiles.filter((newFile) => {
            return !files.some((file) => file.path === newFile.path);
        });

        // Append the new files to the existing files
        setFiles((prevFiles) => {
            let newFiles = [...prevFiles, ...filteredMappedFiles];
            // Wait for the state to update and then slide to the last slide
            setTimeout(() => {
                if (sliderRef.current && sliderRef.current.slickGoTo) {
                    const lastIndex = newFiles.length - 1;
                    sliderRef.current.slickGoTo(lastIndex);
                }
            }, 0);

            return newFiles;
        });

        console.log(JSON.stringify(filteredMappedFiles, null, 2));

        onFileChange([...files, ...filteredMappedFiles]);
    }, []);

    // useEffect(() => {
    //     // Convert initialFiles to the format expected by the component,
    //     // including creating preview URLs
    //     log("MediaUpload.useEffect 1", -1, true);
    //     const filesWithPreviews = initialFiles.map((file) => ({
    //         ...file,
    //         preview: file.preview || URL.createObjectURL(file),
    //     }));
    //     setFiles((x) => filesWithPreviews);
    // }, [initialFiles]);

    const { getRootProps, getInputProps } = useDropzone({ onDrop });

    const removeFile = (file) => () => {
        log("removeFile", -1, true);
        const newFiles = files.filter((f) => f !== file);
        setFiles(newFiles);
        onFileChange(newFiles);
    };

    // Cleanup previews
    useEffect(() => {
        log("MediaUpload.useEffect 2", -1, true);
        return () => {
            filesRef.current.forEach((file) => {
                if (file.preview?.startsWith("blob:")) {
                    URL.revokeObjectURL(file.preview);
                }
            });
        };
    }, []);

    return (
        <Flex flexDirection="column" flex="1" {...props}>
            {files.length > 0 && (
                <Box width="100%" maxHeight="200px" marginBottom="5px">
                    <Slider ref={sliderRef} {...sliderSettings}>
                        {files.map((file) => (
                            <Box key={file.name} position="relative" maxHeight="200px" overflow="hidden">
                                <Image
                                    key={file.name}
                                    src={file.preview}
                                    alt="preview"
                                    width="100%"
                                    height="100%"
                                    objectFit="contain"
                                />
                                <IconButton
                                    icon={<DeleteIcon />}
                                    isRound="true"
                                    size="sm"
                                    position="absolute"
                                    right="10px"
                                    top="10px"
                                    // colorScheme="red"
                                    onClick={removeFile(file)}
                                />
                            </Box>
                        ))}
                    </Slider>
                </Box>
            )}
            <Box {...getRootProps()}>
                <input {...getInputProps()} />
                <IconButton icon={<IoMdImages />} isRound="true" size="md" />
            </Box>
        </Flex>
    );
};

export const CirclePostForm = ({ isUpdateForm, circle, isGuideForm, onNext, onUpdate, onCancel }) => {
    const [user] = useAtom(userAtom);
    const [saveId] = useAtom(saveIdAtom);
    const toast = useToast();
    const [isInitialized, setIsInitialized] = useState(false);
    const contentDescriptionLength = 150;
    const createCircleInitialRef = useRef();
    const [mediaFiles, setMediaFiles] = useState([]);

    const handleFileChange = (newFiles) => {
        setMediaFiles((prevFiles) => [...prevFiles, ...newFiles]);
    };

    const getPostContext = () => {
        if (circle?.parent_circle && circle?.parent_circle?.id !== "global") {
            return `Post in ${circle.parent_circle.name}`;
        } else {
            return `Post to Everyone`;
        }
    };

    const differenceBy = (arr1, arr2, key) => arr1.filter((a) => !arr2.some((b) => a[key] === b[key]));

    // updates media files
    const updateMediaFilesAndSave = async (circleId, circleData) => {
        const storageUrl = `circles/${circleId}/public/media/`;
        let newMedia = mediaFiles;
        let existingMedia = circle.media ?? [];

        const filesToUpload = differenceBy(newMedia, existingMedia, "name");
        const filesToRemove = differenceBy(existingMedia, newMedia, "name");

        log(JSON.stringify(newMedia), 0, true);

        // upload new files
        const uploadPromises = filesToUpload.map(async (file) => {
            const fileRef = ref(storage, `${storageUrl}${file.name}`);

            await uploadBytes(fileRef, file);
            const url = await getDownloadURL(fileRef);
            return {
                url,
                name: file.name,
                type: file.type,
            };
        });

        // remove deleted files
        const removePromises = filesToRemove.map(async ({ name }) => {
            const fileRef = ref(storage, `${storageUrl}${name}`);
            await deleteObject(fileRef);
        });

        // Wait for all uploads and removals to complete
        const uploadedFiles = await Promise.all(uploadPromises);
        await Promise.all(removePromises);

        // Return the updated list of media (existing + new - removed)
        const updatedMedia = existingMedia
            .filter(({ name }) => !filesToRemove.some((file) => file.name === name))
            .concat(uploadedFiles);

        log(JSON.stringify(updatedMedia), 0, true);

        // save circle data with reference to media
        circleData.media = updatedMedia ?? [];
        let putCircleResult = await axios.put(`/circles/${circleId}`, {
            circleData: circleData,
        });

        return putCircleResult;
    };

    if (!circle) return null;

    return (
        <Formik
            enableReinitialize={true}
            initialValues={{
                content: circle.content ?? "",
            }}
            onSubmit={async (values, actions) => {
                log("submitting form", 0, true);
                if (isUpdateForm) {
                    // update circle
                    let updatedCircleData = {
                        content: values.content,
                        parent_circle: circle?.parent_circle,
                        type: "post",
                    };

                    // update circle data
                    let putCircleResult = null;
                    try {
                        putCircleResult = await updateMediaFilesAndSave(circle.id, updatedCircleData);
                    } catch (err) {
                        console.error(err);
                    }

                    if (putCircleResult && !putCircleResult.data?.error) {
                        toast({
                            title: i18n.t("Post updated"),
                            status: "success",
                            position: "top",
                            duration: 4500,
                            isClosable: true,
                        });
                    } else {
                        //console.log(circleId);
                        //console.log(JSON.stringify(putCircleResult.data, null, 2));
                        toast({
                            title: i18n.t("Failed to update post"),
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
                    content: values.content,
                    parent_circle: circle?.parent_circle,
                    type: "post",
                };

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
                        title: i18n.t("Post created"),
                        status: "success",
                        position: "top",
                        duration: 4500,
                        isClosable: true,
                    });

                    // upload media
                    try {
                        putCircleResult = await updateMediaFilesAndSave(putCircleResult.data.circle.id, {});
                    } catch (err) {
                        console.error(err);
                    }

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
                return errors;
            }}
        >
            {({ values, errors, touched, isSubmitting }) => (
                <Form style={{ width: "100%" }}>
                    <Flex flexDirection="row" align="center">
                        <CirclePicture circle={user} size={40} hasPopover={false} />
                        <Flex flexDirection="column" marginLeft="10px">
                            <Text fontSize="16px" fontWeight="bold">
                                {user.name}
                            </Text>
                            <Flex flexDirection="row" align="center">
                                <Text fontSize="12px">Post in</Text>
                                <CirclePicture
                                    circle={circle?.parent_circle}
                                    size={16}
                                    hasPopover={false}
                                    marginLeft="2px"
                                />
                                <Text fontSize="12px" marginLeft="4px">
                                    {circle?.parent_circle?.name}
                                </Text>
                            </Flex>
                        </Flex>
                    </Flex>
                    <Field name="content">
                        {({ field, form }) => (
                            <FormControl isInvalid={form.errors.content && form.touched.content}>
                                <InputGroup>
                                    <Flex marginTop="20px" flexDirection="column" flexGrow="1">
                                        <Textarea
                                            {...field}
                                            id="content"
                                            ref={createCircleInitialRef}
                                            placeholder="Share your story"
                                            maxLength="70000"
                                            resize="none" // Prevents manual resizing
                                            overflow="auto" // Adds scrollbar when exceeded max height
                                            h="auto" // Initial height to auto to grow with content
                                            minH="100px" // Minimum height
                                            maxH="300px" // Maximum height before scrolling
                                            border="0" // Makes it borderless
                                            fontSize="18px"
                                            margin="0px"
                                            padding="0px"
                                            _focus={{ boxShadow: "none" }} // Removes focus outline to maintain borderless appearance
                                        />
                                    </Flex>
                                </InputGroup>
                                <FormErrorMessage>{form.errors.content}</FormErrorMessage>
                            </FormControl>
                        )}
                    </Field>

                    <MediaUpload onFileChange={handleFileChange} initialFiles={[]} />

                    <VStack align="center">
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
                                        : i18n.t(`Post`)}
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
                    </VStack>
                </Form>
            )}
        </Formik>
    );
};

export default CirclePostForm;
