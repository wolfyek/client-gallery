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
            const webdavUrl = `${baseUrl}/public.php/webdav${path}`;

            console.log(`Proxying Download via WebDAV: ${webdavUrl}`);

            const response = await fetch(webdavUrl, {
                headers: {
                    'Authorization': 'Basic ' + Buffer.from(token + ':').toString('base64')
                }
            });

            if (!response.ok) {
                throw new Error(`WebDAV Error: ${response.status}`);
            }

            // Create a new response streaming the body
            const headers = new Headers(response.headers);
            // Ensure force download
            headers.set('Content-Disposition', `attachment; filename="${path.split('/').pop()}"`);

            return new NextResponse(response.body, {
                status: 200,
                headers: headers
            });
        }

        throw new Error("Could not parse Nextcloud URL details for Proxy");

    } catch (error) {
        console.error('Download proxy error:', error);
        return new NextResponse('Download failed', { status: 500 });
    }
}
