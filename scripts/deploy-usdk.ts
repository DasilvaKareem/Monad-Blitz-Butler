import { createThirdwebClient, getContract, prepareContractCall, sendTransaction } from "thirdweb";
import { privateKeyToAccount } from "thirdweb/wallets";
import { defineChain } from "thirdweb/chains";
import { deployERC20Contract } from "thirdweb/deploys";

// Load environment variables
import * as dotenv from "dotenv";
dotenv.config();

const THIRDWEB_SECRET_KEY = process.env.THIRDWEB_SECRET_KEY!;
const AGENT_PRIVATE_KEY = process.env.AGENT_PRIVATE_KEY!;

// Define Monad Testnet
const monadTestnet = defineChain({
  id: 10143,
  name: "Monad Testnet",
  nativeCurrency: {
    name: "Monad",
    symbol: "MON",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://testnet-rpc.monad.xyz"],
    },
  },
  blockExplorers: {
    default: {
      name: "Monad Explorer",
      url: "https://testnet.monadexplorer.com",
    },
  },
  testnet: true,
});

async function deployUSDK() {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🚀 DEPLOYING USDK TOKEN ON MONAD TESTNET");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  // Create thirdweb client
  const client = createThirdwebClient({
    secretKey: THIRDWEB_SECRET_KEY,
  });

  // Create account from private key
  const account = privateKeyToAccount({
    client,
    privateKey: AGENT_PRIVATE_KEY,
  });

  console.log(`\nDeployer address: ${account.address}`);
  console.log("Chain: Monad Testnet (10143)\n");

  try {
    // Deploy ERC20 token
    console.log("Deploying USDK token...");

    const contractAddress = await deployERC20Contract({
      chain: monadTestnet,
      client,
      account,
      type: "TokenERC20",
      params: {
        name: "USD Koin",
        symbol: "USDK",
        description: "Test stablecoin for Blitz Butler on Monad",
        // The deployer gets minter role
      },
    });

    console.log("\n✅ USDK TOKEN DEPLOYED SUCCESSFULLY!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`Contract Address: ${contractAddress}`);
    console.log(`Explorer: https://testnet.monadexplorer.com/address/${contractAddress}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("\n📝 Add this to your .env file:");
    console.log(`USDK_CONTRACT_ADDRESS=${contractAddress}`);
    console.log("\n");

    return contractAddress;
  } catch (error) {
    console.error("❌ Deployment failed:", error);
    throw error;
  }
}

deployUSDK().catch(console.error);
