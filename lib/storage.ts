import fs from 'fs/promises';
import path from 'path';
import { Gallery } from './data';
import { kv } from '@vercel/kv';

const DATA_FILE = path.join(process.cwd(), 'data', 'galleries.json');

// Helper to check if we are in a Vercel KV environment
const hasKV = () => !!process.env.KV_REST_API_URL;

export async function getGalleries(): Promise<Gallery[]> {
    try {
        if (hasKV()) {
            // Production / Preview with KV
            const data = await kv.get<Gallery[]>('galleries');
            return data || [];
        } else {
            // Local Development
            await ensureDataDir();
            const data = await fs.readFile(DATA_FILE, 'utf-8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.warn("Storage Read Error (returning empty):", error);
        return [];
    }
}

export async function saveGalleries(galleries: Gallery[]) {
    if (hasKV()) {
        await kv.set('galleries', galleries);
    } else {
        await ensureDataDir();
        await fs.writeFile(DATA_FILE, JSON.stringify(galleries, null, 2), 'utf-8');
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
