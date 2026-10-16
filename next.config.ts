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
  // تجاهل حزم Capacitor أثناء بناء الويب — تُستخدم فقط في التطبيق الناتيف
  webpack: (config, { webpack }) => {
    config.plugins = config.plugins || [];
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^@capacitor\/|^@capawesome\//,
      })
    );
    return config;
  },
};

export default config;
