import { ethers } from "hardhat";

interface INetworkConfigInfo {
    [id: number]: INetworkConfigItem;
}

interface INetworkConfigItem {
    name?: string;
    vrfCoordinatorV2?: string;
    blockConfirmations?: number;
    entranceFee?: string;
    gasLane?: string;
    subscriptionId?: string;
    callbackGasLimit?: string;
    interval?: string;
}

export const networkConfig: INetworkConfigInfo = {
    4: {
        name: "rinkeby",
        vrfCoordinatorV2: "0x6168499c0cFfCaCD319c818142124B7A15E857ab",
        blockConfirmations: 6,
        entranceFee: "0.01",
        gasLane:
            "0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc",
        subscriptionId: "0",
        callbackGasLimit: "500000",
        interval: "15",
    },
    31337: {
        name: "hardhat",
        blockConfirmations: 1,
        entranceFee: "0.01",
        gasLane:
            "0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc",
        subscriptionId: "0",
        callbackGasLimit: "500000",
        interval: "15",
    },
};

export const developmentChains = ["hardhat", "localhost"];
