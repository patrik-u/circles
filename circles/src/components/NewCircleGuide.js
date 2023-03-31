//#region imports
import React, { useState, useEffect, useMemo, lazy, Suspense } from "react";
import { Flex, Box, Text, Spinner, Button, Checkbox, useToast, HStack, VStack } from "@chakra-ui/react";
import { Scrollbars } from "react-custom-scrollbars-2";
import axios from "axios";
import { toastError, log } from "components/Helpers";
import i18n from "i18n/Localization";
import config from "Config";
import PrivacyPolicy from "components/PrivacyPolicy";
import { userAtom } from "components/Atoms";
import { useAtom } from "jotai";
import { routes, openCircle } from "components/Navigation";
import { useNavigateNoUpdates } from "components/RouterUtils";
//#endregion

const CircleContentForm = lazy(() => import("components/settings/CircleContentForm"));
const CircleLinkForm = lazy(() => import("components/settings/CircleLinkForm"));
const CircleImagesForm = lazy(() => import("components/settings/CircleImagesForm"));
const CircleTagsForm = lazy(() => import("components/settings/CircleTagsForm"));
const CircleBaseForm = lazy(() => import("components/settings/CircleBaseForm"));
const CircleTypeForm = lazy(() => import("components/settings/CircleTypeForm"));

export const NewCircleGuide = ({ onClose, type, circle, message }) => {
    const [user] = useAtom(userAtom);
    const [createdCircle, setCreatedCircle] = useState({ type: type, parent_circle: circle, content: message, is_public: true, language: i18n.language });
    const navigate = useNavigateNoUpdates();
    const allSteps = useMemo(
        () => ({
            about: { id: "about", label: i18n.t("About") },
            images: { id: "images", label: i18n.t("Images") },
            tags: { id: "tags", label: i18n.t("Tags") },
            //            location: { id: "location", label: i18n.t("base") },
            //            complete: { id: "complete", label: i18n.t("Congratulations") },
        }),
        []
    );
    const [steps] = useState([allSteps.about, allSteps.images, allSteps.tags]);
    const [activeStep, setActiveStep] = useState(allSteps.about);

    const next = () => {
        let nextIndex = steps.indexOf(activeStep) + 1;
        if (nextIndex >= steps.length) {
            onClose();
            navigate(routes.circle(createdCircle).home);
        } else {
            setActiveStep(steps[nextIndex]);
        }
    };

    const onUpdate = (updatedCircleData) => {
        setCreatedCircle((previusCreatedCircle) => ({ ...previusCreatedCircle, ...updatedCircleData }));
    };

    const getActiveStepComponent = () => {
        switch (activeStep.id) {
            case allSteps.about.id:
                return (
                    <Box>
                        <VStack align="start">
                            <Suspense fallback={<Spinner />}>
                                <CircleContentForm isUpdateForm={false} circle={createdCircle} isGuideForm={false} onNext={next} onUpdate={onUpdate} onCancel={onClose} />
                            </Suspense>
                        </VStack>
                    </Box>
                );

            case allSteps.images.id:
                return (
                    <Box>
                        <VStack align="start">
                            <Suspense fallback={<Spinner />}>
                                <CircleImagesForm isUpdateForm={true} circle={createdCircle} isGuideForm={false} onNext={next} onUpdate={onUpdate} onCancel={onClose} />
                            </Suspense>
                        </VStack>
                    </Box>
                );

            case allSteps.tags.id:
                return (
                    <Box>
                        <VStack align="start">
                            <Suspense fallback={<Spinner />}>
                                <CircleTagsForm isUpdateForm={true} circle={createdCircle} isGuideForm={false} onNext={next} onUpdate={onUpdate} onCancel={onClose} />
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
                        <Box key={x.id} width="10px" height="10px" borderRadius="50%" backgroundColor={i <= steps.indexOf(activeStep) ? "#5062ff" : "#d3d3d3"}></Box>
                    ))}
                </HStack>
            </Flex>
        </Box>
    );
};

export default NewCircleGuide;
