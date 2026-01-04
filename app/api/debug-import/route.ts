
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Known working preview URL
        const url = "https://nc.netmedia.si:440/index.php/apps/files_sharing/publicpreview/xXMnjAgqBFBG8zG?file=%2FFull%2FJKL-Miklavzev-turnir-2025-001.jpg&x=1920&y=1080&a=true&scalingup=0";

        console.log("Checking CORS for:", url);
        const res = await fetch(url, { method: 'HEAD' });
        console.log(`[${res.status}]`);
        console.log(`   CORS: ${res.headers.get("access-control-allow-origin")}`);

        return NextResponse.json({
            cors: res.headers.get("access-control-allow-origin"),
            status: res.status
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message });
    }
}
