import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone",
  reactCompiler: true,
  serverExternalPackages: ['jspdf', 'fflate'],
  allowedDevOrigins: ['192.168.1.5'],
};

export default nextConfig;
