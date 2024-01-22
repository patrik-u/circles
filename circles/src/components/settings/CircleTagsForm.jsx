//#region imports
import { useState, useEffect } from "react";
import { Box, HStack, VStack, Text, Button, useToast } from "@chakra-ui/react";
import { db } from "@/components/Firebase";
import { log } from "@/components/Helpers";

import axios from "axios";
import { i18n } from "@/i18n/Localization";
import { WithContext as ReactTags } from "react-tag-input";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import "react-datepicker/dist/react-datepicker.css";
import "react-quill/dist/quill.snow.css";
//#endregion

export const CircleTagsForm = ({ isUpdateForm, circle, onCancel, onNext, onUpdate, isGuideForm }) => {
    const toast = useToast();
    const [, setIsLoadingTags] = useState(false);
    const [isSavingTags, setIsSavingTags] = useState(false);
    const [suggestedTags, setSuggestedTags] = useState([]);
    const [tags, setTags] = useState(circle?.tags ?? []);
    const [hasUpdated, setHasUpdated] = useState(false);

    useEffect(() => {
        log("CircleTagsForm.useEffect 1", -1);
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
        let putCircleResult = null;
        try {
            putCircleResult = await axios.put(`/circles/${circle.id}`, {
                circleData: updatedCircleData,
            });
        } catch (err) {
            console.error(err);
        }

        setIsSavingTags(false);
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
                        {isUpdateForm === true
                            ? isGuideForm
                                ? i18n.t("Continue")
                                : i18n.t("Save")
                            : i18n.t("Save and continue")}
                    </Button>
                    {isUpdateForm !== true && (
                        <Button
                            variant="ghost"
                            borderRadius="25px"
                            onClick={onCancel}
                            isDisabled={isSavingTags}
                            lineHeight="0"
                        >
                            {i18n.t("Close")}
                        </Button>
                    )}
                </HStack>
            </Box>
        </VStack>
    );
};

export default CircleTagsForm;
