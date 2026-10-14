/** @type {import('next').NextConfig} */
const nextConfig = {
  // Lets phones/laptops on the same Wi-Fi use the dev server.
  // Update the IP if this machine's address changes (run `ipconfig`).
  allowedDevOrigins: ["192.168.1.19", "192.168.29.145" , "192.168.1.152"],
  experimental: {
    // Uploads go through Server Actions: gateway reports (10 MB) and blog videos (backend MAX_VIDEO_MB, 50 MB).
    serverActions: { bodySizeLimit: "52mb" },
  },
};

export default nextConfig;
