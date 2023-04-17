//#region imports
import React, { useEffect, lazy, useRef, useState, useCallback } from "react";
import { Flex, Box, VStack, HStack, Input, Button, Text, FormControl, FormLabel, Heading, useToast } from "@chakra-ui/react";
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
//#endregion

const MembraneInterface = () => {
    // State variables and useEffect hook as previously defined

    const [circle] = useAtom(circleAtom);
    const [holon, setHolon] = useState(null);
    const [web3, setWeb3] = useState(null);

    const loadHolon = async () => {
        // let web3 = null;
        // let contract = null;
        // let address = null;
        // if (window.ethereum) {
        //     const web3 = new Web3(window.ethereum);
        //     try {
        //         await window.ethereum.enable();

        //         const networkId = await web3.eth.net.getId();
        //         const deployedNetwork = Appreciative.networks[networkId];
        //         const contract = new web3.eth.Contract(Appreciative.abi, deployedNetwork && deployedNetwork.address);
        //     } catch (error) {
        //         console.error(error);
        //     }
        // } else {
        //     // Load web using infura
        //     const web3 = new Web3(new Web3.providers.HttpProvider("https://mainnet.infura.io/v3/966b62ed84c84715bc5970a1afecad29"));
        //     try {
        //         const networkId = await web3.eth.net.getId();
        //         const deployedNetwork = Appreciative.networks[networkId];
        //         const contract = new web3.eth.Contract(Appreciative.abi, deployedNetwork && deployedNetwork.address);
        //     } catch (error) {
        //         console.error(error);
        //     }
        // }

        // setWeb3(web3);
        // setContract(contract);

        // const name = await contract.methods.name("Appreciative", circle.id, 0).call({ from: accounts[0] });
        // setName(name);

        var json = {};
        let address = circle.funding.holon;

        //let web3 = new Web3(new Web3.providers.WebsocketProvider("wss://ropsten.infura.io/ws/v3/966b62ed84c84715bc5970a1afecad29"));
        const web3 = new Web3(new Web3.providers.HttpProvider("https://sepolia.infura.io/v3/966b62ed84c84715bc5970a1afecad29"));
        // check if it is an holon
        const code = await web3.eth.getCode(address);
        console.log(address);
        // if (code === "0x") {
        //     console.log(address + "is NOT an holon");
        //     json.id = address;
        //     json.name = address; // check ens
        //     json.description = address;
        //     // json.image = 'https://ipfs.3box.io/profile?address=' + address // check 3box
        // } else {
        let holon = new web3.eth.Contract(Appreciative.abi, address);
        // const totalappreciation = await holon.methods.totalappreciation().call()
        // console.log(totalappreciation)
        // var name = holon.methods.toName(address).call()
        // console.log(name)
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
        //}
        setHolon(json);
    };

    useEffect(() => {
        if (!circle?.funding?.holon) return;
        loadHolon();
    }, [circle?.funding?.holon]);

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

    // useEffect(() => {
    //     if(!web3 || !contract) return;

    //     console.log("load holon");

    //     const accounts = await web3.eth.getAccounts();
    //     await contract.methods.newHolon("Appreciative", circle.id, 0).send({ from: accounts[0] });
    //     const addr = await contract.methods.newHolon("Appreciative", circle.id, 0).call({ from: accounts[0] });
    // }, [web3, contract])

    // const toast = useToast();

    // // Functions to interact with the smart contract as previously defined

    // const handleAddParent = async () => {
    //     const result = await contractInstance.methods.addParent(parentAddress).send({ from: account });
    //     console.log("Parent added:", result);
    // };

    // const handleAddMember = async () => {
    //     const result = await contractInstance.methods.addMember(parentAddress).send({ from: account });
    //     console.log("Parent added:", result);
    // };

    // const handleRemoveMember = async () => {
    //     const result = await contractInstance.methods.removeMember(memberAddressToRemove).send({ from: account });
    //     console.log("Member removed:", result);
    // };

    // const handleChangeName = async () => {
    //     const result = await contractInstance.methods.changeName(addressToChangeName, newName).send({ from: account });
    //     console.log("Name changed:", result);
    // };

    // const handleSetManifest = async () => {
    //     const result = await contractInstance.methods.setManifest(manifestHash).send({ from: account });
    //     console.log("Manifest set:", result);
    // };

    const addMember = async () => {
        let { web3, contract } = await connectToWeb3();
        const accounts = await web3.eth.getAccounts();
        const result = await contract.methods.addMember("0xE2E97679de1a07E46d7166DEe87E91Aefcea459C", "Roberto").send({ from: accounts[0] });
        console.log("Member added:", result);
    };

    return (
        <Box>
            <Text fontSize="36px">{JSON.stringify(holon, null, 2)}</Text>
            <Button onClick={addMember}>Add member</Button>
            {/* <Heading mb={6}>Membrane Smart Contract Interface</Heading>
            <VStack spacing={4}>
                <FormControl>
                    <FormLabel>Contract Address</FormLabel>
                    <Input type="text" value={contractAddress} onChange={(e) => setContractAddress(e.target.value)} />
                </FormControl>

                <FormControl>
                    <FormLabel>Member Address</FormLabel>
                    <Input type="text" value={memberAddress} onChange={(e) => setMemberAddress(e.target.value)} />
                </FormControl>

                <FormControl>
                    <FormLabel>Member Name</FormLabel>
                    <Input type="text" value={memberName} onChange={(e) => setMemberName(e.target.value)} />
                </FormControl>

                <HStack spacing={4}>
                    <Button onClick={handleAddMember} colorScheme="green">
                        Add Member
                    </Button>
                    <Button onClick={handleAddParent} colorScheme="blue">
                        Add Parent
                    </Button>
                    <Button onClick={handleRemoveMember} colorScheme="red">
                        Remove Member
                    </Button>
                    <Button onClick={handleChangeName} colorScheme="purple">
                        Change Name
                    </Button>
                    <Button onClick={handleSetManifest} colorScheme="orange">
                        Set Manifest
                    </Button>
                </HStack>
            </VStack> */}
        </Box>
    );
};

export const CircleHolon = () => {
    log("CircleHolon.render", -1);

    return <MembraneInterface />;
};

export default CircleHolon;
