//#region imports
import React, { useState, useEffect, useMemo, lazy, Suspense } from "react";
import {
    Flex,
    Box,
    Text,
    Spinner,
    Button,
    Checkbox,
    useToast,
    HStack,
    VStack,
    Tabs,
    Tab,
    TabPanel,
    TabPanels,
    TabList,
} from "@chakra-ui/react";
import { Scrollbars } from "react-custom-scrollbars-2";
import axios from "axios";
import { toastError, log, fromFsDate } from "@/components/Helpers";
import i18n from "@/i18n/Localization";
import config from "@/Config";
import { PrivacyPolicy, TermsOfService, tnsLastUpdate } from "@/components/TermsOfService";
import { userAtom, userDataAtom } from "@/components/Atoms";
import { useAtom } from "jotai";
import CircleContentForm from "@/components/settings/CircleContentForm";
import CircleImagesForm from "@/components/settings/CircleImagesForm";
import CircleTagsForm from "@/components/settings/CircleTagsForm";
import CircleMissionForm from "@/components/settings/CircleMissionForm";
import CircleOffersAndNeedsForm from "@/components/settings/CircleOffersAndNeedsForm";
import CircleQuestionsForm from "@/components/settings/CircleQuestionsForm";
import CircleBasePopupForm from "@/components/settings/CircleBasePopupForm";
//#endregion

export const NewUserGuide = ({ onClose, toggleMapInteract }) => {
    const [user] = useAtom(userAtom);
    const [userData] = useAtom(userDataAtom);
    const allSteps = useMemo(
        () => ({
            default: { id: "default", label: "Default" },
            tnc: { id: "tnc", label: i18n.t("Terms and conditions") },
            tnc_update: {
                id: "tnc_update",
                label: i18n.t("Terms and conditions"),
            },
            welcome: { id: "welcome", label: i18n.t("Welcome") },
            about: { id: "about", label: i18n.t("About") },
            images: { id: "images", label: i18n.t("Images") },
            mission: { id: "mission", label: i18n.t("Mission") },
            tags: { id: "tags", label: i18n.t("Tags") },
            offers_and_needs: {
                id: "offers_and_needs",
                label: i18n.t("Offers & Needs"),
            },
            questions: { id: "questions", label: i18n.t("Questions") },
            location: { id: "location", label: i18n.t("base") },
            complete: { id: "complete", label: i18n.t("Congratulations") },
        }),
        []
    );
    const [agreedToTnc, setAgreedToTnc] = useState(false);
    const [agreedToEmailUpdates, setAgreedToEmailUpdates] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [steps, setSteps] = useState([]);
    const [activeStep, setActiveStep] = useState(allSteps.default);
    const [hasBeenInitialized, setHasBeenInitialized] = useState(false);
    const toast = useToast();

    useEffect(() => {
        log("NewUserGuide.useEffect 1");
        if (!user?.id || hasBeenInitialized) return;
        setHasBeenInitialized(true);
        let ignoreCheck = config.alwaysShowGuide;
        let tocProfileStep = null;
        if (!userData?.agreed_to_tnc || ignoreCheck) {
            // user hasn't agreed to terms and conditions
            tocProfileStep = allSteps.tnc;
        } else if (fromFsDate(userData?.completed_guide) < fromFsDate(tnsLastUpdate)) {
            tocProfileStep = allSteps.tnc_update;
        }

        let profileSteps = [];
        if (!user.description || ignoreCheck) {
            profileSteps.push(allSteps.about);
        }
        if ((!user.picture && !user.cover) || ignoreCheck) {
            profileSteps.push(allSteps.images);
        }
        if (!user.mission || ignoreCheck) {
            profileSteps.push(allSteps.mission);
        }
        if (!user.tags || user.tags?.length <= 0 || ignoreCheck) {
            profileSteps.push(allSteps.tags);
        }
        if (!user.offers || !user.needs || ignoreCheck) {
            profileSteps.push(allSteps.offers_and_needs);
        }
        if (!user.base || ignoreCheck) {
            profileSteps.push(allSteps.location);
        }
        if (
            !user.questions ||
            !user.questions?.question0 ||
            !user.questions?.question1 ||
            !user.questions?.question2 ||
            ignoreCheck
        ) {
            profileSteps.push(allSteps.questions);
        }
        if (profileSteps.length > 0) {
            // if any profile steps added, include welcome and complete steps
            profileSteps.unshift(allSteps.welcome);
            profileSteps.push(allSteps.complete);
        }
        if (tocProfileStep) {
            profileSteps.unshift(tocProfileStep);
        }
        if (profileSteps.length <= 0) {
            onClose();
        }

        setSteps(profileSteps);
        setActiveStep(profileSteps[0]);
    }, [user?.id, userData?.agreed_to_tnc, userData?.completed_guide, hasBeenInitialized, allSteps, onClose]); // ignore warning as we don't want this to update unless vital data changes

    const next = () => {
        let nextIndex = steps.indexOf(activeStep) + 1;
        if (nextIndex >= steps.length) {
            onClose();
        } else {
            setActiveStep(steps[nextIndex]);
        }
    };

    const onAgreeToTncUpdateClick = () => {
        // update user data
        axios
            .put(`/circles/${user.id}`, {
                circlePrivateData: {
                    agreed_to_tnc: true,
                },
            })
            .catch((error) => {
                log("NewUserGuide.onAgreeToTncUpdateClick error", 2);
            });

        next();
    };

    const onAgreeToTncClick = () => {
        if (!agreedToTnc) return;

        setIsSaving(true);

        // update user data
        axios
            .put(`/circles/${user.id}`, {
                circlePrivateData: {
                    agreed_to_tnc: agreedToTnc,
                    agreed_to_email_updates: agreedToEmailUpdates,
                },
            })
            .then((x) => {
                let result = x.data;
                if (result.error) {
                    toastError(toast, JSON.stringify(result.error, null, 2));
                    next();
                } else {
                    next();
                }
                setIsSaving(false);
            })
            .catch((error) => {
                setIsSaving(false);
            });
    };

    const complete = () => {
        let req = {
            circlePrivateData: {
                completed_guide: true,
            },
        };
        if (!userData?.completed_guide) {
            // if first time completed guide then update ai summary
            req.circleData = {
                ai_summary: true,
            };
        }
        // confirm user has completed guide
        axios
            .put(`/circles/${user.id}`, req)
            .then((x) => {})
            .catch((error) => {});
        next();
    };

    const getActiveStepComponent = () => {
        switch (activeStep.id) {
            case allSteps.tnc.id:
                return (
                    <Box>
                        <VStack align="start">
                            <Text className="screenHeader" alignSelf="center">
                                {i18n.t(`Terms  and conditions`)}
                            </Text>
                            <Tabs>
                                <TabList>
                                    <Tab>Terms of Service</Tab>
                                    <Tab>Privacy Policy</Tab>
                                </TabList>

                                <TabPanels marginBottom="20px">
                                    <TabPanel margin="10px" padding="0px">
                                        <Box
                                            width="100%"
                                            height="300px"
                                            borderRadius="5px"
                                            border="1px solid"
                                            borderColor="var(--chakra-colors-gray-200)"
                                            backgroundColor="#f7f7f7"
                                            overflow="auto"
                                        >
                                            <TermsOfService />
                                        </Box>
                                    </TabPanel>
                                    <TabPanel margin="10px" padding="0px">
                                        <Box
                                            width="100%"
                                            height="300px"
                                            borderRadius="5px"
                                            border="1px solid"
                                            borderColor="var(--chakra-colors-gray-200)"
                                            backgroundColor="#f7f7f7"
                                            overflow="auto"
                                        >
                                            <PrivacyPolicy />
                                        </Box>
                                    </TabPanel>
                                </TabPanels>
                            </Tabs>
                            <Checkbox isChecked={agreedToTnc} onChange={(e) => setAgreedToTnc(e.target.checked)}>
                                I agree to the Terms and Conditions and Privacy Policy
                            </Checkbox>
                            <Checkbox
                                isChecked={agreedToEmailUpdates}
                                onChange={(e) => setAgreedToEmailUpdates(e.target.checked)}
                            >
                                I agree to be sent email updates from Circles (optional)
                            </Checkbox>
                        </VStack>
                        <Flex flexDirection="column" flexGrow="1" align="center" marginTop="10px">
                            <Button
                                marginTop="10px"
                                width="150px"
                                colorScheme="blue"
                                borderRadius="25px"
                                lineHeight="0"
                                backgroundColor="#389bf8"
                                color="white"
                                isDisabled={!agreedToTnc || isSaving}
                                onClick={onAgreeToTncClick}
                                position="relative"
                            >
                                {isSaving ? <Spinner /> : <Text>{i18n.t(`Confirm`)}</Text>}
                            </Button>
                        </Flex>
                    </Box>
                );

            case allSteps.tnc_update.id:
                return (
                    <Box>
                        <VStack align="start">
                            <Text className="screenHeader" alignSelf="center">
                                {i18n.t(`Terms  and conditions has been updated`)}
                            </Text>
                            <Tabs>
                                <TabList>
                                    <Tab>Terms of Service</Tab>
                                    <Tab>Privacy Policy</Tab>
                                </TabList>

                                <TabPanels marginBottom="20px">
                                    <TabPanel margin="10px" padding="0px">
                                        <Box
                                            width="100%"
                                            height="300px"
                                            borderRadius="5px"
                                            border="1px solid"
                                            borderColor="var(--chakra-colors-gray-200)"
                                            backgroundColor="#f7f7f7"
                                            overflow="auto"
                                        >
                                            <TermsOfService />
                                        </Box>
                                    </TabPanel>
                                    <TabPanel margin="10px" padding="0px">
                                        <Box
                                            width="100%"
                                            height="300px"
                                            borderRadius="5px"
                                            border="1px solid"
                                            borderColor="var(--chakra-colors-gray-200)"
                                            backgroundColor="#f7f7f7"
                                            overflow="auto"
                                        >
                                            <PrivacyPolicy />
                                        </Box>
                                    </TabPanel>
                                </TabPanels>
                            </Tabs>
                        </VStack>
                        <Flex flexDirection="column" flexGrow="1" align="center" marginTop="10px">
                            <Button
                                marginTop="10px"
                                width="150px"
                                colorScheme="blue"
                                borderRadius="25px"
                                lineHeight="0"
                                backgroundColor="#389bf8"
                                color="white"
                                onClick={onAgreeToTncUpdateClick}
                                position="relative"
                            >
                                <Text>{i18n.t(`Confirm`)}</Text>
                            </Button>
                        </Flex>
                    </Box>
                );

            case allSteps.welcome.id:
                return (
                    <Box>
                        <Text className="screenHeader" alignSelf="center" textAlign="center">
                            {i18n.t(`Welcome`)}
                        </Text>
                        <Text>
                            Welcome to Circles, please take a few minutes to fill out your change maker profile.{" "}
                        </Text>
                        <Flex flexDirection="column" flexGrow="1" align="center" marginTop="10px">
                            <Button
                                width="150px"
                                colorScheme="blue"
                                borderRadius="25px"
                                lineHeight="0"
                                backgroundColor="#389bf8"
                                color="white"
                                isDisabled={isSaving}
                                onClick={next}
                                position="relative"
                            >
                                {isSaving ? <Spinner /> : <Text>{i18n.t(`Continue`)}</Text>}
                            </Button>
                        </Flex>
                    </Box>
                );

            case allSteps.about.id:
                return (
                    <Box>
                        <VStack align="start">
                            <Suspense fallback={<Spinner />}>
                                <CircleContentForm isUpdateForm={true} circle={user} isGuideForm={true} onNext={next} />
                            </Suspense>
                        </VStack>
                    </Box>
                );

            case allSteps.images.id:
                return (
                    <Box>
                        <VStack align="start">
                            <Suspense fallback={<Spinner />}>
                                <CircleImagesForm isUpdateForm={true} circle={user} isGuideForm={true} onNext={next} />
                            </Suspense>
                        </VStack>
                    </Box>
                );

            case allSteps.mission.id:
                return (
                    <Box>
                        <VStack align="start">
                            <Suspense fallback={<Spinner />}>
                                <CircleMissionForm isUpdateForm={true} circle={user} isGuideForm={true} onNext={next} />
                            </Suspense>
                        </VStack>
                    </Box>
                );

            case allSteps.tags.id:
                return (
                    <Box>
                        <VStack align="start">
                            <Suspense fallback={<Spinner />}>
                                <CircleTagsForm isUpdateForm={true} circle={user} isGuideForm={true} onNext={next} />
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
                                    isUpdateForm={true}
                                    circle={user}
                                    isGuideForm={true}
                                    onNext={next}
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
                                    circle={user}
                                    isGuideForm={true}
                                    onNext={next}
                                    toggleMapInteract={toggleMapInteract}
                                />
                            </Suspense>
                        </VStack>
                    </Box>
                );

            case allSteps.questions.id:
                return (
                    <Box>
                        <VStack align="start">
                            <Suspense fallback={<Spinner />}>
                                <CircleQuestionsForm
                                    isUpdateForm={true}
                                    circle={user}
                                    isGuideForm={true}
                                    onNext={next}
                                />
                            </Suspense>
                        </VStack>
                    </Box>
                );

            case allSteps.complete.id:
                return (
                    <Box>
                        <Text className="screenHeader" alignSelf="center" textAlign="center">
                            {i18n.t(`Congratulations`)}
                        </Text>
                        <Text>
                            Thank you for completing your change maker profile. You can change your settings at any time
                            in your user settings.
                        </Text>
                        <Flex flexDirection="column" flexGrow="1" align="center" marginTop="10px">
                            <Button
                                width="150px"
                                colorScheme="blue"
                                borderRadius="25px"
                                lineHeight="0"
                                backgroundColor="#389bf8"
                                color="white"
                                isDisabled={isSaving}
                                onClick={complete}
                                position="relative"
                            >
                                {isSaving ? <Spinner /> : <Text>{i18n.t(`Let's get started`)}</Text>}
                            </Button>
                        </Flex>
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

export default NewUserGuide;
