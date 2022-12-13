//#region imports
import React, { useState, useEffect, lazy } from "react";
import { Box, Flex } from "@chakra-ui/react";
import i18n from "i18n/Localization";
import { log } from "components/Helpers";
import { routes, openCircle } from "components/Navigation";
import { useNavigateNoUpdates } from "components/RouterUtils";
import { isMobileAtom, userAtom, signInStatusAtom, circleAtom } from "components/Atoms";
import { useAtom } from "jotai";
//#endregion

const CircleContentForm = lazy(() => import("components/settings/CircleContentForm"));
const CircleImagesForm = lazy(() => import("components/settings/CircleImagesForm"));
const CircleTagsForm = lazy(() => import("components/settings/CircleTagsForm"));
const CircleBaseForm = lazy(() => import("components/settings/CircleBaseForm"));
const CircleTypeForm = lazy(() => import("components/settings/CircleTypeForm"));

export const CircleCreateNew = () => {
    const [isMobile] = useAtom(isMobileAtom);
    const [createdCircle, setCreatedCircle] = useState({});
    const [circle] = useAtom(circleAtom);
    const [signInStatus] = useAtom(signInStatusAtom);
    const navigate = useNavigateNoUpdates();
    const [step, setStep] = useState(0);

    // const createCircleSteps = [
    //     { label: i18n.t("Type") },
    //     { label: i18n.t("about") },
    //     { label: i18n.t("images") },
    //     { label: i18n.t("Tags") },
    //     { label: i18n.t("base") },
    // ];

    useEffect(() => {
        setStep(0);
    }, []);

    const onCreateCircleNextStep = () => {
        let nextStep = step + 1;
        setStep(nextStep);

        // if active circle step is 1 at this point we're moving on to the third step - setting circle base, we activate the location picker
        if (step === 4) {
            // we're finishing last step so switch to created circle
            navigate(routes.circle(createdCircle.id).home);
        }
    };

    const onCreateCircleCloseClick = () => {
        setStep(0);
        setCreatedCircle(null);
        if (circle?.id) {
            openCircle(navigate, circle.id);
        }
    };

    const onCreateCircleUpdated = (updatedCircleData) => {
        setCreatedCircle((previusCreatedCircle) => ({ ...previusCreatedCircle, ...updatedCircleData }));
    };

    if (!circle?.id || !signInStatus.signedIn) return null;

    return (
        <Flex flexGrow="1" width="100%" position="relative" left="0px" flexDirection={isMobile ? "column" : "row"} top="0px">
            <Box marginLeft="15px" marginRight="15px" marginBottom="25px" width="100%">
                {/*
                            TODO Visualize steps
                        {!isMobile && (
                            <Steps activeStep={createCircleActiveStep} marginBottom="10px">
                                {createCircleSteps.map(({ label }, index) => (
                                    <Step key={label}></Step>
                                ))}
                            </Steps>
                        )} */}

                {/* Create circle step 0 - set circle type */}
                {step === 0 && (
                    <CircleTypeForm isUpdateForm={false} onCancel={onCreateCircleCloseClick} onNext={onCreateCircleNextStep} onUpdate={onCreateCircleUpdated} />
                )}

                {/* Create circle step 1 - set name and description */}
                {step === 1 && (
                    <CircleContentForm
                        circle={createdCircle}
                        isUpdateform={false}
                        onCancel={onCreateCircleCloseClick}
                        onNext={onCreateCircleNextStep}
                        onUpdate={onCreateCircleUpdated}
                    />
                )}

                {/* Create circle step 2 - set picture and cover images */}
                {step === 2 && (
                    <CircleImagesForm
                        circle={createdCircle}
                        isUpdateform={false}
                        onCancel={onCreateCircleCloseClick}
                        onNext={onCreateCircleNextStep}
                        onUpdate={onCreateCircleUpdated}
                    />
                )}

                {/* Create circle step 3 - choose tags */}
                {step === 3 && (
                    <CircleTagsForm
                        circle={createdCircle}
                        isUpdateform={false}
                        onCancel={onCreateCircleCloseClick}
                        onNext={onCreateCircleNextStep}
                        onUpdate={onCreateCircleUpdated}
                    />
                )}

                {/* Create circle step 4 - set base */}
                {step === 4 && (
                    <CircleBaseForm
                        circle={createdCircle}
                        isUpdateForm={false}
                        onCancel={onCreateCircleCloseClick}
                        onNext={onCreateCircleNextStep}
                        onUpdate={onCreateCircleUpdated}
                    />
                )}
            </Box>
        </Flex>
    );
};

export default CircleCreateNew;
