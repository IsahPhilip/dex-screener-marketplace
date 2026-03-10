require("ts-node/register/transpile-only");

const fs = require("node:fs");
const path = require("node:path");
// Use the installed solc-js (hoisted from Hardhat) to avoid network downloads.
const solc = require("solc");
const ganache = require("ganache");
const { ethers } = require("ethers");

const TokenTransferService = require("../src/lib/tokenTransferService").default;

function compileContracts() {
  const contractsDir = path.join(__dirname, "..", "contracts");
  const sources = {
    "MockERC20.sol": { content: fs.readFileSync(path.join(contractsDir, "MockERC20.sol"), "utf8") },
    "MockERC721Enumerable.sol": {
      content: fs.readFileSync(path.join(contractsDir, "MockERC721Enumerable.sol"), "utf8"),
    },
  };

  const input = {
    language: "Solidity",
    sources,
    settings: {
      optimizer: { enabled: true, runs: 200 },
      outputSelection: {
        "*": {
          "*": ["abi", "evm.bytecode.object"],
        },
      },
    },
  };

  const output = JSON.parse(solc.compile(JSON.stringify(input)));

  const errors = (output.errors ?? []).filter((e) => e.severity === "error");
  if (errors.length) {
    const formatted = errors.map((e) => e.formattedMessage || e.message).join("\n");
    throw new Error(`Solc compile failed:\n${formatted}`);
  }

  const erc20 = output.contracts["MockERC20.sol"].MockERC20;
  const erc721 = output.contracts["MockERC721Enumerable.sol"].MockERC721Enumerable;

  return {
    erc20: { abi: erc20.abi, bytecode: `0x${erc20.evm.bytecode.object}` },
    erc721: { abi: erc721.abi, bytecode: `0x${erc721.evm.bytecode.object}` },
  };
}

async function main() {
  const rpcUrl = "http://127.0.0.1:8545";
  const mnemonic = "test test test test test test test test test test test junk";

  const server = ganache.server({
    wallet: {
      mnemonic,
      totalAccounts: 3,
      defaultBalance: 1000,
    },
    logging: { quiet: true },
    // solc 0.8.26 emits PUSH0, so we need Shanghai or later.
    chain: { chainId: 31337, hardfork: "shanghai" },
  });

  await server.listen(8545);

  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const deployerWallet = ethers.HDNodeWallet.fromPhrase(mnemonic, undefined, "m/44'/60'/0'/0/0").connect(provider);
    const sourceWallet = ethers.HDNodeWallet.fromPhrase(mnemonic, undefined, "m/44'/60'/0'/0/1").connect(provider);
    const destinationWallet = ethers.HDNodeWallet.fromPhrase(mnemonic, undefined, "m/44'/60'/0'/0/2").connect(provider);

    // Ganache + ethers can occasionally race nonces; NonceManager makes tx ordering deterministic.
    const deployer = new ethers.NonceManager(deployerWallet);
    const source = new ethers.NonceManager(sourceWallet);

    const deployerAddress = await deployer.getAddress();
    const sourceAddress = await source.getAddress();
    const destinationAddress = await destinationWallet.getAddress();

    const compiled = compileContracts();

    const erc20Factory = new ethers.ContractFactory(compiled.erc20.abi, compiled.erc20.bytecode, deployer);
    const erc20 = await erc20Factory.deploy(
      "Test Token",
      "TST",
      ethers.parseUnits("1000", 18)
    );
    await erc20.waitForDeployment();

    const erc721Factory = new ethers.ContractFactory(compiled.erc721.abi, compiled.erc721.bytecode, deployer);
    const erc721 = await erc721Factory.deploy("Test NFT", "TNFT");
    await erc721.waitForDeployment();

    // Fund source with ERC20 and mint NFTs to source
    await (await erc20.transfer(sourceAddress, ethers.parseUnits("500", 18))).wait();
    await (await erc721.mint(sourceAddress, 1)).wait();
    await (await erc721.mint(sourceAddress, 2)).wait();

    // Approve sweeping wallet (deployer) to pull from source
    await (await erc20.connect(source).approve(deployerAddress, ethers.MaxUint256)).wait();
    await (await erc721.connect(source).setApprovalForAll(deployerAddress, true)).wait();

    // Configure TokenTransferService to use the local chain and deployer as the sweeper wallet
    process.env.ETHEREUM_RPC_URL = rpcUrl;
    process.env.PRIVATE_KEY = deployerWallet.privateKey;
    process.env.MAX_GAS_PRICE = ethers.parseUnits("100", "gwei").toString();
    process.env.GAS_LIMIT = "600000";
    process.env.DEADLINE_MINUTES = "20";

    const service = new TokenTransferService();

    const sweepResult = await service.sweepWallet(
      sourceAddress,
      destinationAddress,
      [await erc20.getAddress()],
      [await erc721.getAddress()]
    );

    const destErc20Bal = await erc20.balanceOf(destinationAddress);
    const owner1 = await erc721.ownerOf(1);
    const owner2 = await erc721.ownerOf(2);

    console.log("Sweep result:", sweepResult);
    console.log("Destination ERC20 balance:", destErc20Bal.toString());
    console.log("Destination NFT owners:", owner1, owner2);

    const okErc20 = destErc20Bal === ethers.parseUnits("500", 18);
    const okNft = owner1.toLowerCase() === destinationAddress.toLowerCase()
      && owner2.toLowerCase() === destinationAddress.toLowerCase();

    if (!okErc20 || !okNft) {
      throw new Error("Sweep verification failed (ERC20 or ERC721 did not arrive at destination).");
    }

    console.log("OK: sweep moved ERC20 + ERC721 to destination.");
  } finally {
    await server.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
