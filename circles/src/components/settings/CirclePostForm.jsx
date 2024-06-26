//#region imports
import { useRef, useState, useEffect, useCallback } from "react";
import {
    Box,
    Image,
    Textarea,
    Flex,
    HStack,
    VStack,
    Text,
    Button,
    IconButton,
    useToast,
} from "@chakra-ui/react";
import { log } from "@/components/Helpers";
import { CirclePicture } from "@/components/CircleElements";
import { ref, uploadBytes, deleteObject, getDownloadURL } from "firebase/storage";
import { storage } from "@/components/Firebase";
import axios from "axios";
import { i18n } from "@/i18n/Localization";
import { useAtom } from "jotai";
import { userAtom, saveIdAtom } from "@/components/Atoms";
import "react-datepicker/dist/react-datepicker.css";
import "react-quill/dist/quill.snow.css";
import { useDropzone } from "react-dropzone";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { DeleteIcon } from "@chakra-ui/icons";
import { IoMdImages } from "react-icons/io";
import { CircleMention } from "@/components/CircleSearch";
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
    const [isInitialized, setIsInitialized] = useState(false);

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

    useEffect(() => {
        // Convert initialFiles to the format expected by the component,
        // including creating preview URLs
        log("MediaUpload.useEffect 1", -1, true);
        if (isInitialized) return;

        // const filesWithPreviews = initialFiles.map((file) => ({
        //     ...file,
        //     preview: file.preview || URL.createObjectURL(file),
        // }));
        setIsInitialized(true);
        setFiles((x) => initialFiles);
    }, [initialFiles, isInitialized]);

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
                                    src={file.preview ?? file.url}
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
    const textAreaRef = useRef();
    const [mediaFiles, setMediaFiles] = useState(circle.media ?? []);
    const [isMentioning, setIsMentioning] = useState(false); // is user currently mentioning someone
    const [mentionQuery, setMentionQuery] = useState(""); // current mention query in user input text
    const [text, setText] = useState(circle?.content ?? "");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [mentionsList, setMentionsList] = useState([]); // list of mentions in user input text

    useEffect(() => {
        textAreaRef.current.focus();
    }, []);

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

    const handleTextChange = (e) => {
        setText(e.target.value);

        if (isMentioning) {
            const queryMatch = e.target.value.match(/(?:^|\s)@(\w*)$/); // This regex matches "@" only if it's at the start or after a space
            if (queryMatch) {
                setMentionQuery(queryMatch[1]);
            }
        }

        if (e.target.value.match(/(?:^|\s)@$/)) {
            log("mentioning", 0, true);
            setIsMentioning(true);
        } else if (e.target.value.endsWith(" ") || e.target.value.endsWith("\n")) {
            log("not mentioning", 0, true);
            setIsMentioning(false);
        }
    };

    const onMention = (mentionedCircle) => {
        log("mentioning circle: " + mentionedCircle.name, 0, true);
        const updatedText = text.replace(`@${mentionQuery}`, `@${mentionedCircle.name} `);
        setText(updatedText);

        // add the mentioned circle to the mentions list
        const newMention = {
            id: mentionedCircle.objectID,
            name: `@${mentionedCircle.name}`,
            picture: mentionedCircle.picture,
        };

        setMentionsList((prevMentions) => [...prevMentions, newMention]);

        setIsMentioning(false);
        setMentionQuery("");

        // Set focus back to the textarea and set cursor position
        const newPosition = updatedText.length; // Get the length of the updated text
        textAreaRef.current.focus(); // Focus the textarea
        textAreaRef.current.setSelectionRange(newPosition, newPosition); // Set the cursor position to the end of the textarea content
    };

    const onSubmit = async () => {
        log("submitting form", 0, true);

        setIsSubmitting(true);
        let transformedText = text;
        mentionsList.forEach((mention) => {
            const markdownLink = `[${mention.name.slice(1)}](codo.earth/circles/${mention.id})`; // remove the '@' from the mention name
            transformedText = transformedText.replace(mention.name, markdownLink);
        });

        if (isUpdateForm) {
            // update circle
            let updatedCircleData = {
                content: transformedText,
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
            setIsSubmitting(false);
            return;
        }

        // create new circle
        let newCircleData = {
            content: transformedText,
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
            setIsSubmitting(False);
            return;
        }

        setIsSubmitting(false);

        // proceed to next step
        if (onNext) {
            onNext();
        }
    };

    if (!circle) return null;

    return (
        <>
            <Box style={{ width: "100%" }}>
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

                <Flex marginTop="20px" flexDirection="column" flexGrow="1" position="relative">
                    <Textarea
                        id="content"
                        ref={textAreaRef}
                        value={text}
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
                        onChange={handleTextChange}
                    />
                    {isMentioning && (
                        <CircleMention onMention={onMention} query={mentionQuery} position="absolute" top="60px" />
                    )}
                </Flex>
                <MediaUpload onFileChange={handleFileChange} initialFiles={circle.media} />

                <VStack align="center">
                    <Box>
                        <HStack align="center" marginTop="10px">
                            <Button
                                colorScheme="blue"
                                mr={3}
                                borderRadius="25px"
                                isLoading={isSubmitting}
                                isDisabled={saveId}
                                onClick={() => onSubmit()}
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
            </Box>
        </>
    );
};

export default CirclePostForm;
