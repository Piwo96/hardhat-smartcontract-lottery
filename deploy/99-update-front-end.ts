import { DeployFunction } from "hardhat-deploy/types";
import { network, ethers } from "hardhat";
import fs from "fs";

const FRONT_END_ADDRESSES_FILE =
    "../nextjs-smarcontract-lottery/constants/contractAddresses.json";
const FRONT_END_ABI_FILE = "../nextjs-smarcontract-lottery/constants/abi.json";

const updateUi: DeployFunction = async () => {
    if (process.env.UPDATE_FRONT_END) {
        console.log("Updating front end ...");
        updateContractAddresses();
        updateAbi();
    }
};

async function updateContractAddresses() {
    const lottery = await ethers.getContract("Lottery");
    const chainId = network.config.chainId!.toString();
    const currentAddresses: any = JSON.parse(
        fs.readFileSync(FRONT_END_ADDRESSES_FILE, "utf-8")
    );
    if (chainId in currentAddresses) {
        if (!currentAddresses[chainId].includes(lottery.address)) {
            currentAddresses[chainId].push(lottery.address);
        }
    } else {
        currentAddresses[chainId] = [lottery.address];
    }
    fs.writeFileSync(
        FRONT_END_ADDRESSES_FILE,
        JSON.stringify(currentAddresses)
    );
}

async function updateAbi() {
    const lottery = await ethers.getContract("Lottery");
    const enc = new TextEncoder();
    const abi = lottery.interface.format(ethers.utils.FormatTypes.json);
    const encodedAbi = enc.encode(abi.toString());
    fs.writeFileSync(FRONT_END_ABI_FILE, encodedAbi);
}

export default updateUi;
updateUi.tags = ["all", "frontend"];
