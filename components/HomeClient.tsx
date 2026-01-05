"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatSlovenianDate, resolveNextcloudUrl } from "@/lib/utils";
import { Search, Instagram, Globe } from "lucide-react";
import { type Gallery } from "@/lib/data";
import { getTranslation, type Language } from "@/lib/i18n";

export default function HomeClient({ initialGalleries, lang = 'sl' }: { initialGalleries: Gallery[], lang?: Language }) {
    const t = getTranslation(lang);
    const [query, setQuery] = useState("");
    const [category, setCategory] = useState("VSE");

    const categories = ["VSE", "Koncert", "Poroka", "Krst", "Rojstni dan", "Šport", "Portret"];

    const filteredGalleries = initialGalleries.filter(g => {
        const titleToMatch = (lang === 'en' && g.titleEn) ? g.titleEn : g.title;
        const matchesQuery = titleToMatch.toLowerCase().includes(query.toLowerCase());
        const matchesCategory = category === "VSE" || g.category === category;
        return matchesQuery && matchesCategory;
    });

    return (
        <main className="min-h-screen bg-[#121212] text-white pt-8">
            <div className="w-full max-w-[1400px] mx-auto px-4 md:px-8 pb-8">

                {/* Header Section */}
                <div className="relative mb-8 grid grid-cols-1 md:grid-cols-3 items-start gap-8">

                    {/* Left Column: Search & Categories (Desktop) */}
                    <div className="hidden md:flex flex-col items-start gap-6">
                        <div className="relative w-full max-w-xs group">
                            <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-white group-focus-within:text-white transition-colors" />
                            <input
                                type="text"
                                placeholder={t.search_placeholder}
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className="w-full bg-transparent border-b border-white/80 py-2 pl-8 text-sm text-white focus:outline-none focus:border-white transition-colors placeholder:text-white/60 uppercase tracking-widest font-dm"
                            />
                        </div>
                    </div>

                    {/* Center Column: Logo */}
                    <div className="flex flex-col items-center justify-center space-y-6">
                        <Link href={lang === 'en' ? '/eng' : '/'} className="cursor-pointer">
                            <img
                                src="http://streznik.farkastimi.si/Farkas-LOGO.svg"
                                alt="Farkaš Timi Logo"
                                className="h-20 md:h-28 w-auto hover:opacity-80 transition-opacity"
                            />
                        </Link>
                    </div>

                    {/* Right Column: Socials & Lang Switcher (Desktop) */}
                    <div className="hidden md:flex justify-end gap-6 pt-2 items-center">
                        {/* Language Switcher */}
                        <div className="flex items-center gap-2 text-sm font-dm uppercase tracking-widest border-r border-white/20 pr-6 mr-0">
                            <Link
                                href="/"
                                className={`hover:text-white transition-colors ${lang === 'sl' ? 'text-white font-bold' : 'text-white/50'}`}
                            >
                                SLO
                            </Link>
                            <span className="text-white/20">|</span>
                            <Link
                                href="/eng"
                                className={`hover:text-white transition-colors ${lang === 'en' ? 'text-white font-bold' : 'text-white/50'}`}
                            >
                                ENG
                            </Link>
                        </div>

                        <a
                            href="https://instagram.com/photosbyfarkas"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-white/50 hover:text-white transition-colors"
                            title="Instagram"
                        >
                            <Instagram className="w-5 h-5" />
                        </a>
                        <a
                            href="https://farkastimi.si"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-white/50 hover:text-white transition-colors"
                            title={t.my_website}
                        >
                            <Globe className="w-5 h-5" />
                        </a>
                    </div>
                </div>

                {/* Subtitle */}
                <div className="flex flex-col items-center justify-center mb-10 gap-6">
                    <p className="text-[32px] text-white uppercase font-sans font-bold text-center">
                        {t.home_subtitle}
                    </p>
                    <div className="w-full max-w-xs h-[1px] bg-white/20" />

                    {/* Category Filter - Centered below title */}
                    <div className="flex items-center gap-4">
                        <span className="text-xs uppercase tracking-widest text-white/50 font-dm">{t.category_label}</span>
                        <div className="relative">
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="bg-transparent text-white border-b border-white/40 py-1 pr-8 pl-2 uppercase tracking-widest text-sm font-dm focus:outline-none focus:border-white appearance-none cursor-pointer"
                            >
                                {categories.map((cat) => (
                                    <option key={cat} value={cat} className="bg-[#121212]">
                                        {cat === "VSE" ? t.all_categories : cat}
                                    </option>
                                ))}
                            </select>
                            {/* Custom Arrow */}
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white/50">
                                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                            </div>
                        </div>
                    </div>

                    {/* Mobile Search & Lang - Below Categories */}
                    <div className="md:hidden flex flex-col items-center gap-4 mt-2 w-full">
                        <div className="w-full max-w-[200px] group relative">
                            <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-3 h-3 text-white/50 group-focus-within:text-white transition-colors" />
                            <input
                                type="text"
                                placeholder={t.search_placeholder}
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className="w-full bg-transparent border-b border-white/20 py-2 pl-6 text-xs text-white focus:outline-none focus:border-white/80 transition-colors placeholder:text-white/40 uppercase tracking-widest font-dm text-center"
                            />
                        </div>

                        {/* Mobile Language Switcher */}
                        <div className="flex items-center gap-4 text-xs font-dm uppercase tracking-widest pt-2">
                            <Link
                                href="/"
                                className={`transition-colors ${lang === 'sl' ? 'text-white font-bold' : 'text-white/50'}`}
                            >
                                SLO
                            </Link>
                            <span className="text-white/20">|</span>
                            <Link
                                href="/eng"
                                className={`transition-colors ${lang === 'en' ? 'text-white font-bold' : 'text-white/50'}`}
                            >
                                ENG
                            </Link>
                        </div>
                    </div>

                </div>

                {/* Galleries Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10 min-h-[50vh]">
                    {filteredGalleries.map((gallery) => {
                        const displayTitle = (lang === 'en' && gallery.titleEn) ? gallery.titleEn : gallery.title;
                        // Use valid URL part: slugEn -> slug -> id
                        const linkId = lang === 'en'
                            ? (gallery.slugEn || gallery.slug || gallery.id)
                            : (gallery.slug || gallery.id);

                        return (
                            <Link
                                key={gallery.id}
                                href={lang === 'en' ? `/eng/gallery/${linkId}` : `/galerija/${linkId}`}
                                className="group block cursor-pointer"
                            >
                                {/* Image Container */}
                                <div className="relative aspect-[3/2] w-full overflow-hidden bg-white/5 mb-3">
                                    <Image
                                        src={resolveNextcloudUrl(gallery.coverImage)}
                                        alt={displayTitle}
                                        fill
                                        unoptimized
                                        className="object-cover transition-transform duration-700 group-hover:scale-105 opacity-90 group-hover:opacity-100"
                                    />

                                    {/* Status Badge */}
                                    <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-[12px] font-normal tracking-widest uppercase font-dm border border-black/10 shadow-lg backdrop-blur-sm
                                        ${gallery.password
                                            ? 'bg-red-500/90 text-white'
                                            : 'bg-green-500/90 text-white'
                                        }`}
                                    >
                                        {gallery.password ? t.private : t.public}
                                    </div>
                                </div>

                                {/* Meta Underneath */}
                                <div className="flex flex-col items-center text-center space-y-2">
                                    <h2 className="text-[28px] font-bold tracking-wide uppercase font-sans leading-none pt-2">
                                        {displayTitle}
                                    </h2>
                                    <p className="text-[15px] text-white/40 tracking-widest uppercase font-dm">
                                        {formatSlovenianDate(gallery.date)}
                                    </p>
                                </div>
                            </Link>
                        );
                    })}

                    {filteredGalleries.length === 0 && (
                        <div className="col-span-full text-center py-20 text-white/30 uppercase tracking-widest">
                            {t.no_results} "{query}" {category !== "VSE" && `(${category})`}
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
