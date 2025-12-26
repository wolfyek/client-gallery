export type Photo = {
    id: string;
    src: string;
    width: number;
    height: number;
    alt: string;
};

export type Gallery = {
    id: string;
    title: string;
    description?: string;
    date: string;
    coverImage: string;
    password?: string; // If undefined, it's public
    downloadable?: boolean; // Defaults to true if undefined
    category?: string; // Koncert, Poroka, Krst, Rojstni dan
    photos: Photo[];
};
