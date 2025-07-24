import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@openzeppelin/hardhat-upgrades";
import "dotenv/config";

const deployerPrivateKey = process.env.DEPLOYER_PRIVATE_KEY;
const primordialRpcUrl = process.env.PRIMORDIAL_RPC_URL;

const config: HardhatUserConfig = {
  solidity: "0.8.24",
  paths: {
    sources: "./contracts",
    artifacts: "./artifacts",
    cache: "./cache",
    tests: "./test"
  },
  networks: {
    hardhat: { chainId: 31337 },
    localhost: { url: "http://127.0.0.1:8545", chainId: 31337 },
    primordialTestnet: {
      url: primordialRpcUrl || "",
      accounts: deployerPrivateKey ? [deployerPrivateKey] : [],
      chainId: 1043,
    },
  },
  etherscan: {

    apiKey: {
      primordialTestnet: "API_KEY_IS_NOT_NEEDED"
    },

    customChains: [
      {
        network: "primordialTestnet",
        chainId: 1043,
        urls: {
          apiURL: "https://primordial.bdagscan.com/api",
          browserURL: "https://primordial.bdagscan.com"
        }
      }
    ]
  },
  typechain: {
    outDir: "typechain-types",
    target: "ethers-v6",
  },
};

export default config;