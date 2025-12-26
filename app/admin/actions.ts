"use server";

import { deleteGallery, saveGallery, getGallery } from "@/lib/storage";
import { Gallery, Photo } from "@/lib/data";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logActivity } from "@/lib/logs";

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
                'Depth': '1',
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
            const filename = decodedHref.split('/').pop();

            if (!filename) continue;

            const isImage = filename.match(/\.(jpg|jpeg|png|webp|avif)$/i);

            if (isImage) {
                // Construct Public Preview URL
                // Pattern: https://[host]/index.php/apps/files_sharing/publicpreview/[token]?file=/[filename]&x=1920&y=1080&a=true
                const previewBase = `${baseUrl}/index.php/apps/files_sharing/publicpreview/${token}`;
                const finalSrc = `${previewBase}?file=/${encodeURIComponent(filename)}&x=1920&y=1080&a=true`;

                console.log(`Generated Preview URL: ${finalSrc}`);

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
        downloadable,
        photos
    };

    await saveGallery(newGallery);
    await logActivity('CREATE_GALLERY', `Created gallery: ${title} (${photos.length} photos)`);

    revalidatePath("/");
    revalidatePath("/admin");
    redirect("/admin");
}

export async function updateGallery(id: string, formData: FormData) {
    const existing = await getGallery(id);
    if (!existing) throw new Error("Gallery not found");

    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const date = formData.get("date") as string;
    const password = formData.get("password") as string;
    const coverImage = formData.get("coverImage") as string;
    const downloadable = formData.get("downloadable") === "on";
    const photosJson = formData.get("photos") as string;

    let photos = existing.photos;
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
        downloadable,
        photos
    };

    await saveGallery(updated);
    await logActivity('UPDATE_GALLERY', `Updated gallery: ${title} (Total: ${photos.length} photos)`);

    revalidatePath("/");
    revalidatePath("/admin");
    revalidatePath(`/galerija/${id}`);
    redirect("/admin");
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
