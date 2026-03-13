import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      { source: '/js/api-config.js', destination: '/api/config.js' },
      { source: '/', destination: '/index.html' },
      { source: '/marketplace', destination: '/pages/marketplace.html' },
      { source: '/profile', destination: '/pages/profile.html' },
      { source: '/profile.html', destination: '/pages/profile.html' },
      { source: '/checkout', destination: '/pages/checkout.html' },
      { source: '/admin', destination: '/pages/admin-dashboard.html' },
      { source: '/admin-dashboard.html', destination: '/pages/admin-dashboard.html' },
      { source: '/tracking', destination: '/pages/tracking.html' },
      { source: '/about', destination: '/pages/about.html' },
      { source: '/contact', destination: '/pages/contact.html' }
    ];
  },
};

export default nextConfig;
