import Image from "next/image";

const socialLinks = [
  {
    name: "Discord",
    href: "https://discord.gg/XNgMb5tQN7",
    icon: "https://ext.same-assets.com/3250060909/560461911.svg",
  },
  {
    name: "Telegram",
    href: "https://telegram.me/dexscreenerchat",
    icon: "https://ext.same-assets.com/3250060909/289808971.svg",
  },
  {
    name: "Twitter",
    href: "https://twitter.com/dexscreener",
    icon: "https://ext.same-assets.com/3250060909/247214298.svg",
  },
];

function GradientDivider() {
  return <div className="h-px w-full gradient-divider" />;
}

export default function SiteFooter() {
  return (
    <footer className="w-full bg-black">
      <div className="relative container mx-auto px-4 py-6">
        <div className="absolute left-0 top-0 w-full">
          <GradientDivider />
        </div>
        <div className="flex flex-col items-center space-y-4">
          <div className="flex flex-row items-center space-x-4 md:space-x-8">
            {socialLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-row items-center space-x-2 text-gray-300 transition-colors hover:text-white"
              >
                <Image src={link.icon} alt={link.name} width={24} height={24} />
                <span>{link.name}</span>
              </a>
            ))}
          </div>
          <span className="text-center text-xs text-muted-foreground">
            ©{" "}
            <a
              href="https://dexscreener.com"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-white"
            >
              DEX Screener
            </a>
            , Inc.
          </span>
        </div>
      </div>
    </footer>
  );
}
