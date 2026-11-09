/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: false,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/services/plumbing",
        destination: "/services/plumber",
        permanent: true,
      },
      {
        source: "/services/electrical",
        destination: "/services/electrician",
        permanent: true,
      },
      {
        source: "/services/driver-services",
        destination: "/services/driver",
        permanent: true,
      },
      {
        source: "/services/furniture-assembly",
        destination: "/services/carpenter",
        permanent: true,
      },
      {
        source: "/services/plumbing/:location",
        destination: "/services/plumber/:location",
        permanent: true,
      },
      {
        source: "/services/electrical/:location",
        destination: "/services/electrician/:location",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
