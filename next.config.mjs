/** @type {import('next').NextConfig} */
const nextConfig = {
  // Lets phones/laptops on the same Wi-Fi use the dev server.
  // Update the IP if this machine's address changes (run `ipconfig`).
  allowedDevOrigins: ["192.168.1.19"],
};

export default nextConfig;
