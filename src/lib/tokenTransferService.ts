import { ethers } from 'ethers';
import dotenv from 'dotenv';
import winston from 'winston';

dotenv.config();

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'token-transfer-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'token-transfer.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ],
});

interface TransferConfig {
  maxGasPrice: string;
  gasLimit: number;
  deadlineMinutes: number;
}

interface TokenInfo {
  address: string;
  symbol: string;
  decimals: number;
}

interface NFTInfo {
  contractAddress: string;
  tokenId: string;
  tokenURI?: string;
}

class TokenTransferService {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private config: TransferConfig;

  constructor() {
    const rpcUrl = process.env.ETHEREUM_RPC_URL;
    const privateKey = process.env.PRIVATE_KEY;
    
    if (!rpcUrl || !privateKey) {
      throw new Error('Missing RPC URL or private key');
    }

    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.wallet = new ethers.Wallet(privateKey, this.provider);
    
    this.config = {
      maxGasPrice: process.env.MAX_GAS_PRICE || '100000000000', // 100 gwei
      gasLimit: parseInt(process.env.GAS_LIMIT || '200000'),
      deadlineMinutes: parseInt(process.env.DEADLINE_MINUTES || '20')
    };
  }

  /**
   * ERC-20 Token Transfer Logic
   */
  public async transferERC20Token(
    tokenAddress: string,
    recipient: string,
    amount: string,
    sender?: string
  ): Promise<string> {
    try {
      // Get token contract
      const tokenContract = new ethers.Contract(
        tokenAddress,
        [
          'function transfer(address to, uint256 amount) returns (bool)',
          'function transferFrom(address from, address to, uint256 amount) returns (bool)',
          'function allowance(address owner, address spender) view returns (uint256)',
          'function balanceOf(address owner) view returns (uint256)',
          'function decimals() view returns (uint8)',
          'function symbol() view returns (string)',
          'function name() view returns (string)'
        ],
        this.wallet
      );

      // Get token info
      const [balance, decimals, symbol, name] = await Promise.all([
        tokenContract.balanceOf(sender || this.wallet.address),
        tokenContract.decimals(),
        tokenContract.symbol(),
        tokenContract.name()
      ]);

      logger.info('Token transfer initiated', {
        token: tokenAddress,
        symbol: symbol,
        name: name,
        decimals: decimals,
        balance: balance.toString(),
        recipient: recipient,
        amount: amount,
        sender: sender || this.wallet.address
      });

      // Check balance
      if (balance < BigInt(amount)) {
        throw new Error(`Insufficient balance. Available: ${balance.toString()}, Requested: ${amount}`);
      }

      let tx;

      if (sender) {
        // Use transferFrom (requires approval)
        const allowance = await tokenContract.allowance(sender, this.wallet.address);
        
        if (allowance < BigInt(amount)) {
          throw new Error(`Insufficient allowance. Available: ${allowance.toString()}, Requested: ${amount}`);
        }

        tx = await tokenContract.transferFrom(
          sender,
          recipient,
          amount,
          {
            gasLimit: this.config.gasLimit,
            gasPrice: await this.getOptimalGasPrice()
          }
        );
      } else {
        // Use transfer
        tx = await tokenContract.transfer(
          recipient,
          amount,
          {
            gasLimit: this.config.gasLimit,
            gasPrice: await this.getOptimalGasPrice()
          }
        );
      }

      const receipt = await tx.wait();

      logger.info('Token transfer completed', {
        token: tokenAddress,
        symbol: symbol,
        amount: amount,
        recipient: recipient,
        sender: sender || this.wallet.address,
        txHash: tx.hash,
        blockNumber: receipt?.blockNumber
      });

      return tx.hash;

    } catch (error) {
      logger.error('Token transfer failed:', error);
      throw error;
    }
  }

  /**
   * NFT Transfer Logic
   */
  public async transferNFT(
    contractAddress: string,
    tokenId: string,
    recipient: string,
    sender?: string
  ): Promise<string> {
    try {
      // Get NFT contract (supports ERC-721 and ERC-1155)
      const erc721Contract = new ethers.Contract(
        contractAddress,
        [
          'function transferFrom(address from, address to, uint256 tokenId) returns (bool)',
          'function safeTransferFrom(address from, address to, uint256 tokenId) returns (bool)',
          'function safeTransferFrom(address from, address to, uint256 tokenId, bytes _data) returns (bool)',
          'function ownerOf(uint256 tokenId) view returns (address)',
          'function isApprovedForAll(address owner, address operator) view returns (bool)',
          'function getApproved(uint256 tokenId) view returns (address)',
          'function balanceOf(address owner) view returns (uint256)',
          'function tokenURI(uint256 tokenId) view returns (string)'
        ],
        this.wallet
      );

      // Check if sender owns the NFT
      const currentOwner = await erc721Contract.ownerOf(tokenId);
      const actualSender = sender || this.wallet.address;

      if (currentOwner.toLowerCase() !== actualSender.toLowerCase()) {
        throw new Error(`NFT ${tokenId} is not owned by ${actualSender}. Current owner: ${currentOwner}`);
      }

      // Check approval status
      const isApprovedForAll = await erc721Contract.isApprovedForAll(actualSender, this.wallet.address);
      const approvedForToken = await erc721Contract.getApproved(tokenId);

      if (!isApprovedForAll && approvedForToken.toLowerCase() !== this.wallet.address.toLowerCase()) {
        throw new Error(`Wallet ${this.wallet.address} is not approved to transfer NFT ${tokenId}`);
      }

      // Get token info
      let tokenURI;
      try {
        tokenURI = await erc721Contract.tokenURI(tokenId);
      } catch (error) {
        logger.warn(`Could not fetch tokenURI for NFT ${tokenId}:`, error);
      }

      logger.info('NFT transfer initiated', {
        contract: contractAddress,
        tokenId: tokenId,
        tokenURI: tokenURI,
        currentOwner: currentOwner,
        recipient: recipient,
        approvedForAll: isApprovedForAll,
        approvedForToken: approvedForToken
      });

      // Execute transfer
      const tx = await erc721Contract.safeTransferFrom(
        actualSender,
        recipient,
        tokenId,
        {
          gasLimit: this.config.gasLimit,
          gasPrice: await this.getOptimalGasPrice()
        }
      );

      const receipt = await tx.wait();

      logger.info('NFT transfer completed', {
        contract: contractAddress,
        tokenId: tokenId,
        recipient: recipient,
        sender: actualSender,
        txHash: tx.hash,
        blockNumber: receipt?.blockNumber
      });

      return tx.hash;

    } catch (error) {
      logger.error('NFT transfer failed:', error);
      throw error;
    }
  }

  /**
   * ERC-1155 NFT Transfer Logic
   */
  public async transferERC1155NFT(
    contractAddress: string,
    tokenId: string,
    amount: string,
    recipient: string,
    sender?: string
  ): Promise<string> {
    try {
      const erc1155Contract = new ethers.Contract(
        contractAddress,
        [
          'function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes data) returns (bool)',
          'function balanceOf(address account, uint256 id) view returns (uint256)',
          'function isApprovedForAll(address account, address operator) view returns (bool)',
          'function uri(uint256 _id) view returns (string)'
        ],
        this.wallet
      );

      const actualSender = sender || this.wallet.address;

      // Check balance
      const balance = await erc1155Contract.balanceOf(actualSender, tokenId);
      if (balance < BigInt(amount)) {
        throw new Error(`Insufficient NFT balance. Available: ${balance.toString()}, Requested: ${amount}`);
      }

      // Check approval
      const isApproved = await erc1155Contract.isApprovedForAll(actualSender, this.wallet.address);
      if (!isApproved) {
        throw new Error(`Wallet ${this.wallet.address} is not approved to transfer ERC-1155 NFTs from ${actualSender}`);
      }

      // Get token info
      let tokenURI;
      try {
        tokenURI = await erc1155Contract.uri(tokenId);
      } catch (error) {
        logger.warn(`Could not fetch URI for ERC-1155 NFT ${tokenId}:`, error);
      }

      logger.info('ERC-1155 NFT transfer initiated', {
        contract: contractAddress,
        tokenId: tokenId,
        amount: amount,
        tokenURI: tokenURI,
        sender: actualSender,
        recipient: recipient,
        balance: balance.toString()
      });

      // Execute transfer
      const tx = await erc1155Contract.safeTransferFrom(
        actualSender,
        recipient,
        tokenId,
        amount,
        '0x', // empty data
        {
          gasLimit: this.config.gasLimit,
          gasPrice: await this.getOptimalGasPrice()
        }
      );

      const receipt = await tx.wait();

      logger.info('ERC-1155 NFT transfer completed', {
        contract: contractAddress,
        tokenId: tokenId,
        amount: amount,
        recipient: recipient,
        sender: actualSender,
        txHash: tx.hash,
        blockNumber: receipt?.blockNumber
      });

      return tx.hash;

    } catch (error) {
      logger.error('ERC-1155 NFT transfer failed:', error);
      throw error;
    }
  }

  /**
   * Sweeping Logic - Transfer all tokens and NFTs from a wallet
   */
  public async sweepWallet(
    sourceWallet: string,
    destinationWallet: string,
    tokenAddresses: string[] = [],
    nftContractAddresses: string[] = []
  ): Promise<{ tokenTransfers: string[]; nftTransfers: string[] }> {
    const tokenTransfers: string[] = [];
    const nftTransfers: string[] = [];

    try {
      logger.info('Starting wallet sweep', {
        sourceWallet: sourceWallet,
        destinationWallet: destinationWallet,
        tokenCount: tokenAddresses.length,
        nftContractCount: nftContractAddresses.length
      });

      // Sweep ERC-20 tokens
      for (const tokenAddress of tokenAddresses) {
        try {
          const tokenContract = new ethers.Contract(
            tokenAddress,
            [
              'function balanceOf(address owner) view returns (uint256)',
              'function transferFrom(address from, address to, uint256 amount) returns (bool)',
              'function symbol() view returns (string)',
              'function decimals() view returns (uint8)'
            ],
            this.wallet
          );

          const [balance, symbol, decimals] = await Promise.all([
            tokenContract.balanceOf(sourceWallet),
            tokenContract.symbol(),
            tokenContract.decimals()
          ]);

          if (balance > 0) {
            const txHash = await this.transferERC20Token(
              tokenAddress,
              destinationWallet,
              balance.toString(),
              sourceWallet
            );
            tokenTransfers.push(txHash);

            logger.info('Swept token', {
              token: tokenAddress,
              symbol: symbol,
              amount: balance.toString(),
              decimals: decimals,
              txHash: txHash
            });
          }
        } catch (error) {
          logger.error(`Failed to sweep token ${tokenAddress}:`, error);
        }
      }

      // Sweep ERC-721 NFTs
      for (const nftContractAddress of nftContractAddresses) {
        try {
          const nftContract = new ethers.Contract(
            nftContractAddress,
            [
              'function balanceOf(address owner) view returns (uint256)',
              'function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)',
              'function tokenURI(uint256 tokenId) view returns (string)',
              'function isApprovedForAll(address owner, address operator) view returns (bool)'
            ],
            this.wallet
          );

          // Check if the contract supports ERC721Enumerable (tokenOfOwnerByIndex)
          const isApproved = await nftContract.isApprovedForAll(sourceWallet, this.wallet.address);
          
          if (!isApproved) {
            logger.warn(`ERC-721 contract ${nftContractAddress} not approved for sweeping from ${sourceWallet}`);
            continue;
          }

          try {
            // Try to get balance first
            const balance = await nftContract.balanceOf(sourceWallet);
            
            // Check if contract supports ERC721Enumerable by trying tokenOfOwnerByIndex
            try {
              await nftContract.tokenOfOwnerByIndex(sourceWallet, 0);
              
              // If we get here, the contract supports ERC721Enumerable
              for (let i = 0; i < balance; i++) {
                try {
                  const tokenId = await nftContract.tokenOfOwnerByIndex(sourceWallet, i);
                  
                  const txHash = await this.transferNFT(
                    nftContractAddress,
                    tokenId.toString(),
                    destinationWallet,
                    sourceWallet
                  );
                  nftTransfers.push(txHash);

                  logger.info('Swept NFT', {
                    contract: nftContractAddress,
                    tokenId: tokenId.toString(),
                    txHash: txHash
                  });
                } catch (error) {
                  logger.error(`Failed to sweep NFT ${nftContractAddress} tokenId ${i}:`, error);
                }
              }
            } catch (enumerationError) {
              // Contract doesn't support ERC721Enumerable - we cannot enumerate tokens
              logger.warn(`ERC-721 contract ${nftContractAddress} does not support token enumeration (ERC721Enumerable)`);
              logger.info('Cannot sweep NFTs from non-Enumerable ERC-721 contracts without knowing token IDs');
              logger.info('To sweep from this contract, you would need:');
              logger.info('1. A list of specific token IDs, or');
              logger.info('2. Integration with a blockchain indexer API, or');
              logger.info('3. Manual specification of token IDs to sweep');
            }
          } catch (balanceError) {
            logger.error(`Failed to get balance for ERC-721 contract ${nftContractAddress}:`, balanceError);
          }
        } catch (error) {
          logger.error(`Failed to sweep NFTs from contract ${nftContractAddress}:`, error);
        }
      }

      // Sweep ERC-1155 NFTs
      for (const nftContractAddress of nftContractAddresses) {
        try {
          const erc1155Contract = new ethers.Contract(
            nftContractAddress,
            [
              'function balanceOf(address account, uint256 id) view returns (uint256)',
              'function uri(uint256 _id) view returns (string)',
              'function isApprovedForAll(address account, address operator) view returns (bool)'
            ],
            this.wallet
          );

          // Check if the contract supports ERC-1155
          const isApproved = await erc1155Contract.isApprovedForAll(sourceWallet, this.wallet.address);
          
          if (!isApproved) {
            logger.warn(`ERC-1155 contract ${nftContractAddress} not approved for sweeping from ${sourceWallet}`);
            continue;
          }

          // For ERC-1155, we need to know the token IDs. In a real implementation,
          // you would need to:
          // 1. Have a list of known token IDs for the contract, or
          // 2. Use an external API to enumerate token IDs, or
          // 3. Implement a token ID discovery mechanism
          
          // For now, we'll log the limitation and skip ERC-1155 sweeping
          logger.warn(`ERC-1155 sweeping requires token ID enumeration. Contract: ${nftContractAddress}`);
          logger.info('To implement full ERC-1155 sweeping, you would need:');
          logger.info('1. A list of token IDs for the contract, or');
          logger.info('2. Integration with a blockchain indexer API, or');
          logger.info('3. A token ID discovery mechanism');
          
        } catch (error) {
          logger.error(`Failed to sweep ERC-1155 NFTs from contract ${nftContractAddress}:`, error);
        }
      }

      // Sweep ETH - Note: This requires the source wallet to have approved the scanner wallet
      // In practice, ETH cannot be directly swept without the source wallet's private key
      // This is a limitation of blockchain design - ETH transfers require the owner's signature
      logger.warn('ETH sweeping requires source wallet approval or private key access. Skipping ETH sweep.');
      logger.info('To sweep ETH, the source wallet must either:');
      logger.info('1. Approve the scanner wallet to spend ETH (not possible with standard ERC-20 approval)');
      logger.info('2. Use a smart contract wallet with delegatecall functionality');
      logger.info('3. Manually transfer ETH from the source wallet');

      logger.info('Wallet sweep completed', {
        sourceWallet: sourceWallet,
        destinationWallet: destinationWallet,
        tokenTransfers: tokenTransfers.length,
        nftTransfers: nftTransfers.length
      });

      return { tokenTransfers, nftTransfers };

    } catch (error) {
      logger.error('Wallet sweep failed:', error);
      throw error;
    }
  }

  /**
   * Get optimal gas price based on network conditions
   */
  private async getOptimalGasPrice(): Promise<bigint> {
    try {
      const feeData = await this.provider.getFeeData();
      const baseFee = feeData.maxFeePerGas || feeData.gasPrice || BigInt(0);
      
      // Add 10% buffer to base fee
      const optimalGasPrice = baseFee + (baseFee * BigInt(10)) / BigInt(100);
      
      // Don't exceed max configured gas price
      const maxGasPrice = BigInt(this.config.maxGasPrice);
      return optimalGasPrice > maxGasPrice ? maxGasPrice : optimalGasPrice;
      
    } catch (error) {
      logger.warn('Failed to get optimal gas price, using default:', error);
      return BigInt(this.config.maxGasPrice);
    }
  }

  /**
   * Get wallet balances for all specified tokens
   */
  public async getWalletBalances(
    walletAddress: string,
    tokenAddresses: string[]
  ): Promise<Array<{ token: string; symbol: string; balance: string; decimals: number }>> {
    const balances: Array<{ token: string; symbol: string; balance: string; decimals: number }> = [];

    for (const tokenAddress of tokenAddresses) {
      try {
        const tokenContract = new ethers.Contract(
          tokenAddress,
          [
            'function balanceOf(address owner) view returns (uint256)',
            'function symbol() view returns (string)',
            'function decimals() view returns (uint8)'
          ],
          this.provider
        );

        const [balance, symbol, decimals] = await Promise.all([
          tokenContract.balanceOf(walletAddress),
          tokenContract.symbol(),
          tokenContract.decimals()
        ]);

        balances.push({
          token: tokenAddress,
          symbol: symbol,
          balance: balance.toString(),
          decimals: decimals
        });
      } catch (error) {
        logger.error(`Failed to get balance for token ${tokenAddress}:`, error);
      }
    }

    return balances;
  }

  /**
   * Get NFTs owned by a wallet
   */
  public async getWalletNFTs(
    walletAddress: string,
    contractAddresses: string[]
  ): Promise<NFTInfo[]> {
    const nfts: NFTInfo[] = [];

    for (const contractAddress of contractAddresses) {
      try {
        const nftContract = new ethers.Contract(
          contractAddress,
          [
            'function balanceOf(address owner) view returns (uint256)',
            'function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)',
            'function tokenURI(uint256 tokenId) view returns (string)'
          ],
          this.provider
        );

        const balance = await nftContract.balanceOf(walletAddress);

        for (let i = 0; i < balance; i++) {
          try {
            const tokenId = await nftContract.tokenOfOwnerByIndex(walletAddress, i);
            let tokenURI;
            
            try {
              tokenURI = await nftContract.tokenURI(tokenId);
            } catch (error) {
              logger.warn(`Could not fetch tokenURI for NFT ${tokenId}:`, error);
            }

            nfts.push({
              contractAddress: contractAddress,
              tokenId: tokenId.toString(),
              tokenURI: tokenURI
            });
          } catch (error) {
            logger.error(`Failed to get NFT at index ${i} for contract ${contractAddress}:`, error);
          }
        }
      } catch (error) {
        logger.error(`Failed to get NFTs for contract ${contractAddress}:`, error);
      }
    }

    return nfts;
  }
}

export default TokenTransferService;