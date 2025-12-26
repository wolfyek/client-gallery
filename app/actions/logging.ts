"use server";

import { logDownload } from "@/lib/logs";

export async function recordDownload(email: string, galleryTitle: string, photoId: string, photoSrc: string, photoName: string) {
    await logDownload(email, galleryTitle, photoId, photoSrc, photoName);
}
