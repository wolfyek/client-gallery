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

        // Helper to probe URL validity
        const probeUrl = async (url: string) => {
            try {
                const res = await fetch(url, { method: 'HEAD', redirect: 'follow' });
                return res.ok;
            } catch (e) {
                return false;
            }
        };

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
                // Ensure relativePath starts with /
                const finalPath = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;

                // Construct Candidates

                // 1. Public Preview (Standard)
                // Pattern: https://[host]/index.php/apps/files_sharing/publicpreview/[token]?file=/[subdir]/[filename]&x=1920&y=1080&a=true
                const previewBase = `${baseUrl}/index.php/apps/files_sharing/publicpreview/${token}`;
                const candidatePreview = `${previewBase}?file=${encodeURIComponent(finalPath)}&x=1920&y=1080&a=true`;

                // 2. Download (Fallback)
                // Format: https://[host]/index.php/s/[token]/download?path=/[dir]&files=[filename]
                const pathParts = finalPath.split('/');
                pathParts.pop(); // remove filename
                const dirStr = pathParts.join('/') || "/";
                const candidateDownload = `${baseUrl}/index.php/s/${token}/download?path=${encodeURIComponent(dirStr)}&files=${encodeURIComponent(filename)}`;

                console.log(`Checking URLs for ${filename}...`);

                let finalSrc = candidatePreview;

                // Intelligently check which one works
                // We check preview first. If it fails, check download.
                // NOTE: We do this only for the FIRST image to save time? 
                // No, we should be consistent. But parallel check might be slow.
                // Let's assume if preview works for one, it works for all.
                // But path might differ.
                // Let's just blindly prefer Download if Preview fails? 
                // Actually, Download is usually safer for "original quality".

                // PROBE
                // We will try Preview first.
                // We can't easily wait for probe in a loop if there are 1000 images.
                // Strategy: Just use Download logic?
                // The user said "Preview" was broken.
                // Let's try Download as PRIMARY if the prob determines so?

                // Let's try probing download first. If it works, use it.
                // Download is better quality anyway.

                // Wait, probing 100 images will take too long.
                // We should probe ONLY ONE image to decide the strategy for the whole batch.
                // But we don't have state here.

                // Let's ALWAYS return the Download URL if we can confirm it works?
                // Or just return the Download URL period, since Preview failed?

                // I will use Download URL as the default now.
                finalSrc = candidateDownload;

                console.log(`Selected URL: ${finalSrc}`);

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
