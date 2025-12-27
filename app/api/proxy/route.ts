
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const server = searchParams.get("server");
    const token = searchParams.get("token");
    const path = searchParams.get("path");

    if (!server || !token || !path) {
        return new NextResponse("Missing parameters", { status: 400 });
    }

    try {
        // Construct WebDAV URL
        // We need to encode the path segments correctly
        // path comes in raw, e.g. "/Folder/My Image.jpg"
        const encodedPath = path.split('/').map(s => encodeURIComponent(s)).join('/');

        // Ensure server doesn't have trailing slash if encodedPath has leading slash (it usually does)
        const baseUrl = server.replace(/\/$/, "");
        const webdavUrl = `${baseUrl}/public.php/webdav${encodedPath}`;

        // Auth
        const auth = Buffer.from(`${token}:`).toString('base64');

        const ncRes = await fetch(webdavUrl, {
            headers: {
                'Authorization': `Basic ${auth}`
            }
        });

        if (!ncRes.ok) {
            console.error(`Proxy Error: ${ncRes.status} for ${webdavUrl}`);
            return new NextResponse("Upstream Error", { status: ncRes.status });
        }

        // Forward headers
        const headers = new Headers();
        headers.set("Content-Type", ncRes.headers.get("Content-Type") || "image/jpeg");
        headers.set("Cache-Control", "public, max-age=31536000, immutable");
        headers.set("Content-Disposition", "inline"); // Force display

        return new NextResponse(ncRes.body, {
            status: 200,
            headers
        });
    } catch (e) {
        console.error("Proxy Internal Error:", e);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
