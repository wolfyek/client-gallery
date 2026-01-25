"use client";

import { useState, useEffect } from "react";
import { type Gallery } from "@/lib/data";
import { type Language, getTranslation } from "@/lib/i18n";
import PasswordGate from "@/components/PasswordGate";
import GalleryGrid from "@/components/GalleryGrid";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { formatDate } from "@/lib/utils"; // We'll keep Slovenian date format for now as requested
import Image from "next/image";

interface GalleryClientProps {
    gallery: Gallery;
    lang?: Language;
}

export default function GalleryClient({ gallery, lang = 'sl' }: GalleryClientProps) {
    const t = getTranslation(lang);
    const [isLocked, setIsLocked] = useState(!!gallery.password);
    const [isChecking, setIsChecking] = useState(true);

    const displayTitle = (lang === 'en' && gallery.titleEn) ? gallery.titleEn : gallery.title;
    const displayDesc = (lang === 'en' && gallery.descriptionEn) ? gallery.descriptionEn : gallery.description;

    useEffect(() => {
        if (!gallery.password) {
            setIsLocked(false);
            setIsChecking(false);
            window.scrollTo(0, 0); // Force scroll to top for public galleries
            return;
        }

        const storedAuth = localStorage.getItem(`gallery_auth_${gallery.id}`);
        if (storedAuth === "true") {
            setIsLocked(false);
        }
        setIsChecking(false);
        window.scrollTo(0, 0); // Force scroll to top after auth check
    }, [gallery.id, gallery.password]);

    const handleUnlock = async (password: string) => {
        // Simple client-side check since we have the hash/password available or checking against prop
        // The previous implementation likely checked against the raw password string passed in props.
        // BE CAREFUL: Passing raw password to client is insecure but that's how it was set up (correctPassword={gallery.password}).
        // Ideally we should use a server action, but to match previous behavior:

        // Wait, gallery.password is likely the plain text password based on previous code usage?
        // Or is it a hash? The previous code was `if (password === correctPassword)`.
        // So we assume it is plain text for this simple app.

        if (password === gallery.password) {
            localStorage.setItem(`gallery_auth_${gallery.id}`, "true");
            setIsLocked(false);
            return true;
        }
        return false;
    };

    if (isChecking) return null; // Prevent flash

    if (isLocked) {
        return (
            <PasswordGate
                isLocked={isLocked}
                onUnlock={handleUnlock}
                galleryTitle={displayTitle}
                coverImage={gallery.coverImage}
                lang={lang}
            />
        );
    }

    return (
        <main className="min-h-screen bg-[#121212] text-white">
            {/* Navigation / Back Button */}
            <nav className="fixed top-0 left-0 w-full z-50 px-6 py-6 mix-blend-difference">
                <Link
                    href={lang === 'en' ? "/eng" : "/"}
                    className="flex items-center gap-2 text-white/70 hover:text-white transition-colors uppercase tracking-widest text-xs font-dm"
                >
                    <ArrowLeft className="w-4 h-4" /> {lang === 'en' ? "Back to galleries" : "Nazaj na galerije"}
                </Link>
            </nav>

            {/* Hero / Header Section */}
            <header className="pt-32 pb-16 px-6 text-center max-w-4xl mx-auto space-y-6">
                <span className="text-xs tracking-[0.3em] uppercase text-white/60 font-dm">
                    {formatDate(gallery.date, lang)}
                </span>

                <h1 className="text-5xl md:text-7xl font-bold tracking-tighter uppercase">
                    {displayTitle}
                </h1>

                <p className="text-lg md:text-xl text-white/70 font-light max-w-2xl mx-auto leading-relaxed font-dm">
                    {displayDesc}
                </p>

                <div className="h-px w-12 bg-white/20 mx-auto mt-8" />
            </header>

            {/* Gallery Content */}
            <GalleryGrid
                photos={gallery.photos}
                galleryTitle={displayTitle}
                allowDownloads={gallery.downloadable ?? true}
                lang={lang}
                slug={gallery.slug}
            />
        </main>
    );
}
