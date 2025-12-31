import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const fileUrl = searchParams.get('url');
    const filename = searchParams.get('filename') || 'image.jpg';

    if (!fileUrl) {
        return new NextResponse('Missing url parameter', { status: 400 });
    }

    try {
        console.log(`Redirecting download for: ${fileUrl}`);

        // Return 307 Redirect to let client fetch direct URL
        return NextResponse.redirect(fileUrl, 307);

    } catch (error) {
        console.error('Download redirect error:', error);
        return new NextResponse('Download failed', { status: 500 });
    }
}
