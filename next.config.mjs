/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // NOTE: MONGODB_URI must NOT be listed here. Next inlines `env` values into
  // any bundle that references them, so one client-side reference would ship
  // the Atlas credential to every visitor. Server code reads process.env
  // directly (see src/lib/mongodb.js).
};

export default nextConfig;
