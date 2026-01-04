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

import { saveAs } from "file-saver";

export async function downloadImage(url: string, filename: string) {
    // Resolve to the Direct Nextcloud Download URL
    const downloadUrl = resolveNextcloudDownloadUrl(url);

    // Use resolved URL or fallback to the provided URL (via redirector if needed, though redirector just uses the same logic)
    const targetUrl = downloadUrl || url;

    // Trigger Native Browser Download via Navigation
    // This is the most reliable way for Cross-Origin downloads (Nextcloud) where 'download' attribute is ignored.
    // If the server sends Content-Disposition: attachment, the browser will stay on page and download.
    window.location.href = targetUrl;
}

export function resolveNextcloudUrl(url: string | undefined): string {
    if (!url) return "";

    // If it's already a direct URL or not our proxy, return as is
    if (!url.startsWith("/api/proxy")) return url;

    try {
        const urlObj = new URL(url, "http://dummy.com"); // Base needed for relative URLs
        const server = urlObj.searchParams.get("server");
        const token = urlObj.searchParams.get("token");
        const path = urlObj.searchParams.get("path");

        if (server && token && path) {
            // Reconstruct the direct Nextcloud Public Preview URL
            // Format: https://[server]/index.php/apps/files_sharing/publicpreview/[token]?file=[path]&x=1920&y=1080&a=true&scalingup=0

            const cleanServer = server.replace(/\/$/, "");
            const cleanPath = path.startsWith('/') ? path : `/${path}`;

            return `${cleanServer}/index.php/apps/files_sharing/publicpreview/${token}?file=${encodeURIComponent(cleanPath)}&x=1920&y=1080&a=true&scalingup=0`;
        }
    } catch (e) {
        console.error("Failed to resolve Nextcloud URL", e);
    }

    return url;
}



export function resolveNextcloudDownloadUrl(url: string | undefined): string | null {
    if (!url) return null;

    try {
        // Case 1: Legacy Proxy URL (Handle gracefully just in case)
        if (url.startsWith("/api/proxy")) {
            const urlObj = new URL(url, "http://dummy.com");
            const server = urlObj.searchParams.get("server");
            const token = urlObj.searchParams.get("token");
            const path = urlObj.searchParams.get("path");

            if (server && token && path) {
                const cleanServer = server.replace(/\/$/, "");
                return `${cleanServer}/index.php/s/${token}/download?path=${encodeURIComponent(path)}`;
            }
        }

        // Case 2: Standard Public Preview URL
        // .../publicpreview/TOKEN?file=/Path/To/Image.jpg...
        if (url.includes("/publicpreview/")) {
            const urlObj = new URL(url);
            const match = url.match(/\/publicpreview\/([a-zA-Z0-9]+)/);
            if (match) {
                const token = match[1];
                const filePath = urlObj.searchParams.get("file");

                if (filePath) {
                    // 1. Force "Full" resolution if we are in "Web" or root
                    // The user explicitly wants "Originals" (Full), not Web Optimized.
                    let targetPath = filePath;
                    if (targetPath.includes("/Web/") || targetPath.includes("/web/")) {
                        targetPath = targetPath.replace(/\/web\//i, "/Full/");
                    } else if (!targetPath.includes("/Full/")) {
                        // If it doesn't look like it's in Full or Web, it might be at root.
                        // Try to force it into /Full/Filename if that's the known structure
                        // But let's be careful. Swapping Web->Full is explicitly requested.
                    }

                    // 2. Split into Directory and Filename for the official Download Endpoint
                    // API: /index.php/s/[token]/download?path=[dir]&files=[name]
                    const lastSlash = targetPath.lastIndexOf('/');
                    const directory = lastSlash > 0 ? targetPath.substring(0, lastSlash) : '/';
                    const filename = lastSlash >= 0 ? targetPath.substring(lastSlash + 1) : targetPath;

                    return `${urlObj.origin}/index.php/s/${token}/download?path=${encodeURIComponent(directory)}&files=${encodeURIComponent(filename)}`;
                }
            }
        }

    } catch (e) {
        console.error("Failed to resolve Nextcloud Download URL", e);
    }

    return null;
}
