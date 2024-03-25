//#region imports
import React, { useState, useMemo, Suspense } from "react";
import { Flex, Box, Spinner, HStack, VStack } from "@chakra-ui/react";
import axios from "axios";
import i18n from "@/i18n/Localization";
import { userAtom, toggleAboutAtom, focusOnMapItemAtom } from "@/components/Atoms";
import { useAtom } from "jotai";
import { openCircle, openAboutCircle, focusCircle } from "@/components/Navigation";
import { useNavigateNoUpdates } from "@/components/RouterUtils";
import { CircleContentForm } from "@/components/settings/CircleContentForm";
import { CircleProjectForm } from "@/components/settings/CircleProjectForm";
import { CircleImagesForm } from "@/components/settings/CircleImagesForm";
import { CircleMissionForm } from "@/components/settings/CircleMissionForm";
import { CircleTagsForm } from "@/components/settings/CircleTagsForm";
import { CircleOffersAndNeedsForm } from "@/components/settings/CircleOffersAndNeedsForm";
import { CircleBasePopupForm } from "@/components/settings/CircleBasePopupForm";
import { CircleTypeForm } from "@/components/settings/CircleTypeForm";
import { CirclePostForm } from "@/components/settings/CirclePostForm";
//#endregion

export const NewCircleGuide = ({ onClose, type, circle, parent_circle, message, toggleMapInteract, isUpdateForm }) => {
    const [user] = useAtom(userAtom);
    const [createdCircle, setCreatedCircle] = useState(
        isUpdateForm
            ? circle
            : {
                  type: type,
                  parent_circle: parent_circle,
                  content: message,
                  is_public: true,
                  language: i18n.language,
              }
    );
    const [, setToggleAbout] = useAtom(toggleAboutAtom);
    const navigate = useNavigateNoUpdates();
    const allSteps = useMemo(
        () => ({
            // type: { id: "type", label: i18n.t("Type") },
            post: { id: "post", label: i18n.t("Post") },
            project: { id: "project", label: i18n.t("Project") },
            about: { id: "about", label: i18n.t("About") },
            images: { id: "images", label: i18n.t("Images") },
            mission: { id: "mission", label: i18n.t("Mission") },
            tags: { id: "tags", label: i18n.t("Tags") },
            offers_and_needs: { id: "offers_and_needs", label: i18n.t("Offers & Needs") },
            location: { id: "location", label: i18n.t("base") },
        }),
        []
    );

    const getStepsForType = (type) => {
        switch (type) {
            case "post":
                return [allSteps.post];
            case "project":
                return [allSteps.project,allSteps.images];
            default:
                return [
                    allSteps.about,
                    allSteps.images,
                    allSteps.mission,
                    allSteps.tags,
                    allSteps.offers_and_needs,
                    allSteps.location,
                ];
        }
    };

    const steps = getStepsForType(type);
    const [activeStep, setActiveStep] = useState(steps[0]);
    const [, setFocusOnMapItem] = useAtom(focusOnMapItemAtom);

    const next = () => {
        let nextIndex = steps.indexOf(activeStep) + 1;
        if (nextIndex >= steps.length) {
            complete();
            onClose();
            if (createdCircle.type === "circle") {
                openCircle(navigate, createdCircle);
                focusCircle(createdCircle, setFocusOnMapItem);
                openAboutCircle(createdCircle, setToggleAbout);
            }
        } else {
            setActiveStep(steps[nextIndex]);
        }
    };

    const onUpdate = (updatedCircleData) => {
        setCreatedCircle((previusCreatedCircle) => ({ ...previusCreatedCircle, ...updatedCircleData }));
    };

    const complete = () => {
        if (!circle?.id) return;
        // turn on AI summary for select circle types
        if (circle.type === "circle" || circle.type === "event" || circle.type === "user") {
            let req = {
                circleData: {
                    ai_summary: true,
                },
            };
            axios.put(`/circles/${circle.id}`, req).catch((error) => {
                console.error(error);
            });
        }
    };

    const getActiveStepComponent = () => {
        switch (activeStep.id) {
            case allSteps.post.id:
                return (
                    <Box>
                        <VStack align="start">
                            <Suspense fallback={<Spinner />}>
                                <CirclePostForm
                                    isUpdateForm={isUpdateForm}
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
            case allSteps.project.id:
                return (
                    <Box>
                        <VStack align="start">
                            <Suspense fallback={<Spinner />}>
                                <CircleProjectForm
                                    isUpdateForm={isUpdateForm}
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
                                    isUpdateForm={isUpdateForm}
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

            case allSteps.mission.id:
                return (
                    <Box>
                        <VStack align="start">
                            <Suspense fallback={<Spinner />}>
                                <CircleMissionForm
                                    isUpdateForm={isUpdateForm}
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

            case allSteps.offers_and_needs.id:
                return (
                    <Box>
                        <VStack align="start">
                            <Suspense fallback={<Spinner />}>
                                <CircleOffersAndNeedsForm
                                    isUpdateForm={isUpdateForm}
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

            {steps.length > 1 && (
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
            )}
        </Box>
    );
};

export default NewCircleGuide;
