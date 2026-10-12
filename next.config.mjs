/** @type {import('next').NextConfig} */
const nextConfig = {
  // Lets phones/laptops on the same Wi-Fi use the dev server.
  // Update the IP if this machine's address changes (run `ipconfig`).
  allowedDevOrigins: ["192.168.1.19", "192.168.29.145" , "192.168.1.152"],
  experimental: {
    // Gateway settlement reports are uploaded through a Server Action (backend limit: 10 MB).
    serverActions: { bodySizeLimit: "11mb" },
  },
};

export default nextConfig;
