import fs from 'fs/promises';
import path from 'path';
import { Gallery } from './data';
import { kv } from '@vercel/kv';

const DATA_FILE = path.join(process.cwd(), 'data', 'galleries.json');

function hasKV() {
    return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

export async function getGalleries(): Promise<Gallery[]> {
    if (hasKV()) {
        try {
            const data = await kv.get<Gallery[]>('galleries');
            return data || [];
        } catch (error) {
            console.error("KV Read Error:", error);
            // Fallback to empty array or local file could be dangerous if data is split. 
            // Better to return empty and let admin know.
            return [];
        }
    }

    // Local Development / Fallback
    await ensureDataDir();
    try {
        const data = await fs.readFile(DATA_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

export async function saveGalleries(galleries: Gallery[]) {
    if (hasKV()) {
        try {
            await kv.set('galleries', galleries);
            // Optional: Also try to write to disk if we are in a mixed environment, 
            // but on Vercel this will fail and we catch it below. 
            // For now, KV is the source of truth if active.
            return;
        } catch (e) {
            console.error("KV Write Error:", e);
            throw new Error("Failed to save to Vercel KV Database.");
        }
    }

    // Local Development
    try {
        await ensureDataDir();
        await fs.writeFile(DATA_FILE, JSON.stringify(galleries, null, 2), 'utf-8');
    } catch (e) {
        console.error("Local File Write Error:", e);
        if (process.env.NODE_ENV === 'production') {
            throw new Error("Cannot save data: File System is Read-Only and Redis/KV is not configured.");
        }
        throw e;
    }
}

// Helper to ensure data directory exists locally
async function ensureDataDir() {
    try {
        await fs.access(path.dirname(DATA_FILE));
    } catch {
        await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
    }
}

export async function getGallery(id: string): Promise<Gallery | undefined> {
    const galleries = await getGalleries();
    return galleries.find((g) => g.id === id);
}

export async function saveGallery(gallery: Gallery) {
    const galleries = await getGalleries();
    const index = galleries.findIndex((g) => g.id === gallery.id);

    if (index >= 0) {
        galleries[index] = gallery;
    } else {
        galleries.push(gallery);
    }

    await saveGalleries(galleries);
}

export async function deleteGallery(id: string) {
    let galleries = await getGalleries();
    galleries = galleries.filter(g => g.id !== id);
    await saveGalleries(galleries);
}
