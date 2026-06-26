import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  compress: true,
  poweredByHeader: false,
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/uploads/:path*",
          destination: "/api/uploads/:path*",
        },
      ],
    };
  },
  experimental: {
    optimizePackageImports: ["react-markdown", "remark-gfm"],
    /** 避免客户端 Router Cache 保留旧 RSC 数分钟 */
    staleTimes: {
      dynamic: 0,
      static: 0,
    },
  },
};

export default nextConfig;
