export type Language = 'sl' | 'en';

export const translations = {
    sl: {
        // Generics
        loading: "Nalaganje...",
        error: "Napaka",
        success: "Uspešno",

        // Gallery Grid
        download_all: "Prenesi Vse",
        preparing_download: "Pripravljam",
        download_single: "Prenesi",
        view_large: "Velik Pogled",
        view_grid: "Grid Pogled",
        view_compact: "Kompakten Pogled",

        // Email Modal
        download_photos: "Prenos Fotografij",
        enter_email_desc: "Prosim, vnesite vaš e-poštni naslov za nadaljevanje prenosa.",
        email_placeholder: "vas@email.com",
        confirm_and_download: "Potrdi in Prenesi",

        // Password Gate
        password_required: "Zahtevano Geslo",
        password_desc: "Ta galerija je zaščitena. Prosim vnesite geslo za dostop.",
        enter_password: "Vnesite geslo",
        enter_gallery: "Vstopi",
        wrong_password: "Napačno geslo",

        // Navigation / Home
        home_title: "Farkaš Timi",
        home_subtitle: "GALERIJE FOTOGRAFIJ",
        my_website: "Moja Spletna Stran",
        gallery_locked: "Zaklenjeno",
        gallery_photos: "fotografij",

        // Home Search & Filter
        search_placeholder: "ISKANJE...",
        category_label: "Kategorija:",
        all_categories: "VSE",
        private: "ZASEBNO",
        public: "JAVNO",
        no_results: "Ni rezultatov",

        // Footer / Meta
        footer_rights: "Vse pravice pridržane.",
    },
    en: {
        // Generics
        loading: "Loading...",
        error: "Error",
        success: "Success",

        // Gallery Grid
        download_all: "Download All",
        preparing_download: "Preparing",
        download_single: "Download",
        view_large: "Large View",
        view_grid: "Grid View",
        view_compact: "Compact View",

        // Email Modal
        download_photos: "Download Photos",
        enter_email_desc: "Please enter your email address to continue the download.",
        email_placeholder: "your@email.com",
        confirm_and_download: "Confirm & Download",

        // Password Gate
        password_required: "Password Required",
        password_desc: "This gallery is protected. Please enter the password to access.",
        enter_password: "Enter password",
        enter_gallery: "Enter",
        wrong_password: "Wrong password",

        // Navigation / Home
        home_title: "Farkas Timi",
        home_subtitle: "PHOTO GALLERIES",
        my_website: "My Website",
        gallery_locked: "Locked",
        gallery_photos: "photos",

        // Home Search & Filter
        search_placeholder: "SEARCH...",
        category_label: "Category:",
        all_categories: "ALL",
        private: "PRIVATE",
        public: "PUBLIC",
        no_results: "No results",

        // Footer / Meta
        footer_rights: "All rights reserved.",
    }
} as const;

export function getTranslation(lang: Language) {
    return translations[lang] || translations.sl;
}
