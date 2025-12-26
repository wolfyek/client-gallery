"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { type Photo } from "@/lib/data";
import Image from "next/image";
import { Download, X, ChevronLeft, ChevronRight, Archive, Check } from "lucide-react";
import { downloadImage } from "@/lib/utils";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { recordDownload } from "@/app/actions/logging";

export default function GalleryGrid({ photos, galleryTitle }: { photos: Photo[], galleryTitle: string }) {
    const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'large' | 'compact'>('grid');
    const [isZipping, setIsZipping] = useState(false);
    const [zipProgress, setZipProgress] = useState(0);

    // Email Tracking State
    const [userEmail, setUserEmail] = useState<string>("");
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [pendingDownload, setPendingDownload] = useState<(() => void) | null>(null);
    const emailInputRef = useRef<HTMLInputElement>(null);

    const handleEmailSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const email = emailInputRef.current?.value;
        if (email && email.includes("@")) {
            setUserEmail(email);
            setShowEmailModal(false);
            if (pendingDownload) {
                pendingDownload();
                setPendingDownload(null);
            }
        }
    };

    const requireEmail = (callback: () => void) => {
        if (userEmail) {
            callback();
        } else {
            setPendingDownload(() => callback);
            setShowEmailModal(true);
        }
    };

    const performDownloadAll = async () => {
        setIsZipping(true);
        setZipProgress(0);

        // Log the bulk download (using first image as representative)
        if (photos.length > 0) {
            await recordDownload(userEmail, galleryTitle, "ZIP-ARCHIVE", photos[0].src, `${galleryTitle}.zip`);
        }

        try {
            const zip = new JSZip();
            const folder = zip.folder(galleryTitle) || zip;

            let completed = 0;
            const chunkSize = 3;
            for (let i = 0; i < photos.length; i += chunkSize) {
                const chunk = photos.slice(i, i + chunkSize);
                await Promise.all(chunk.map(async (photo) => {
                    const filename = photo.alt || `photo-${photo.id}.jpg`;
                    const response = await fetch(`/api/download?url=${encodeURIComponent(photo.src)}&filename=${encodeURIComponent(filename)}`);
                    const blob = await response.blob();
                    folder.file(filename, blob);

                    completed++;
                    setZipProgress(Math.round((completed / photos.length) * 100));
                }));
            }

            const content = await zip.generateAsync({ type: "blob" });
            saveAs(content, `${galleryTitle}.zip`);

        } catch (error) {
            console.error("ZIP Generation failed:", error);
            alert("Napaka pri ustvarjanju ZIP datoteke.");
        } finally {
            setIsZipping(false);
            setZipProgress(0);
        }
    };

    const handleDownloadAll = () => {
        requireEmail(performDownloadAll);
    };

    const performSingleDownload = async () => {
        if (selectedPhoto) {
            const filename = selectedPhoto.alt || `photo-${selectedPhoto.id}.jpg`;
            await recordDownload(userEmail, galleryTitle, selectedPhoto.id, selectedPhoto.src, filename);
            downloadImage(selectedPhoto.src, filename);
        }
    };

    const handleDownload = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        requireEmail(performSingleDownload);
    };

    // ... existing navigation logic ...
    const handleNext = useCallback((e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (!selectedPhoto) return;
        const currentIndex = photos.findIndex(p => p.id === selectedPhoto.id);
        const nextIndex = (currentIndex + 1) % photos.length;
        setSelectedPhoto(photos[nextIndex]);
    }, [photos, selectedPhoto]);

    const handlePrev = useCallback((e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (!selectedPhoto) return;
        const currentIndex = photos.findIndex(p => p.id === selectedPhoto.id);
        const prevIndex = (currentIndex - 1 + photos.length) % photos.length;
        setSelectedPhoto(photos[prevIndex]);
    }, [photos, selectedPhoto]);


    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!selectedPhoto) return;
            if (e.key === "ArrowRight") handleNext();
            if (e.key === "ArrowLeft") handlePrev();
            if (e.key === "Escape") setSelectedPhoto(null);
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [selectedPhoto, handleNext, handlePrev]);

    const nextPhoto = photos[(photos.findIndex(p => p.id === selectedPhoto?.id) + 1) % photos.length];
    const prevPhoto = photos[(photos.findIndex(p => p.id === selectedPhoto?.id) - 1 + photos.length) % photos.length];

    const gridClasses = {
        large: "grid-cols-1 max-w-4xl mx-auto",
        grid: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
        compact: "grid-cols-2 md:grid-cols-4 lg:grid-cols-5"
    };

    return (
        <>
            {/* Toolbar */}
            <div className="sticky top-[80px] z-40 flex justify-between items-center px-4 md:px-8 pb-4 mix-blend-difference">

                {/* Download All Button */}
                <button
                    onClick={handleDownloadAll}
                    disabled={isZipping}
                    className="flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-lg py-2 px-4 border border-white/10 text-white/80 hover:text-white hover:bg-white/20 transition-all uppercase tracking-widest text-xs disabled:opacity-50 disabled:cursor-wait"
                >
                    {isZipping ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Pripravljam ({zipProgress}%)</span>
                        </>
                    ) : (
                        <>
                            <Archive className="w-4 h-4" />
                            <span>Prenesi Vse</span>
                        </>
                    )}
                </button>

                {/* View Switcher */}
                <div className="flex bg-white/10 backdrop-blur-md rounded-lg p-1 gap-1 border border-white/10">
                    <button
                        onClick={() => setViewMode('large')}
                        className={`p-2 rounded ${viewMode === 'large' ? 'bg-white text-black' : 'text-white/50 hover:text-white'} transition-colors`}
                        title="Velik Pogled"
                    >
                        <div className="w-5 h-5 border-2 border-current rounded-sm" />
                    </button>
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white text-black' : 'text-white/50 hover:text-white'} transition-colors`}
                        title="Grid Pogled"
                    >
                        <div className="w-5 h-5 grid grid-cols-2 gap-0.5">
                            <div className="bg-current rounded-[1px]" />
                            <div className="bg-current rounded-[1px]" />
                            <div className="bg-current rounded-[1px]" />
                            <div className="bg-current rounded-[1px]" />
                        </div>
                    </button>
                    <button
                        onClick={() => setViewMode('compact')}
                        className={`p-2 rounded ${viewMode === 'compact' ? 'bg-white text-black' : 'text-white/50 hover:text-white'} transition-colors`}
                        title="Kompakten Pogled"
                    >
                        <div className="w-5 h-5 grid grid-cols-3 gap-0.5">
                            {[...Array(9)].map((_, i) => (
                                <div key={i} className="bg-current rounded-[0.5px]" />
                            ))}
                        </div>
                    </button>
                </div>
            </div>

            <div className={`grid ${gridClasses[viewMode]} gap-4 p-4 md:p-8 transition-all duration-500`}>
                {photos.map((photo, i) => (
                    <motion.div
                        key={photo.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: i * 0.05 }}
                        className="relative group bg-gray-900 cursor-pointer"
                        onClick={() => setSelectedPhoto(photo)}
                    >
                        {/* 16:10 Aspect Ratio Container */}
                        <div className="relative aspect-[16/10] w-full overflow-hidden">
                            <Image
                                src={photo.src}
                                alt={photo.alt}
                                fill
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                priority={i < 6}
                                quality={90}
                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                            {/* Overlay */}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* LIGHTBOX */}
            <AnimatePresence>
                {selectedPhoto && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm p-4"
                        onClick={() => setSelectedPhoto(null)}
                    >
                        {/* Close Button */}
                        <button className="absolute top-4 right-4 text-white/50 hover:text-white z-50">
                            <X className="w-8 h-8" />
                        </button>

                        {/* Main Container: Arrow - Image - Arrow */}
                        <div className="flex items-center justify-center gap-4 md:gap-8 w-full h-full max-w-7xl" onClick={(e) => e.stopPropagation()}>

                            {/* Left Arrow */}
                            <button
                                className="p-2 rounded-full bg-white/5 hover:bg-white/20 text-white/70 hover:text-white transition-all"
                                onClick={handlePrev}
                            >
                                <ChevronLeft className="w-8 h-8 md:w-10 md:h-10" />
                            </button>

                            <div className="flex flex-col items-center space-y-4 relative w-full h-full flex-1 justify-center">

                                {/* Image Container */}
                                <motion.div
                                    key={selectedPhoto.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.3 }}
                                    className="relative w-full h-full"
                                >
                                    <Image
                                        src={selectedPhoto.src}
                                        alt={selectedPhoto.alt}
                                        fill
                                        className="object-contain"
                                        quality={100}
                                        priority
                                    />
                                </motion.div>

                                {/* Download Button */}
                                <div className="absolute bottom-4 z-50">
                                    <button
                                        onClick={handleDownload}
                                        className="flex items-center gap-2 bg-black/50 backdrop-blur-md text-white/80 hover:text-white transition-colors uppercase tracking-widest text-xs py-3 px-6 border border-white/10 hover:border-white/30 rounded-full hover:bg-black/70"
                                    >
                                        <Download className="w-4 h-4" />
                                        PRENESI
                                    </button>
                                </div>
                            </div>

                            {/* Right Arrow */}
                            <button
                                className="p-2 rounded-full bg-white/5 hover:bg-white/20 text-white/70 hover:text-white transition-all"
                                onClick={handleNext}
                            >
                                <ChevronRight className="w-8 h-8 md:w-10 md:h-10" />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* EMAIL MODAL */}
            <AnimatePresence>
                {showEmailModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                        onClick={() => setShowEmailModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-[#1e1e1e] p-8 rounded-2xl w-full max-w-md border border-white/10 shadow-2xl space-y-6"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="space-y-2 text-center">
                                <h3 className="text-[28px] font-bold uppercase tracking-wide text-white font-sans">Prenos Fotografij</h3>
                                <p className="text-[15px] text-white/60 font-dm leading-relaxed">Prosim, vnesite vaš e-poštni naslov za nadaljevanje prenosa.</p>
                            </div>

                            <form onSubmit={handleEmailSubmit} className="space-y-4">
                                <div>
                                    <input
                                        type="email"
                                        required
                                        ref={emailInputRef}
                                        placeholder="vas@email.com"
                                        className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-colors text-center font-mono"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="w-full bg-white text-black font-bold uppercase tracking-widest py-3 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Check className="w-4 h-4" />
                                    Potrdi in Prenesi
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* HIDDEN PRELOADER */}
            {selectedPhoto && (
                <div className="hidden">
                    {nextPhoto && (
                        <Image src={nextPhoto.src} alt="preload-next" width={1} height={1} priority />
                    )}
                    {prevPhoto && (
                        <Image src={prevPhoto.src} alt="preload-prev" width={1} height={1} priority />
                    )}
                </div>
            )}
        </>
    );
}
