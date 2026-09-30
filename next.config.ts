import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  // the route used to be misspelled; keep old links working
  redirects: async () => [{ source: "/restourant/:path*", destination: "/restaurant/:path*", permanent: true }],
};

export default nextConfig;
