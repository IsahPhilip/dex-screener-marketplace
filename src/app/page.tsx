"use client";

import Image from "next/image";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";

// Payment icons - crypto and credit card
const paymentIcons = [
  { src: "https://ext.same-assets.com/3250060909/1235508204.svg", alt: "USDC" },
  { src: "https://ext.same-assets.com/3250060909/3708650860.svg", alt: "ETH" },
  { src: "https://ext.same-assets.com/3250060909/3272679162.svg", alt: "SOL" },
  { src: "https://ext.same-assets.com/3250060909/3619454512.svg", alt: "BTC" },
  { src: "https://ext.same-assets.com/3250060909/1746412211.svg", alt: "Card" },
];

// Pulsing dot positions on the feature image
const pulsingDots = [
  { top: "18.5%", left: "26%" },
  { top: "64%", left: "47%" },
  { top: "66%", left: "25%" },
  { top: "11%", left: "87%" },
  { top: "65%", left: "83%" },
  { top: "30%", left: "65%" },
];

// Benefits data
const benefits = [
  {
    title: "Stand out from the crowd",
    description:
      "Your project's logo and socials can be displayed on DEX Screener front and center, so traders can easily spot and interact with it!",
  },
  {
    title: "Credibility",
    description:
      "Show your project's commitment to transparency and trust and inform potential token holders of the project's vision, team and roadmap",
  },
  {
    title: "Community Engagement",
    description:
      "Crypto projects live and die by their communities: Enhanced Token Info boosts social engagement and helps bring token holders together to connect and collaborate for shared success",
  },
  {
    title: "Accurate Market Cap",
    description:
      "Set wallets holding locked supply and ensure your token's market cap is always displayed correctly",
  },
];

// How it works steps
const steps = [
  {
    number: "1",
    title: "Set token info",
    description: "Fill out the form in under a minute",
  },
  {
    number: "2",
    title: "Pay",
    description: "All major cryptocurrencies and credit/debit cards accepted",
  },
  {
    number: "3",
    title: "Wait for processing",
    description:
      "Most orders are processed within just a few minutes, but please allow up to 12 hours",
  },
];

function PulsingDot({ top, left }: { top: string; left: string }) {
  return (
    <div
      className="absolute z-10 flex h-3 w-3 -translate-x-1/2 -translate-y-1/2 cursor-pointer"
      style={{ top, left }}
    >
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-100 ring-2 ring-blue-100 opacity-75" />
      <span className="relative inline-flex h-3 w-3 rounded-full bg-sky-200" />
    </div>
  );
}

function GradientDivider() {
  return <div className="h-px w-full gradient-divider" />;
}

function OrderButton() {
  return (
    <Link
      href="/order"
      className="inline-flex items-center justify-center whitespace-nowrap font-medium transition-all rounded-md px-8 h-11 text-md bg-gradient-to-r from-sky-500 to-indigo-500 text-white hover:from-sky-600 hover:to-indigo-600 space-x-2"
    >
      <span>Order Now -</span>
      <span>from</span>
      <span className="line-through opacity-75">$499.00</span>
      <span>$299.00</span>
    </Link>
  );
}

export default function Home() {
  return (
    <section className="flex min-h-screen flex-col">
      {/* Background gradient */}
      <div className="absolute left-0 top-0 -z-10 h-screen w-full bg-hero-gradient" />

      {/* Main content */}
      <section className="flex-grow">
        {/* Hero section */}
        <div className="container mx-auto px-4 my-10 flex flex-col items-center">
          <div className="flex flex-col items-center md:w-4/5 lg:w-3/5">
            <div className="w-full">
              <Breadcrumbs
                items={[
                  { label: "Home", href: "/" },
                  { label: "Enhanced Token Info" },
                ]}
              />
            </div>

            {/* Title */}
            <h1 className="text-center text-4xl font-bold text-white md:text-6xl font-serif">
              Enhanced Token Info
            </h1>

            {/* Subtitle */}
            <p className="mt-4 text-center text-muted-foreground md:text-xl max-w-lg">
              Quickly update your DEX Screener token page with accurate and up-to-date info and socials
            </p>

            {/* CTA and payment icons */}
            <div className="flex flex-col space-y-6 mt-6 items-center">
              <OrderButton />
              <div className="flex flex-col space-y-2 items-center text-center text-xs">
                <div className="flex flex-row space-x-2 items-center text-2xl">
                  {paymentIcons.map((icon) => (
                    <Image
                      key={icon.alt}
                      src={icon.src}
                      alt={icon.alt}
                      width={24}
                      height={24}
                    />
                  ))}
                </div>
                <span className="text-muted-foreground">Pay with crypto or credit card</span>
              </div>
            </div>
          </div>
        </div>

        {/* Features section */}
        <section className="w-full">
          <div className="container mx-auto px-4">
            <GradientDivider />

            <section className="py-10">
              {/* Intro text */}
              <div className="mx-auto max-w-2xl">
                <div className="flex flex-col space-y-4 lg:mb-15 mb-10 text-center text-gray-300 md:text-xl">
                  <p>
                    Update your token info with{" "}
                    <span className="font-serif font-semibold">DEX&nbsp;Screener</span> directly to{" "}
                    <strong>grow your community</strong> and{" "}
                    <strong>stand out from the crowd</strong>!
                  </p>
                </div>
              </div>

              {/* Feature image with pulsing dots */}
              <section className="relative mx-auto mb-10 max-w-4xl lg:mb-16">
                <Image
                  src="https://ext.same-assets.com/3250060909/1963003030.png"
                  width={896}
                  height={709}
                  alt="DEX Screener Interface"
                  className="w-full h-auto"
                  priority
                />
                {pulsingDots.map((dot, index) => (
                  <PulsingDot key={index} top={dot.top} left={dot.left} />
                ))}
              </section>

              {/* Benefits */}
              <section className="mx-auto max-w-2xl">
                <div className="md:space-y-16 space-y-12">
                  {benefits.map((benefit) => (
                    <div
                      key={benefit.title}
                      className="flex flex-col items-center"
                    >
                      <div className="flex-1">
                        <h2 className="mb-2 text-center font-serif text-2xl font-semibold text-white">
                          {benefit.title}
                        </h2>
                        <h3 className="text-center text-gray-400">
                          {benefit.description}
                        </h3>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="my-14">
                  <GradientDivider />
                </div>

                {/* How does it work */}
                <div className="flex flex-col space-y-8 mx-auto w-full max-w-2xl items-center text-center">
                  <h2 className="font-serif text-4xl font-semibold text-white">
                    How does it work?
                  </h2>

                  <div className="flex flex-col space-y-6 mx-auto w-full text-gray-100">
                    {steps.map((step) => (
                      <div
                        key={step.number}
                        className="flex flex-col space-y-3 items-center"
                      >
                        <span className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-500 text-lg font-bold text-gray-100">
                          {step.number}
                        </span>
                        <div className="flex flex-col space-y-1">
                          <h3 className="font-medium">{step.title}</h3>
                          <p className="opacity-50">{step.description}</p>
                        </div>
                      </div>
                    ))}

                    {/* Done step */}
                    <div className="flex flex-col space-y-3 items-center">
                      <span className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-500 text-sm font-bold text-gray-100">
                        <Image
                          src="https://ext.same-assets.com/3250060909/1488988196.svg"
                          alt="Check"
                          width={14}
                          height={14}
                        />
                      </span>
                      <div className="flex flex-col space-y-1">
                        <h3 className="font-medium">Done!</h3>
                        <p className="opacity-50">
                          Your token info is live on the DEX Screener website and apps!
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Bottom CTA */}
              <div className="mt-8 flex w-full justify-center">
                <OrderButton />
              </div>
            </section>
          </div>
        </section>
      </section>
    </section>
  );
}
