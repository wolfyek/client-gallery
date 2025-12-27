"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatSlovenianDate } from "@/lib/utils";
import { Search, Instagram, Globe } from "lucide-react";
import { Input } from "@/components/ui/input";
import { type Gallery } from "@/lib/data";

export default function HomeClient({ initialGalleries }: { initialGalleries: Gallery[] }) {
    const [query, setQuery] = useState("");
    const [query, setQuery] = useState("");

    const filteredGalleries = initialGalleries.filter(g => {
        const matchesQuery = g.title.toLowerCase().includes(query.toLowerCase());
        return matchesQuery;
    });



    return (
        <main className="min-h-screen bg-[#121212] text-white pt-8">
            <div className="w-full max-w-[1400px] mx-auto px-4 md:px-8 pb-8">

                {/* Header Section */}
                <div className="relative mb-8 grid grid-cols-1 md:grid-cols-3 items-center gap-8">

                    {/* Search - Left Aligned (Desktop) */}
                    <div className="hidden md:flex flex-col justify-start">
                        <div className="relative w-full max-w-xs group">
                            <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-white group-focus-within:text-white transition-colors" />
                            <input
                                type="text"
                                placeholder="ISKANJE..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className="w-full bg-transparent border-b border-white/80 py-2 pl-8 text-sm text-white focus:outline-none focus:border-white transition-colors placeholder:text-white/60 uppercase tracking-widest font-dm"
                            />
                        </div>
                    </div>

                    {/* Logo - Center Aligned */}
                    <div className="flex flex-col items-center justify-center space-y-6">
                        <Link href="/" className="cursor-pointer">
                            <img
                                src="http://streznik.farkastimi.si/Farkas-LOGO.svg"
                                alt="Farkaš Timi Logo"
                                className="h-20 md:h-28 w-auto hover:opacity-80 transition-opacity"
                            />
                        </Link>
                    </div>

                    {/* Mobile Search (Visible only on mobile) */}
                    <div className="md:hidden w-full">
                        <div className="relative w-full group">
                            <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 group-focus-within:text-white transition-colors" />
                            <input
                                type="text"
                                placeholder="ISKANJE..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className="w-full bg-transparent border-b border-white/20 py-2 pl-8 text-sm text-white focus:outline-none focus:border-white/80 transition-colors placeholder:text-white/40 uppercase tracking-widest font-dm"
                            />
                        </div>
                    </div>

                    {/* Social Links - Right Aligned (Desktop) */}
                    <div className="hidden md:flex justify-end gap-6">
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
                            title="Spletna stran"
                        >
                            <Globe className="w-5 h-5" />
                        </a>
                    </div>
                </div>

                {/* Subtitle */}
                <div className="flex flex-col items-center justify-center mb-8 gap-6">
                    <p className="text-[32px] text-white uppercase font-sans font-bold text-center">
                        galerija fotografij
                    </p>
                    <div className="w-full max-w-xs h-[1px] bg-white/20" />
                </div>



                {/* Galleries Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10 min-h-[50vh]">
                    {filteredGalleries.map((gallery) => (
                        <Link key={gallery.id} href={`/galerija/${gallery.id}`} className="group block cursor-pointer">
                            {/* Image Container */}
                            <div className="relative aspect-[3/2] w-full overflow-hidden bg-white/5 mb-3">
                                <Image
                                    src={gallery.coverImage}
                                    alt={gallery.title}
                                    fill
                                    className="object-cover transition-transform duration-700 group-hover:scale-105 opacity-90 group-hover:opacity-100"
                                />

                                {/* Status Badge */}
                                <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-[12px] font-normal tracking-widest uppercase font-dm border border-black/10 shadow-lg backdrop-blur-sm
                                    ${gallery.password
                                        ? 'bg-red-500/90 text-white'
                                        : 'bg-green-500/90 text-white'
                                    }`}
                                >
                                    {gallery.password ? 'ZASEBNO' : 'JAVNO'}
                                </div>
                            </div>

                            {/* Meta Underneath */}
                            <div className="flex flex-col items-center text-center space-y-2">
                                <h2 className="text-[28px] font-bold tracking-wide uppercase font-sans leading-none pt-2">
                                    {gallery.title}
                                </h2>
                                <p className="text-[15px] text-white/40 tracking-widest uppercase font-dm">
                                    {formatSlovenianDate(gallery.date)}
                                </p>
                            </div>
                        </Link>
                    ))}

                    {filteredGalleries.length === 0 && (
                        <div className="col-span-full text-center py-20 text-white/30 uppercase tracking-widest">
                            Ni rezultatov za "{query}"
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
