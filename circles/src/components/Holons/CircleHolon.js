//#region imports
import React, { useEffect, lazy, useRef, useState, useCallback } from "react";
import {
    Flex,
    InputGroup,
    Box,
    VStack,
    HStack,
    InputRightElement,
    Input,
    Button,
    FormErrorMessage,
    Text,
    FormControl,
    FormLabel,
    Heading,
    useToast,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalCloseButton,
    ModalBody,
    ModalFooter,
    useDisclosure,
} from "@chakra-ui/react";
import { Form, Field, Formik } from "formik";
import db from "components/Firebase";
import axios from "axios";
import { log, fromFsDate, getDateWithoutTime, isConnected } from "components/Helpers";
import { collection, doc, onSnapshot, query, where } from "firebase/firestore";
import { Routes, Route, useParams, useSearchParams } from "react-router-dom";
import { defaultCoverHeight } from "components/Constants";
import { CircleHeader, CircleCover, DisplayModeButtons, CircleRightPanel, ConnectButton, CirclePicture, FloatingAddButton, CircleProfilePicture } from "components/CircleElements";
import LeftMenu from "components/LeftMenu";
import HorizontalNavigator from "components/HorizontalNavigator";
import { useAtom } from "jotai";
import { isMobileAtom, userAtom, userDataAtom, displayModeAtom, homeExpandedAtom, signInStatusAtom, circleAtom, circlesAtom, circleConnectionsAtom, searchResultsShownAtom } from "components/Atoms";
import { displayModes } from "components/Constants";
import TopMenu from "components/TopMenu";
import { useDrag, useGesture, useScroll, useWheel } from "@use-gesture/react";
import { useSpring, animated } from "react-spring";
import useWindowDimensions from "components/useWindowDimensions";
import { Home } from "components/Home";
import { useLocationNoUpdates, useNavigateNoUpdates } from "components/RouterUtils";
import { routes } from "components/Navigation";
import { DataProviderFactory } from "services/DataProviderFactory";
import Appreciative from "components/contracts/Appreciative";
import Web3 from "web3";
import HolonMap from "components/Holons/HolonMap";
import { i18n, LanguagePicker } from "i18n/Localization";
import { CheckIcon } from "@chakra-ui/icons";
//#endregion

export const AddHolonMember = () => {
    const [circle] = useAtom(circleAtom);
    const { isOpen, onOpen, onClose } = useDisclosure();

    const connectToWeb3 = async () => {
        if (window.ethereum) {
            const web3 = new Web3(window.ethereum);
            try {
                await window.ethereum.enable();
                const contract = new web3.eth.Contract(Appreciative.abi, circle?.funding?.holon);

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

    const addMember = async (memberName, memberAddress) => {
        let { web3, contract } = await connectToWeb3();
        const accounts = await web3.eth.getAccounts();
        const result = await contract.methods.addMember(memberAddress, memberName).send({ from: accounts[0] });
        console.log("Member added:", result);
    };

    if (!circle) return null;

    return (
        <>
            <Button onClick={onOpen}>Add Holon Member</Button>

            <Modal isOpen={isOpen} onClose={onClose}>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Add Holon Member</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <Formik
                            enableReinitialize={true}
                            initialValues={{
                                name: "",
                                address: "",
                            }}
                            onSubmit={async (values, actions) => {
                                await addMember(values.name, values.address);
                                onClose();
                            }}
                            validate={(values) => {
                                const errors = {};
                                // TODO validate
                                return errors;
                            }}
                        >
                            {({ values, errors, touched, isSubmitting }) => (
                                <Form style={{ width: "100%" }}>
                                    <VStack align="center">
                                        <VStack align="center" spacing="25px" width="100%" marginLeft="25px" marginRight="25px">
                                            <Field name="name">
                                                {({ field, form }) => (
                                                    <FormControl isInvalid={form.errors.name && form.touched.name}>
                                                        <FormLabel>Name</FormLabel>
                                                        <Text position="absolute" right="0px" top="5px" fontSize="12px" color="#bbb">
                                                            {form?.values?.name ? form.values.name.length : 0} / 50
                                                        </Text>
                                                        <InputGroup>
                                                            <Input {...field} id="name" type="text" maxLength="50" />
                                                            {!form.errors.name && form.touched.name && <InputRightElement children={<CheckIcon color="green.500" />} />}
                                                        </InputGroup>
                                                        <FormErrorMessage>{form.errors.name}</FormErrorMessage>
                                                    </FormControl>
                                                )}
                                            </Field>
                                            <Field name="address">
                                                {({ field, form }) => (
                                                    <FormControl isInvalid={form.errors.address && form.touched.address}>
                                                        <FormLabel>Address</FormLabel>
                                                        <Text position="absolute" right="0px" top="5px" fontSize="12px" color="#bbb">
                                                            {form?.values?.address ? form.values.address.length : 0} / 50
                                                        </Text>
                                                        <InputGroup>
                                                            <Input {...field} id="name" type="text" maxLength="50" />
                                                            {!form.errors.address && form.touched.address && <InputRightElement children={<CheckIcon color="green.500" />} />}
                                                        </InputGroup>
                                                        <FormErrorMessage>{form.errors.address}</FormErrorMessage>
                                                    </FormControl>
                                                )}
                                            </Field>
                                        </VStack>
                                        <Box>
                                            <HStack align="center" marginTop="10px">
                                                <Button colorScheme="blue" mr={3} borderRadius="25px" isLoading={isSubmitting} type="submit" lineHeight="0" width={"auto"}>
                                                    Add Member
                                                </Button>
                                                <Button variant="ghost" borderRadius="25px" onClick={onClose} isDisabled={isSubmitting} lineHeight="0">
                                                    {i18n.t("Cancel")}
                                                </Button>
                                            </HStack>
                                        </Box>
                                    </VStack>
                                </Form>
                            )}
                        </Formik>
                    </ModalBody>

                    {/* <ModalFooter>
                        <Button colorScheme="blue" mr={3} type="submit">
                            Add Member
                        </Button>
                        <Button variant="ghost" onClick={onClose}>
                            Cancel
                        </Button>
                    </ModalFooter> */}
                </ModalContent>
            </Modal>
        </>
    );
};

const MembraneInterface = () => {
    // State variables and useEffect hook as previously defined

    const [circle] = useAtom(circleAtom);
    const [holon, setHolon] = useState(null);
    const [web3, setWeb3] = useState(null);
    const [memberAddress, setMemberAddress] = useState(null);

    const loadHolon = async () => {
        var json = {};
        let address = circle.funding.holon;

        //let web3 = new Web3(new Web3.providers.WebsocketProvider("wss://ropsten.infura.io/ws/v3/966b62ed84c84715bc5970a1afecad29"));
        const web3 = new Web3(new Web3.providers.HttpProvider("https://sepolia.infura.io/v3/966b62ed84c84715bc5970a1afecad29"));
        // check if it is an holon
        const code = await web3.eth.getCode(address);
        console.log(address);
        if (code === "0x") {
            console.log(address + "is NOT an holon");
            json.id = address;
            json.name = address; // check ens
            json.description = address;
            json.image = "https://ipfs.3box.io/profile?address=" + address; // check 3box
        } else {
            let holon = new web3.eth.Contract(Appreciative.abi, address);
            json.id = address;
            json.name = await holon.methods.name().call();
            var members = await holon.methods.listMembers().call();
            if (members) {
                json.holons = await Promise.all(
                    members.map(async (member, index) => {
                        var name = await holon.methods.toName(member).call();
                        return { id: member, label: name };
                    })
                );
            }
        }
        setHolon(json);
    };

    useEffect(() => {
        if (!circle?.funding?.holon) return;
        loadHolon();
    }, [circle?.funding?.holon]);

    return (
        <Box>
            <Text fontSize="36px">{JSON.stringify(holon, null, 2)}</Text>
            <AddHolonMember />
        </Box>
    );
};

export const CircleHolon = () => {
    log("CircleHolon.render", -1);

    const data = [
        { name: "a", value: 10 },
        { name: "b", value: 20 },
        { name: "c", value: 30 },
        { name: "d", value: 40 },
        { name: "e", value: 50 },
        { name: "f", value: 60 },
        { name: "g", value: 70 },
        { name: "h", value: 80 },
        { name: "i", value: 90 },
        { name: "j", value: 100 },
        { name: "k", value: 110 },
        { name: "l", value: 120 },
        { name: "m", value: 130 },
        { name: "n", value: 140 },
        { name: "o", value: 150 },
        { name: "p", value: 160 },
        { name: "q", value: 170 },
        { name: "r", value: 180 },
        { name: "s", value: 190 },
        { name: "t", value: 200 },
    ];

    return <HolonMap data={data} />;
    //return <MembraneInterface />;
};

export default CircleHolon;
