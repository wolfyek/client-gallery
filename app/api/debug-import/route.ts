
import { NextResponse } from "next/server";
import { importFromNextcloud } from "@/app/admin/actions";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const url = "https://nc.netmedia.si:440/index.php/s/Ba43mK37gpHAFHX";
        console.log("Testing import for:", url);
        const result = await importFromNextcloud(url);

        return NextResponse.json({
            success: true,
            count: result.length,
            sample: result.length > 0 ? result[0] : null
        });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message, stack: e.stack }, { status: 500 });
    }
}
