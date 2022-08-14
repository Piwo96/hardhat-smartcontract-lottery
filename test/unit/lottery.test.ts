import { assert, expect } from "chai";
import { deployments, ethers, network } from "hardhat";
import { Lottery, VRFCoordinatorV2Mock } from "../../typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { developmentChains, networkConfig } from "../../helper-hardhat-config";
import { BigNumber } from "ethers";

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Lottery", function () {
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

          describe("constructor", function () {
              it("Lottery state should be open", async function () {
                  const stateRes = await lottery.getLotteryState();
                  assert.equal(stateRes.toString(), "0");
              });

              it("Should have time interval", async function () {
                  const intervalRes = await lottery.getInterval();
                  assert.equal(interval, intervalRes.toNumber());
              });
          });

          describe("enterLottery", function () {
              it("Should be reverted when fee to low", async function () {
                  await expect(
                      lottery.enterLottery()
                  ).to.be.revertedWithCustomError(
                      lottery,
                      "Lottery__NotEnoughEthEntered"
                  );
              });

              it("Should store players that entered", async function () {
                  await lottery.enterLottery({ value: entranceFee });
                  const playerFromContract = await lottery.getPlayer(0);
                  assert.equal(deployer.address, playerFromContract);
              });

              it("Should emit event LotteryEnter", async function () {
                  await expect(
                      lottery.enterLottery({ value: entranceFee })
                  ).to.emit(lottery, "LotteryEnter");
              });

              it("Does not allow entrance when lottery is calculating", async function () {
                  await lottery.enterLottery({ value: entranceFee });
                  await network.provider.send("evm_increaseTime", [
                      interval + 1,
                  ]);
                  await network.provider.request({
                      method: "evm_mine",
                      params: [],
                  });
                  await lottery.performUpkeep([]);
                  await expect(
                      lottery.enterLottery({ value: entranceFee })
                  ).to.be.revertedWithCustomError(
                      lottery,
                      "Lottery__LotteryNotOpen"
                  );
              });
          });

          describe("checkUpkeep", function () {
              it("Returns false if peple have not sent any eth", async function () {
                  await network.provider.send("evm_increaseTime", [
                      interval + 1,
                  ]);
                  await network.provider.send("evm_mine", []);
                  const checkUpkeepRes = await lottery.callStatic.checkUpkeep(
                      "0x"
                  );
                  const upkeepNeeded = checkUpkeepRes[0];
                  assert(!upkeepNeeded);
              });

              it("Returns false if the lottery is not open", async function () {
                  await lottery.enterLottery({ value: entranceFee });
                  await network.provider.send("evm_increaseTime", [
                      interval + 1,
                  ]);
                  await network.provider.send("evm_mine", []);
                  await lottery.performUpkeep([]);
                  const lotteryState = await lottery.getLotteryState();
                  const checkUpkeepRes = await lottery.callStatic.checkUpkeep(
                      []
                  );
                  const upkeepNeeded = checkUpkeepRes[0];
                  assert.equal(lotteryState.toString(), "1");
                  assert(!upkeepNeeded);
              });

              it("Returns false if not enough time has passed", async function () {
                  await lottery.enterLottery({ value: entranceFee });
                  await network.provider.send("evm_increaseTime", [
                      interval - 2,
                  ]);
                  await network.provider.send("evm_mine", []);
                  const checkUpkeepRes = await lottery.callStatic.checkUpkeep(
                      []
                  );
                  const upkeepNeeded = checkUpkeepRes[0];
                  assert(!upkeepNeeded);
              });

              it("Returns true when player entered, open, time has passed, eth", async function () {
                  await lottery.enterLottery({ value: entranceFee });
                  await network.provider.send("evm_increaseTime", [
                      interval + 1,
                  ]);
                  await network.provider.send("evm_mine", []);
                  const checkUpkeepRes = await lottery.callStatic.checkUpkeep(
                      "0x"
                  );
                  const upkeepNeeded = checkUpkeepRes[0];
                  assert(upkeepNeeded);
              });
          });

          describe("performUpkeep", function () {
              it("Reverts when upkeep not needed", async function () {
                  await network.provider.send("evm_increaseTime", [
                      interval + 1,
                  ]);
                  await network.provider.send("evm_mine", []);
                  await expect(
                      lottery.performUpkeep("0x")
                  ).to.be.revertedWithCustomError(
                      lottery,
                      "Lottery_UpkeepNotNeeded"
                  );
              });

              it("Sets lottery in calculating state", async function () {
                  await lottery.enterLottery({ value: entranceFee });
                  await network.provider.send("evm_increaseTime", [
                      interval + 1,
                  ]);
                  await network.provider.send("evm_mine", []);
                  await lottery.performUpkeep("0x");
                  const lotteryState = await lottery.getLotteryState();
                  assert.equal(lotteryState.toString(), "1");
              });

              it("Emits RequestLotteryWinner event", async function () {
                  await lottery.enterLottery({ value: entranceFee });
                  await network.provider.send("evm_increaseTime", [
                      interval + 1,
                  ]);
                  await network.provider.request({
                      method: "evm_mine",
                      params: [],
                  });
                  // await expect(lottery.performUpkeep("0x")).to.emit(lottery, "RequestLotteryWinner");
                  const txResponse = await lottery.performUpkeep("0x");
                  const txReceipt = await txResponse.wait(1);
                  const requestId = txReceipt.events![1].args!.requestId;
                  assert(requestId.toNumber() > 0);
              });
          });

          describe("fulFilRandomWords", function () {
              this.beforeEach(async function () {
                  await lottery.enterLottery({ value: entranceFee });
                  await network.provider.send("evm_increaseTime", [
                      interval + 1,
                  ]);
                  await network.provider.send("evm_mine", []);
              });

              it("Can only be called after request has been made", async function () {
                  await expect(
                      vrfMock.fulfillRandomWords(0, lottery.address)
                  ).to.be.revertedWith("nonexistent request");
                  await expect(
                      vrfMock.fulfillRandomWords(1, lottery.address)
                  ).to.be.revertedWith("nonexistent request");
              });

              it("Picks a winner, rests the lottery, and sends money", async function () {
                  const additionalEntrants: number = 3;
                  const startingAccountIndex: number = 1;
                  const accounts = await ethers.getSigners();
                  for (
                      let i = startingAccountIndex;
                      i < startingAccountIndex + additionalEntrants;
                      i++
                  ) {
                      const accountConnectedLottery = lottery.connect(
                          accounts[i]
                      );
                      await accountConnectedLottery.enterLottery({
                          value: entranceFee,
                      });
                  }
                  const startingTimeStamp = await lottery.getLatestTimestamp();

                  // performUpkeep (mock being Chainlink Keepers)
                  // fulfillRandomWords (mock being the chainlink VRF)
                  await new Promise<void>(async (resolve, reject) => {
                      lottery.once("WinnerPicked", async () => {
                          console.log("Found the event");
                          try {
                              const recentWinner =
                                  await lottery.getRecentWinner();
                              const winnerEndingBalance =
                                  await accounts[1].getBalance();
                              const lotteryState =
                                  await lottery.getLotteryState();
                              const endingTimeStamp =
                                  await lottery.getLatestTimestamp();
                              const numPlayers =
                                  await lottery.getNumberOfPlayers();

                              // console.log(recentWinner);
                              // console.log(accounts[0].address);
                              // console.log(accounts[1].address);
                              // console.log(accounts[2].address);
                              // console.log(accounts[3].address);
                              assert(recentWinner);
                              assert.equal(lotteryState.toString(), "0");
                              assert(endingTimeStamp > startingTimeStamp);
                              assert.equal(numPlayers.toString(), "0");
                              assert.equal(
                                  winnerEndingBalance.toString(),
                                  winnerStartingBalance
                                      .add(
                                          entranceFee
                                              .mul(additionalEntrants)
                                              .add(entranceFee)
                                      )
                                      .toString()
                              );
                          } catch (error) {
                              reject(error);
                          }
                          resolve();
                      });
                      const tx = await lottery.performUpkeep("0x");
                      const txReceipt = await tx.wait(1);
                      const winnerStartingBalance =
                          await accounts[1].getBalance();
                      await vrfMock.fulfillRandomWords(
                          txReceipt.events![1].args!.requestId,
                          lottery.address
                      );
                  });
              });
          });
      });
