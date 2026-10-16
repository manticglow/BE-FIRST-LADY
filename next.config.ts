import type { NextConfig } from 'next';

const config: NextConfig = {
  reactStrictMode: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
    ],
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion', 'recharts'],
  },
  webpack: (config, { isServer }) => {
    config.externals = config.externals || [];
    if (!isServer) {
      config.externals.push({
        '@capacitor/core': 'commonjs @capacitor/core',
        '@capacitor/app': 'commonjs @capacitor/app',
        '@capacitor/push-notifications': 'commonjs @capacitor/push-notifications',
        '@capacitor/geolocation': 'commonjs @capacitor/geolocation',
        '@capacitor/camera': 'commonjs @capacitor/camera',
        '@capacitor/share': 'commonjs @capacitor/share',
        '@capacitor/haptics': 'commonjs @capacitor/haptics',
        '@capacitor/status-bar': 'commonjs @capacitor/status-bar',
        '@capacitor/splash-screen': 'commonjs @capacitor/splash-screen',
        '@capacitor/preferences': 'commonjs @capacitor/preferences',
        '@capacitor/network': 'commonjs @capacitor/network',
        '@capacitor/browser': 'commonjs @capacitor/browser',
        '@capacitor/toast': 'commonjs @capacitor/toast',
        '@capawesome/capacitor-barcode-scanner': 'commonjs @capawesome/capacitor-barcode-scanner',
      });
    }
    return config;
  },
};

export default config;
