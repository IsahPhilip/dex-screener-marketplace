"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useState } from "react";
import { useSession } from "next-auth/react";
import Breadcrumbs from "@/components/Breadcrumbs";

const linkTypes = [
  "Add Website",
  "Add Docs",
  "Add X",
  "Add Telegram",
  "Add Discord",
  "Add Tiktok",
  "Add Instagram",
  "Add Reddit",
  "Add Farcaster",
];

const burnAddresses = [
  "0x0000000000000000000000000000000000000000",
  "0x0000000000000000000000000000000000000001",
  "0x000000000000000000000000000000000000dead",
  "0xdead000000000000000000000000000000000000",
];

type ProjectLink = {
  id: number;
  type: string;
  url: string;
};

function Input({
  name,
  placeholder,
  value,
}: {
  name: string;
  placeholder: string;
  value?: string;
}) {
  return (
    <input
      type="text"
      name={name}
      defaultValue={value}
      placeholder={placeholder}
      className="mt-2 w-full rounded-md border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none placeholder:text-white/35 focus:border-white/30"
    />
  );
}

function UploadCard({
  title,
  ratioText,
  minWidthText,
  inputId,
  onFileChange,
  selectedFile,
}: {
  title: string;
  ratioText: string;
  minWidthText: string;
  inputId: string;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  selectedFile: string;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/25 p-4">
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{ratioText}</p>
      <p className="text-sm text-muted-foreground">{minWidthText}</p>
      <p className="text-sm text-muted-foreground">
        support formats: png, jpg, webp and gif
      </p>
      <p className="text-sm text-muted-foreground">max. file size: 4.5MB</p>
      {selectedFile ? (
        <p className="mt-2 text-sm text-white/80">Selected: {selectedFile}</p>
      ) : null}
      <input
        id={inputId}
        type="file"
        accept=".png,.jpg,.jpeg,.webp,.gif"
        className="hidden"
        onChange={onFileChange}
      />
      <label
        htmlFor={inputId}
        className="mt-4 inline-flex rounded-md border border-white/20 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10"
      >
        Upload image
      </label>
    </div>
  );
}

export default function OrderPage() {
  const { status } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [links, setLinks] = useState<ProjectLink[]>([]);
  const [lockedAddresses, setLockedAddresses] = useState<string[]>([]);
  const [iconFileName, setIconFileName] = useState("");
  const [headerFileName, setHeaderFileName] = useState("");
  const router = useRouter();

  const addLink = (type: string) => {
    setLinks((prev) => [
      ...prev,
      { id: Date.now() + Math.floor(Math.random() * 1000), type, url: "" },
    ]);
  };

  const updateLink = (id: number, url: string) => {
    setLinks((prev) =>
      prev.map((link) => (link.id === id ? { ...link, url } : link)),
    );
  };

  const removeLink = (id: number) => {
    setLinks((prev) => prev.filter((link) => link.id !== id));
  };

  const addLockedAddress = () => {
    setLockedAddresses((prev) => [...prev, ""]);
  };

  const updateLockedAddress = (index: number, value: string) => {
    setLockedAddresses((prev) =>
      prev.map((address, i) => (i === index ? value : address)),
    );
  };

  const removeLockedAddress = (index: number) => {
    setLockedAddresses((prev) => prev.filter((_, i) => i !== index));
  };

  const handleIconChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setIconFileName(file?.name ?? "");
  };

  const handleHeaderChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setHeaderFileName(file?.name ?? "");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError("");
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const payload = {
      chain: String(formData.get("chain") ?? ""),
      tokenAddress: String(formData.get("tokenAddress") ?? ""),
      tokenName: String(formData.get("tokenName") ?? ""),
      tokenSymbol: String(formData.get("tokenSymbol") ?? ""),
      description: String(formData.get("description") ?? ""),
      paymentMethod: String(formData.get("paymentMethod") ?? ""),
      links: links.filter((link) => link.url.trim().length > 0),
      lockedAddresses: lockedAddresses.filter(
        (address) => address.trim().length > 0,
      ),
      iconFileName,
      headerFileName,
      acceptVerifiableData: formData.get("acceptVerifiableData") === "on",
      acceptPolicy: formData.get("acceptPolicy") === "on",
    };

    try {
      const response = await fetch("/api/order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok) {
        setSubmitError(result.error ?? "Failed to submit order");
        return;
      }

      router.push(`/thank-you?orderId=${result.orderId}`);
    } catch {
      setSubmitError("Unable to submit order right now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-hero-gradient px-4 py-10">
      <section className="mx-auto w-full max-w-4xl rounded-xl border border-white/10 bg-black/40 p-6 backdrop-blur md:p-8">
        <div className="flex justify-center">
          <Breadcrumbs
            className="mb-0"
            items={[
              { label: "DEX Screener Marketplace", href: "/" },
              { label: "Token Advertising", href: "/" },
              { label: "Order" },
            ]}
          />
        </div>
        <h1 className="mt-2 text-center font-serif text-4xl font-semibold text-white">
          Enhanced Token Info
        </h1>

        {status !== "authenticated" ? (
          <div className="mt-8 flex flex-col items-center">
            <p className="text-xl font-semibold text-white">
              Account required!
            </p>
            <div className="mt-2 flex items-center gap-2 text-muted-foreground">
              <span>Please</span>
              <Link
                href="/sign-in"
                className="inline-flex rounded-md border border-white/20 px-3 py-1 text-sm font-medium text-white transition-colors hover:bg-white/10"
              >
                Sign In
              </Link>
              <span>to proceed.</span>
            </div>

            <Link
              href="/"
              className="mt-10 inline-flex rounded-md border border-white/20 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10"
            >
              Go back to Home Page
            </Link>
          </div>
        ) : (
          <form className="mt-8 space-y-8" onSubmit={handleSubmit}>
            <section className="space-y-4">
              <h2 className="text-sm font-semibold text-white">Token Details</h2>
              <div>
                <label className="text-sm font-semibold text-white">Chain</label>
                <select
                  name="chain"
                  defaultValue=""
                  className="mt-2 w-full rounded-md border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-white/30"
                >
                  <option value="">Select a chain</option>
                  <option value="ethereum">Ethereum</option>
                  <option value="bsc">BNB Chain</option>
                  <option value="solana">Solana</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-white">
                  Token Address
                </label>
                <Input
                  name="tokenAddress"
                  value="0x0000000000000000000000000000000000000000"
                  placeholder="Token address"
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-semibold text-white">
                    Token Name
                  </label>
                  <Input
                    name="tokenName"
                    placeholder="Enter token name"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-white">
                    Token Symbol
                  </label>
                  <Input
                    name="tokenSymbol"
                    placeholder="Enter token symbol"
                  />
                </div>
              </div>
            </section>

            <section>
              <label className="text-sm font-semibold text-white">
                Description
              </label>
              <textarea
                name="description"
                rows={5}
                className="mt-2 w-full rounded-md border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none placeholder:text-white/35 focus:border-white/30"
                placeholder="Project description. Plain text only. Emojis and multilines allowed. Description will be displayed on the pair details page on DEX Screener."
              />
            </section>

            <section>
              <h2 className="text-sm font-semibold text-white">Links</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {linkTypes.map((label) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => addLink(label.replace("Add ", ""))}
                    className="rounded-md border border-white/20 px-3 py-2 text-sm text-white transition-colors hover:bg-white/10"
                  >
                    {label}
                  </button>
                ))}
              </div>
              {links.length > 0 ? (
                <div className="mt-4 space-y-3">
                  {links.map((link) => (
                    <div
                      key={link.id}
                      className="rounded-md border border-white/10 bg-black/20 p-3"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-sm font-medium text-white">{link.type}</p>
                        <button
                          type="button"
                          onClick={() => removeLink(link.id)}
                          className="text-xs text-red-300 hover:text-red-200"
                        >
                          Remove
                        </button>
                      </div>
                      <input
                        type="url"
                        value={link.url}
                        onChange={(event) => updateLink(link.id, event.target.value)}
                        placeholder={`Enter ${link.type} URL`}
                        className="w-full rounded-md border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none placeholder:text-white/35 focus:border-white/30"
                      />
                    </div>
                  ))}
                </div>
              ) : null}
              <p className="mt-4 text-sm text-muted-foreground">
                Additional links
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Please provide additional links that don&apos;t fit into the
                above categories. For example, links to other social media
                profiles.
              </p>
              <button
                type="button"
                onClick={() => addLink("Additional")}
                className="mt-4 rounded-md border border-white/20 px-3 py-2 text-sm text-white transition-colors hover:bg-white/10"
              >
                Add link
              </button>
            </section>

            <section className="space-y-4">
              <h2 className="text-sm font-semibold text-white">Images</h2>
              <UploadCard
                title="Icon"
                ratioText="1:1 aspect ratio (square, for example 100x100px or 500x500px)"
                minWidthText="min. image width: 100px"
                inputId="icon-upload"
                onFileChange={handleIconChange}
                selectedFile={iconFileName}
              />
              <UploadCard
                title="Header"
                ratioText="3:1 aspect ratio (rectangle, for example 600x200px or 1500x500px)"
                minWidthText="min. image width: 600px"
                inputId="header-upload"
                onFileChange={handleHeaderChange}
                selectedFile={headerFileName}
              />
            </section>

            <section>
              <h2 className="text-sm font-semibold text-white">
                Locked Supply (Optional)
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Locked Supply refers to the portion of a cryptocurrency&apos;s
                total supply that is not available for trading or circulation.
                These tokens are often held in reserve for future use, such as
                development, partnerships, or team incentives. Not to be
                confused with Locked Liquidity.
              </p>

              <p className="mt-5 text-sm font-semibold text-white">
                Locked Addresses
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Provide an optional list of addresses with locked tokens. You
                don&apos;t need to include the following burn addresses, we check
                them automatically:
              </p>

              <div className="mt-3 rounded-md border border-white/10 bg-black/25 p-4">
                {burnAddresses.map((address) => (
                  <p key={address} className="text-sm text-muted-foreground">
                    {address}
                  </p>
                ))}
              </div>

              <button
                type="button"
                onClick={addLockedAddress}
                className="mt-4 rounded-md border border-white/20 px-3 py-2 text-sm text-white transition-colors hover:bg-white/10"
              >
                Add address
              </button>

              {lockedAddresses.length > 0 ? (
                <div className="mt-4 space-y-3">
                  {lockedAddresses.map((address, index) => (
                    <div key={`${index}-${address}`} className="flex gap-2">
                      <input
                        type="text"
                        value={address}
                        onChange={(event) =>
                          updateLockedAddress(index, event.target.value)
                        }
                        placeholder="Enter locked address"
                        className="w-full rounded-md border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none placeholder:text-white/35 focus:border-white/30"
                      />
                      <button
                        type="button"
                        onClick={() => removeLockedAddress(index)}
                        className="rounded-md border border-red-300/40 px-3 py-2 text-sm text-red-300 transition-colors hover:bg-red-300/10"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}

              <p className="mt-6 text-sm font-semibold text-white">
                Supply Description
              </p>
              <textarea
                rows={3}
                className="mt-2 w-full rounded-md border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none placeholder:text-white/35 focus:border-white/30"
                placeholder="Provide a brief explanation of why and how supply is locked"
              />
            </section>

            <section className="rounded-lg border border-white/10 bg-black/25 p-4">
              <h2 className="text-lg font-semibold text-white">Order summary</h2>
              <div className="mt-4 flex items-center justify-between border-b border-white/10 pb-2 text-sm text-muted-foreground">
                <span>Product</span>
                <span>Price</span>
              </div>
              <div className="mt-3 flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-white">Enhanced Token Info</p>
                  <p className="mt-2 max-w-lg text-sm text-muted-foreground">
                    ETA: Submission will be verified by DEX Screener. Average
                    processing time after receiving payment is less than 15
                    minutes.
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground line-through">
                    $499.00
                  </p>
                  <p className="text-xl font-semibold text-white">$299.00</p>
                </div>
              </div>
            </section>

            <section className="rounded-lg border border-white/10 bg-black/25 p-4">
              <h2 className="text-lg font-semibold text-white">Payment</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Select your payment method and confirm your order.
              </p>
              <label className="mt-4 block text-sm font-semibold text-white">
                Payment Method
              </label>
              <select
                name="paymentMethod"
                defaultValue=""
                className="mt-2 w-full rounded-md border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-white/30"
              >
                <option value="">Choose payment method</option>
                <option value="crypto">Pay with crypto</option>
                <option value="card">Pay with card</option>
              </select>
            </section>

            <section className="space-y-3">
              <label className="flex items-start gap-2 text-sm text-muted-foreground">
                <input
                  name="acceptVerifiableData"
                  type="checkbox"
                  className="mt-1 h-4 w-4"
                />
                <span>
                  I understand that all supplied data must be verifiable through
                  official channels such as website and socials.
                </span>
              </label>
              <label className="flex items-start gap-2 text-sm text-muted-foreground">
                <input
                  name="acceptPolicy"
                  type="checkbox"
                  className="mt-1 h-4 w-4"
                />
                <span>
                  I understand and accept that DEX Screener reserves the right
                  to reject or modify the provided information. By completing
                  this purchase, I confirm that I&apos;ve read and agree to the
                  Refund Policy.
                </span>
              </label>
            </section>

            {submitError ? (
              <p className="text-sm text-red-300">{submitError}</p>
            ) : null}

            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-md bg-gradient-to-r from-sky-500 to-indigo-500 px-6 py-3 text-sm font-semibold text-white transition hover:from-sky-600 hover:to-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Order Now"}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
