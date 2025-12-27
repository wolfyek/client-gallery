"use server";

import { deleteGallery, saveGallery, getGallery } from "@/lib/storage";
import { Gallery, Photo } from "@/lib/data";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logActivity, deleteLog } from "@/lib/logs";

export async function importFromNextcloud(shareUrl: string): Promise<Photo[]> {
    try {
        console.log("Starting Nextcloud import (Preview Link Mode) for:", shareUrl);

        // 1. Extract Token and Base URL
        const url = new URL(shareUrl);
        const pathParts = url.pathname.split('/');
        const tokenIndex = pathParts.indexOf('s');

        if (tokenIndex === -1 || tokenIndex + 1 >= pathParts.length) {
            throw new Error("Invalid Nextcloud Share URL. Must contain /s/[token]");
        }

        const token = pathParts[tokenIndex + 1];
        const baseUrl = `${url.protocol}//${url.host}`;
        const webdavUrl = `${baseUrl}/public.php/webdav`;

        console.log("Token:", token);

        // 2. Fetch File List via WebDAV
        const response = await fetch(webdavUrl, {
            method: 'PROPFIND',
            headers: {
                'Authorization': 'Basic ' + Buffer.from(token + ':').toString('base64'),
                'Depth': 'infinity',
            }
        });

        if (!response.ok) {
            const txt = await response.text();
            console.error("Nextcloud WebDAV Error:", response.status, txt);
            throw new Error(`Failed to connect to Nextcloud. Status: ${response.status}`);
        }

        const xmlText = await response.text();

        // 3. Regex Parsing
        const hrefRegex = /<([a-z0-9]+:)?href>([^<]+)<\/([a-z0-9]+:)?href>/gi;

        const photos: Photo[] = [];
        let match;

        // Loop through all matches
        while ((match = hrefRegex.exec(xmlText)) !== null) {
            const href = match[2];
            const decodedHref = decodeURIComponent(href);

            // Handle relative path extraction
            // WebDAV path usually looks like /public.php/webdav/folder/image.jpg
            let relativePath = decodedHref;
            if (relativePath.includes('/public.php/webdav')) {
                relativePath = relativePath.split('/public.php/webdav')[1];
            }

            if (!relativePath) continue;

            const filename = relativePath.split('/').pop();
            if (!filename) continue;

            // Skip directories (simplistic check, but valid since we check extension)
            if (relativePath.endsWith('/')) continue;

            const isImage = filename.match(/\.(jpg|jpeg|png|webp|avif)$/i);

            if (isImage) {
                // Construct Public Preview URL
                // We use standard encodeURI to preserve slashes for the path
                // Pattern: https://[host]/index.php/apps/files_sharing/publicpreview/[token]?file=/[subdir]/[filename]&x=1920&y=1080&a=true

                // Ensure relativePath starts with /
                const finalPath = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;

                const previewBase = `${baseUrl}/index.php/apps/files_sharing/publicpreview/${token}`;

                // CRITICAL: We use encodeURIComponent for the WHOLE path but we might need to be careful.
                // Actually, standard browsers encode slashes in query params as %2F.
                // But Nextcloud might want them raw? 
                // Let's try to mimic the "yesterday" logic which was just `file=/${filename}` but with the full path.
                // If I use `file=${finalPath}`, the browser will encode it.
                // Let's try `encodeURIComponent(finalPath)` which produces %2F.
                // If that failed, let's try `finalPath` directly (so spaces are encoded but slashes might be kept if manual?)
                // Wait, if I put it in a string, it's just a string.

                // LET'S TRY: encodeURIComponent but replace %2F with / ?
                // No, that's partial encoding.

                // The most standard way is `encodeURIComponent`. 
                // However, I will try to use `previewBase` again.
                // And I will try to make sure `finalPath` is correct.

                const finalSrc = `${previewBase}?file=${encodeURIComponent(finalPath)}&x=1920&y=1080&a=true`;

                console.log(`Generated Preview URL so far: ${finalSrc}`);

                photos.push({
                    id: Math.random().toString(36).substr(2, 9),
                    src: finalSrc,
                    width: 1920,
                    height: 1080,
                    alt: filename
                });
            }
        }

        console.log(`Successfully found ${photos.length} images.`);
        return photos;

    } catch (error) {
        console.error("Nextcloud Import Error:", error);
        throw error;
    }
}

export async function createGallery(formData: FormData) {
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const date = formData.get("date") as string;
    const password = formData.get("password") as string;
    const coverImage = formData.get("coverImage") as string;
    const category = formData.get("category") as string;
    const downloadable = formData.get("downloadable") === "on";
    const idStr = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const photosJson = formData.get("photos") as string;

    let photos = [];
    try {
        if (photosJson) photos = JSON.parse(photosJson);
    } catch (e) {
        console.error("Failed to parse photos", e);
    }

    const newGallery: Gallery = {
        id: idStr,
        title,
        description,
        date,
        password,
        coverImage,
        category,
        downloadable,
        photos
    };

    try {
        await saveGallery(newGallery);
        const user = process.env.ADMIN_USERNAME || "Admin";
        await logActivity('CREATE_GALLERY', `Created gallery: ${title} (${photos.length} photos)`, user);
    } catch (e: any) {
        console.error("Create Gallery Error:", e);
        // Return the error instead of throwing to avoid Next.js masking it
        return { error: e.message || "Failed to create gallery" };
    }

    revalidatePath("/");
    revalidatePath("/admin");

    return { success: true };
}

export async function updateGallery(id: string, formData: FormData) {
    const existing = await getGallery(id);
    if (!existing) throw new Error("Gallery not found");

    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const date = formData.get("date") as string;
    const password = formData.get("password") as string;
    const coverImage = formData.get("coverImage") as string;
    const category = formData.get("category") as string;
    const downloadable = formData.get("downloadable") === "on";
    const photosJson = formData.get("photos") as string;

    let photos = existing.photos;
    try {
        console.log(`Update payload for ${id}: Photos JSON length=${photosJson?.length}`);
        if (photosJson) {
            photos = JSON.parse(photosJson);
            console.log(`Parsed ${photos.length} photos.`);
        } else {
            console.log("No photos JSON provided, keeping existing.");
        }
    } catch (e) {
        console.error("Failed to parse photos", e);
    }

    const updated: Gallery = {
        ...existing,
        title,
        description,
        date,
        password,
        coverImage,
        category,
        downloadable,
        photos
    };

    try {
        await saveGallery(updated);
        const user = process.env.ADMIN_USERNAME || "Admin";
        await logActivity('UPDATE_GALLERY', `Updated gallery: ${title} (Total: ${photos.length} photos)`, user);
    } catch (e: any) {
        console.error("Update Gallery Error:", e);
        return { error: e.message || "Failed to update gallery" };
    }

    revalidatePath("/");
    revalidatePath("/admin");
    revalidatePath(`/galerija/${id}`);

    return { success: true };
}

export async function updateGalleryMetadata(
    id: string,
    data: {
        title: string;
        date: string;
        password?: string;
        coverImage: string;
        category?: string;
        downloadable: boolean;
        description?: string;
    }
) {
    try {
        console.log(`[MetadataUpdate] Starting for ${id}`, data);
        const existing = await getGallery(id);
        if (!existing) {
            console.error(`[MetadataUpdate] Gallery ${id} not found`);
            throw new Error("Gallery not found");
        }

        const updated: Gallery = {
            ...existing,
            title: data.title,
            date: data.date,
            password: data.password || undefined,
            coverImage: data.coverImage,
            category: data.category,
            downloadable: data.downloadable,
            description: data.description || "",
        };

        await saveGallery(updated);
        const user = process.env.ADMIN_USERNAME || "Admin";
        await logActivity('UPDATE_GALLERY', `Updated metadata: ${data.title}`, user);

        // FORCE READ-BACK VERIFICATION
        const verify = await getGallery(id);

        console.log(`[MetadataUpdate] Verification - Title: ${verify?.title}`);

        revalidatePath("/");
        revalidatePath("/admin");
        revalidatePath(`/galerija/${id}`);

        return { success: true, debugMessage: `Saved!` };
    } catch (e) {
        console.error("[MetadataUpdate] Error:", e);
        return { success: false, error: e instanceof Error ? e.message : "Unknown server error" };
    }
}

export async function removeGallery(id: string) {
    const existing = await getGallery(id);
    const title = existing ? existing.title : id;

    await deleteGallery(id);

    const user = process.env.ADMIN_USERNAME || "Admin";
    await logActivity('DELETE_GALLERY', `Izbrisana galerija: ${title}`, user);

    revalidatePath("/");
    revalidatePath("/admin");
}

export async function removeLogAction(id: string, type: 'activity' | 'download') {
    await deleteLog(id, type);
    revalidatePath("/admin/logs");
}
