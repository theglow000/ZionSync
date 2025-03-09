/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove the swcMinify option as it's no longer recognized in Next.js 15
  // swcMinify: true,
  
  // Keep your other configuration options
  reactStrictMode: true,
  env: {
    MONGODB_URI: process.env.MONGODB_URI,
    PROJECT_NAME: 'ZionSync'
  }
};

export default nextConfig;