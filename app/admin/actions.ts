"use server";

import { deleteGallery, saveGallery, getGallery, getGalleries } from "@/lib/storage";
import { Gallery, Photo } from "@/lib/data";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logActivity, deleteLog } from "@/lib/logs";
import { XMLParser } from "fast-xml-parser";

export async function importFromNextcloud(shareUrl: string): Promise<Photo[]> {
    try {
        console.log("Starting Nextcloud import (Enhanced Dual-Resolution Mode) for:", shareUrl);

        // 1. Extract Token and Base URL
        const url = new URL(shareUrl);
        const pathParts = url.pathname.split('/');

        // Try to find token in standard share URL /s/[token]
        let tokenIndex = pathParts.indexOf('s');

        // If not found, try to find in WebDAV URL /public.php/dav/files/[token]
        if (tokenIndex === -1) {
            const davIndex = pathParts.indexOf('dav');
            if (davIndex !== -1 && pathParts[davIndex + 1] === 'files') {
                tokenIndex = davIndex + 1; // "files" is at index+1, token is at index+2
            }
        }

        let token = "";

        if (pathParts.includes('s')) {
            token = pathParts[pathParts.indexOf('s') + 1];
        } else if (pathParts.includes('files') && pathParts.includes('dav')) {
            token = pathParts[pathParts.indexOf('files') + 1];
        }

        if (!token) {
            throw new Error("Invalid Nextcloud Share URL. Must contain /s/[token] or be a WebDAV URL.");
        }

        // Correct Base URL extraction
        let baseUrl = "";
        const sIndex = shareUrl.indexOf('/s/' + token);
        if (sIndex !== -1) {
            baseUrl = shareUrl.substring(0, sIndex);
            if (baseUrl.endsWith("/index.php")) {
                baseUrl = baseUrl.substring(0, baseUrl.length - "/index.php".length);
            }
        } else {
            const publicIndex = shareUrl.indexOf('/public.php');
            if (publicIndex !== -1) {
                baseUrl = shareUrl.substring(0, publicIndex);
            } else {
                baseUrl = url.origin;
            }
        }

        const webdavUrl = `${baseUrl}/public.php/webdav`;

        console.log("Token:", token);
        console.log("Base URL:", baseUrl);

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

        // 3. XML Parsing with fast-xml-parser
        const parser = new XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: ""
        });
        const parsed = parser.parse(xmlText);

        const foundFiles: { path: string, filename: string, folder: string, proxyUrl: string, lastMod: string }[] = [];

        // Navigate structure: multistatus -> response (array or single object)
        // Handle namespaced keys (d:multistatus) or standard keys
        const multi = parsed['d:multistatus'] || parsed.multistatus;
        const responses = multi?.['d:response'] || multi?.response;

        const responseList = Array.isArray(responses) ? responses : (responses ? [responses] : []);

        for (const resp of responseList) {
            if (!resp) continue;

            const href = resp['d:href'] || resp.href;
            if (!href) continue;

            const decodedHref = decodeURIComponent(href);

            // Extract 'getlastmodified'
            let lastMod = "";
            const propstatRaw = resp['d:propstat'] || resp.propstat;
            const propstats = Array.isArray(propstatRaw) ? propstatRaw : [propstatRaw];

            for (const stat of propstats) {
                const prop = stat?.['d:prop'] || stat?.prop;
                if (prop) {
                    const lm = prop['d:getlastmodified'] || prop.getlastmodified;
                    if (lm) {
                        lastMod = lm;
                        break;
                    }
                }
            }

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
                const parentFolder = pathParts[pathParts.length - 1];
                const cleanServer = baseUrl.replace(/\/$/, "");
                const cleanPath = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;

                // IMPROVEMENT: Request larger dimensions (3000x3000) to ensure 16:10 or Portrait images aren't cropped/downscaled to 16:9
                const directUrl = `${cleanServer}/index.php/apps/files_sharing/publicpreview/${token}?file=${encodeURIComponent(cleanPath)}&x=3000&y=3000&a=true&scalingup=0`;

                foundFiles.push({
                    path: relativePath,
                    filename: filename,
                    folder: parentFolder,
                    proxyUrl: directUrl,
                    lastMod: lastMod
                });
            }
        }

        console.log(`Found ${foundFiles.length} total images. Sorting into Web/Full...`);

        // 4. Pair "Full" and "Web" images
        const groups: { [key: string]: { full?: typeof foundFiles[0], web?: typeof foundFiles[0] } } = {};

        foundFiles.forEach(file => {
            const nameWithoutExt = file.filename.replace(/\.[^/.]+$/, "");
            const canonicalName = nameWithoutExt
                .replace(/_web/gi, "")
                .replace(/_full/gi, "")
                .trim()
                .toLowerCase();

            let type: 'full' | 'web' = 'full';

            const lowerName = nameWithoutExt.toLowerCase();
            if (lowerName.includes('_web') || (file.folder && file.folder.toLowerCase() === 'web')) {
                type = 'web';
            } else if (lowerName.includes('_full') || (file.folder && file.folder.toLowerCase() === 'full')) {
                type = 'full';
            }

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
            const main = group.full || group.web;
            const preview = group.web;

            if (!main) continue;

            // Parse Date
            let dateTakenStr = main.lastMod; // "Tue, 24 Oct 2023..."

            // Prefer Full image date if available, else Web
            if (group.full && group.full.lastMod) dateTakenStr = group.full.lastMod;

            let isoDate = "";
            try {
                if (dateTakenStr) {
                    isoDate = new Date(dateTakenStr).toISOString();
                }
            } catch (e) {
                console.warn("Failed to parse date:", dateTakenStr);
            }

            photos.push({
                id: Math.random().toString(36).substr(2, 9),
                src: main.proxyUrl,
                previewSrc: preview ? preview.proxyUrl : undefined,
                width: 1920,
                height: 1080,
                alt: main.filename,
                dateTaken: isoDate
            });
        }

        // 5. SORT BY DATE (Earliest to Latest)
        photos.sort((a, b) => {
            if (!a.dateTaken) return 1;
            if (!b.dateTaken) return -1;
            return new Date(a.dateTaken).getTime() - new Date(b.dateTaken).getTime();
        });

        console.log(`Result: ${photos.length} gallery items created (Sorted by Date).`);
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
    const coverImagePosition = formData.get("coverImagePosition") as string;
    const category = formData.get("category") as string;
    const slug = formData.get("slug") as string;
    const titleEn = formData.get("titleEn") as string;
    const descriptionEn = formData.get("descriptionEn") as string;
    const slugEn = formData.get("slugEn") as string;
    const downloadable = formData.get("downloadable") === "on";
    const hidden = formData.get("hidden") === "on";
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

    // Validate English Slug Uniqueness
    if (slugEn) {
        const conflict = galleries.find(g => g.slugEn === slugEn);
        if (conflict) {
            return { error: `Angleški Slug "${slugEn}" je že v uporabi.` };
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
        coverImagePosition: coverImagePosition || 'center',
        category,
        slug: slug || undefined, // Save slug
        titleEn: titleEn || undefined,
        descriptionEn: descriptionEn || undefined,
        slugEn: slugEn || undefined,
        downloadable,
        hidden,
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
    const coverImagePosition = formData.get("coverImagePosition") as string;
    const category = formData.get("category") as string;
    const slug = formData.get("slug") as string;
    const downloadable = formData.get("downloadable") === "on";
    const hidden = formData.get("hidden") === "on";
    const titleEn = formData.get("titleEn") as string;
    const descriptionEn = formData.get("descriptionEn") as string;
    const slugEn = formData.get("slugEn") as string;

    // Validate Slug Uniqueness (Exclude current gallery)
    if (slug) {
        const galleries = await getGalleries();
        const conflict = galleries.find(g => (g.slug === slug || g.id === slug) && g.id !== id);
        if (conflict) {
            return { error: `Slug (povezava) "${slug}" je že v uporabi. Izberi drugega.` };
        }
    }

    // Validate English Slug Uniqueness (Exclude current gallery)
    if (slugEn) {
        const galleries = await getGalleries();
        const conflict = galleries.find(g => (g.slugEn === slugEn) && g.id !== id);
        if (conflict) {
            return { error: `Angleški Slug "${slugEn}" je že v uporabi.` };
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
        coverImagePosition: coverImagePosition || existing.coverImagePosition || 'center',
        category,
        slug: slug || undefined, // Update slug
        titleEn: titleEn || undefined,
        descriptionEn: descriptionEn || undefined,
        slugEn: slugEn || undefined,
        downloadable,
        hidden,
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
        coverImagePosition?: string;
        category?: string;
        slug?: string;
        titleEn?: string;
        descriptionEn?: string;
        slugEn?: string;
        downloadable: boolean;
        hidden?: boolean;
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

        if (data.slugEn) {
            const galleries = await getGalleries();
            const conflict = galleries.find(g => (g.slugEn === data.slugEn) && g.id !== id);
            if (conflict) {
                return { success: false, error: `Angleški Slug "${data.slugEn}" je že v uporabi.` };
            }
        }

        const updated: Gallery = {
            ...existing,
            title: data.title,
            date: data.date,
            password: data.password || undefined,
            coverImage: data.coverImage,
            coverImagePosition: data.coverImagePosition || existing.coverImagePosition || 'center',
            category: data.category,
            slug: data.slug || undefined,
            titleEn: data.titleEn || undefined,
            descriptionEn: data.descriptionEn || undefined,
            slugEn: data.slugEn || undefined,
            downloadable: data.downloadable,
            hidden: data.hidden,
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
