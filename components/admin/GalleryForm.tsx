"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Gallery, Photo } from "@/lib/data";
import { createGallery, updateGallery, importFromNextcloud } from "@/app/admin/actions";
import { X, Plus, Image as ImageIcon, Download, Star, Check } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export default function GalleryForm({ gallery }: { gallery?: Gallery }) {
    const [photos, setPhotos] = useState<Photo[]>(gallery?.photos || []);
    const [newPhotoUrl, setNewPhotoUrl] = useState("");
    const [ncLink, setNcLink] = useState("");
    const [isImporting, setIsImporting] = useState(false);
    const [coverImage, setCoverImage] = useState(gallery?.coverImage || "");
    const [downloadable, setDownloadable] = useState(gallery?.downloadable ?? true);
    const isEditing = !!gallery;

    const handleNextcloudImport = async () => {
        if (!ncLink) return;
        setIsImporting(true);
        try {
            const newPhotos = await importFromNextcloud(ncLink);
            setPhotos([...photos, ...newPhotos]);
            setNcLink("");
            alert(`Uspešno uvoženih ${newPhotos.length} slik!`);
        } catch (e) {
            alert("Napaka pri uvozu. Preveri povezavo.");
            console.error(e);
        } finally {
            setIsImporting(false);
        }
    };

    const handleAddPhoto = () => {
        if (!newPhotoUrl) return;
        const newPhoto: Photo = {
            id: Math.random().toString(36).substr(2, 9),
            src: newPhotoUrl,
            width: 1920,
            height: 1080,
            alt: "Nova Slika"
        };
        setPhotos([...photos, newPhoto]);
        setNewPhotoUrl("");
    };

    const removePhoto = (id: string) => {
        setPhotos(photos.filter(p => p.id !== id));
    };

    return (
        <form action={isEditing ? updateGallery.bind(null, gallery.id) : createGallery} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest text-white/50 font-dm">Naslov Galerije</label>
                    <Input name="title" defaultValue={gallery?.title} placeholder="npr. Ana & Mark" required className="bg-white/5 border-white/10 font-dm" />
                </div>
                <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest text-white/50 font-dm">Kategorija</label>
                    <select
                        name="category"
                        defaultValue={gallery?.category || ""}
                        className="flex h-11 w-full rounded-md border border-white/20 bg-white/5 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/50 font-dm appearance-none"
                    >
                        <option value="" className="bg-[#121212] text-white/50">Brez Kategorije</option>
                        <option value="Poroka" className="bg-[#121212]">Poroka</option>
                        <option value="Krst" className="bg-[#121212]">Krst</option>
                        <option value="Rojstni dan" className="bg-[#121212]">Rojstni dan</option>
                        <option value="Koncert" className="bg-[#121212]">Koncert</option>
                        <option value="Šport" className="bg-[#121212]">Šport</option>
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest text-white/50 font-dm">Datum (YYYY-MM-DD)</label>
                    <Input name="date" type="date" defaultValue={gallery?.date} required className="bg-white/5 border-white/10" />
                </div>
                <div className="col-span-1 md:col-span-2 space-y-2">
                    <label className="text-xs uppercase tracking-widest text-white/50 font-dm">Opis</label>
                    <Input name="description" defaultValue={gallery?.description} placeholder="Kratek opis dogodka..." className="bg-white/5 border-white/10 font-dm" />
                </div>
                <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest text-white/50 font-dm">Geslo (opcijsko)</label>
                    <Input name="password" defaultValue={gallery?.password} placeholder="Pusti prazno za javno" className="bg-white/5 border-white/10 font-dm" />
                </div>
                <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest text-white/50 font-dm">Cover Slika URL</label>
                    <div className="flex gap-2">
                        <Input
                            name="coverImage"
                            value={coverImage}
                            onChange={(e) => setCoverImage(e.target.value)}
                            placeholder="https://..."
                            required
                            className="bg-white/5 border-white/10 font-dm"
                        />
                        {coverImage && (
                            <div className="relative w-10 h-10 shrink-0 rounded overflow-hidden border border-white/20">
                                <Image src={coverImage} fill alt="Cover" className="object-cover" unoptimized />
                            </div>
                        )}
                    </div>
                </div>
                <div className="space-y-2 flex items-center gap-3 bg-white/5 border border-white/10 rounded-md px-4 mt-6 h-[50px]">
                    <Input
                        type="checkbox"
                        name="downloadable"
                        value="on" // Explicitly valid for form submission
                        checked={downloadable}
                        onChange={(e) => setDownloadable(e.target.checked)}
                        className="w-5 h-5 accent-white cursor-pointer"
                    />
                    <label className="text-xs uppercase tracking-widest text-white/70 font-dm cursor-pointer" onClick={() => setDownloadable(!downloadable)}>
                        Dovoli Prenose (Download)
                    </label>
                </div>
            </div>

            {/* Nextcloud Import */}
            <div className="bg-blue-900/10 border border-blue-500/20 p-6 rounded-lg space-y-4">
                <h3 className="text-sm font-bold uppercase text-blue-400 font-dm">Uvozi iz oblaka (Nextcloud)</h3>
                <div className="flex gap-2">
                    <Input
                        value={ncLink}
                        onChange={(e) => setNcLink(e.target.value)}
                        placeholder="https://cloud.yoursite.com/s/Token..."
                        className="bg-black/20 border-blue-500/20 font-dm"
                    />
                    <Button type="button" onClick={handleNextcloudImport} disabled={isImporting} className="bg-blue-600 hover:bg-blue-500 text-white min-w-[120px] font-dm">
                        {isImporting ? 'Nalagam...' : 'Uvozi'}
                    </Button>
                </div>
                <p className="text-[10px] text-white/30 font-dm">
                    Prilepi "Public Share Link" iz Nextcloud-a. Sistem bo avtomatsko poiskal vse slike.
                </p>
            </div>

            {/* Hidden Photos JSON Input - Optimization to prevent massive payloads */}
            {/* Only send photos if creating (no gallery) or if photos have changed */}
            <input
                type="hidden"
                name="photos"
                value={
                    !isEditing || (gallery && JSON.stringify(photos) !== JSON.stringify(gallery.photos))
                        ? JSON.stringify(photos)
                        : ""
                }
            />

            {/* Photo Manager */}
            <div className="border-t border-white/10 pt-8 space-y-4">
                <h3 className="text-lg font-bold uppercase">Fotografije ({photos.length})</h3>

                <div className="flex gap-2">
                    <Input
                        value={newPhotoUrl}
                        onChange={(e) => setNewPhotoUrl(e.target.value)}
                        placeholder="Prilepi URL slike (npr. Unsplash/Imgur)"
                        className="bg-white/5 border-white/10 font-dm"
                    />
                    <Button type="button" onClick={handleAddPhoto} className="bg-white text-black font-dm">
                        <Plus className="w-4 h-4" /> Dodaj
                    </Button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-4">
                    {photos.map((photo) => {
                        const isCover = coverImage === photo.src;
                        return (
                            <div
                                key={photo.id}
                                className={cn(
                                    "relative aspect-square group rounded-md overflow-hidden transition-all border-2",
                                    isCover ? "border-green-500" : "border-transparent bg-white/5"
                                )}
                            >
                                <Image src={photo.src} alt="preview" fill className={cn("object-cover transition-opacity", isCover ? "opacity-100" : "opacity-70 group-hover:opacity-100")} unoptimized />

                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                                    {!isCover && (
                                        <Button
                                            type="button"
                                            size="sm"
                                            onClick={() => setCoverImage(photo.src)}
                                            className="bg-white/20 hover:bg-white text-white hover:text-black gap-2 text-xs uppercase tracking-wider"
                                        >
                                            <Star className="w-3 h-3" /> Cover
                                        </Button>
                                    )}
                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={() => removePhoto(photo.id)}
                                        className="bg-red-500/20 hover:bg-red-500 text-white gap-2 text-xs uppercase tracking-wider"
                                    >
                                        <X className="w-3 h-3" /> Brisi
                                    </Button>
                                </div>

                                {isCover && (
                                    <div className="absolute top-2 left-2 bg-green-500 text-black text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1 shadow-lg">
                                        <Check className="w-3 h-3" /> COVER
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="pt-8 border-t border-white/10 flex justify-end">
                <Button
                    type="submit"
                    size="lg"
                    disabled={isImporting}
                    className="bg-white text-black uppercase tracking-widest text-sm w-full md:w-auto disabled:opacity-50 disabled:cursor-not-allowed font-dm font-bold"
                >
                    {isEditing ? 'Shrani Spremembe' : 'Ustvari Galerijo'}
                </Button>
            </div>

            {/* Upload Progress Popup */}
            {isImporting && (
                <div className="fixed bottom-8 right-8 z-50 bg-[#121212] border border-white/20 p-6 rounded-lg shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom-5">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <div className="flex flex-col">
                        <span className="text-sm font-bold uppercase tracking-wider">Uvažanje...</span>
                        <span className="text-xs text-white/50">Povezujem se z Nextcloud</span>
                    </div>
                </div>
            )}
        </form>
    );
}
