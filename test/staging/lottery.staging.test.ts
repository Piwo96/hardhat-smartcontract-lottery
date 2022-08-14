import { assert, expect } from "chai";
import { Lottery } from "../../typechain-types";
import { deployments, network, ethers } from "hardhat";
import { developmentChains, networkConfig } from "../../helper-hardhat-config";
import { BigNumber } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

developmentChains.includes(network.name)
? describe.skip
: describe("Lottery", function() {
    let lottery: Lottery;
    let deployer: SignerWithAddress;
    let entranceFee: BigNumber;
    let interval: number;
    this.beforeEach(async function () {
        const accounts = await ethers.getSigners();
        deployer = accounts[0];
        lottery = await ethers.getContract("Lottery", deployer);
        entranceFee = await lottery.getEntranceFee();
    });

    describe("fulfillRandomWords", function(){
        this.beforeEach(async function() {
            await lottery.enterLottery({value: entranceFee});
        });
    })
});