/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: [
      "@aws-sdk/client-bedrock-agent-runtime",
      "firebase-admin",
      "firebase-admin/app",
      "firebase-admin/firestore"
    ],
  },
  webpack: (config, { isServer }) => {
    // Server-specific modifications
    if (isServer) {
      config.externals.push({
        "@aws-sdk/client-bedrock-agent-runtime":
          "commonjs @aws-sdk/client-bedrock-agent-runtime",
      });
    }
    
    // For both client and server, add polyfills for Node.js modules
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        // Polyfill or ignore Node.js modules 
        net: false,
        tls: false,
        fs: false,
        child_process: false,
        http2: false,
        dns: false,
        path: false,
        os: false,
        https: false,
        http: false,
        stream: false,
        crypto: false,
        zlib: false,
        url: false,
        util: false,
        assert: false,
      };
    }
    
    return config;
  },
};

export default nextConfig;
