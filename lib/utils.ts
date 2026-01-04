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

    if (!downloadUrl) {
        console.error("Could not resolve proper download URL. Aborting to prevent white-screen fallback.");
        return;
    }

    // Trigger Native Browser Download via Navigation
    // This is the most reliable way for Cross-Origin downloads (Nextcloud) where 'download' attribute is ignored.
    // If the server sends Content-Disposition: attachment, the browser will stay on page and download.
    window.location.href = downloadUrl;
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
                    // FINAL CORRECTED LOGIC:
                    // 1. Trust source path (Do NOT strip first segment, as /Full/Image.jpg IS the correct relative path).
                    const targetPath = filePath;

                    // 2. Split directory/filename
                    const lastSlash = targetPath.lastIndexOf('/');
                    let directory = '';
                    let filename = targetPath;

                    if (lastSlash >= 0) {
                        if (lastSlash === 0) {
                            // File at root: /Image.jpg
                            directory = '';
                            filename = targetPath.substring(1);
                        } else {
                            // File in folder: /Full/Image.jpg -> directory: /Full
                            directory = targetPath.substring(0, lastSlash);
                            filename = targetPath.substring(lastSlash + 1);
                        }
                    } else {
                        directory = '';
                        filename = targetPath;
                    }

                    // 3. Remove leading slash from directory if present
                    // Nextcloud /download endpoint often prefers "Full" over "/Full"
                    if (directory.startsWith('/')) {
                        directory = directory.substring(1);
                    }

                    // 4. Use Official Download Endpoint
                    return `${urlObj.origin}/index.php/s/${token}/download?path=${encodeURIComponent(directory)}&files=${encodeURIComponent(filename)}`;
                }
            }
        }

    } catch (e) {
        console.error("Failed to resolve Nextcloud Download URL", e);
    }

    return null;
}
