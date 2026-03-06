"use client";

import { signIn, useSession } from "next-auth/react";
import Image from "next/image";

export default function SignInPage() {
  const { status } = useSession();

  return (
    <main className="min-h-screen bg-hero-gradient px-4 py-16">
      <section className="mx-auto w-full max-w-md rounded-xl border border-white/10 bg-black/40 p-8 backdrop-blur">
        <div className="flex flex-col items-center text-center">
          <div className="mb-5 flex items-center gap-3">
            <Image
              src="https://ext.same-assets.com/3250060909/3374208345.svg"
              alt="DEX Screener owl logo"
              width={32}
              height={32}
            />
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-xl font-semibold text-white">
                DEX Screener
              </span>
              <span className="text-sm text-white/60">Marketplace</span>
            </div>
          </div>

          <h1 className="font-serif text-4xl font-semibold text-white">
            Sign In
          </h1>
        </div>

        <button
          type="button"
          onClick={() => signIn("google", { callbackUrl: "/order" })}
          className="mt-8 inline-flex w-full items-center justify-center gap-3 rounded-md bg-white px-4 py-3 text-base font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={status === "loading"}
        >
          <img
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            alt="Google"
            className="h-5 w-5"
          />
          Sign in with Google
        </button>
      </section>
    </main>
  );
}
