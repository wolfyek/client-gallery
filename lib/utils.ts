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
    // Try to resolve a direct download URL (forcing attachment) if possible
    const downloadUrl = resolveNextcloudDownloadUrl(url) || url;
    const proxyUrl = `/api/download?url=${encodeURIComponent(downloadUrl)}&filename=${encodeURIComponent(filename)}`;

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
                // Direct Download URL: /s/{token}/download?path={dir}&files={filename}
                const pathParts = cleanPath.split('/');
                const filename = pathParts.pop();
                const dir = pathParts.join('/') || '/';

                return `${cleanServer}/index.php/s/${token}/download?path=${encodeURIComponent(dir)}&files=${encodeURIComponent(filename || "")}`;
            }
        } catch (e) {
            console.error("Failed to resolve Nextcloud Proxy Download URL", e);
        }
    }

    // Case 2: Already a Nextcloud Preview URL (from new imports or previously resolved)
    // Format: .../publicpreview/[token]?file=[path]...
    if (url.includes("/publicpreview/")) {
        try {
            //Regex to extract token and file path
            // Example: .../publicpreview/xXMnjAgqBFBG8zG?file=%2FFull%2FJKL.jpg...
            const match = url.match(/\/publicpreview\/([a-zA-Z0-9]+)/);
            if (match && match[1]) {
                const token = match[1];
                const urlObj = new URL(url);
                const fileParam = urlObj.searchParams.get("file");

                if (fileParam) {
                    // Reconstruct base URL from the input URL origin
                    // Assumption: The input URL is absolute if it's external
                    const origin = urlObj.origin;

                    const pathParts = fileParam.split('/');
                    const filename = pathParts.pop();
                    const dir = pathParts.join('/') || '/';

                    return `${origin}/index.php/s/${token}/download?path=${encodeURIComponent(dir)}&files=${encodeURIComponent(filename || "")}`;
                }
            }
        } catch (e) {
            console.error("Failed to resolve Nextcloud Preview Download URL", e);
        }
    }

    return null;
}
