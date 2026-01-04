
import { NextRequest, NextResponse } from 'next/server';
import { resolveNextcloudDownloadUrl } from '@/lib/utils';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const fileUrl = searchParams.get('url');

    if (!fileUrl) {
        return new NextResponse('Missing url parameter', { status: 400 });
    }

    // STRICT NO-PROXY POLICY
    // We only perform a 307 Redirect. No fetching.

    // Resolve to the "Force Download" version of the URL if possible
    const targetUrl = resolveNextcloudDownloadUrl(fileUrl) || fileUrl;

    return NextResponse.redirect(targetUrl, 307);
}
