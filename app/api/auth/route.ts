import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const serverPassword = process.env.ADMIN_PASSWORD || "admin123";
        const serverUsername = process.env.ADMIN_USERNAME || "admin";

        if (body.username === serverUsername && body.password === serverPassword) {
            // Set cookie
            cookies().set("admin_session", "true", {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                path: "/",
                maxAge: 60 * 60 * 24 * 7, // 1 week
            });

            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ success: false }, { status: 401 });
    } catch (e) {
        return NextResponse.json({ success: false }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    cookies().delete("admin_session");
    return NextResponse.json({ success: true });
}
