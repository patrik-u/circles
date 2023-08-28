//#region imports
import React, { useState, useEffect, useMemo, lazy, Suspense } from "react";
import { Flex, Box, Text, Spinner, Button, Checkbox, useToast, HStack, VStack } from "@chakra-ui/react";
import { Scrollbars } from "react-custom-scrollbars-2";
import axios from "axios";
import { toastError, log } from "components/Helpers";
import i18n from "i18n/Localization";
import config from "Config";
import PrivacyPolicy from "components/PrivacyPolicy";
import { userAtom, toggleAboutAtom } from "components/Atoms";
import { useAtom } from "jotai";
import { routes, openCircle, openAboutCircle } from "components/Navigation";
import { useNavigateNoUpdates } from "components/RouterUtils";
import { CircleContentForm } from "components/settings/CircleContentForm";
import { CircleImagesForm } from "components/settings/CircleImagesForm";
import { CircleTagsForm } from "components/settings/CircleTagsForm";
import { CircleBaseForm } from "components/settings/CircleBaseForm";
import { CircleBasePopupForm } from "components/settings/CircleBasePopupForm";
import { CircleTypeForm } from "components/settings/CircleTypeForm";
//#endregion

export const NewCircleGuide = ({ onClose, type, circle, message, toggleMapInteract }) => {
    const [user] = useAtom(userAtom);
    const [createdCircle, setCreatedCircle] = useState({ type: type, parent_circle: circle, content: message, is_public: true, language: i18n.language });
    const [, setToggleAbout] = useAtom(toggleAboutAtom);
    const navigate = useNavigateNoUpdates();
    const allSteps = useMemo(
        () => ({
            type: { id: "type", label: i18n.t("Type") },
            about: { id: "about", label: i18n.t("About") },
            images: { id: "images", label: i18n.t("Images") },
            tags: { id: "tags", label: i18n.t("Tags") },
            location: { id: "location", label: i18n.t("base") },
            //            complete: { id: "complete", label: i18n.t("Congratulations") },
        }),
        []
    );
    const [steps] = useState([allSteps.type, allSteps.about, allSteps.images, allSteps.tags, allSteps.location]);
    const [activeStep, setActiveStep] = useState(allSteps.type);

    const next = () => {
        let nextIndex = steps.indexOf(activeStep) + 1;
        if (nextIndex >= steps.length) {
            onClose();
            openCircle(navigate, createdCircle);
            openAboutCircle(createdCircle, setToggleAbout);
        } else {
            setActiveStep(steps[nextIndex]);
        }
    };

    const onUpdate = (updatedCircleData) => {
        setCreatedCircle((previusCreatedCircle) => ({ ...previusCreatedCircle, ...updatedCircleData }));
    };

    const getActiveStepComponent = () => {
        switch (activeStep.id) {
            case allSteps.type.id:
                return (
                    <Box>
                        <VStack align="start">
                            <Suspense fallback={<Spinner />}>
                                <CircleTypeForm
                                    isUpdateForm={false}
                                    circle={createdCircle}
                                    isGuideForm={false}
                                    onNext={next}
                                    onUpdate={onUpdate}
                                    onCancel={onClose}
                                />
                            </Suspense>
                        </VStack>
                    </Box>
                );

            case allSteps.about.id:
                return (
                    <Box>
                        <VStack align="start">
                            <Suspense fallback={<Spinner />}>
                                <CircleContentForm
                                    isUpdateForm={false}
                                    circle={createdCircle}
                                    isGuideForm={false}
                                    onNext={next}
                                    onUpdate={onUpdate}
                                    onCancel={onClose}
                                />
                            </Suspense>
                        </VStack>
                    </Box>
                );

            case allSteps.images.id:
                return (
                    <Box>
                        <VStack align="start">
                            <Suspense fallback={<Spinner />}>
                                <CircleImagesForm
                                    isUpdateForm={true}
                                    circle={createdCircle}
                                    isGuideForm={false}
                                    onNext={next}
                                    onUpdate={onUpdate}
                                    onCancel={onClose}
                                />
                            </Suspense>
                        </VStack>
                    </Box>
                );

            case allSteps.tags.id:
                return (
                    <Box>
                        <VStack align="start">
                            <Suspense fallback={<Spinner />}>
                                <CircleTagsForm
                                    isUpdateForm={true}
                                    circle={createdCircle}
                                    isGuideForm={false}
                                    onNext={next}
                                    onUpdate={onUpdate}
                                    onCancel={onClose}
                                />
                            </Suspense>
                        </VStack>
                    </Box>
                );

            case allSteps.location.id:
                return (
                    <Box>
                        <VStack align="start">
                            <Suspense fallback={<Spinner />}>
                                <CircleBasePopupForm
                                    isUpdateForm={true}
                                    circle={createdCircle}
                                    isGuideForm={true}
                                    onNext={next}
                                    toggleMapInteract={toggleMapInteract}
                                />
                            </Suspense>
                        </VStack>
                    </Box>
                );

            default:
                break;
        }
    };

    return (
        <Box>
            <Box marginTop="10px">{getActiveStepComponent()}</Box>

            <Flex flexDirection="column" flexGrow="1" align="center" marginBottom="20px" marginTop="20px">
                <HStack align="center">
                    {steps.map((x, i) => (
                        <Box
                            key={x.id}
                            width="10px"
                            height="10px"
                            borderRadius="50%"
                            backgroundColor={i <= steps.indexOf(activeStep) ? "#5062ff" : "#d3d3d3"}
                        ></Box>
                    ))}
                </HStack>
            </Flex>
        </Box>
    );
};

export default NewCircleGuide;
