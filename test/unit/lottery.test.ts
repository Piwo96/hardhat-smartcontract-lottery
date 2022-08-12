import { assert, expect } from "chai";
import { deployments, ethers, network } from "hardhat";
import { Lottery } from "../../typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { developmentChains } from "../../helper-hardhat-config";

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Lottery", async function () {
          let lottery: Lottery;
          let deployer: SignerWithAddress;
          this.beforeEach(async function () {
              const accounts = await ethers.getSigners();
              deployer = accounts[0];
              await deployments.fixture(["all"]);
              lottery = await ethers.getContract("Lottery", deployer);
          });

          describe("constructor", async function () {});
      });
