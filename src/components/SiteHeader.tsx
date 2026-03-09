import Image from "next/image";
import Link from "next/link";

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 py-4 bg-transparent">
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
          <Link
            href="/sign-in"
            className="inline-flex h-10 items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-white/10"
          >
            Sign In
          </Link>
        </div>
      </div>
    </header>
  );
}
