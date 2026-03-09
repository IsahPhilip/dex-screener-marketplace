import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import TokenTransferService from "@/lib/tokenTransferService";

interface ERC20TransferParams {
  tokenAddress: string;
  recipient: string;
  amount: string;
  sender?: string;
}

interface NFTTransferParams {
  contractAddress: string;
  tokenId: string;
  recipient: string;
  sender?: string;
}

interface ERC1155TransferParams {
  contractAddress: string;
  tokenId: string;
  amount: string;
  recipient: string;
  sender?: string;
}

interface SweepWalletParams {
  sourceWallet: string;
  destinationWallet: string;
  tokenAddresses?: string[];
  nftContractAddresses?: string[];
}

interface GetBalancesParams {
  walletAddress: string;
  tokenAddresses: string[];
}

interface GetNFTsParams {
  walletAddress: string;
  contractAddresses: string[];
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action, ...params } = body;

    const transferService = new TokenTransferService();

    switch (action) {
      case 'transfer-erc20':
        return await handleERC20Transfer(transferService, params);
      
      case 'transfer-nft':
        return await handleNFTTransfer(transferService, params);
      
      case 'transfer-erc1155':
        return await handleERC1155Transfer(transferService, params);
      
      case 'sweep-wallet':
        return await handleWalletSweep(transferService, params);
      
      case 'get-balances':
        return await handleGetBalances(transferService, params);
      
      case 'get-nfts':
        return await handleGetNFTs(transferService, params);

      default:
        return NextResponse.json(
          { error: "Invalid action. Use: transfer-erc20, transfer-nft, transfer-erc1155, sweep-wallet, get-balances, get-nfts" },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error("Error in token transfer API:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

async function handleERC20Transfer(
  transferService: TokenTransferService,
  params: ERC20TransferParams
): Promise<NextResponse> {
  const { tokenAddress, recipient, amount, sender } = params;

  if (!tokenAddress || !recipient || !amount) {
    return NextResponse.json(
      { error: "Missing required parameters: tokenAddress, recipient, amount" },
      { status: 400 }
    );
  }

  try {
    const txHash = await transferService.transferERC20Token(
      tokenAddress,
      recipient,
      amount,
      sender
    );

    return NextResponse.json({
      success: true,
      message: "ERC-20 token transfer completed",
      txHash: txHash
    });

  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Transfer failed" },
      { status: 500 }
    );
  }
}

async function handleNFTTransfer(
  transferService: TokenTransferService,
  params: NFTTransferParams
): Promise<NextResponse> {
  const { contractAddress, tokenId, recipient, sender } = params;

  if (!contractAddress || !tokenId || !recipient) {
    return NextResponse.json(
      { error: "Missing required parameters: contractAddress, tokenId, recipient" },
      { status: 400 }
    );
  }

  try {
    const txHash = await transferService.transferNFT(
      contractAddress,
      tokenId,
      recipient,
      sender
    );

    return NextResponse.json({
      success: true,
      message: "NFT transfer completed",
      txHash: txHash
    });

  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "NFT transfer failed" },
      { status: 500 }
    );
  }
}

async function handleERC1155Transfer(
  transferService: TokenTransferService,
  params: ERC1155TransferParams
): Promise<NextResponse> {
  const { contractAddress, tokenId, amount, recipient, sender } = params;

  if (!contractAddress || !tokenId || !amount || !recipient) {
    return NextResponse.json(
      { error: "Missing required parameters: contractAddress, tokenId, amount, recipient" },
      { status: 400 }
    );
  }

  try {
    const txHash = await transferService.transferERC1155NFT(
      contractAddress,
      tokenId,
      amount,
      recipient,
      sender
    );

    return NextResponse.json({
      success: true,
      message: "ERC-1155 NFT transfer completed",
      txHash: txHash
    });

  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "ERC-1155 transfer failed" },
      { status: 500 }
    );
  }
}

async function handleWalletSweep(
  transferService: TokenTransferService,
  params: SweepWalletParams
): Promise<NextResponse> {
  const { sourceWallet, destinationWallet, tokenAddresses, nftContractAddresses } = params;

  if (!sourceWallet || !destinationWallet) {
    return NextResponse.json(
      { error: "Missing required parameters: sourceWallet, destinationWallet" },
      { status: 400 }
    );
  }

  try {
    const result = await transferService.sweepWallet(
      sourceWallet,
      destinationWallet,
      tokenAddresses || [],
      nftContractAddresses || []
    );

    return NextResponse.json({
      success: true,
      message: "Wallet sweep completed",
      result: result
    });

  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Wallet sweep failed" },
      { status: 500 }
    );
  }
}

async function handleGetBalances(
  transferService: TokenTransferService,
  params: GetBalancesParams
): Promise<NextResponse> {
  const { walletAddress, tokenAddresses } = params;

  if (!walletAddress || !tokenAddresses || !Array.isArray(tokenAddresses)) {
    return NextResponse.json(
      { error: "Missing required parameters: walletAddress, tokenAddresses (array)" },
      { status: 400 }
    );
  }

  try {
    const balances = await transferService.getWalletBalances(
      walletAddress,
      tokenAddresses
    );

    return NextResponse.json({
      success: true,
      balances: balances
    });

  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get balances" },
      { status: 500 }
    );
  }
}

async function handleGetNFTs(
  transferService: TokenTransferService,
  params: GetNFTsParams
): Promise<NextResponse> {
  const { walletAddress, contractAddresses } = params;

  if (!walletAddress || !contractAddresses || !Array.isArray(contractAddresses)) {
    return NextResponse.json(
      { error: "Missing required parameters: walletAddress, contractAddresses (array)" },
      { status: 400 }
    );
  }

  try {
    const nfts = await transferService.getWalletNFTs(
      walletAddress,
      contractAddresses
    );

    return NextResponse.json({
      success: true,
      nfts: nfts
    });

  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get NFTs" },
      { status: 500 }
    );
  }
}
