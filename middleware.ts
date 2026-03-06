export { default } from "next-auth/middleware";

export const config = {
  matcher: ["/order/:path*", "/thank-you/:path*", "/connect-wallet/:path*"],
};
