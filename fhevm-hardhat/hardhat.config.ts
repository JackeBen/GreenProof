import "@fhevm/hardhat-plugin";
import "@nomicfoundation/hardhat-chai-matchers";
import "@nomicfoundation/hardhat-ethers";
import "@nomicfoundation/hardhat-verify";
import "@typechain/hardhat";
import "hardhat-deploy";
import "hardhat-gas-reporter";
import type { HardhatUserConfig } from "hardhat/config";
import { vars } from "hardhat/config";
import "solidity-coverage";

// Prefer PRIVATE_KEY for live networks; fallback to mnemonic for local
const MNEMONIC: string = vars.get("MNEMONIC", "test test test test test test test test test test test junk");
const PRIVATE_KEY: string | undefined = (() => {
  try { return vars.get("PRIVATE_KEY"); } catch { return undefined; }
})();

const SEPOLIA_RPC_URL: string = vars.get(
  "SEPOLIA_RPC_URL",
  "https://ethereum-sepolia-rpc.publicnode.com"
);

const ETHERSCAN_API_KEY: string = vars.get("ETHERSCAN_API_KEY", "");

const accountsLocal = { mnemonic: MNEMONIC } as const;
const accountsLive = PRIVATE_KEY ? [PRIVATE_KEY] : { mnemonic: MNEMONIC };

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  namedAccounts: {
    deployer: 0,
  },
  etherscan: {
    apiKey: {
      sepolia: ETHERSCAN_API_KEY,
    },
  },
  gasReporter: {
    currency: "USD",
    enabled: process.env.REPORT_GAS ? true : false,
    excludeContracts: [],
  },
  networks: {
    hardhat: {
      accounts: accountsLocal,
      chainId: 31337,
    },
    localhost: {
      accounts: accountsLocal,
      chainId: 31337,
      url: "http://127.0.0.1:8545",
    },
    sepolia: {
      accounts: accountsLive as any,
      chainId: 11155111,
      url: SEPOLIA_RPC_URL,
    },
  },
  paths: {
    artifacts: "./artifacts",
    cache: "./cache",
    sources: "./contracts",
    tests: "./test",
    deployments: "./deployments",
  },
  solidity: {
    version: "0.8.27",
    settings: {
      metadata: {
        bytecodeHash: "none",
      },
      optimizer: {
        enabled: true,
        runs: 800,
      },
      evmVersion: "cancun",
    },
  },
  typechain: {
    outDir: "types",
    target: "ethers-v6",
  },
};

export default config;
