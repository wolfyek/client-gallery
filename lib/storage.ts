import fs from 'fs/promises';
import path from 'path';
import { Gallery } from './data';
import { kv, createClient, VercelKV } from '@vercel/kv';
import Redis from 'ioredis';

const DATA_FILE = path.join(process.cwd(), 'data', 'galleries.json');

// --- Storage Adapters ---

export interface IStorage {
    get<T>(key: string): Promise<T | null>;
    set(key: string, value: any): Promise<void>;
}

class VercelKVAdapter implements IStorage {
    constructor(private client: VercelKV) { }
    async get<T>(key: string) { return this.client.get<T>(key); }
    async set(key: string, value: any) { await this.client.set(key, value); }
}

class IOredisAdapter implements IStorage {
    constructor(private client: Redis) { }
    async get<T>(key: string) {
        const val = await this.client.get(key);
        return val ? JSON.parse(val) : null;
    }
    async set(key: string, value: any) {
        await this.client.set(key, JSON.stringify(value));
    }
}

// Factory to get the best available storage client
export function getDB(): IStorage | null {
    // 1. Vercel KV (HTTP)
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
        const client = createClient({
            url: process.env.KV_REST_API_URL,
            token: process.env.KV_REST_API_TOKEN
        });
        return new VercelKVAdapter(client);
    }
    // 2. Generic Redis (TCP) - e.g. Vercel Redis Integration
    if (process.env.REDIS_URL) {
        // Need to ensure we don't crash if connection fails, but ioredis handles retries.
        // On serverless, we usually create a new connection per lambda or reuse if global.
        // For simplicity in this fix, we create new.
        return new IOredisAdapter(new Redis(process.env.REDIS_URL));
    }
    return null;
}

// --- Public API ---

export async function getGalleries(): Promise<Gallery[]> {
    const storage = getDB();
    if (storage) {
        try {
            const data = await storage.get<Gallery[]>('galleries');
            return data || [];
        } catch (error) {
            console.error("Storage Read Error (Redis/KV):", error);
            // If Redis fails, we could fallback to FS, but that might lead to split-brain data.
            // Better to return empty or error. Returning empty [] for safety.
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
    const storage = getDB();
    if (storage) {
        try {
            await storage.set('galleries', galleries);
            return;
        } catch (e) {
            console.error("Storage Write Error (Redis/KV):", e);
            throw new Error("Failed to save to Database (Redis/KV).");
        }
    }

    // Local Development
    try {
        await ensureDataDir();
        await fs.writeFile(DATA_FILE, JSON.stringify(galleries, null, 2), 'utf-8');
    } catch (e) {
        console.error("Local File Write Error:", e);
        if (process.env.NODE_ENV === 'production') {
            const envKeys = Object.keys(process.env).filter(k => k.includes('KV') || k.includes('REDIS') || k.includes('URL') || k.includes('TOKEN'));
            throw new Error(`Cannot save data: File System is Read-Only and Redis/KV is not configured. Debug: [${envKeys.join(', ') || 'NONE'}]`);
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
