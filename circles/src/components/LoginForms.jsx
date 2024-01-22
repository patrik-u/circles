/* global google */
//#region imports
import React, { useState, useEffect, useRef } from "react";
import {
    Box,
    Text,
    Image,
    Button,
    useToast,
    HStack,
    VStack,
    FormControl,
    Input,
    FormErrorMessage,
    InputGroup,
    InputRightElement,
    useDisclosure,
    FormLabel,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalCloseButton,
    ModalBody,
    ModalFooter,
    Link,
} from "@chakra-ui/react";
import { CheckIcon } from "@chakra-ui/icons";
import { auth } from "./Firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import axios from "axios";
import i18n from "@/i18n/Localization";
import { toastError, toastSuccess, validateEmail, validatePassword, log } from "./Helpers";
import { Form, Field, Formik } from "formik";
import { BiHide, BiShow } from "react-icons/bi";

import { useAtom } from "jotai";
import { isMobileAtom, signInStatusAtom, userAtom } from "./Atoms";
import useScript from "./useScript";
//#endregion

//PWA123 complete

export const LoginRegisterMenu = () => {
    log("LoginRegisterMenu.render", -1);

    const [isMobile] = useAtom(isMobileAtom);
    const [signInStatus] = useAtom(signInStatusAtom);
    const [user] = useAtom(userAtom);

    const googleOneTapScript = useScript("https://accounts.google.com/gsi/client");
    const googleOneTapScriptFlag = "__googleOneTapScript__";

    const {
        isOpen: forgotPasswordIsOpen,
        onOpen: forgotPasswordOnOpen,
        onClose: forgotPasswordOnClose,
    } = useDisclosure();
    const { isOpen: signInIsOpen, onOpen: signInOnOpen, onClose: signInOnClose } = useDisclosure();
    const { isOpen: signUpIsOpen, onOpen: signUpOnOpen, onClose: signUpOnClose } = useDisclosure();

    const displayLoginRegisterMenu = !signInStatus.signedIn && !signInStatus.signingIn;

    log(`LoginRegisterMenu signedIn: ${signInStatus.signedIn}, signingIn: ${signInStatus.signingIn}`, -1);

    const [signInButton, setSignInButton] = useState(null);
    const [signInButton2, setSignInButton2] = useState(null);
    const setSignInButtonRef = (element) => {
        setSignInButton(element);
    };
    const setSignInButton2Ref = (element) => {
        setSignInButton2(element);
    };

    const [showPassword, setShowPassword] = useState(false);
    const toast = useToast();
    const signInInitialRef = useRef();
    const signUpInitialRef = useRef();
    const forgotPasswordInitialRef = useRef();
    const [newUserData, setNewUserData] = useState(null);

    useEffect(() => {
        log("LoginRegisterMenu.useEffect 1", -1);
        if (signInStatus.signingIn || signInStatus.signedIn) {
            signInOnClose();
            signUpOnClose();
        }
    }, [signInStatus, signInOnClose, signUpOnClose]);

    useEffect(() => {
        log("LoginRegisterMenu.useEffect 2", -1);
        if (!signInButton && !signInButton2) return;

        // have we already loaded the google one tap script?
        if (!window?.[googleOneTapScriptFlag] && window.google && googleOneTapScript === "ready") {
            window[googleOneTapScriptFlag] = true;
        }
        if (window?.[googleOneTapScriptFlag] && googleOneTapScript === "ready") {
            if (signInButton) {
                google.accounts.id.renderButton(signInButton, {
                    theme: "outline",
                    size: isMobile ? "medium" : "large",
                    type: "standard",
                    text: "signin_with",
                    shape: "rectangular",
                    logo_alignment: "left",
                });
            }
            if (signInButton2) {
                google.accounts.id.renderButton(signInButton2, {
                    theme: "outline",
                    size: isMobile ? "medium" : "large",
                    type: "standard",
                    text: "signup_with",
                    shape: "rectangular",
                    logo_alignment: "left",
                });
            }
        }
    }, [signInButton, signInButton2, isMobile, googleOneTapScript]);

    const onSignUpClick = () => {
        signInOnClose();
        signUpOnOpen();
    };

    const onSignInClick = () => {
        signUpOnClose();
        signInOnOpen();
    };

    useEffect(() => {
        log("LoginRegisterMenu.useEffect 3", -1);
        if (!user?.id || !newUserData) return;

        // check if user just created a new account with name, email and password
        // update user data with firstname and lastname
        axios
            .put(`/circles/${user.id}`, {
                circleData: newUserData.circleData,
                circlePrivateData: newUserData.circlePrivateData,
            })
            .catch((err) => {
                console.error(err);
            });
        setNewUserData(null);
    }, [newUserData, user?.id]);

    return (
        displayLoginRegisterMenu && (
            <Box marginTop="0px">
                <HStack>
                    <Button onClick={onSignInClick} rounded={"full"} height={isMobile ? "30px" : "40px"}>
                        {i18n.t("Log in")}
                    </Button>
                    <Button onClick={onSignUpClick} rounded={"full"} height={isMobile ? "30px" : "40px"}>
                        {i18n.t("Sign up")}
                    </Button>
                </HStack>

                {/* Modal popup - Log in */}
                <Modal
                    initialFocusRef={signInInitialRef}
                    isOpen={signInIsOpen}
                    onClose={signInOnClose}
                    closeOnOverlayClick={false}
                    size="sm"
                >
                    <Formik
                        initialValues={{ email: "", password: "" }}
                        onSubmit={async (values, actions) => {
                            try {
                                // attempt to log in using username and password
                                await signInWithEmailAndPassword(auth, values.email, values.password);
                            } catch (error) {
                                let message = "";
                                switch (error.code) {
                                    case "auth/user-not-found":
                                        message = i18n.t("emailNotFound");
                                        break;
                                    case "auth/wrong-password":
                                        message = i18n.t("wrongPassword");
                                        break;
                                    default:
                                        break;
                                }

                                toastError(toast, i18n.t("loginFailed"), message);
                                console.error("sign in failed", error);
                            }

                            signInOnClose();
                            actions.setSubmitting(false);
                        }}
                        validate={(values) => {
                            const errors = {};
                            if (!values.email) {
                                errors.email = i18n.t("enterEmail");
                            }
                            if (!values.password) {
                                errors.description = i18n.t("enterPassword");
                            }
                            return errors;
                        }}
                    >
                        {({ values, errors, touched, isSubmitting }) => (
                            <Form>
                                <ModalOverlay />
                                <ModalContent borderRadius="25px">
                                    <ModalHeader>{i18n.t("Log in")}</ModalHeader>
                                    <ModalCloseButton isDisabled={isSubmitting} />
                                    <ModalBody>
                                        <Text fontWeight="500" lineHeight="32px">
                                            {i18n.t("login with google")}
                                        </Text>
                                        <div ref={setSignInButtonRef}></div>

                                        <div className="strike">
                                            <span>{i18n.t("or")}</span>
                                        </div>
                                        <VStack marginLeft="14px" marginRight="14px">
                                            <Text fontWeight="500">{i18n.t("login with email")}</Text>

                                            <VStack align="center" spacing="5px">
                                                <Field name="email">
                                                    {({ field, form }) => (
                                                        <FormControl
                                                            isInvalid={form.errors.email && form.touched.email}
                                                        >
                                                            <Input
                                                                {...field}
                                                                id="email"
                                                                ref={signInInitialRef}
                                                                placeholder={i18n.t("email")}
                                                                type="text"
                                                                maxLength="200"
                                                            />
                                                            <FormErrorMessage>{form.errors.email}</FormErrorMessage>
                                                        </FormControl>
                                                    )}
                                                </Field>
                                                <Field name="password">
                                                    {({ field, form }) => (
                                                        <FormControl
                                                            isInvalid={form.errors.password && form.touched.password}
                                                        >
                                                            <InputGroup>
                                                                <Input
                                                                    {...field}
                                                                    id="password"
                                                                    placeholder={i18n.t("password")}
                                                                    maxLength="200"
                                                                    type={showPassword ? "text" : "password"}
                                                                />
                                                                <InputRightElement>
                                                                    <Image
                                                                        as={showPassword ? BiHide : BiShow}
                                                                        width="23px"
                                                                        height="23px"
                                                                        _hover={{
                                                                            transform: "scale(1.1)",
                                                                            color: "black",
                                                                        }}
                                                                        _active={{
                                                                            transform: "scale(0.98)",
                                                                            color: "black",
                                                                        }}
                                                                        _focus={{}}
                                                                        onClick={() => setShowPassword(!showPassword)}
                                                                    />
                                                                </InputRightElement>
                                                            </InputGroup>
                                                            <FormErrorMessage>{form.errors.password}</FormErrorMessage>
                                                        </FormControl>
                                                    )}
                                                </Field>

                                                <Link fontSize="10px" onClick={forgotPasswordOnOpen}>
                                                    {i18n.t("forgotPassword")}
                                                </Link>
                                                <Box>
                                                    <Button
                                                        variant="outline"
                                                        borderRadius="25px"
                                                        isLoading={isSubmitting}
                                                        type="submit"
                                                        lineHeight="0"
                                                        marginTop="4px"
                                                    >
                                                        {i18n.t("login")}
                                                    </Button>
                                                </Box>
                                            </VStack>
                                            <Link fontSize="12px" onClick={onSignUpClick}>
                                                {i18n.t("create new account")}
                                            </Link>
                                        </VStack>
                                    </ModalBody>
                                </ModalContent>
                            </Form>
                        )}
                    </Formik>
                </Modal>

                {/* Modal popup - Sign up */}
                <Modal
                    initialFocusRef={signUpInitialRef}
                    isOpen={signUpIsOpen}
                    onClose={signUpOnClose}
                    closeOnOverlayClick={false}
                >
                    <Formik
                        initialValues={{ firstname: "", lastname: "", email: "", password: "", password2: "" }}
                        onSubmit={async (values, actions) => {
                            try {
                                // update user data with name
                                // user data different from jwt token, update database
                                let updatedUser = {
                                    circleData: {
                                        name: (values.firstname + " " + values.lastname).trim(),
                                    },
                                    circlePrivateData: {
                                        email: values.email.trim(),
                                    },
                                };

                                setNewUserData(updatedUser);

                                // attempt to create user using username and password
                                await createUserWithEmailAndPassword(auth, values.email, values.password);

                                toastSuccess(toast, i18n.t("registrationSuccess"));
                            } catch (error) {
                                let message =
                                    error.code === "auth/email-already-in-use" ? i18n.t("emailAlreadyInUse") : "";
                                toastError(toast, i18n.t("registrationFailed"), message);
                                actions.setSubmitting(false);
                                return;
                            }

                            actions.setSubmitting(false);
                            signUpOnClose();
                        }}
                        validate={(values) => {
                            const errors = {};
                            if (!values.firstname) {
                                errors.firstname = i18n.t("enterFirstName");
                            } else if (values.firstname.length > 50) {
                                errors.firstname = i18n.t("firstNameValidationError");
                            }

                            if (!values.lastname) {
                                errors.lastname = i18n.t("enterLastName");
                            } else if (values.lastname.length > 50) {
                                errors.lastname = i18n.t("lastNameValidationError");
                            }

                            if (!values.password) {
                                errors.password = i18n.t("enterPassword");
                            } else if (values.password.length < 6) {
                                errors.password = i18n.t("passwordValidationError1");
                            } else if (!validatePassword(values.password)) {
                                errors.password = i18n.t("passwordValidationError2");
                            }

                            if (!values.email) {
                                errors.email = i18n.t("enterEmail");
                            } else if (!validateEmail(values.email)) {
                                errors.email = i18n.t("enterValidEmail");
                            }

                            if (values.password2 && values.password != values.password2) {
                                errors.password2 = i18n.t("passworsMustMatch");
                            }
                            return errors;
                        }}
                    >
                        {({ values, errors, touched, isSubmitting }) => (
                            <Form>
                                <ModalOverlay />
                                <ModalContent borderRadius="25px">
                                    <ModalHeader>{i18n.t("create new account")}</ModalHeader>
                                    <ModalCloseButton isDisabled={isSubmitting} />
                                    <ModalBody>
                                        <Text fontWeight="500" lineHeight="32px">
                                            {i18n.t("Sign up with google")}
                                        </Text>
                                        <div ref={setSignInButton2Ref}></div>

                                        <div className="strike">
                                            <span>{i18n.t("or")}</span>
                                        </div>

                                        <VStack align="center" spacing="25px">
                                            <HStack spacing="15px" align="top">
                                                <Field name="firstname">
                                                    {({ field, form }) => (
                                                        <FormControl
                                                            isInvalid={form.errors.firstname && form.touched.firstname}
                                                        >
                                                            <FormLabel>{i18n.t("firstName")}</FormLabel>
                                                            <Text
                                                                position="absolute"
                                                                right="0px"
                                                                top="5px"
                                                                fontSize="12px"
                                                                color="#bbb"
                                                            >
                                                                {form?.values?.firstname
                                                                    ? form.values.firstname.length
                                                                    : 0}{" "}
                                                                / 50
                                                            </Text>
                                                            <InputGroup>
                                                                <Input
                                                                    {...field}
                                                                    id="firstname"
                                                                    ref={signUpInitialRef}
                                                                    type="text"
                                                                    maxLength="50"
                                                                />
                                                                {!form.errors.firstname && form.touched.firstname && (
                                                                    <InputRightElement
                                                                        children={<CheckIcon color="green.500" />}
                                                                    />
                                                                )}
                                                            </InputGroup>
                                                            <FormErrorMessage>{form.errors.firstname}</FormErrorMessage>
                                                        </FormControl>
                                                    )}
                                                </Field>
                                                <Field name="lastname">
                                                    {({ field, form }) => (
                                                        <FormControl
                                                            isInvalid={form.errors.lastname && form.touched.lastname}
                                                        >
                                                            <FormLabel>{i18n.t("lastName")}</FormLabel>
                                                            <Text
                                                                position="absolute"
                                                                right="0px"
                                                                top="5px"
                                                                fontSize="12px"
                                                                color="#bbb"
                                                            >
                                                                {form?.values?.lastname
                                                                    ? form.values.lastname.length
                                                                    : 0}{" "}
                                                                / 50
                                                            </Text>
                                                            <InputGroup>
                                                                <Input
                                                                    {...field}
                                                                    id="lastname"
                                                                    type="text"
                                                                    maxLength="50"
                                                                />
                                                                {!form.errors.lastname && form.touched.lastname && (
                                                                    <InputRightElement
                                                                        children={<CheckIcon color="green.500" />}
                                                                    />
                                                                )}
                                                            </InputGroup>
                                                            <FormErrorMessage>{form.errors.lastname}</FormErrorMessage>
                                                        </FormControl>
                                                    )}
                                                </Field>
                                            </HStack>
                                            <Field name="email">
                                                {({ field, form }) => (
                                                    <FormControl isInvalid={form.errors.email && form.touched.email}>
                                                        <FormLabel>{i18n.t("email")}</FormLabel>
                                                        <Text
                                                            position="absolute"
                                                            right="0px"
                                                            top="5px"
                                                            fontSize="12px"
                                                            color="#bbb"
                                                        >
                                                            {form?.values?.email ? form.values.email.length : 0} / 250
                                                        </Text>
                                                        <InputGroup>
                                                            <Input {...field} id="email" type="text" maxLength="50" />
                                                            {!form.errors.email && form.touched.email && (
                                                                <InputRightElement
                                                                    children={<CheckIcon color="green.500" />}
                                                                />
                                                            )}
                                                        </InputGroup>
                                                        <FormErrorMessage>{form.errors.email}</FormErrorMessage>
                                                    </FormControl>
                                                )}
                                            </Field>
                                            <Field name="password">
                                                {({ field, form }) => (
                                                    <FormControl
                                                        isInvalid={form.errors.password && form.touched.password}
                                                    >
                                                        <FormLabel>{i18n.t("password")}</FormLabel>
                                                        <Text
                                                            position="absolute"
                                                            right="0px"
                                                            top="5px"
                                                            fontSize="12px"
                                                            color="#bbb"
                                                        >
                                                            {form?.values?.password ? form.values.password.length : 0} /
                                                            200
                                                        </Text>
                                                        <InputGroup>
                                                            <Input
                                                                {...field}
                                                                id="password"
                                                                maxLength="200"
                                                                type={showPassword ? "text" : "password"}
                                                            />
                                                            <InputRightElement
                                                                marginRight={
                                                                    !form.errors.password && form.touched.password
                                                                        ? "30px"
                                                                        : "0px"
                                                                }
                                                            >
                                                                <Image
                                                                    as={showPassword ? BiHide : BiShow}
                                                                    width="23px"
                                                                    height="23px"
                                                                    _hover={{
                                                                        transform: "scale(1.1)",
                                                                        color: "black",
                                                                    }}
                                                                    _active={{
                                                                        transform: "scale(0.98)",
                                                                        color: "black",
                                                                    }}
                                                                    _focus={{}}
                                                                    onClick={() => setShowPassword(!showPassword)}
                                                                />
                                                            </InputRightElement>
                                                            {!form.errors.password && form.touched.password && (
                                                                <InputRightElement
                                                                    children={<CheckIcon color="green.500" />}
                                                                />
                                                            )}
                                                        </InputGroup>
                                                        <FormErrorMessage>{form.errors.password}</FormErrorMessage>
                                                    </FormControl>
                                                )}
                                            </Field>
                                            <Field name="password2">
                                                {({ field, form }) => (
                                                    <FormControl
                                                        isInvalid={form.errors.password2 && form.touched.password2}
                                                    >
                                                        <FormLabel>{i18n.t("confirm password")}</FormLabel>
                                                        <Text
                                                            position="absolute"
                                                            right="0px"
                                                            top="5px"
                                                            fontSize="12px"
                                                            color="#bbb"
                                                        >
                                                            {form?.values?.password2 ? form.values.password2.length : 0}{" "}
                                                            / 200
                                                        </Text>
                                                        <InputGroup>
                                                            <Input
                                                                {...field}
                                                                id="password2"
                                                                maxLength="200"
                                                                type={showPassword ? "text" : "password"}
                                                            />
                                                            <InputRightElement
                                                                marginRight={
                                                                    !form.errors.password2 && form.touched.password2
                                                                        ? "30px"
                                                                        : "0px"
                                                                }
                                                            >
                                                                <Image
                                                                    as={showPassword ? BiHide : BiShow}
                                                                    width="23px"
                                                                    height="23px"
                                                                    _hover={{
                                                                        transform: "scale(1.1)",
                                                                        color: "black",
                                                                    }}
                                                                    _active={{
                                                                        transform: "scale(0.98)",
                                                                        color: "black",
                                                                    }}
                                                                    _focus={{}}
                                                                    onClick={() => setShowPassword(!showPassword)}
                                                                />
                                                            </InputRightElement>
                                                            {!form.errors.password2 && form.touched.password2 && (
                                                                <InputRightElement
                                                                    children={<CheckIcon color="green.500" />}
                                                                />
                                                            )}
                                                        </InputGroup>
                                                        <FormErrorMessage>{form.errors.password2}</FormErrorMessage>
                                                    </FormControl>
                                                )}
                                            </Field>
                                        </VStack>
                                    </ModalBody>

                                    <ModalFooter>
                                        <Button
                                            colorScheme="blue"
                                            mr={3}
                                            borderRadius="25px"
                                            isLoading={isSubmitting}
                                            type="submit"
                                            lineHeight="0"
                                        >
                                            {i18n.t("create new account")}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            borderRadius="25px"
                                            onClick={signUpOnClose}
                                            isDisabled={isSubmitting}
                                            lineHeight="0"
                                        >
                                            {i18n.t("Cancel")}
                                        </Button>
                                    </ModalFooter>
                                </ModalContent>
                            </Form>
                        )}
                    </Formik>
                </Modal>

                {/* Modal popup - Forgot password? */}
                <Modal
                    initialFocusRef={forgotPasswordInitialRef}
                    isOpen={forgotPasswordIsOpen}
                    onClose={forgotPasswordOnClose}
                    closeOnOverlayClick={false}
                >
                    <Formik
                        initialValues={{ email: "" }}
                        onSubmit={async (values, actions) => {
                            try {
                                // attempt to recover password using email
                                await sendPasswordResetEmail(auth, values.email);
                                toastSuccess(toast, i18n.t("passwordRecoverySuccessToast"));
                            } catch (error) {
                                let message = "";
                                switch (error.code) {
                                    case "auth/user-not-found":
                                        message = i18n.t("emailNotFound");
                                        break;
                                    default:
                                        break;
                                }

                                toastError(toast, i18n.t("passwordRecoveryFailedToast"), message);
                                actions.setSubmitting(false);
                                forgotPasswordOnClose();
                                return;
                            }

                            actions.setSubmitting(false);
                            forgotPasswordOnClose();
                        }}
                        validate={(values) => {
                            const errors = {};
                            if (!values.email) {
                                errors.email = i18n.t("enterEmail");
                            } else if (!validateEmail(values.email)) {
                                errors.email = i18n.t("enterValidEmail");
                            }
                            return errors;
                        }}
                    >
                        {({ values, errors, touched, isSubmitting }) => (
                            <Form>
                                <ModalOverlay />
                                <ModalContent borderRadius="25px">
                                    <ModalHeader>{i18n.t("recoverPassword")}</ModalHeader>
                                    <ModalCloseButton isDisabled={isSubmitting} />
                                    <ModalBody>
                                        <VStack align="center" spacing="25px">
                                            <Field name="email">
                                                {({ field, form }) => (
                                                    <FormControl isInvalid={form.errors.email && form.touched.email}>
                                                        <FormLabel>{i18n.t("email")}</FormLabel>
                                                        <Text
                                                            position="absolute"
                                                            right="0px"
                                                            top="5px"
                                                            fontSize="12px"
                                                            color="#bbb"
                                                        >
                                                            {form?.values?.email ? form.values.email.length : 0} / 250
                                                        </Text>
                                                        <InputGroup>
                                                            <Input
                                                                {...field}
                                                                id="email"
                                                                ref={forgotPasswordInitialRef}
                                                                type="text"
                                                                maxLength="50"
                                                            />
                                                            {!form.errors.email && form.touched.email && (
                                                                <InputRightElement
                                                                    children={<CheckIcon color="green.500" />}
                                                                />
                                                            )}
                                                        </InputGroup>
                                                        <FormErrorMessage>{form.errors.email}</FormErrorMessage>
                                                    </FormControl>
                                                )}
                                            </Field>
                                        </VStack>
                                    </ModalBody>

                                    <ModalFooter>
                                        <Button
                                            colorScheme="blue"
                                            mr={3}
                                            borderRadius="25px"
                                            isLoading={isSubmitting}
                                            type="submit"
                                            lineHeight="0"
                                        >
                                            {i18n.t("recoverPassword")}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            borderRadius="25px"
                                            onClick={forgotPasswordOnClose}
                                            isDisabled={isSubmitting}
                                            lineHeight="0"
                                        >
                                            {i18n.t("Cancel")}
                                        </Button>
                                    </ModalFooter>
                                </ModalContent>
                            </Form>
                        )}
                    </Formik>
                </Modal>
            </Box>
        )
    );
};

export default LoginRegisterMenu;
