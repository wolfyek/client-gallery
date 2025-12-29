import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const fileUrl = searchParams.get('url');
    const filename = searchParams.get('filename') || 'image.jpg';

    if (!fileUrl) {
        return new NextResponse('Missing url parameter', { status: 400 });
    }

    try {
        const fetchUrl = fileUrl.startsWith('/')
            ? `${request.nextUrl.origin}${fileUrl}`
            : fileUrl;

        console.log(`Proxying download for: ${fetchUrl}`);
        const response = await fetch(fetchUrl);
        if (!response.ok) throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);

        const blob = await response.blob();
        const headers = new Headers();

        headers.set('Content-Type', response.headers.get('Content-Type') || 'image/jpeg');
        headers.set('Content-Disposition', `attachment; filename="${filename}"`);
        headers.set('Content-Length', blob.size.toString());

        return new NextResponse(blob, { headers });
    } catch (error) {
        console.error('Proxy download error:', error);
        return new NextResponse('Download failed', { status: 500 });
    }
}
