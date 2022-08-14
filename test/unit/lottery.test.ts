import { assert, expect } from "chai";
import { deployments, ethers, network } from "hardhat";
import { Lottery, VRFCoordinatorV2Mock } from "../../typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { developmentChains, networkConfig } from "../../helper-hardhat-config";
import { BigNumber } from "ethers";

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Lottery", async function () {
          let chainId: number;
          let lottery: Lottery;
          let vrfMock: VRFCoordinatorV2Mock;
          let deployer: SignerWithAddress;
          let entranceFee: BigNumber;
          this.beforeEach(async function () {
              chainId = network.config.chainId!;
              const accounts = await ethers.getSigners();
              deployer = accounts[0];
              await deployments.fixture(["all"]);
              lottery = await ethers.getContract("Lottery", deployer);
              vrfMock = await ethers.getContract(
                  "VRFCoordinatorV2Mock",
                  deployer
              );
              entranceFee = await lottery.getEntranceFee();
          });

          describe("constructor", async function () {
              let interval: string;
              this.beforeEach(async function () {
                  interval = networkConfig[chainId].interval!;
              });

              it("Lottery state should be open", async function () {
                  const stateRes = await lottery.getLotteryState();
                  assert.equal(stateRes.toString(), "0");
              });

              it("Should have time interval", async function () {
                  const intervalRes = await lottery.getInterval();
                  assert.equal(interval, intervalRes.toString());
              });
          });

          describe("enterLottery", async function () {
              it("Should be reverted when fee to low", async function () {
                  await expect(
                      lottery.enterLottery()
                  ).to.be.revertedWithCustomError(
                      lottery,
                      "Lottery__NotEnoughEthEntered"
                  );
              });

              it("Stores players", async function () {
                  await lottery.enterLottery({
                      value: entranceFee,
                  });
                  const playerFromContract = await lottery.getPlayer(0);
                  assert.equal(playerFromContract, deployer.address);
              });

              it("Emits evet on enter", async function () {
                  await expect(
                      lottery.enterLottery({ value: entranceFee })
                  ).to.emit(lottery, "LotteryEnter");
              });

              it("Does not allow entrance when lottery is calculating", async function () {});
          });
      });
