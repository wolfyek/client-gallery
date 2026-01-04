import { NextRequest, NextResponse } from 'next/server';

import { resolveNextcloudDownloadUrl } from '@/lib/utils';
// Note: resolveNextcloudDownloadUrl is safe to use on server

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const fileUrl = searchParams.get('url');

    if (!fileUrl) {
        return new NextResponse('Missing url parameter', { status: 400 });
    }

    try {
        // Parse Nextcloud URL to extract Token and Path for WebDAV
        // Expected format: .../publicpreview/[token]?file=[path]...
        const urlObj = new URL(fileUrl);
        let token = "";
        let path = "";
        let baseUrl = "";

        if (fileUrl.includes("/publicpreview/")) {
            const match = fileUrl.match(/\/publicpreview\/([a-zA-Z0-9]+)/);
            if (match) token = match[1];
            path = urlObj.searchParams.get("file") || "";
            // Extract base: https://nc.netmedia.si:440
            // urlObj.origin gives base
            baseUrl = urlObj.origin;
        } else {
            // Try fallback if it's already a /s/ link?
            // For now assume the system passes the stored src which is publicpreview
            // If manual parsing fails, we can't auth.
        }

        if (token && path && baseUrl) {
            const kind = searchParams.get('kind');

            let targetUrl = "";
            let headers: HeadersInit = {
                'Authorization': 'Basic ' + Buffer.from(token + ':').toString('base64')
            };

            if (kind === 'zip') {
                // Calculate parent directory of the file
                // e.g. /Full/Image.jpg -> /Full
                // e.g. /Image.jpg -> /
                const lastSlash = path.lastIndexOf('/');
                const dir = lastSlash > 0 ? path.substring(0, lastSlash) : '/';

                // Construct Nextcloud native ZIP download URL
                // /index.php/s/[token]/download?path=[dir]
                targetUrl = `${baseUrl}/index.php/s/${token}/download?path=${encodeURIComponent(dir)}`;
                console.log(`Proxying ZIP Download: ${targetUrl}`);

                // Note: The download endpoint might redirect. We rely on fetch following it.
            } else {
                // Single file WebDAV
                targetUrl = `${baseUrl}/public.php/webdav${path}`;
                console.log(`Proxying File via WebDAV: ${targetUrl}`);
            }

            const response = await fetch(targetUrl, { headers });

            if (!response.ok) {
                throw new Error(`Upstream Error: ${response.status}`);
            }

            // Create a new response streaming the body
            const responseHeaders = new Headers(response.headers);

            // Ensure reasonable content disposition
            if (kind === 'zip') {
                // Nextcloud usually provides a good filename (e.g. "download.zip" or "Folder.zip")
                // We preserve it if present, otherwise set default
                if (!responseHeaders.has('content-disposition')) {
                    responseHeaders.set('content-disposition', `attachment; filename="gallery.zip"`);
                }
            } else {
                responseHeaders.set('content-disposition', `attachment; filename="${path.split('/').pop()}"`);
            }

            return new NextResponse(response.body, {
                status: 200,
                headers: responseHeaders
            });
        }

        throw new Error("Could not parse Nextcloud URL details for Proxy");

    } catch (error) {
        console.error('Download proxy error:', error);
        return new NextResponse('Download failed', { status: 500 });
    }
}
