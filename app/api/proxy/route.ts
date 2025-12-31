
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
        // Construct Nextcloud Public Preview URL
        // Endpoint: /index.php/apps/files_sharing/ajax/publicpreview.php
        // Params: t={token}, file={path}, x={width}, y={height}, a=true

        // Ensure server doesn't have trailing slash
        const baseUrl = server.replace(/\/$/, "");

        const previewUrl = new URL(`${baseUrl}/index.php/apps/files_sharing/ajax/publicpreview.php`);
        previewUrl.searchParams.set("t", token);
        previewUrl.searchParams.set("file", path); // Path usually needs leading slash, e.g. /Folder/Image.jpg
        previewUrl.searchParams.set("x", "1920"); // High res for gallery
        previewUrl.searchParams.set("y", "1080");
        previewUrl.searchParams.set("a", "true"); // Aspect ratio
        previewUrl.searchParams.set("scalingup", "0"); // Don't upscale

        return NextResponse.redirect(previewUrl.toString(), 307);
    } catch (e) {
        console.error("Redirect Error:", e);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
