import { NextRequest, NextResponse } from 'next/server';

import { resolveNextcloudDownloadUrl } from '@/lib/utils';
// Note: resolveNextcloudDownloadUrl is safe to use on server

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const fileUrl = searchParams.get('url');
    // const filename = searchParams.get('filename') || 'image.jpg'; // Filename is handled by Content-Disposition from Nextcloud

    if (!fileUrl) {
        return new NextResponse('Missing url parameter', { status: 400 });
    }

    try {
        // Enforce Nextcloud Download URL format to ensure Content-Disposition: attachment
        const downloadUrl = resolveNextcloudDownloadUrl(fileUrl) || fileUrl;

        console.log(`Redirecting download. Input: ${fileUrl} -> Target: ${downloadUrl}`);

        // Return 307 Redirect to let client fetch direct URL
        return NextResponse.redirect(downloadUrl, 307);

    } catch (error) {
        console.error('Download redirect error:', error);
        return new NextResponse('Download failed', { status: 500 });
    }
}
