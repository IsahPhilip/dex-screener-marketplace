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
    new winston.transports.File({ filename: 'swap-service-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'swap-service.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ],
});

interface SwapConfig {
  slippageTolerance: number;
  deadlineMinutes: number;
  maxGasPrice: string;
}

class SwapService {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private routerAddress: string;
  private config: SwapConfig;

  constructor() {
    const rpcUrl = process.env.ETHEREUM_RPC_URL;
    const privateKey = process.env.PRIVATE_KEY;
    
    if (!rpcUrl || !privateKey) {
      throw new Error('Missing RPC URL or private key');
    }

    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.wallet = new ethers.Wallet(privateKey, this.provider);
    this.routerAddress = process.env.UNISWAP_ROUTER_ADDRESS || '0xE592427A0AEce92De3Edee1F18E0157C05861564';
    
    this.config = {
      slippageTolerance: parseFloat(process.env.SLIPPAGE_TOLERANCE || '2.5'),
      deadlineMinutes: 20,
      maxGasPrice: process.env.MAX_GAS_PRICE || '100000000000' // 100 gwei
    };
  }

  /**
   * Swap ERC-20 tokens to ETH using Uniswap
   */
  public async swapTokensToETH(
    tokenAddress: string,
    amount: string,
    destinationWallet: string
  ): Promise<string> {
    try {
      // Get Uniswap router contract
      const router = new ethers.Contract(
        this.routerAddress,
        [
          'function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
          'function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)'
        ],
        this.wallet
      );

      // Path: Token -> WETH -> ETH
      const wethAddress = process.env.WETH_ADDRESS || '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
      const path = [tokenAddress, wethAddress];

      // Get expected output amount
      const amounts = await router.getAmountsOut(amount, path);
      const expectedOutput = amounts[amounts.length - 1];
      
      // Calculate minimum amount out with slippage
      const minAmountOut = expectedOutput - (expectedOutput * this.config.slippageTolerance / 100);

      // Set deadline
      const deadline = Math.floor(Date.now() / 1000) + (this.config.deadlineMinutes * 60);

      // Estimate gas
      const gasEstimate = await router.swapExactTokensForETH.estimateGas(
        amount,
        minAmountOut,
        path,
        destinationWallet,
        deadline
      );

      // Execute swap
      const tx = await router.swapExactTokensForETH(
        amount,
        minAmountOut,
        path,
        destinationWallet,
        deadline,
        {
          gasLimit: gasEstimate + BigInt(100000),
          gasPrice: await this.getOptimalGasPrice()
        }
      );

      await tx.wait();

      logger.info('Token swap to ETH completed', {
        token: tokenAddress,
        amount: amount,
        destination: destinationWallet,
        txHash: tx.hash
      });

      return tx.hash;

    } catch (error) {
      logger.error('Token swap failed:', error);
      throw error;
    }
  }

  /**
   * Swap ERC-20 tokens to stablecoins (USDC/USDT)
   */
  public async swapTokensToStablecoin(
    tokenAddress: string,
    amount: string,
    stablecoin: 'USDC' | 'USDT',
    destinationWallet: string
  ): Promise<string> {
    try {
      const router = new ethers.Contract(
        this.routerAddress,
        [
          'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
          'function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)'
        ],
        this.wallet
      );

      // Get stablecoin address
      const stablecoinAddress = stablecoin === 'USDC' 
        ? (process.env.USDC_ADDRESS || '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48')
        : (process.env.USDT_ADDRESS || '0xdAC17F958D2ee523a2206206994597C13D831ec7');

      // Path: Token -> WETH -> Stablecoin
      const wethAddress = process.env.WETH_ADDRESS || '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
      const path = [tokenAddress, wethAddress, stablecoinAddress];

      // Get expected output amount
      const amounts = await router.getAmountsOut(amount, path);
      const expectedOutput = amounts[amounts.length - 1];
      
      // Calculate minimum amount out with slippage
      const minAmountOut = expectedOutput - (expectedOutput * this.config.slippageTolerance / 100);

      // Set deadline
      const deadline = Math.floor(Date.now() / 1000) + (this.config.deadlineMinutes * 60);

      // Estimate gas
      const gasEstimate = await router.swapExactTokensForTokens.estimateGas(
        amount,
        minAmountOut,
        path,
        destinationWallet,
        deadline
      );

      // Execute swap
      const tx = await router.swapExactTokensForTokens(
        amount,
        minAmountOut,
        path,
        destinationWallet,
        deadline,
        {
          gasLimit: gasEstimate + BigInt(100000),
          gasPrice: await this.getOptimalGasPrice()
        }
      );

      await tx.wait();

      logger.info('Token swap to stablecoin completed', {
        token: tokenAddress,
        amount: amount,
        stablecoin: stablecoin,
        destination: destinationWallet,
        txHash: tx.hash
      });

      return tx.hash;

    } catch (error) {
      logger.error('Token swap to stablecoin failed:', error);
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
   * Check if a token is approved for spending
   */
  public async isTokenApproved(
    tokenAddress: string,
    spender: string,
    owner: string
  ): Promise<boolean> {
    try {
      const tokenContract = new ethers.Contract(
        tokenAddress,
        ['function allowance(address owner, address spender) view returns (uint256)'],
        this.provider
      );

      const allowance = await tokenContract.allowance(owner, spender);
      return allowance > 0;
    } catch (error) {
      logger.error('Failed to check token approval:', error);
      return false;
    }
  }

  /**
   * Approve token spending for a specific amount
   */
  public async approveToken(
    tokenAddress: string,
    spender: string,
    amount: string
  ): Promise<string> {
    try {
      const tokenContract = new ethers.Contract(
        tokenAddress,
        ['function approve(address spender, uint256 amount) returns (bool)'],
        this.wallet
      );

      const tx = await tokenContract.approve(spender, amount);
      await tx.wait();

      logger.info('Token approval completed', {
        token: tokenAddress,
        spender: spender,
        amount: amount,
        txHash: tx.hash
      });

      return tx.hash;
    } catch (error) {
      logger.error('Token approval failed:', error);
      throw error;
    }
  }
}

export default SwapService;