"use server";

import { deleteGallery, saveGallery, getGallery, getGalleries } from "@/lib/storage";
import { Gallery, Photo } from "@/lib/data";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logActivity, deleteLog } from "@/lib/logs";

export async function importFromNextcloud(shareUrl: string): Promise<Photo[]> {
    try {
        console.log("Starting Nextcloud import (Enhanced Dual-Resolution Mode) for:", shareUrl);

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

        // 2. Fetch File List via WebDAV (Recursive)
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

        let match;
        const foundFiles: { path: string, filename: string, folder: string, proxyUrl: string }[] = [];

        // Loop through all matches
        while ((match = hrefRegex.exec(xmlText)) !== null) {
            const href = match[2];
            const decodedHref = decodeURIComponent(href);

            // Handle relative path extraction
            let relativePath = decodedHref;
            if (relativePath.includes('/public.php/webdav')) {
                relativePath = relativePath.split('/public.php/webdav')[1];
            }

            if (!relativePath) continue;

            const pathParts = relativePath.split('/');
            const filename = pathParts.pop();

            if (!filename) continue;

            // Skip directories by checking extension
            const isImage = filename.match(/\.(jpg|jpeg|png|webp|avif)$/i);

            if (isImage) {
                // Determine folder (e.g. "Web" or "Full")
                const parentFolder = pathParts[pathParts.length - 1]; // Last part before filename

                // Construct PROXY URL
                const fullPath = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
                const proxyUrl = `/api/proxy?server=${encodeURIComponent(baseUrl)}&token=${encodeURIComponent(token)}&path=${encodeURIComponent(fullPath)}`;

                foundFiles.push({
                    path: relativePath,
                    filename: filename,
                    folder: parentFolder,
                    proxyUrl: proxyUrl
                });
            }
        }

        console.log(`Found ${foundFiles.length} total images. Sorting into Web/Full...`);

        // 4. Pair "Full" and "Web" images
        // Logic: Group by "basename" (canonical name).
        // Rules:
        // - Naming: "Image_Web.jpg" -> Base: "Image", Type: Web
        // - Naming: "Image_Full.jpg" -> Base: "Image", Type: Full
        // - Folder: "Web/Image.jpg"   -> Base: "Image", Type: Web
        // - Default: "Image.jpg"      -> Base: "Image", Type: Full (unless a better Full exists?)

        const groups: { [key: string]: { full?: typeof foundFiles[0], web?: typeof foundFiles[0] } } = {};

        foundFiles.forEach(file => {
            // Normalize filename to create a "key" for pairing
            // Strategy: Remove "_web" and "_full" (case insensitive) from the name
            // Example: "Concert_Full (1).jpg" -> "Concert (1)"
            // Example: "Concert_Web (1).jpg" -> "Concert (1)"
            // This preserves the (1) so duplicates don't merge into one generic entry

            const nameWithoutExt = file.filename.replace(/\.[^/.]+$/, "");
            const canonicalName = nameWithoutExt
                .replace(/_web/gi, "")
                .replace(/_full/gi, "")
                .trim()
                .toLowerCase();

            let type: 'full' | 'web' = 'full'; // Default assumption

            // Detect Type
            const lowerName = nameWithoutExt.toLowerCase();
            if (lowerName.includes('_web') || (file.folder && file.folder.toLowerCase() === 'web')) {
                type = 'web';
            } else if (lowerName.includes('_full') || (file.folder && file.folder.toLowerCase() === 'full')) {
                type = 'full';
            }
            // If neither logic hits, we treat it as 'full' (master), assuming it's a standalone high-res image

            if (!groups[canonicalName]) {
                groups[canonicalName] = {};
            }

            if (type === 'web') {
                groups[canonicalName].web = file;
            } else {
                groups[canonicalName].full = file;
            }
        });

        const photos: Photo[] = [];

        // Create Photo objects
        for (const basename in groups) {
            const group = groups[basename];

            // Must have at least one version.
            // If we have Full, use it as Main. If we only have Web, should we skip?
            // Decision: If we only have Web, we treat it as Main (fallback), but ideally we want Full.
            // If we have both, Full is Main, Web is Preview.

            const main = group.full || group.web;
            const preview = group.web;

            if (!main) continue;

            photos.push({
                id: Math.random().toString(36).substr(2, 9),
                src: main.proxyUrl, // Download/HighRes URL
                previewSrc: preview ? preview.proxyUrl : undefined, // Display URL (Web version if exists)
                width: 1920,
                height: 1080,
                alt: main.filename // Use original filename
            });
        }

        console.log(`Result: ${photos.length} gallery items created.`);
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
    const idStr = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    // Validate ID Uniqueness (The auto-generated ID from Title)
    const galleries = await getGalleries();
    const idConflict = galleries.find(g => g.id === idStr || g.slug === idStr);
    if (idConflict) {
        return { error: `Naslov "${title}" generira ID "${idStr}", ki je že v uporabi (kot ID ali Slug). Prosim spremeni naslov.` };
    }

    // Validate Slug Uniqueness
    if (slug) {
        const conflict = galleries.find(g => g.slug === slug || g.id === slug);
        if (conflict) {
            return { error: `Slug (povezava) "${slug}" je že v uporabi. Izberi drugega.` };
        }
    }

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
        slug: slug || undefined, // Save slug
        downloadable,
        photos
    };

    try {
        await saveGallery(newGallery);
        const user = process.env.ADMIN_USERNAME || "Admin";
        await logActivity('CREATE_GALLERY', `Created gallery: ${title} (${photos.length} photos) [Slug: ${slug || 'none'}]`, user);
    } catch (e: any) {
        console.error("Create Gallery Error:", e);
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
    const slug = formData.get("slug") as string; // Get slug
    const downloadable = formData.get("downloadable") === "on";

    // Validate Slug Uniqueness (Exclude current gallery)
    if (slug) {
        const galleries = await getGalleries();
        const conflict = galleries.find(g => (g.slug === slug || g.id === slug) && g.id !== id);
        if (conflict) {
            return { error: `Slug (povezava) "${slug}" je že v uporabi. Izberi drugega.` };
        }
    }

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
        slug: slug || undefined, // Update slug
        downloadable,
        photos
    };

    try {
        await saveGallery(updated);
        const user = process.env.ADMIN_USERNAME || "Admin";
        await logActivity('UPDATE_GALLERY', `Updated gallery: ${title} (Total: ${photos.length} photos) [Slug: ${slug || 'none'}]`, user);
    } catch (e: any) {
        console.error("Update Gallery Error:", e);
        return { error: e.message || "Failed to update gallery" };
    }

    revalidatePath("/");
    revalidatePath("/admin");
    revalidatePath(`/galerija/${id}`);
    if (slug) revalidatePath(`/galerija/${slug}`); // Revalidate slug path too

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
        slug?: string;
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

        if (data.slug) {
            const galleries = await getGalleries();
            const conflict = galleries.find(g => (g.slug === data.slug || g.id === data.slug) && g.id !== id);
            if (conflict) {
                return { success: false, error: `Slug "${data.slug}" je že v uporabi.` };
            }
        }

        const updated: Gallery = {
            ...existing,
            title: data.title,
            date: data.date,
            password: data.password || undefined,
            coverImage: data.coverImage,
            category: data.category,
            slug: data.slug || undefined,
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
