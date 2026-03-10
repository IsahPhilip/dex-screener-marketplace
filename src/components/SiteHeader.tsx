"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";

export default function SiteHeader() {
  const [isScrolled, setIsScrolled] = useState(false);
  const { data: session, status } = useSession();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 py-4 transition-all duration-300 ${
        isScrolled
          ? "supports-[backdrop-filter]:bg-white/5 bg-white/5 backdrop-blur-lg backdrop-saturate-150 border-b border-white/10 shadow-lg"
          : "bg-transparent backdrop-blur-0 border-b border-transparent shadow-none"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex h-10 flex-row items-center justify-between">
          <Link href="/" className="flex flex-row items-center space-x-2">
            <Image
              src="https://ext.same-assets.com/3250060909/3374208345.svg"
              alt="DEX Screener"
              width={25}
              height={25}
            />
            <div className="flex flex-col items-baseline -space-y-2 md:flex-row md:space-x-2 md:space-y-0">
              <span className="font-serif text-lg font-semibold">
                DEX&nbsp;Screener
              </span>
              <span className="text-sm text-white/50">Marketplace</span>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            {status === "authenticated" ? (
              <>
                <span className="inline-flex h-10 items-center rounded-md bg-white/10 px-4 text-sm font-medium text-white">
                  {session?.user?.name ?? "User"}
                </span>
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="inline-flex h-10 items-center justify-center whitespace-nowrap rounded-md border border-white/15 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                href="/sign-in"
                className="inline-flex h-10 items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-white/10"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
