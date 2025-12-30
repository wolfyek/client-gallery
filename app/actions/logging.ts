"use server";

import { logDownload } from "@/lib/logs";

export async function recordDownload(email: string, galleryTitle: string, photoId: string, photoSrc: string, photoName: string) {
    await logDownload(email, galleryTitle, photoId, photoSrc, photoName);
}

import { deleteAllLogs as deleteAllLogsLib } from "@/lib/logs";
import { revalidatePath } from "next/cache";

export async function deleteAllLogs() {
    await deleteAllLogsLib();
    revalidatePath("/admin/logs");
}
