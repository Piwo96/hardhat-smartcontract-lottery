import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "dotenv/config";
import "hardhat-gas-reporter";

const RINKEBY_RPC_URL = process.env.RINKEBY_RPC_URL || "http://";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x00";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "asdfj";
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY || "adsf";

const config: HardhatUserConfig = {
    solidity: {
        compilers: [{ version: "0.8.9" }, { version: "0.6.8" }],
    },
    networks: {
        hardhat: {},
        rinkeby: {
            url: RINKEBY_RPC_URL,
            accounts: [PRIVATE_KEY],
            chainId: 4,
        },
    },
    etherscan: {
        apiKey: ETHERSCAN_API_KEY,
    },
    gasReporter: {
        enabled: true, // wenn man gerade nicht das Gas prüft kann es ausgeschaltet werden
        outputFile: "gas-report.txt", // optional
        noColors: true, // optional
        currency: "USD", // optional; API Key von CoinMarketCap
        // coinmarketcap: COINMARKETCAP_API_KEY, // notwendig for API Call, kann auskommentiert werden
        token: "ETH", // um Kosten auf anderen Chains zu testen wie MATIC
    },
};

export default config;
