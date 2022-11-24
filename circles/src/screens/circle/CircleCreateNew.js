//#region imports
import React, { useState, useEffect, useContext } from "react";
import { Box, Flex } from "@chakra-ui/react";
import { CircleTypeForm, CircleImagesForm, CircleTagsForm, CircleBaseForm, CircleContentForm, EventContentForm } from "../settings/CircleSettingsForms";
import i18n from "i18n/Localization";
import UserContext from "../../components/UserContext";
import { log } from "../../components/Helpers";
import IsMobileContext from "../../components/IsMobileContext";
import { useNavigate } from "react-router-dom";
import { routes, openCircle } from "../../components/Navigation";
import { Step, Steps, useSteps } from "chakra-ui-steps";
import { Scrollbars } from "react-custom-scrollbars-2";
//#endregion

export const CircleCreateNew = ({
    circle,
    setCircle,
    displayMode,
    setDisplayMode,
    locationPickerPosition,
    setLocationPickerPosition,
    setLocationPickerActive,
    isSignedIn,
    isSigningIn,
    mustLogInOnOpen,
    parentId,
}) => {
    const isMobile = useContext(IsMobileContext);
    const [createdCircle, setCreatedCircle] = useState({});
    const [isInitialized, setIsInitialized] = useState(false);
    const navigate = useNavigate();
    const user = useContext(UserContext);

    const createCircleSteps = [
        { label: i18n.t("Type") },
        { label: i18n.t("about") },
        { label: i18n.t("images") },
        { label: i18n.t("Tags") },
        { label: i18n.t("base") },
    ];
    const {
        nextStep: createCircleNextStep,
        reset: createCircleReset,
        activeStep: createCircleActiveStep,
    } = useSteps({
        initialStep: 0,
    });

    const onCreateCircleNextStep = () => {
        createCircleNextStep();

        // if active circle step is 1 at this point we're moving on to the third step - setting circle base, we activate the location picker
        setLocationPickerActive(createCircleActiveStep === 3);
        if (createCircleActiveStep === 4) {
            // we're finishing last step so switch to created circle
            navigate(routes.circle(createdCircle.id).home);
            setLocationPickerPosition(null);
            setLocationPickerActive(false);
        }
    };

    useEffect(() => {
        log("CreateNewCircle.useEffect 1", 0);
        if (isInitialized) return;
        if (!isSignedIn) {
            mustLogInOnOpen();
            return;
        }
        // for some reason it gets reset here we need to fix it
        setIsInitialized(() => true);
        if (isMobile) {
            setDisplayMode("list");
        }
        createCircleReset();
        setCreatedCircle(null);
    }, [createCircleReset, isSignedIn, mustLogInOnOpen, setDisplayMode, isInitialized, isMobile]);

    const onCreateCircleCloseClick = () => {
        setLocationPickerActive(false);
        setCreatedCircle(null);
        //setIsInitialized(false);
        openCircle(navigate, user, parentId ?? "earth", circle, setCircle);
    };

    const onCreateCircleUpdated = (updatedCircleData) => {
        setCreatedCircle((previusCreatedCircle) => ({ ...previusCreatedCircle, ...updatedCircleData }));
    };

    return (
        <Box flexGrow="1" width="100%" height="100%" align="center" position="relative" top="0px" backgroundColor="white">
            <Scrollbars>
                {/* Holy grail layout here */}

                <Flex width="100%" maxWidth="800px" flexDirection="column" flexWrap="nowrap">
                    <Box flex="initial" order="0" marginTop="25px" marginLeft="25px" marginRight="25px">
                        {!isMobile && (
                            <Steps activeStep={createCircleActiveStep} marginBottom="10px">
                                {createCircleSteps.map(({ label }, index) => (
                                    <Step key={label}></Step>
                                ))}
                            </Steps>
                        )}

                        {/* Create circle step 0 - set circle type */}
                        {createCircleActiveStep === 0 && (
                            <CircleTypeForm
                                isUpdateForm={false}
                                language={i18n.language}
                                onCancel={onCreateCircleCloseClick}
                                onNext={onCreateCircleNextStep}
                                onUpdate={onCreateCircleUpdated}
                            />
                        )}

                        {/* Create circle step 1 - set name and description */}
                        {createCircleActiveStep === 1 && (
                            <>
                                {(createdCircle?.type === "circle" || createdCircle?.type === "tag" || createdCircle?.type === "room") && (
                                    <CircleContentForm
                                        isUpdateForm={false}
                                        language={i18n.language}
                                        onCancel={onCreateCircleCloseClick}
                                        onNext={onCreateCircleNextStep}
                                        onUpdate={onCreateCircleUpdated}
                                        type={createdCircle.type}
                                        parentCircle={circle}
                                        chatIsPublic={true}
                                    />
                                )}
                                {createdCircle?.type === "event" && (
                                    <EventContentForm
                                        isUpdateForm={false}
                                        language={i18n.language}
                                        onCancel={onCreateCircleCloseClick}
                                        onNext={onCreateCircleNextStep}
                                        onUpdate={onCreateCircleUpdated}
                                        parentCircle={circle}
                                        chatIsPublic={true}
                                    />
                                )}
                            </>
                        )}

                        {/* Create circle step 2 - set picture and cover images */}
                        {createCircleActiveStep === 2 && (
                            <CircleImagesForm
                                isUpdateform={false}
                                onCancel={onCreateCircleCloseClick}
                                onNext={onCreateCircleNextStep}
                                onUpdate={onCreateCircleUpdated}
                                circleId={createdCircle.id}
                                name={createdCircle.name}
                                description={createdCircle.description}
                                type={createdCircle.type}
                            />
                        )}

                        {/* Create circle step 3 - choose tags */}
                        {createCircleActiveStep === 3 && (
                            <CircleTagsForm
                                isUpdateform={false}
                                onCancel={onCreateCircleCloseClick}
                                onNext={onCreateCircleNextStep}
                                onUpdate={onCreateCircleUpdated}
                                circle={createdCircle}
                            />
                        )}

                        {/* Create circle step 4 - set base */}
                        {createCircleActiveStep === 4 && (
                            <CircleBaseForm
                                isUpdateForm={false}
                                onCancel={onCreateCircleCloseClick}
                                onNext={onCreateCircleNextStep}
                                onUpdate={onCreateCircleUpdated}
                                circleId={createdCircle.id}
                                locationPickerPosition={locationPickerPosition}
                                type={createdCircle.type}
                            />
                        )}
                    </Box>
                </Flex>
            </Scrollbars>
        </Box>
    );
};

export default CircleCreateNew;
