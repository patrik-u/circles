import React, { useState, useEffect } from "react";
import {
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
} from "@chakra-ui/react";
import Web3 from "web3";
import { useAtom } from "jotai";
import { circleAtom } from "components/Atoms";
import ERC20Token from "components/contracts/TestToken";

const DonateToHolon = () => {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [circle] = useAtom(circleAtom);
    const [recipient, setRecipient] = useState(circle?.funding?.holon);
    const [amount, setAmount] = useState("");
    const [tokenAddress, setTokenAddress] = useState("");
    const [tokens, setTokens] = useState([]);
    const [selectedToken, setSelectedToken] = useState("");
    const [networkType, setNetworkType] = useState("");

    // Set up a new Web3 instance (using Metamask)
    const web3 = new Web3(Web3.givenProvider || "http://localhost:8545");

    // Get a list of popular ERC20 tokens on the Ethereum mainnet
    useEffect(() => {
        const getTokens = async () => {
            const networkId = await web3.eth.net.getId();
            const response = await fetch("https://gateway.ipfs.io/ipns/tokens.uniswap.org");
            let json = await response.json();
            console.log(networkId);
            const netType = await web3.eth.net.getNetworkType();
            setNetworkType(netType);
            const tokens = json.tokens.filter((x) => x.chainId === networkId);
            tokens.sort((a, b) => a.name.localeCompare(b.name));
            setTokens(tokens);
        };

        getTokens();
    }, []);

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

    return (
        <>
            <Button onClick={onOpen}>Donate to Circle</Button>

            <Modal isOpen={isOpen} onClose={onClose}>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Donate to Circle</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <FormControl>
                            <FormLabel>Recipient Address</FormLabel>
                            <Input placeholder="Recipient Address" value={recipient} isReadOnly={true} />
                        </FormControl>

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

export default DonateToHolon;
