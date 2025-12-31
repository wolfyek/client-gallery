
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
        // Construct Nextcloud Public Preview URL (Modern & Robust)
        // Endpoint: /index.php/apps/files_sharing/publicpreview/{token}
        // This endpoint returns 'Content-Disposition: inline' which allows <img> tags to work.

        // Ensure server doesn't have trailing slash
        const baseUrl = server.replace(/\/$/, "");

        // Ensure path has leading slash
        const contentPath = path.startsWith('/') ? path : `/${path}`;

        // Example: https://nc.netmedia.si/index.php/apps/files_sharing/publicpreview/{token}
        const previewUrl = new URL(`${baseUrl}/index.php/apps/files_sharing/publicpreview/${token}`);

        previewUrl.searchParams.set("file", contentPath);
        previewUrl.searchParams.set("x", "1920"); // HD Max
        previewUrl.searchParams.set("y", "1080");
        previewUrl.searchParams.set("a", "true"); // Aspect Ratio
        previewUrl.searchParams.set("scalingup", "0");

        return NextResponse.redirect(previewUrl.toString(), 307);
    } catch (e) {
        console.error("Redirect Error:", e);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
