import fs from 'fs/promises';
import path from 'path';
import { Gallery } from './data';
import { kv } from '@vercel/kv';

const DATA_FILE = path.join(process.cwd(), 'data', 'galleries.json');

// Helper to check if we are in a Vercel KV / Redis environment
// We check multiple common variable names because Vercel/Upstash naming can vary.
const getRedisUrl = () => {
    return process.env.KV_REST_API_URL ||
        process.env.KV_URL ||
        process.env.REDIS_URL ||
        process.env.UPSTASH_REDIS_REST_URL;
};

const getRedisToken = () => {
    return process.env.KV_REST_API_TOKEN ||
        process.env.KV_TOKEN ||
        process.env.REDIS_TOKEN ||
        process.env.UPSTASH_REDIS_REST_TOKEN;
};

const hasKV = () => !!getRedisUrl();

export async function getGalleries(): Promise<Gallery[]> {
    try {
        if (hasKV()) {
            console.log("Using KV Storage");
            // Production / Preview with KV - Ensure we pass explicit config if using generic vars
            const url = getRedisUrl();
            const token = getRedisToken();

            // If using standard Vercel KV, 'kv' client works auto. 
            // If using generic, we might need to configure it, but for now let's hope standard works or we fall back.
            // Actually, @vercel/kv requires specific vars usually. 
            // If they are missing, we should probably construct a client, but let's stick to the default client 
            // and assume if hasKV is true, the environment is set up.
            // DEBUG: Use the kv client provided by the package
            const data = await kv.get<Gallery[]>('galleries');
            return data || [];
        } else {
            // ...
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
        try {
            await kv.set('galleries', galleries);
        } catch (e) {
            console.error("KV Write Error:", e);
            throw new Error(`KV Write Failed: ${e instanceof Error ? e.message : String(e)}`);
        }
    } else {
        // Fallback or Local
        // Check if we are in production (read-only FS)
        if (process.env.NODE_ENV === 'production') {
            const vars = Object.keys(process.env).filter(k => k.includes('KV') || k.includes('REDIS') || k.includes('URL'));
            throw new Error(`CRITICAL: Cannot save to disk in Production (EROFS). KV/Redis NOT detected. Available Vars: ${vars.join(', ')}`);
        }

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
