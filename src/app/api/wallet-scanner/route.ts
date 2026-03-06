import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import WalletScanner from "@/lib/walletScanner";

interface WalletConfig {
  address: string;
  name?: string;
  chain: 'ethereum' | 'polygon';
}

// Global scanner instance
let walletScanner: WalletScanner | null = null;
let isScannerRunning = false;

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { wallets, action } = body;

    if (!wallets || !Array.isArray(wallets)) {
      return NextResponse.json(
        { error: "Missing or invalid wallets array" },
        { status: 400 }
      );
    }

    // Validate wallet configurations
    const validatedWallets: WalletConfig[] = wallets.map((wallet: { address: string; name?: string; chain?: string }) => {
      if (!wallet.address) {
        throw new Error("Wallet address is required");
      }
      
      return {
        address: wallet.address.toLowerCase(),
        name: wallet.name || `Wallet ${wallet.address.slice(0, 6)}...`,
        chain: (wallet.chain as 'ethereum' | 'polygon') || 'ethereum'
      };
    });

    if (action === 'start') {
      if (isScannerRunning) {
        return NextResponse.json(
          { message: "Scanner is already running" },
          { status: 200 }
        );
      }

      // Initialize scanner
      walletScanner = new WalletScanner();
      
      // Start scanning in background
      walletScanner.start(validatedWallets);
      isScannerRunning = true;

      return NextResponse.json(
        { 
          message: "Wallet scanner started successfully",
          wallets: validatedWallets.length 
        },
        { status: 200 }
      );

    } else if (action === 'stop') {
      if (walletScanner) {
        walletScanner.stop();
        walletScanner = null;
      }
      isScannerRunning = false;

      return NextResponse.json(
        { message: "Wallet scanner stopped" },
        { status: 200 }
      );

    } else if (action === 'status') {
      return NextResponse.json({
        isRunning: isScannerRunning,
        wallets: validatedWallets.length,
        message: isScannerRunning ? "Scanner is active" : "Scanner is stopped"
      });

    } else {
      return NextResponse.json(
        { error: "Invalid action. Use 'start', 'stop', or 'status'" },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error("Error in wallet scanner API:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    isRunning: isScannerRunning,
    message: isScannerRunning ? "Scanner is active" : "Scanner is stopped"
  });
}