import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatSlovenianDate(isoDate: string) {
    const date = new Date(isoDate);
    return date.toLocaleDateString("sl-SI", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });
}

export function downloadImage(url: string, filename: string) {
    const proxyUrl = `/api/download?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}`;

    // Create invisible link and click it to trigger native browser download
    const link = document.createElement('a');
    link.href = proxyUrl;
    link.download = filename; // Backup hint
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

export function getNextcloudPreviewUrl(proxyUrl: string, width = 1024, height = 1024) {
    if (!proxyUrl || !proxyUrl.startsWith('/api/proxy')) return null;

    try {
        // Use a dummy base for relative URLs
        const urlObj = new URL(proxyUrl, 'http://dummy.com');
        const params = urlObj.searchParams;
        const server = params.get('server');
        const token = params.get('token');
        const path = params.get('path');

        if (!server || !token || !path) return null;

        // Construct Nextcloud Preview URL
        // Standard format: /index.php/core/preview.png?file={path}&x={width}&y={height}&a=true&t={token}
        const previewUrl = new URL(`${server}/index.php/core/preview.png`);
        previewUrl.searchParams.set('file', path);
        previewUrl.searchParams.set('x', width.toString());
        previewUrl.searchParams.set('y', height.toString());
        previewUrl.searchParams.set('a', 'true'); // 'a' usually stands for auth/authenticated or specific mode, dependent on NC version but harmless
        previewUrl.searchParams.set('t', token);

        return previewUrl.toString();
    } catch (e) {
        console.error("Error parsing proxy URL for preview:", e);
        return null;
    }
}
