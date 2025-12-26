import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatSlovenianDate(isoDate: string) {
    const date = new Date(isoDate);
    return date.toLocaleDateString("sl-SI", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });
}

export function downloadImage(url: string, filename: string) {
    const proxyUrl = `/api/download?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}`;

    // Create invisible link and click it to trigger native browser download
    const link = document.createElement('a');
    link.href = proxyUrl;
    link.download = filename; // Backup hint
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
