//#region imports
import { useRef, useState, useEffect } from "react";
import { Form, Field, Formik } from "formik";
import { components } from "react-select";
import Select from "react-select";
import {
    Box,
    Tooltip,
    FormControl,
    Icon,
    FormLabel,
    InputRightElement,
    Input,
    Textarea,
    FormErrorMessage,
    Flex,
    InputGroup,
    HStack,
    VStack,
    Text,
    Checkbox,
    Button,
    IconButton,
    Select as ChakraSelect,
    useToast,
} from "@chakra-ui/react";
import { CheckIcon } from "@chakra-ui/icons";
import { adminCircles, combineDateAndTime, fromFsDate, log } from "components/Helpers";

import axios from "axios";
import { i18n, LanguagePicker } from "i18n/Localization";
import ReactQuill from "react-quill";
import DatePicker from "react-datepicker";
import { DatePickerInput } from "components/CircleElements";
import { useAtom } from "jotai";
import { userAtom, requestUserConnectionsAtom, userConnectionsAtom } from "components/Atoms";
import "react-datepicker/dist/react-datepicker.css";
import "react-quill/dist/quill.snow.css";
import CircleListItem from "components/CircleListItem";
import { IoInformationCircleSharp } from "react-icons/io5";
import Holons from "components/contracts/Holons";
import Web3 from "web3";
//#endregion

export const CircleFundingForm = ({ isUpdateForm, circle, isGuideForm, onNext, onUpdate, onCancel }) => {
    const toast = useToast();
    const [web3, setWeb3] = useState(null);
    const [contract, setContract] = useState(null);
    const [holonId, setHolonId] = useState(circle.funding?.holon);
    const [isCreatingHolon, setIsCreatingHolon] = useState(false);

    if (!circle) return null;

    // OpenCollective
    // Paypal
    // Connect Wallet Address
    // InputField (readonly) + button Create Holon
    // *Connect Wallet(s) (WalletConnect / MetaMask)

    const connectToWeb3 = async () => {
        if (window.ethereum) {
            const web3 = new Web3(window.ethereum);
            try {
                await window.ethereum.enable();
                setWeb3(web3);
                const networkId = await web3.eth.net.getId();
                console.log("networkId", networkId);
                const deployedNetwork = Holons.networks[networkId];
                console.log("deployedNetwork", deployedNetwork && deployedNetwork.address);
                const contract = new web3.eth.Contract(Holons.abi, deployedNetwork && deployedNetwork.address);
                setContract(contract);
                return { web3, contract };
            } catch (error) {
                console.error(error);
            }
        } else {
            // Load web using infura
            //new Web3.providers.HttpProvider('https://mainnet.infura.io/v3/966b62ed84c84715bc5970a1afecad29'))
            console.error("No Ethereum wallet detected");
        }
    };

    const createHolon = async () => {
        setIsCreatingHolon(true);
        let { web3, contract } = await connectToWeb3();
        console.log("createHolon");

        const accounts = await web3.eth.getAccounts();
        await contract.methods.newHolon("Appreciative", circle.id, 0).send({ from: accounts[0] });
        const addr = await contract.methods.newHolon("Appreciative", circle.id, 0).call({ from: accounts[0] });
        //const addr = await contract.methods.newHolon.call("Appreciative", circle.id, 0, { from: accounts[0] });
        //console.log("result:", JSON.stringify(result, null, 2));
        //console.log("addr: ", result.events.NewHolon.returnValues.addr);
        //console.log("addr: ", addr);

        // save addr to circle
        let new_funding = {
            ...circle.funding,
            holon: addr,
        };

        let updatedCircleData = { funding: new_funding };

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
        setHolonId(addr);
        setIsCreatingHolon(false);
    };

    return (
        <Box width="100%">
            <Formik
                enableReinitialize={true}
                initialValues={{
                    openCollective: circle.funding?.open_collective ?? "",
                    paypal: circle.funding?.paypal ?? "",
                }}
                onSubmit={async (values, actions) => {
                    if (!circle) return;

                    // update user name and description
                    let new_funding = {};
                    if (values?.openCollective) {
                        new_funding.open_collective = values?.openCollective;
                    }

                    // if new_funding is empty return
                    if (Object.keys(new_funding).length === 0) {
                        return;
                    }

                    let updatedCircleData = { funding: new_funding };

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
                // validate={(values) => {
                //     const errors = {};
                //     return errors;
                // }}
            >
                {({ values, errors, touched, isSubmitting }) => (
                    <Form style={{ width: "100%" }}>
                        <VStack align="center">
                            <Text className="screenHeader">{i18n.t("Funding")}</Text>

                            <VStack align="center" spacing="25px" width="100%" marginLeft="25px" marginRight="25px">
                                <Field name="openCollective">
                                    {({ field, form }) => (
                                        <FormControl isInvalid={form.errors.openCollective && form.touched.openCollective}>
                                            <FormLabel>Open Collective Slug</FormLabel>
                                            <Text position="absolute" right="0px" top="5px" fontSize="12px" color="#bbb">
                                                {form?.values?.openCollective ? form.values.openCollective.length : 0} / 200
                                            </Text>
                                            <InputGroup>
                                                <Input {...field} id="openCollective" type="text" placeholder={i18n.t("OpenCollective example")} maxLength="200" />
                                                {!form.errors.openCollective && form.touched.openCollective && <InputRightElement children={<CheckIcon color="green.500" />} />}
                                            </InputGroup>
                                            <FormErrorMessage>{form.errors.openCollective}</FormErrorMessage>
                                        </FormControl>
                                    )}
                                </Field>
                                {/* <Field name="paypal">
                                    {({ field, form }) => (
                                        <FormControl isInvalid={form.errors.paypal && form.touched.paypal}>
                                            <FormLabel>PayPal</FormLabel>
                                            <Text position="absolute" right="0px" top="5px" fontSize="12px" color="#bbb">
                                                {form?.values?.paypal ? form.values.paypal.length : 0} / 200
                                            </Text>
                                            <InputGroup>
                                                <Input {...field} id="paypal" type="text" placeholder={i18n.t("PayPal example")} maxLength="200" />
                                                {!form.errors.paypal && form.touched.paypal && <InputRightElement children={<CheckIcon color="green.500" />} />}
                                            </InputGroup>
                                            <FormErrorMessage>{form.errors.twitter}</FormErrorMessage>
                                        </FormControl>
                                    )}
                                </Field> */}

                                <FormControl>
                                    <FormLabel>Holon</FormLabel>
                                    <InputGroup>
                                        <Input id="holon" type="text" maxLength="200" readOnly={true} value={holonId} backgroundColor="#e1e1e1" />
                                        <Button colorScheme="blue" borderRadius="25px" lineHeight="0" marginLeft="10px" onClick={createHolon} isLoading={isCreatingHolon} minWidth="150px">
                                            Create Holon
                                        </Button>
                                    </InputGroup>
                                </FormControl>
                            </VStack>
                            <Box>
                                <HStack align="center" marginTop="10px">
                                    <Button colorScheme="blue" mr={3} borderRadius="25px" isLoading={isSubmitting} type="submit" lineHeight="0">
                                        {i18n.t("Save")}
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

export default CircleFundingForm;
