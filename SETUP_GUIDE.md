# Wallet Scanner Setup Guide

This guide will help you set up the wallet scanner with proper API keys and configuration.

## Getting RPC API Keys

### Option 1: Alchemy (Recommended)

1. **Sign up for Alchemy**
   - Go to [alchemy.com](https://alchemy.com/)
   - Create a free account

2. **Create a New App**
   - Dashboard → "Create App" or "Build" → "Create App"
   - Fill in the details:
     - **Name**: "Wallet Scanner"
     - **Description**: "Backend wallet monitoring service"
     - **Network**: Ethereum Mainnet (for production)
     - **Environment**: Production

3. **Get Your API Key**
   - After creating the app, you'll see an API key
   - Format: `https://eth-mainnet.alchemyapi.io/v2/YOUR_API_KEY`
   - Copy this for your `.env.local` file

4. **For Polygon Network**
   - Create another app or add Polygon network to existing app
   - Use: `https://polygon-mainnet.g.alchemy.com/v2/YOUR_POLYGON_API_KEY`

### Option 2: Infura

1. **Sign up for Infura**
   - Go to [infura.io](https://infura.io/)
   - Create a free account

2. **Create a New Project**
   - Dashboard → "Create a new project"
   - Choose Ethereum or Polygon

3. **Get Your API Key**
   - Format: `https://mainnet.infura.io/v3/YOUR_PROJECT_ID`
   - For Polygon: `https://polygon-mainnet.infura.io/v3/YOUR_PROJECT_ID`

### Option 3: Public RPC Endpoints (Limited)

For testing only (not recommended for production):

```bash
# Ethereum Mainnet
ETHEREUM_RPC_URL=https://cloudflare-eth.com

# Polygon Mainnet  
POLYGON_RPC_URL=https://polygon-rpc.com
```

## Getting a Wallet Private Key

⚠️ **WARNING**: Never use a wallet with significant funds for testing!

### Option 1: Create a New Wallet (Recommended for Testing)

1. **Using MetaMask**
   - Install MetaMask browser extension
   - Create a new wallet
   - Go to Account Details → Export Private Key
   - **IMPORTANT**: Store this securely and never share it

2. **Using Command Line**
   ```bash
   # Install ethers
   npm install -g ethers

   # Generate new wallet
   node -e "const { Wallet } = require('ethers'); console.log(new Wallet.createRandom().privateKey)"
   ```

### Option 2: Use Testnet Wallets

For testing purposes, use testnet versions:

```bash
# Testnet RPC URLs
ETHEREUM_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_SEPOLIA_KEY
POLYGON_RPC_URL=https://polygon-mumbai.g.alchemy.com/v2/YOUR_MUMBAI_KEY
```

## Setting Up Environment Variables

1. **Copy the example file:**
   ```bash
   cp .env.example .env.local
   ```

2. **Fill in your configuration:**
   ```bash
   # Replace with your actual API keys
   ETHEREUM_RPC_URL=https://eth-mainnet.alchemyapi.io/v2/your-actual-api-key-here
   POLYGON_RPC_URL=https://polygon-mainnet.g.alchemy.com/v2/your-actual-polygon-key
   
   # Replace with your wallet's private key
   PRIVATE_KEY=0xyour-private-key-here
   
   # Replace with your destination wallet address
   DESTINATION_WALLET=0xYourDestinationWalletAddressHere
   
   # Scan interval in milliseconds (30 seconds)
   SCAN_INTERVAL=30000
   
   # Token addresses (these are correct for mainnet)
   WETH_ADDRESS=0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2
   USDC_ADDRESS=0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48
   USDT_ADDRESS=0xdAC17F958D2ee523a2206206994597C13D831ec7
   
   # NFT contracts you want to monitor (optional)
   NFT_CONTRACT_ADDRESSES=["0xYourNFTContractAddress"]
   
   # Uniswap router address (correct for mainnet)
   UNISWAP_ROUTER_ADDRESS=0xE592427A0AEce92De3Edee1F18E0157C05861564
   
   # Slippage tolerance for swaps (2.5%)
   SLIPPAGE_TOLERANCE=2.5
   ```

## Funding Your Scanner Wallet

Your scanner wallet needs ETH for gas fees:

### For Mainnet:
1. Send a small amount of ETH (0.01-0.1 ETH) to your scanner wallet
2. This covers transaction fees for monitoring and transfers

### For Testnet:
1. Use faucet websites to get free test ETH:
   - **Sepolia**: https://sepoliafaucet.com/
   - **Mumbai**: https://mumbaifaucet.com/

## Testing the Setup

1. **Start your development server:**
   ```bash
   npm run dev
   ```

2. **Test the API:**
   ```bash
   # Check if scanner is running
   curl http://localhost:3000/api/wallet-scanner
   
   # Start the scanner (replace with real wallet addresses)
   curl -X POST http://localhost:3000/api/wallet-scanner \
     -H "Content-Type: application/json" \
     -d '{
       "action": "start",
       "wallets": [
         {
           "address": "0xYourTestWalletAddress",
           "chain": "ethereum"
         }
       ]
     }'
   ```

## Security Best Practices

1. **Never commit `.env.local` to version control**
   - It's already in `.gitignore`
   - Never share your private key

2. **Use separate wallets for testing and production**
   - Test with small amounts first
   - Never use your main wallet

3. **Monitor your logs**
   - Check `wallet-scanner.log` for activity
   - Monitor for any errors in `wallet-scanner-error.log`

4. **Start with testnets**
   - Test thoroughly on Sepolia or Mumbai first
   - Verify all functionality before using mainnet

## Troubleshooting

### Common Issues:

1. **"Invalid API Key"**
   - Double-check your Alchemy/Infura dashboard
   - Ensure you're using the correct network

2. **"Insufficient funds for gas"**
   - Fund your scanner wallet with more ETH
   - Check current gas prices

3. **"Network timeout"**
   - Check your internet connection
   - Try switching to a different RPC provider

4. **"Approval not detected"**
   - Ensure the wallet actually granted approval
   - Check that you're monitoring the correct wallet address

## Next Steps

1. Set up your API keys using the instructions above
2. Configure your `.env.local` file
3. Fund your scanner wallet with test ETH
4. Test the system thoroughly on testnet
5. Monitor the logs to ensure everything is working
6. Once confident, deploy to production with mainnet configuration

## Support

If you encounter issues:
1. Check the log files for detailed error messages
2. Verify your API keys are correct
3. Ensure your wallet has sufficient gas
4. Test with smaller amounts first

Remember: **Always test thoroughly before using with real funds!**