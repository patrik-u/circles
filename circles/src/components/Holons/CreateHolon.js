import React, { useState, useEffect } from "react";
import {
    Flex,
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    Box,
    Image,
    Button,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalCloseButton,
    ModalBody,
    ModalFooter,
    FormControl,
    FormLabel,
    Input,
    Select,
    useDisclosure,
    useToast,
} from "@chakra-ui/react";
import Web3 from "web3";
import { useAtom } from "jotai";
import { circleAtom } from "components/Atoms";
import ERC20Token from "components/contracts/TestToken";
import axios from "axios";
import Holons from "components/contracts/Holons";
import Appreciative from "components/contracts/Appreciative";
import { i18n, LanguagePicker } from "i18n/Localization";

const CreateHolon = () => {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [circle] = useAtom(circleAtom);
    const [recipient, setRecipient] = useState(circle?.funding?.holon);
    const [amount, setAmount] = useState("");
    const [tokenAddress, setTokenAddress] = useState("");
    const [tokens, setTokens] = useState([]);
    const [selectedToken, setSelectedToken] = useState("");
    const [networkType, setNetworkType] = useState("");
    const [web3, setWeb3] = useState(null);
    const [contract, setContract] = useState(null);
    const [holonId, setHolonId] = useState(circle.funding?.holon);
    const [isCreatingHolon, setIsCreatingHolon] = useState(false);
    const toast = useToast();

    // Set up a new Web3 instance (using Metamask)
    //const web3 = new Web3(Web3.givenProvider || "http://localhost:8545");

    // Get a list of popular ERC20 tokens on the Ethereum mainnet
    // useEffect(() => {
    //     const getTokens = async () => {
    //         const networkId = await web3.eth.net.getId();
    //         const response = await fetch("https://gateway.ipfs.io/ipns/tokens.uniswap.org");
    //         let json = await response.json();
    //         console.log(networkId);
    //         const netType = await web3.eth.net.getNetworkType();
    //         setNetworkType(netType);
    //         const tokens = json.tokens.filter((x) => x.chainId === networkId);
    //         tokens.sort((a, b) => a.name.localeCompare(b.name));
    //         setTokens(tokens);
    //     };

    //     getTokens();
    // }, []);

    const handleSend = async () => {
        const accounts = await web3.eth.getAccounts();
        const sender = accounts[0];

        if (!tokenAddress || tokenAddress === "") {
            // Send Ether
            const weiAmount = web3.utils.toWei(amount, "ether");
            await web3.eth.sendTransaction({ from: sender, to: recipient, value: weiAmount });
        } else {
            // Send ERC20 token
            const tokenContract = new web3.eth.Contract(ERC20Token.abi, tokenAddress);
            const decimals = await tokenContract.methods.decimals().call();
            const tokenAmount = web3.utils.toBN(amount * 10 ** decimals);

            await tokenContract.methods.transfer(recipient, tokenAmount).send({ from: sender });
        }

        onClose();
    };

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

        // add self as member
        // TODO show popup do you want to add yourself as a member?
        const holonContract = new web3.eth.Contract(Appreciative.abi, addr);
        const result = await holonContract.methods.addMember(accounts[0], circle.name).send({ from: accounts[0] });
        console.log(result);
    };

    return (
        <>
            <Flex direction="row" width="100%">
                <Input id="holon" flexGrow="1" type="text" maxLength="200" readOnly={true} value={holonId} backgroundColor="#e1e1e1" />
                <Button colorScheme="blue" borderRadius="25px" lineHeight="0" marginLeft="10px" onClick={createHolon} isLoading={isCreatingHolon} minWidth="150px">
                    Create Holon
                </Button>
            </Flex>

            {/* <Button onClick={onOpen}>Create Holon</Button> */}

            <Modal isOpen={isOpen} onClose={onClose}>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Create Holon</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <FormControl mt={4}>
                            <FormLabel>Amount</FormLabel>
                            <Input placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
                        </FormControl>

                        <FormControl mt={4}>
                            <FormLabel>Token Address (optional)</FormLabel>
                            <Input placeholder="Token Address" value={tokenAddress} onChange={(e) => setTokenAddress(e.target.value)} />
                        </FormControl>

                        <FormControl mt={4}>
                            <FormLabel>Select Token (optional)</FormLabel>
                            <Menu>
                                <MenuButton
                                    as={Button}
                                    rightIcon={
                                        <Box as="span" fontSize="0.8em" ml={2}>
                                            ▼
                                        </Box>
                                    }
                                >
                                    {selectedToken ? (
                                        <Box display="flex" alignItems="center">
                                            <Image src={selectedToken.logoURI} boxSize="24px" mr={2} />
                                            {selectedToken.name} ({selectedToken.symbol})
                                        </Box>
                                    ) : (
                                        "Select Token"
                                    )}
                                </MenuButton>
                                <MenuList maxHeight="200px" overflowY="auto">
                                    {tokens.map((token) => (
                                        <MenuItem
                                            key={token.address}
                                            onClick={() => {
                                                setSelectedToken(token);
                                                setTokenAddress(token.address);
                                                onClose();
                                            }}
                                        >
                                            <Box display="flex" alignItems="center">
                                                <Image src={token.logoURI} boxSize="24px" mr={2} />
                                                {token.name} ({token.symbol})
                                            </Box>
                                        </MenuItem>
                                    ))}
                                </MenuList>
                            </Menu>
                        </FormControl>

                        <FormControl mt={4}>
                            <FormLabel>Select Token (optional)</FormLabel>
                            <Menu>
                                <MenuButton
                                    as={Button}
                                    rightIcon={
                                        <Box as="span" fontSize="0.8em" ml={2}>
                                            ▼
                                        </Box>
                                    }
                                >
                                    {selectedToken ? (
                                        <Box display="flex" alignItems="center">
                                            <Image src={selectedToken.logoURI} boxSize="24px" mr={2} />
                                            {selectedToken.name} ({selectedToken.symbol})
                                        </Box>
                                    ) : (
                                        "Select Token"
                                    )}
                                </MenuButton>
                                <MenuList maxHeight="200px" overflowY="auto">
                                    {tokens.map((token) => (
                                        <MenuItem
                                            key={token.address}
                                            onClick={() => {
                                                setSelectedToken(token);
                                                setTokenAddress(token.address);
                                                onClose();
                                            }}
                                        >
                                            <Box display="flex" alignItems="center">
                                                <Image src={token.logoURI} boxSize="24px" mr={2} />
                                                {token.name} ({token.symbol})
                                            </Box>
                                        </MenuItem>
                                    ))}
                                </MenuList>
                            </Menu>
                        </FormControl>
                    </ModalBody>

                    <ModalFooter>
                        <Button colorScheme="blue" mr={3} onClick={handleSend}>
                            Send
                        </Button>
                        <Button variant="ghost" onClick={onClose}>
                            Cancel
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    );
};

export default CreateHolon;
