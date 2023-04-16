import React, { useState } from "react";
import Web3 from "web3";
import HolonContract from "./contracts/Holon";
import { Button } from "@chakra-ui/react";

const Holon = () => {
    const [web3, setWeb3] = useState(null);
    const [contract, setContract] = useState(null);
    const [holonName, setHolonName] = useState("");
    const [ipfsManifest, setIpfsManifest] = useState("");
    const [creator, setCreator] = useState("");
    const [loading, setLoading] = useState(false);

    const connectToWeb3 = async () => {
        if (window.ethereum) {
            const web3 = new Web3(window.ethereum);
            try {
                await window.ethereum.enable();
                setWeb3(web3);
                const networkId = await web3.eth.net.getId();
                const deployedNetwork = HolonContract.networks[networkId];
                const contract = new web3.eth.Contract(HolonContract.abi, "0x2ed63b87E4164E7112e08c192844B6e8deCA7Fa6");
                console.log(await contract.methods.name().call());
                setContract(contract);
            } catch (error) {
                console.error(error);
            }
        } else {
            console.error("No Ethereum wallet detected");
        }
    };

    const createHolon = async () => {
        setLoading(true);
        const accounts = await web3.eth.getAccounts();
        const result = await contract.methods.newHolon(holonName, 0).send({ from: accounts[0] });
        setLoading(false);
    };

    return (
        <div>
            {loading ? (
                <p>Loading...</p>
            ) : (
                <div>
                    <label htmlFor="holonName">Holon Name:</label>
                    <input type="text" id="holonName" value={holonName} onChange={(e) => setHolonName(e.target.value)} />
                    <label htmlFor="ipfsManifest">IPFS Manifest:</label>
                    <input type="text" id="ipfsManifest" value={ipfsManifest} onChange={(e) => setIpfsManifest(e.target.value)} />
                    <label htmlFor="creator">Creator Address:</label>
                    <input type="text" id="creator" value={creator} onChange={(e) => setCreator(e.target.value)} />
                    <Button onClick={createHolon}>Create Holon</Button>
                </div>
            )}
            {!web3 && <Button onClick={connectToWeb3}>Connect to Web3</Button>}
        </div>
    );
};

export default Holon;
