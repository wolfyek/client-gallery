
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
        // Construct Nextcloud Direct Download URL
        // Format: https://{server}/s/{token}/download?path={dir}&files={filename}

        // Ensure server doesn't have trailing slash
        const baseUrl = server.replace(/\/$/, "");

        // Extract directory and filename from path
        // Path input example: "/Folder/Image.jpg"
        const lastSlashIndex = path.lastIndexOf('/');
        const dir = path.substring(0, lastSlashIndex) || "/";
        const filename = path.substring(lastSlashIndex + 1);

        const directUrl = new URL(`${baseUrl}/s/${token}/download`);
        directUrl.searchParams.set("path", dir);
        directUrl.searchParams.set("files", filename);

        return NextResponse.redirect(directUrl.toString(), 307); // Temporary Redirect
    } catch (e) {
        console.error("Redirect Error:", e);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
