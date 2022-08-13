import { assert, expect } from "chai";
import { deployments, ethers, network } from "hardhat";
import { Lottery, VRFCoordinatorV2Mock } from "../../typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { developmentChains, networkConfig } from "../../helper-hardhat-config";
import { BigNumber } from "ethers";

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Lottery", async function () {
          let lottery: Lottery;
          let vrfMock: VRFCoordinatorV2Mock;
          let deployer: SignerWithAddress;
          let entranceFee: BigNumber;
          let interval: number;
          this.beforeEach(async function () {
              const accounts = await ethers.getSigners();
              deployer = accounts[0];
              await deployments.fixture(["all"]);
              lottery = await ethers.getContract("Lottery", deployer);
              vrfMock = await ethers.getContract(
                  "VRFCoordinatorV2Mock",
                  deployer
              );
              entranceFee = await lottery.getEntranceFee();
              interval = (await lottery.getInterval()).toNumber();
          });

          describe("constructor", async function () {
              it("Lottery state should be open", async function () {
                  const stateRes = await lottery.getLotteryState();
                  assert.equal(stateRes.toString(), "0");
              });

              it("Should have time interval", async function () {
                  const intervalRes = await lottery.getInterval();
                  assert.equal(interval, intervalRes.toNumber());
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

              it("Should store players that entered", async function(){
                await lottery.enterLottery({value: entranceFee});
                const playerFromContract = await lottery.getPlayer(0);
                assert.equal(deployer.address, playerFromContract);
              });

              it("Should emit event LotteryEnter", async function(){
                await expect(lottery.enterLottery({value: entranceFee})).to.emit(lottery, "LotteryEnter");
              });

              it("Does not allow entrance when lottery is calculating", async function(){
                await lottery.enterLottery({value: entranceFee});
                await network.provider.send("evm_increaseTime", [interval + 1]);
                await network.provider.request({method: "evm_mine", params: []});
                await lottery.performUpkeep([]);
                await expect(lottery.enterLottery({value: entranceFee})).to.be.revertedWithCustomError(lottery, "Lottery__LotteryNotOpen");
              });
          });

          describe("checkUpkeep", async function(){
            it("Returns false if peple have not sent any eth", async function() {
                await network.provider.send("evm_increaseTime", [interval + 1]);
                await network.provider.send("evm_mine", []);
                const checkUpkeepRes = await lottery.callStatic.
                checkUpkeep([]);
                const upkeepNeeded = checkUpkeepRes[0];
                assert(!upkeepNeeded);
            });

            it("Returns false if the lottery is not open", async function (){
                await lottery.enterLottery({value: entranceFee});
                await network.provider.send("evm_increaseTime", [interval + 1]);
                await network.provider.send("evm_mine", []);
                await lottery.performUpkeep([]);
                const checkUpkeepRes = await lottery.callStatic.checkUpkeep([]);
                const upkeepNeeded = checkUpkeepRes[0];
                assert(!upkeepNeeded);
            });
          });
      });
