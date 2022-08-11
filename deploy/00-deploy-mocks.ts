import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { developmentChains } from "../helper-hardhat-config";
import { ethers } from "hardhat";

const BASE_FEE = ethers.utils.parseEther("0.25");
// Calculated value based on the gas price of the chain.
// Eth price: 1.000.000.000
// Chainlink nodes pay the gas fees to give us randomess & do external execution
// So the price of request changes based on the price of gas
const GAS_PRICE_LINK = 1e9;

const deployMocks: DeployFunction = async function (
    hre: HardhatRuntimeEnvironment
) {
    const { getNamedAccounts, deployments, network } = hre;
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();
    const chainName: string = network.name;

    if (developmentChains.includes(chainName)) {
        log("Local network detected! Deploying mocks ...");
        await deploy("MockVrfCoordinatorV2", {
            contract: "MockVrfCoordinatorV2",
            from: deployer,
            log: true,
            args: [BASE_FEE, GAS_PRICE_LINK],
        });
        log("Mock deployed!");
        log("------------------------------");
    }
};

export default deployMocks;
deployMocks.tags = ["all", "mocks"];
