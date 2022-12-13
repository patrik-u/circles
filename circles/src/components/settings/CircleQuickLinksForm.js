//#region imports
import { Form, Field, Formik } from "formik";
import { Box, FormControl, FormLabel, InputRightElement, Input, FormErrorMessage, InputGroup, HStack, VStack, Text, Button, useToast } from "@chakra-ui/react";
import { CheckIcon } from "@chakra-ui/icons";
import axios from "axios";
import { i18n } from "i18n/Localization";
import "react-datepicker/dist/react-datepicker.css";
import "react-quill/dist/quill.snow.css";
//#endregion

export const CircleQuickLinksForm = ({ circle }) => {
    const toast = useToast();

    if (!circle) return null;

    return (
        <Box width="100%">
            <Formik
                initialValues={{
                    facebook: circle.social_media?.facebook ?? "",
                    instagram: circle.social_media?.instagram ?? "",
                    youtube: circle.social_media?.youtube ?? "",
                    tiktok: circle.social_media?.tiktok ?? "",
                    twitter: circle.social_media?.twitter ?? "",
                    linkedin: circle.social_media?.linkedin ?? "",
                    medium: circle.social_media?.medium ?? "",
                    link1: circle.social_media?.link1 ?? "",
                    link2: circle.social_media?.link2 ?? "",
                    link3: circle.social_media?.link3 ?? "",
                }}
                onSubmit={async (values, actions) => {
                    if (!circle) return;

                    // update user name and description
                    let new_social_media = {
                        facebook: values.facebook ?? "",
                        instagram: values.instagram ?? "",
                        youtube: values.youtube ?? "",
                        tiktok: values.tiktok ?? "",
                        twitter: values.twitter ?? "",
                        linkedin: values.linkedin ?? "",
                        medium: values.medium ?? "",
                        link1: values.link1 ?? "",
                        link2: values.link2 ?? "",
                        link3: values.link3 ?? "",
                    };

                    let updatedCircleData = { social_media: new_social_media };

                    //console.log("updating user data", updatedUserData);

                    // update user data
                    let putCircleResult = await axios.put(`/circles/${circle.id}`, {
                        circleData: updatedCircleData,
                    });

                    if (!putCircleResult.data?.error) {
                        toast({
                            title: i18n.t("Circle updated"),
                            status: "success",
                            position: "top",
                            duration: 4500,
                            isClosable: true,
                        });
                    } else {
                        toast({
                            title: i18n.t("Unable to update circle"),
                            description: putCircleResult.data.error,
                            status: "error",
                            position: "top",
                            duration: 4500,
                            isClosable: true,
                        });
                    }

                    actions.setSubmitting(false);
                    return;
                }}
                validate={(values) => {
                    const errors = {};
                    if (values.facebook && values.facebook.length > 200) {
                        errors.facebook = i18n.t("Link can't contain more than 200 characters");
                    }
                    if (values.instagram && values.instagram.length > 200) {
                        errors.instagram = i18n.t("Link can't contain more than 200 characters");
                    }
                    if (values.youtube && values.youtube.length > 200) {
                        errors.youtube = i18n.t("Link can't contain more than 200 characters");
                    }
                    if (values.tiktok && values.tiktok.length > 200) {
                        errors.tiktok = i18n.t("Link can't contain more than 200 characters");
                    }
                    if (values.twitter && values.twitter.length > 200) {
                        errors.twitter = i18n.t("Link can't contain more than 200 characters");
                    }
                    if (values.linkedin && values.linkedin.length > 200) {
                        errors.linkedin = i18n.t("Link can't contain more than 200 characters");
                    }
                    if (values.medium && values.medium.length > 200) {
                        errors.medium = i18n.t("Link can't contain more than 200 characters");
                    }
                    if (values.link1 && values.link1.length > 200) {
                        errors.link1 = i18n.t("Link can't contain more than 200 characters");
                    }
                    if (values.link2 && values.link2.length > 200) {
                        errors.link2 = i18n.t("Link can't contain more than 200 characters");
                    }
                    if (values.link3 && values.link3.length > 200) {
                        errors.link3 = i18n.t("Link can't contain more than 200 characters");
                    }
                    return errors;
                }}
            >
                {({ values, errors, touched, isSubmitting }) => (
                    <Form>
                        <VStack align="center">
                            <Text className="screenHeader">{i18n.t("Links")}</Text>

                            <VStack align="center" spacing="25px" width="100%" marginLeft="25px" marginRight="25px">
                                <Field name="facebook">
                                    {({ field, form }) => (
                                        <FormControl isInvalid={form.errors.facebook && form.touched.facebook}>
                                            <FormLabel>Facebook</FormLabel>
                                            <Text position="absolute" right="0px" top="5px" fontSize="12px" color="#bbb">
                                                {form?.values?.facebook ? form.values.facebook.length : 0} / 200
                                            </Text>
                                            <InputGroup>
                                                <Input {...field} id="facebook" type="text" placeholder={i18n.t("Facebook example")} maxLength="200" />
                                                {!form.errors.facebook && form.touched.facebook && (
                                                    <InputRightElement children={<CheckIcon color="green.500" />} />
                                                )}
                                            </InputGroup>
                                            <FormErrorMessage>{form.errors.facebook}</FormErrorMessage>
                                        </FormControl>
                                    )}
                                </Field>
                                <Field name="twitter">
                                    {({ field, form }) => (
                                        <FormControl isInvalid={form.errors.twitter && form.touched.twitter}>
                                            <FormLabel>Twitter</FormLabel>
                                            <Text position="absolute" right="0px" top="5px" fontSize="12px" color="#bbb">
                                                {form?.values?.twitter ? form.values.twitter.length : 0} / 200
                                            </Text>
                                            <InputGroup>
                                                <Input {...field} id="twitter" type="text" placeholder={i18n.t("Twitter example")} maxLength="200" />
                                                {!form.errors.twitter && form.touched.twitter && (
                                                    <InputRightElement children={<CheckIcon color="green.500" />} />
                                                )}
                                            </InputGroup>
                                            <FormErrorMessage>{form.errors.twitter}</FormErrorMessage>
                                        </FormControl>
                                    )}
                                </Field>
                                <Field name="instagram">
                                    {({ field, form }) => (
                                        <FormControl isInvalid={form.errors.instagram && form.touched.instagram}>
                                            <FormLabel>Instagram</FormLabel>
                                            <Text position="absolute" right="0px" top="5px" fontSize="12px" color="#bbb">
                                                {form?.values?.instagram ? form.values.instagram.length : 0} / 200
                                            </Text>
                                            <InputGroup>
                                                <Input {...field} id="instagram" type="text" placeholder={i18n.t("Instagram example")} maxLength="200" />
                                                {!form.errors.instagram && form.touched.instagram && (
                                                    <InputRightElement children={<CheckIcon color="green.500" />} />
                                                )}
                                            </InputGroup>
                                            <FormErrorMessage>{form.errors.instagram}</FormErrorMessage>
                                        </FormControl>
                                    )}
                                </Field>
                                <Field name="youtube">
                                    {({ field, form }) => (
                                        <FormControl isInvalid={form.errors.youtube && form.touched.youtube}>
                                            <FormLabel>YouTube</FormLabel>
                                            <Text position="absolute" right="0px" top="5px" fontSize="12px" color="#bbb">
                                                {form?.values?.youtube ? form.values.youtube.length : 0} / 200
                                            </Text>
                                            <InputGroup>
                                                <Input {...field} id="youtube" type="text" placeholder={i18n.t("YouTube example")} maxLength="200" />
                                                {!form.errors.youtube && form.touched.youtube && (
                                                    <InputRightElement children={<CheckIcon color="green.500" />} />
                                                )}
                                            </InputGroup>
                                            <FormErrorMessage>{form.errors.youtube}</FormErrorMessage>
                                        </FormControl>
                                    )}
                                </Field>
                                <Field name="tiktok">
                                    {({ field, form }) => (
                                        <FormControl isInvalid={form.errors.tiktok && form.touched.tiktok}>
                                            <FormLabel>TikTok</FormLabel>
                                            <Text position="absolute" right="0px" top="5px" fontSize="12px" color="#bbb">
                                                {form?.values?.tiktok ? form.values.tiktok.length : 0} / 200
                                            </Text>
                                            <InputGroup>
                                                <Input {...field} id="tiktok" type="text" placeholder={i18n.t("TikTok example")} maxLength="200" />
                                                {!form.errors.tiktok && form.touched.tiktok && <InputRightElement children={<CheckIcon color="green.500" />} />}
                                            </InputGroup>
                                            <FormErrorMessage>{form.errors.tiktok}</FormErrorMessage>
                                        </FormControl>
                                    )}
                                </Field>
                                <Field name="linkedin">
                                    {({ field, form }) => (
                                        <FormControl isInvalid={form.errors.linkedin && form.touched.linkedin}>
                                            <FormLabel>LinkedIn</FormLabel>
                                            <Text position="absolute" right="0px" top="5px" fontSize="12px" color="#bbb">
                                                {form?.values?.linkedin ? form.values.linkedin.length : 0} / 200
                                            </Text>
                                            <InputGroup>
                                                <Input {...field} id="linkedin" type="text" placeholder={i18n.t("LinkedIn example")} maxLength="200" />
                                                {!form.errors.linkedin && form.touched.linkedin && (
                                                    <InputRightElement children={<CheckIcon color="green.500" />} />
                                                )}
                                            </InputGroup>
                                            <FormErrorMessage>{form.errors.linkedin}</FormErrorMessage>
                                        </FormControl>
                                    )}
                                </Field>
                                <Field name="medium">
                                    {({ field, form }) => (
                                        <FormControl isInvalid={form.errors.medium && form.touched.medium}>
                                            <FormLabel>Medium</FormLabel>
                                            <Text position="absolute" right="0px" top="5px" fontSize="12px" color="#bbb">
                                                {form?.values?.medium ? form.values.medium.length : 0} / 200
                                            </Text>
                                            <InputGroup>
                                                <Input {...field} id="medium" type="text" placeholder={i18n.t("Medium example")} maxLength="200" />
                                                {!form.errors.medium && form.touched.medium && <InputRightElement children={<CheckIcon color="green.500" />} />}
                                            </InputGroup>
                                            <FormErrorMessage>{form.errors.medium}</FormErrorMessage>
                                        </FormControl>
                                    )}
                                </Field>
                                <Field name="link1">
                                    {({ field, form }) => (
                                        <FormControl isInvalid={form.errors.link1 && form.touched.link1}>
                                            <FormLabel>Custom link 1</FormLabel>
                                            <Text position="absolute" right="0px" top="5px" fontSize="12px" color="#bbb">
                                                {form?.values?.link1 ? form.values.link1.length : 0} / 200
                                            </Text>
                                            <InputGroup>
                                                <Input {...field} id="link1" type="text" placeholder={i18n.t("Link example")} maxLength="200" />
                                                {!form.errors.link1 && form.touched.link1 && <InputRightElement children={<CheckIcon color="green.500" />} />}
                                            </InputGroup>
                                            <FormErrorMessage>{form.errors.link1}</FormErrorMessage>
                                        </FormControl>
                                    )}
                                </Field>
                                <Field name="link2">
                                    {({ field, form }) => (
                                        <FormControl isInvalid={form.errors.link2 && form.touched.link2}>
                                            <FormLabel>Custom link 2</FormLabel>
                                            <Text position="absolute" right="0px" top="5px" fontSize="12px" color="#bbb">
                                                {form?.values?.link2 ? form.values.link2.length : 0} / 200
                                            </Text>
                                            <InputGroup>
                                                <Input {...field} id="link2" type="text" placeholder={i18n.t("Link example")} maxLength="200" />
                                                {!form.errors.link2 && form.touched.link2 && <InputRightElement children={<CheckIcon color="green.500" />} />}
                                            </InputGroup>
                                            <FormErrorMessage>{form.errors.link2}</FormErrorMessage>
                                        </FormControl>
                                    )}
                                </Field>
                                <Field name="link3">
                                    {({ field, form }) => (
                                        <FormControl isInvalid={form.errors.link3 && form.touched.link3}>
                                            <FormLabel>Custom link 3</FormLabel>
                                            <Text position="absolute" right="0px" top="5px" fontSize="12px" color="#bbb">
                                                {form?.values?.link3 ? form.values.link3.length : 0} / 200
                                            </Text>
                                            <InputGroup>
                                                <Input {...field} id="link3" type="text" placeholder={i18n.t("Link example")} maxLength="200" />
                                                {!form.errors.link3 && form.touched.link3 && <InputRightElement children={<CheckIcon color="green.500" />} />}
                                            </InputGroup>
                                            <FormErrorMessage>{form.errors.link3}</FormErrorMessage>
                                        </FormControl>
                                    )}
                                </Field>
                            </VStack>
                            <Box>
                                <HStack align="center" marginTop="10px">
                                    <Button colorScheme="blue" mr={3} borderRadius="25px" isLoading={isSubmitting} type="submit" lineHeight="0">
                                        {i18n.t("Spara")}
                                    </Button>
                                </HStack>
                            </Box>
                        </VStack>
                    </Form>
                )}
            </Formik>
        </Box>
    );
};

export default CircleQuickLinksForm;
