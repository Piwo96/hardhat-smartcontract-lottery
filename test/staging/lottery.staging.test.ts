import { assert, expect } from "chai";
import { Lottery } from "../../typechain-types";
import { deployments, network, ethers, getNamedAccounts } from "hardhat";
import { developmentChains, networkConfig } from "../../helper-hardhat-config";
import { BigNumber } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

developmentChains.includes(network.name)
    ? describe.skip
    : describe("Lottery", function () {
          let lottery: Lottery;
          let entranceFee: BigNumber;
          let deployer: SignerWithAddress;
          beforeEach(async function () {
              const accounts = await ethers.getSigners();
              deployer = accounts[0];
              lottery = await ethers.getContract("Lottery", deployer);
              entranceFee = await lottery.getEntranceFee();
          });

          describe("fulfillRandomWords", function () {
              it("works with live Chainlink Keepers and Chainlink VRF, we get a random winner", async function () {
                  // enter the raffle
                  console.log("Setting up test...");
                  const startingTimeStamp = await lottery.getLatestTimestamp();
                  const accounts = await ethers.getSigners();

                  console.log("Setting up Listener...");
                  await new Promise<void>(async (resolve, reject) => {
                      // setup listener before we enter the raffle
                      // Just in case the blockchain moves REALLY fast
                      lottery.once("WinnerPicked", async () => {
                          console.log("WinnerPicked event fired!");
                          try {
                              // add our asserts here
                              const recentWinner =
                                  await lottery.getRecentWinner();
                              const raffleState =
                                  await lottery.getLotteryState();
                              const winnerEndingBalance =
                                  await accounts[0].getBalance();
                              const endingTimeStamp =
                                  await lottery.getLatestTimestamp();

                              await expect(lottery.getPlayer(0)).to.be.reverted;
                              assert.equal(
                                  recentWinner.toString(),
                                  accounts[0].address
                              );
                              assert.equal(raffleState, 0);
                              assert.equal(
                                  winnerEndingBalance.toString(),
                                  winnerStartingBalance
                                      .add(entranceFee)
                                      .toString()
                              );
                              assert(endingTimeStamp > startingTimeStamp);
                              resolve();
                          } catch (error) {
                              console.log(error);
                              reject(error);
                          }
                      });
                      // Then entering the lottery
                      console.log("Entering Lottery...");
                      const tx = await lottery.enterLottery({
                          value: entranceFee,
                      });
                      await tx.wait(1);
                      console.log("Ok, time to wait...");
                      const winnerStartingBalance =
                          await accounts[0].getBalance();

                      // and this code WONT complete until our listener has finished listening!
                  });
              });
          });
      });
