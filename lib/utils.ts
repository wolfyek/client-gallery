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
    // Try to resolve a direct download URL (forcing attachment) if possible
    const downloadUrl = resolveNextcloudDownloadUrl(url);

    if (downloadUrl) {
        try {
            // Client-side fetch to bypass browser navigation issues and Vercel limits
            const response = await fetch(downloadUrl);
            if (!response.ok) throw new Error("Network response was not ok");
            const blob = await response.blob();
            saveAs(blob, filename);
            return;
        } catch (e) {
            console.error("Direct download failed, trying fallback...", e);
        }
    }



    // Fallback for non-Nextcloud URLs or if resolution fails
    const proxyUrl = `/api/download?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}`;

    // Create invisible link and click it to trigger native browser download
    const link = document.createElement('a');
    link.href = proxyUrl;
    link.download = filename; // Backup hint
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

    // Case 1: Legacy Proxy URL
    if (url.startsWith("/api/proxy")) {
        try {
            const urlObj = new URL(url, "http://dummy.com");
            const server = urlObj.searchParams.get("server");
            const token = urlObj.searchParams.get("token");
            const path = urlObj.searchParams.get("path");

            if (server && token && path) {
                const cleanServer = server.replace(/\/$/, "");
                const cleanPath = path.startsWith('/') ? path : `/${path}`;

                // Use Public Preview with download=1 as it returns the binary reliably (200 OK), 
                // whereas /s/token/download often redirects to a broken WebDAV ZIP URL.
                return `${cleanServer}/index.php/apps/files_sharing/publicpreview/${token}?file=${encodeURIComponent(cleanPath)}&a=true&download=1`;
            }
        } catch (e) {
            console.error("Failed to resolve Nextcloud Proxy Download URL", e);
        }
    }

    // Case 2: Already a Nextcloud Preview URL
    // Legacy note: We used to try adding &download=1 here, but that only yields a thumbnail.
    // We now return null to force the usage of /api/download (WebDAV Proxy) which gets the full file.
    if (url.includes("/publicpreview/")) {
        return null;
    }

    return null;
}
