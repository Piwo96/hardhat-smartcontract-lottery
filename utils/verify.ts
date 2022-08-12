import { run } from "hardhat";

export async function verify(contractAddress: string, args: any) {
    console.log("Verifying contract ...");
    try {
        await run("verify:verify", {
            address: contractAddress,
            constructorArguments: args,
        });
    } catch (error: any) {
        if (error.message.toLowercase().includes("already verified")) {
            console.log("Allready verified");
        } else {
            console.log(error);
        }
    }
}
