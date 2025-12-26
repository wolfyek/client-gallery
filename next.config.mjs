/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        serverActions: {
            bodySizeLimit: '50mb',
        },
    },
    images: {
        formats: ['image/avif', 'image/webp'],
        remotePatterns: [
            { protocol: "https", hostname: "images.unsplash.com", },
            { protocol: "https", hostname: "**", },
            { protocol: "https", hostname: "nc.netmedia.si", port: "440", },
            { protocol: "https", hostname: "nc.netmedia.si", },
            { protocol: "https", hostname: "www.netmedia.si", },
        ],
    },
};
export default nextConfig;