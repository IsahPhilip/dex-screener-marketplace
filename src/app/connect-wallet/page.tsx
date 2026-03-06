"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";

type WalletId = "metamask" | "walletconnect" | "coinbase" | "phantom";

type WalletOption = {
  id: WalletId;
  name: string;
  subtitle: string;
  accent: string;
};

const walletOptions: WalletOption[] = [
  {
    id: "metamask",
    name: "MetaMask",
    subtitle: "Browser extension wallet",
    accent: "from-orange-400 to-amber-500",
  },
  {
    id: "walletconnect",
    name: "WalletConnect",
    subtitle: "Connect with mobile wallets",
    accent: "from-blue-400 to-indigo-500",
  },
  {
    id: "coinbase",
    name: "Coinbase Wallet",
    subtitle: "Self-custody wallet by Coinbase",
    accent: "from-sky-400 to-blue-500",
  },
  {
    id: "phantom",
    name: "Phantom",
    subtitle: "Popular Solana wallet",
    accent: "from-fuchsia-400 to-violet-500",
  },
];

type Eip1193Provider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

declare global {
  interface Window {
    ethereum?: Eip1193Provider;
    phantom?: {
      solana?: {
        connect: () => Promise<{ publicKey?: { toString: () => string } }>;
      };
    };
  }
}

export default function ConnectWalletPage() {
  const [statusText, setStatusText] = useState("Select a wallet to continue.");
  const [connectedWallet, setConnectedWallet] = useState("");
  const [connectedAddress, setConnectedAddress] = useState("");
  const [pendingExternalWallet, setPendingExternalWallet] = useState("");
  const [isConnecting, setIsConnecting] = useState<WalletId | "">("");
  const [orderId, setOrderId] = useState("");
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setOrderId(params.get("orderId") ?? "");
  }, []);

  const redirectToThankYou = (wallet: string, address?: string) => {
    const next = new URLSearchParams();
    if (orderId) {
      next.set("orderId", orderId);
    }
    next.set("walletConnected", "true");
    next.set("wallet", wallet);
    if (address) {
      next.set("address", address);
    }
    router.push(`/thank-you?${next.toString()}`);
  };

  const connectMetaMask = async () => {
    if (!window.ethereum) {
      setStatusText("MetaMask is not installed. Opening installation page...");
      window.open("https://metamask.io/download/", "_blank", "noopener,noreferrer");
      return;
    }

    const accounts = (await window.ethereum.request({
      method: "eth_requestAccounts",
    })) as string[];

    if (accounts?.[0]) {
      setConnectedWallet("MetaMask");
      setConnectedAddress(accounts[0]);
      setStatusText("Wallet connected successfully.");
      redirectToThankYou("MetaMask", accounts[0]);
    } else {
      setStatusText("No wallet account returned.");
    }
  };

  const connectWalletConnect = async () => {
    setStatusText("Opening WalletConnect portal...");
    setPendingExternalWallet("WalletConnect");
    window.open("https://walletconnect.com/explorer", "_blank", "noopener,noreferrer");
  };

  const connectCoinbase = async () => {
    setStatusText("Opening Coinbase Wallet...");
    setPendingExternalWallet("Coinbase Wallet");
    window.open("https://www.coinbase.com/wallet", "_blank", "noopener,noreferrer");
  };

  const connectPhantom = async () => {
    if (window.phantom?.solana) {
      const result = await window.phantom.solana.connect();
      const pubkey = result.publicKey?.toString();

      if (pubkey) {
        setConnectedWallet("Phantom");
        setConnectedAddress(pubkey);
        setStatusText("Wallet connected successfully.");
        redirectToThankYou("Phantom", pubkey);
        return;
      }
    }

    setStatusText("Phantom is not installed. Opening installation page...");
    window.open("https://phantom.com/download", "_blank", "noopener,noreferrer");
  };

  const connectByWallet = async (wallet: WalletId) => {
    setIsConnecting(wallet);
    try {
      if (wallet === "metamask") {
        await connectMetaMask();
        return;
      }

      if (wallet === "walletconnect") {
        await connectWalletConnect();
        return;
      }

      if (wallet === "coinbase") {
        await connectCoinbase();
        return;
      }

      await connectPhantom();
    } catch {
      setStatusText("Connection failed. Please try again.");
    } finally {
      setIsConnecting("");
    }
  };

  return (
    <main className="min-h-screen bg-hero-gradient px-4 py-14">
      <div className="mx-auto w-full max-w-3xl">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Enhanced Token Info", href: "/" },
            { label: "Thank You", href: "/thank-you" },
            { label: "Connect Wallet" },
          ]}
        />
      </div>

      <section className="mx-auto w-full max-w-3xl overflow-hidden rounded-2xl border border-white/10 bg-black/40 shadow-2xl backdrop-blur">
        <div className="border-b border-white/10 px-6 py-6 md:px-8">
          <p className="text-sm uppercase tracking-[0.2em] text-white/50">Payment</p>
          <h1 className="mt-2 font-serif text-3xl font-semibold text-white md:text-4xl">
            Connect your wallet
          </h1>
          <p className="mt-3 text-sm text-muted-foreground md:text-base">
            Choose a wallet provider to authorize payment for your order.
          </p>
        </div>

        <div className="grid gap-4 p-6 md:grid-cols-2 md:p-8">
          {walletOptions.map((wallet) => (
            <button
              key={wallet.id}
              type="button"
              onClick={() => connectByWallet(wallet.id)}
              disabled={isConnecting === wallet.id}
              className="group rounded-xl border border-white/15 bg-black/30 p-4 text-left transition hover:border-white/35 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <div
                className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br ${wallet.accent} text-sm font-semibold text-white`}
              >
                {wallet.name[0]}
              </div>
              <p className="text-base font-semibold text-white">
                Connect with {wallet.name}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{wallet.subtitle}</p>
            </button>
          ))}
        </div>

        <div className="border-t border-white/10 bg-black/30 px-6 py-5 md:px-8">
          <p className="text-sm text-white/80">{statusText}</p>
          {connectedWallet && connectedAddress ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Connected: {connectedWallet} • {connectedAddress}
            </p>
          ) : null}
          {pendingExternalWallet ? (
            <button
              type="button"
              onClick={() => redirectToThankYou(pendingExternalWallet)}
              className="mt-3 inline-flex rounded-md bg-gradient-to-r from-sky-500 to-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:from-sky-600 hover:to-indigo-600"
            >
              I have connected {pendingExternalWallet}
            </button>
          ) : null}

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href={orderId ? `/thank-you?orderId=${orderId}` : "/thank-you"}
              className="inline-flex rounded-md border border-white/20 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10"
            >
              Back to payment methods
            </Link>
            <Link
              href="/"
              className="inline-flex rounded-md border border-white/20 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10"
            >
              Go back to Home Page
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
