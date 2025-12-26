import fs from 'fs/promises';
import path from 'path';
import { Gallery } from './data';

const DATA_FILE = path.join(process.cwd(), 'data', 'galleries.json');

export async function getGalleries(): Promise<Gallery[]> {
    try {
        const data = await fs.readFile(DATA_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        // If file doesn't exist, return empty array
        return [];
    }
}

export async function saveGalleries(galleries: Gallery[]) {
    await fs.writeFile(DATA_FILE, JSON.stringify(galleries, null, 2), 'utf-8');
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
