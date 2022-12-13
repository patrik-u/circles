//#region imports
import { Form, Field, Formik } from "formik";
import { Box, FormControl, FormErrorMessage, HStack, VStack, Text, Image, Button, RadioGroup, Stack, Radio, StackDivider } from "@chakra-ui/react";

import { i18n } from "i18n/Localization";
import { useAtom } from "jotai";
import { userAtom, circleAtom } from "components/Atoms";
import "react-datepicker/dist/react-datepicker.css";
import "react-quill/dist/quill.snow.css";
//#endregion

export const CircleTypeForm = ({ type, onCancel, onNext, onUpdate }) => {
    const [user] = useAtom(userAtom);
    const [circle] = useAtom(circleAtom);

    return (
        <Formik
            initialValues={{ type: type ?? "circle" }}
            onSubmit={async (values, actions) => {
                console.log("Submitting");
                actions.setSubmitting(false);
                let newCircle = { type: values.type, language: i18n.language, chat_is_public: true };
                if (circle) {
                    newCircle.parent_circle = circle;
                }

                onUpdate(newCircle);

                // proceed to next step
                if (onNext) {
                    onNext();
                }
            }}
            validate={(values) => {
                const errors = {};
                if (!values.type) {
                    errors.type = i18n.t("Choose type of circle");
                } else if (values.type === "tag" && !user?.is_admin) {
                    errors.type = "unauthorized";
                } else if (values.type !== "tag" && values.type !== "circle" && values.type !== "event" && values.type !== "room" && values.type !== "link") {
                    errors.type = i18n.t("Choose valid circle type");
                }
                return errors;
            }}
        >
            {({ values, errors, touched, isSubmitting }) => (
                <Form>
                    <VStack align="center">
                        <Text className="screenHeader">{i18n.t("Create new")}</Text>

                        <VStack align="center" spacing="25px" width="100%" marginLeft="25px" marginRight="25px">
                            <Field name="type">
                                {({ field, form }) => {
                                    const { onChange, ...rest } = field;
                                    return (
                                        <FormControl isInvalid={form.errors.type && form.touched.type}>
                                            <RadioGroup id="type" {...rest}>
                                                <Stack direction="column" divider={<StackDivider borderColor="gray.200" />}>
                                                    <Radio onChange={onChange} value="circle">
                                                        <HStack spacing="10px">
                                                            <Image src="/circle-default-option.png" width="100px" height="100px" />
                                                            <VStack align="start" spacing="0px">
                                                                <Text fontWeight="700">{i18n.t("Circle")}</Text>
                                                                <Text textAlign="left">{i18n.t("Circle of people gathering around a common cause")}</Text>
                                                            </VStack>
                                                        </HStack>
                                                    </Radio>
                                                    <Radio onChange={onChange} value="event">
                                                        <HStack spacing="10px">
                                                            <Image src="/circle-event-option.png" width="100px" height="100px" />
                                                            <VStack align="start" spacing="0px">
                                                                <Text fontWeight="700">{i18n.t("Event")}</Text>
                                                                <Text textAlign="left">{i18n.t("Event that takes place at a certain date")}</Text>
                                                            </VStack>
                                                        </HStack>
                                                    </Radio>
                                                    <Radio onChange={onChange} value="room">
                                                        <HStack spacing="10px">
                                                            <Image src="/circle-room-option.png" width="100px" height="100px" />
                                                            <VStack align="start" spacing="0px">
                                                                <Text fontWeight="700">{i18n.t("Room")}</Text>
                                                                <Text textAlign="left">{i18n.t("Room description")}</Text>
                                                            </VStack>
                                                        </HStack>
                                                    </Radio>

                                                    {user?.is_admin && (
                                                        <Radio onChange={onChange} value="link">
                                                            <HStack spacing="10px">
                                                                <Image src="/circle-link-option.png" width="100px" height="100px" />
                                                                <VStack align="start" spacing="0px">
                                                                    <Text fontWeight="700">{i18n.t("Link")}</Text>
                                                                    <Text textAlign="left">{i18n.t("Link description")}</Text>
                                                                </VStack>
                                                            </HStack>
                                                        </Radio>
                                                    )}

                                                    {user?.is_admin && (
                                                        <Radio onChange={onChange} value="tag">
                                                            <HStack spacing="10px">
                                                                <Image src="/circle-tag-option.png" width="100px" height="100px" />
                                                                <VStack align="start" spacing="0px">
                                                                    <Text fontWeight="700">{i18n.t("Tag")}</Text>
                                                                    <Text textAlign="left">{i18n.t("Tag description")}</Text>
                                                                </VStack>
                                                            </HStack>
                                                        </Radio>
                                                    )}
                                                </Stack>
                                            </RadioGroup>
                                            <FormErrorMessage>{form.errors.type}</FormErrorMessage>
                                        </FormControl>
                                    );
                                }}
                            </Field>
                        </VStack>
                        <Box>
                            <HStack align="center" marginTop="10px">
                                <Button colorScheme="blue" mr={3} borderRadius="25px" isLoading={isSubmitting} type="submit" lineHeight="0">
                                    {i18n.t("Continue")}
                                </Button>
                                <Button variant="ghost" borderRadius="25px" onClick={onCancel} isDisabled={isSubmitting} lineHeight="0">
                                    {i18n.t("Cancel")}
                                </Button>
                            </HStack>
                        </Box>
                    </VStack>
                </Form>
            )}
        </Formik>
    );
};

export default CircleTypeForm;
