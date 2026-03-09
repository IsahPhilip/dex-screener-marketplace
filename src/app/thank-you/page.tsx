import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";

export default async function ThankYouPage({
  searchParams,
}: {
  searchParams: Promise<{
    orderId?: string;
    walletConnected?: string;
    wallet?: string;
    address?: string;
    approved?: string;
    txHash?: string;
  }>;
}) {
  const params = await searchParams;
  const orderId = params.orderId;
  const walletConnected = params.walletConnected === "true";
  const wallet = params.wallet;
  const address = params.address;
  const approved = params.approved === "true";
  const txHash = params.txHash;

  return (
    <main className="min-h-screen bg-hero-gradient px-4 py-14">
      <div className="mx-auto w-full max-w-2xl">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Enhanced Token Info", href: "/" },
            { label: "Thank You" },
          ]}
        />
      </div>
      <section className="mx-auto w-full max-w-2xl rounded-xl border border-white/10 bg-black/40 p-8 text-center backdrop-blur">
        <h1 className="font-serif text-4xl font-semibold text-white">Thank You</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          {orderId
            ? `Thank you for your order #${orderId}`
            : "Thank you for your order."}
        </p>
        {walletConnected ? (
          <p className="mt-3 text-sm text-emerald-300">
            Wallet connected: {wallet}
            {address ? ` (${address})` : ""}
          </p>
        ) : null}
        {approved ? (
          <p className="mt-2 text-xs break-all text-emerald-300">
            Transaction approved{txHash ? ` • ${txHash}` : ""}
          </p>
        ) : null}
        <p className="mt-8 text-white">Please choose a payment method:</p>

        <Link
          href={{
            pathname: "/connect-wallet",
            query: orderId ? { orderId } : {},
          }}
          className="mt-4 inline-flex rounded-md bg-gradient-to-r from-sky-500 to-indigo-500 px-5 py-3 text-sm font-semibold text-white transition hover:from-sky-600 hover:to-indigo-600"
        >
          Pay with crypto
        </Link>

        <div>
          <Link
            href="/"
            className="mt-8 inline-flex rounded-md border border-white/20 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10"
          >
            Go back to Home Page
          </Link>
        </div>
      </section>
    </main>
  );
}
