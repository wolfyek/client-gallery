import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const LOGS_FILE = path.join(process.cwd(), "data", "logs.json");

export type ActivityLog = {
    id: string;
    type: 'CREATE_GALLERY' | 'UPDATE_GALLERY' | 'DELETE_GALLERY' | 'LOGIN' | 'OTHER';
    description: string;
    user: string;
    timestamp: string;
};

export type DownloadLog = {
    id: string;
    email: string;
    galleryTitle: string;
    photoId: string;
    photoSrc: string;
    photoName: string;
    timestamp: string;
};

type LogsData = {
    activity: ActivityLog[];
    downloads: DownloadLog[];
};


async function ensureLogsFile() {
    try {
        await fs.access(LOGS_FILE);
    } catch {
        try {
            const initialData: LogsData = { activity: [], downloads: [] };
            await fs.mkdir(path.dirname(LOGS_FILE), { recursive: true });
            await fs.writeFile(LOGS_FILE, JSON.stringify(initialData, null, 2));
        } catch (e) {
            console.warn("Could not create logs file (likely Read-Only Environment). Logs will be ephemeral.", e);
        }
    }
}

export async function getLogs(): Promise<LogsData> {
    try {
        await ensureLogsFile();
        const data = await fs.readFile(LOGS_FILE, "utf-8");
        return JSON.parse(data);
    } catch (e) {
        console.warn("Could not read logs file (likely Read-Only Environment). Returning empty logs.", e);
        return { activity: [], downloads: [] };
    }
}

export async function logActivity(type: ActivityLog['type'], description: string, user: string = 'admin') {
    console.log(`[ACTIVITY] ${type}: ${description} (User: ${user})`);
    try {
        const logs = await getLogs();
        const newLog: ActivityLog = {
            id: randomUUID(),
            type,
            description,
            user,
            timestamp: new Date().toISOString(),
        };
        logs.activity.unshift(newLog); // Add to beginning
        await fs.writeFile(LOGS_FILE, JSON.stringify(logs, null, 2));
    } catch (e) {
        console.warn("Failed to persist activity log (ReadOnly FS).", e);
    }
}

export async function logDownload(email: string, galleryTitle: string, photoId: string, photoSrc: string, photoName: string) {
    console.log(`[DOWNLOAD] ${email} downloaded ${photoName} from ${galleryTitle}`);
    try {
        const logs = await getLogs();
        const newLog: DownloadLog = {
            id: randomUUID(),
            email,
            galleryTitle,
            photoId,
            photoSrc,
            photoName,
            timestamp: new Date().toISOString(),
        };
        logs.downloads.unshift(newLog); // Add to beginning
        await fs.writeFile(LOGS_FILE, JSON.stringify(logs, null, 2));
    } catch (e) {
        console.warn("Failed to persist download log (ReadOnly FS).", e);
    }
}
