import { HardhatRuntimeEnvironment } from "hardhat/types";
import { ethers } from "hardhat";
import { DeployFunction } from "hardhat-deploy/types";
import { networkConfig, developmentChains } from "../helper-hardhat-config";
import { verify } from "../utils/verify";

const VRF_SUB_FUND_AMOUNT = ethers.utils.parseEther("30");

const deployLottery: DeployFunction = async function (
    hre: HardhatRuntimeEnvironment
) {
    const { getNamedAccounts, deployments, network } = hre;
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();
    const chainId: number = network.config.chainId!;
    const chainName: string = network.name;

    let vrfCoordinatorV2Address: string, subscriptionId: string;
    const waitConfirmations: number =
        networkConfig[chainId].blockConfirmations || 1;
    if (developmentChains.includes(chainName)) {
        const vrfCoordinatorV2 = await ethers.getContract(
            "VRFCoordinatorV2Mock"
        );
        vrfCoordinatorV2Address = vrfCoordinatorV2.address;
        const transactionResponse = await vrfCoordinatorV2.createSubscription();
        const transactionReceipt = await transactionResponse.wait(1);
        subscriptionId = transactionReceipt.events[0].args.subId;
        // Fund subscription
        // Usually, you'd need the link token on a real network
        await vrfCoordinatorV2.fundSubscription(
            subscriptionId,
            VRF_SUB_FUND_AMOUNT
        );
    } else {
        vrfCoordinatorV2Address = networkConfig[chainId].vrfCoordinatorV2!;
        subscriptionId = networkConfig[chainId].subscriptionId!;
    }

    const entranceFee = ethers.utils.parseEther(
        networkConfig[chainId].entranceFee!
    );
    const gasLane = networkConfig[chainId].gasLane;
    const callbackGasLimit = networkConfig[chainId].callbackGasLimit!;
    const interval = networkConfig[chainId].interval;

    const args: any = [
        vrfCoordinatorV2Address,
        entranceFee,
        gasLane,
        subscriptionId,
        callbackGasLimit,
        interval,
    ];
    const lottery = await deploy("Lottery", {
        contract: "Lottery",
        from: deployer,
        log: true,
        args: args,
        waitConfirmations: waitConfirmations,
    });

    log("Lottery deployed!");

    if (
        !developmentChains.includes(chainName) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        log("Verifying ...");
        await verify(lottery.address, args);
    }
    log("---------------------------------------------");
};

export default deployLottery;
deployLottery.tags = ["all", "lottery"];
