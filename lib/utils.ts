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
            // Loose regex to match token until start of query params or end of string
            const match = url.match(/\/publicpreview\/([^/?&]+)/);
            if (match) {
                const token = match[1];
                const filePath = urlObj.searchParams.get("file");

                if (filePath) {
                    // FINAL SYNCED LOGIC (Matches Working ZIP Logic):
                    // 1. Strip the "Share Root" from the path so it is relative to the share.
                    // The ZIP function does this and works, so we MUST do it here too.
                    // Usage: /index.php/s/[token]/download expects path relative to share.

                    const parts = filePath.split('/').filter(p => p.length > 0);
                    let relativePath = filePath;

                    // If we have at least 2 parts (ShareName + File), strip the first.
                    // e.g. /Gallery/Image.jpg -> /Image.jpg
                    if (parts.length >= 2) {
                        relativePath = '/' + parts.slice(1).join('/');
                    }

                    // 2. Split into Directory and Filename for /download endpoint
                    const lastSlash = relativePath.lastIndexOf('/');
                    let directory = '/';
                    let filename = relativePath;

                    if (lastSlash >= 0) {
                        if (lastSlash === 0) {
                            directory = '/';
                            filename = relativePath.substring(1);
                        } else {
                            directory = relativePath.substring(0, lastSlash);
                            filename = relativePath.substring(lastSlash + 1);
                        }
                    } else {
                        directory = '/';
                        filename = relativePath;
                    }

                    // 3. Use Official Download Endpoint
                    return `${urlObj.origin}/index.php/s/${token}/download?path=${encodeURIComponent(directory)}&files=${encodeURIComponent(filename)}`;
                }
            }
        }

    } catch (e) {
        console.error("Failed to resolve Nextcloud Download URL", e);
    }

    return null;
}
