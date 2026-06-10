/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client", "prisma", "node-edge-tts", "ws", "better-auth"],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // better-auth bundles a kysely-adapter that expects exports missing from
      // the installed kysely version. We use Prisma, not Kysely — stub it out.
      config.resolve.alias = {
        ...config.resolve.alias,
        "@better-auth/kysely-adapter": require("path").resolve(__dirname, "src/lib/kysely-stub.js"),
      };
    }
    return config;
  },
};

module.exports = nextConfig;
