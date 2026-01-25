export type Photo = {
    id: string;
    src: string;
    width: number;
    height: number;
    alt: string;
    previewSrc?: string; // Optional URL for optimized web display
    dateTaken?: string; // ISO string representing the capture date (or last modified)
};

export type Gallery = {
    id: string;
    title: string;
    description?: string;
    date: string;
    coverImage: string;
    coverImagePosition?: string; // CSS object-position value (e.g. 'center', 'top', '50% 20%')
    password?: string; // If undefined, it's public
    downloadable?: boolean; // Defaults to true if undefined
    category?: string;
    slug?: string; // Custom URL slug
    titleEn?: string; // English Title
    descriptionEn?: string; // English Description
    slugEn?: string; // English URL Slug
    hidden?: boolean; // If true, hidden from homepage lists
    photos: Photo[];
};
