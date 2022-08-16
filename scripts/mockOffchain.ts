import { ethers, network } from "hardhat";
import { BigNumber, Contract } from "ethers";
import { Lottery__factory } from "../typechain-types";

async function mookKeeper() {
    const lottery = await ethers.getContract("Lottery");
    const { upkeepNeeded } = await lottery.callStatic.checkUpkeep("0x");
    if (upkeepNeeded) {
        const tx = await lottery.performUpkeep("0x");
        const txReceipt = await tx.wait(1);
        const requestId = (
            txReceipt.events[1].args.requestId as BigNumber
        ).toNumber();
        console.log(`Performed upkeep with requestId: ${requestId}`);
        if (network.config.chainId == 31337) {
            await mockVrf(requestId, lottery);
        } else {
            console.log("no upkepp needed!");
        }
    }
}

async function mockVrf(requestId: number, lottery: Contract) {
    console.log("Calculating winner ...");
    const vrfCoordinatorV2Mock = await ethers.getContract(
        "VRFCoordinatorV2Mock"
    );
    await vrfCoordinatorV2Mock.fulfillRandomWords(requestId, lottery.address);
    console.log("Responed!");
    const recentWinner = await lottery.getRecentWinner();
    console.log(`The winner is: ${recentWinner}`);
}

mookKeeper()
    .then(() => process.exit(0))
    .catch((error) => {
        console.log(error);
        process.exit(1);
    });
