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

export async function downloadImage(url: string, filename: string) {
    const downloadUrl = resolveNextcloudDownloadUrl(url);
    const targetUrl = downloadUrl || url;

    try {
        // Attempt Direct Fetch to force "Save As" (Prevent New Tab/Inline View)
        // This requires CORS support on Nextcloud.
        const response = await fetch(targetUrl);

        if (!response.ok) throw new Error("Fetch failed");

        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename; // Force the filename
        document.body.appendChild(link);
        link.click();

        // Cleanup
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);

    } catch (e) {
        console.warn("Direct fetch download failed (CORS?), falling back to navigation.", e);
        // Fallback: This might open in new tab if it's an image, but it's the best we can do if Cross-Origin is blocked.
        // We add 'download' attribute to URL if possible or rely on headers.
        // FINAL GUARD: Don't navigate to proxy URL to save bandwidth
        if (targetUrl.startsWith("/api/proxy")) {
            alert("Prenos ni mogoč (Varnostna omejitev pasovne širine).");
            return;
        }
        window.location.href = targetUrl;
    }
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

    // CRITICAL: If resolution failed for a proxy URL, preventing leaking bandwidth.
    console.warn("Resolution failed for proxy URL, returning empty:", url);
    return "";
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
                // Use WebDAV path for reliability (bypassing ZIP controller)
                const encodedPath = path.split('/').map(encodeURIComponent).join('/');
                return `${cleanServer}/public.php/dav/files/${token}/${encodedPath.startsWith('/') ? encodedPath.substring(1) : encodedPath}`;
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
                    // WEBDAV DIRECT ACCESS STRATEGY
                    // We use the public WebDAV endpoint to access the RAW file.
                    // This completely bypasses the /download controller (which forces ZIP)
                    // and the /publicpreview controller (which resizes images).
                    // URL Structure: /public.php/dav/files/{token}/{path}

                    let targetPath = filePath;

                    // Intelligent Swap: If directory is exact match 'Web', make it 'Full'
                    // We match specific segments to avoid breaking weird filenames.
                    const parts = targetPath.split('/');
                    const webIndex = parts.findIndex(p => p.toLowerCase() === 'web');

                    if (webIndex !== -1) {
                        // Check if we aren't just at root (preserving flat galleries)
                        // Actually, if 'Web' exists as a folder, we almost certainly want 'Full' if it exists.
                        // We will swap it.
                        parts[webIndex] = 'Full';
                        targetPath = parts.join('/');
                    }

                    // Ensure path starts with slash for consistency before creating URL
                    if (!targetPath.startsWith('/')) targetPath = '/' + targetPath;

                    // Encode each segment correctly (but keep slashes)
                    const encodedPath = targetPath.split('/').map(s => encodeURIComponent(s)).join('/');

                    // Construct WebDAV URL
                    // Note: public.php/dav/files/{token} is the base.
                    return `${urlObj.origin}/public.php/dav/files/${token}${encodedPath}`;
                }
            }
        }

    } catch (e) {
        console.error("Failed to resolve Nextcloud Download URL", e);
    }

    return null;
}
