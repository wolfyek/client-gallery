"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Gallery, Photo } from "@/lib/data";
import { createGallery, updateGallery, updateGalleryMetadata, importFromNextcloud } from "@/app/admin/actions";
import { X, Plus, Image as ImageIcon, Download, Star, Check } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Reorder } from "framer-motion";

export default function GalleryForm({ gallery }: { gallery?: Gallery }) {
    const [photos, setPhotos] = useState<Photo[]>(gallery?.photos || []);
    const [newPhotoUrl, setNewPhotoUrl] = useState("");
    const [ncLink, setNcLink] = useState("");
    const [isImporting, setIsImporting] = useState(false);
    const [coverImage, setCoverImage] = useState(gallery?.coverImage || "");
    const [downloadable, setDownloadable] = useState(gallery?.downloadable ?? true);
    const isEditing = !!gallery;

    const [hasPhotosChanged, setHasPhotosChanged] = useState(false);

    const handleNextcloudImport = async () => {
        if (!ncLink) return;
        setIsImporting(true);
        try {
            const newPhotos = await importFromNextcloud(ncLink);
            setPhotos([...photos, ...newPhotos]);
            setHasPhotosChanged(true); // Mark as changed
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
        setHasPhotosChanged(true); // Mark as changed
        setNewPhotoUrl("");
    };

    const removePhoto = (id: string) => {
        setPhotos(photos.filter(p => p.id !== id));
        setHasPhotosChanged(true); // Mark as changed
    };



    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);



        if (isEditing && !hasPhotosChanged) {
            // OPTIMIZED PATH: Metadata only
            try {
                const result = await updateGalleryMetadata(gallery.id, {
                    title: formData.get("title") as string,
                    date: formData.get("date") as string,
                    password: formData.get("password") as string,
                    coverImage: formData.get("coverImage") as string,
                    category: formData.get("category") as string,
                    slug: formData.get("slug") as string, // Added missing slug
                    titleEn: formData.get("titleEn") as string,
                    descriptionEn: formData.get("descriptionEn") as string,
                    slugEn: formData.get("slugEn") as string,
                    downloadable: downloadable,
                });
                if (result.success) {
                    alert('Galerija uspešno posodobljena!');
                    window.location.href = "/admin";
                } else {
                    throw new Error(result.error);
                }
            } catch (err) {
                console.error(err);
                const msg = err instanceof Error ? err.message : "Neznana napaka";
                alert(`Prišlo je do napake. ${msg}`);
            }
        } else {
            // FULL PATH: Create or Update with Photos
            // We use the hidden input 'photos' which is already managed by our state
            try {
                const action = isEditing ? updateGallery.bind(null, gallery.id) : createGallery;
                const result = await action(formData);

                // If the action returned an error object (instead of redirecting)
                if (result && result.error) {
                    alert(`Prišlo je do napake. ${result.error}`);
                } else if (result && result.success) {
                    alert(isEditing ? 'Galerija uspešno posodobljena!' : 'Galerija uspešno ustvarjena!');
                    window.location.href = "/admin";
                }
            } catch (error) {
                console.error("Submission error:", error);
                // This catch might still catch the generic error if we missed something, but the above Result check should catch our explicit errors.
                alert(`Prišlo je do napake. ${error instanceof Error ? error.message : "Neznana napaka"}`);
            }
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest text-white/50 font-dm">Naslov Galerije</label>
                    <Input name="title" defaultValue={gallery?.title} placeholder="npr. Ana & Mark" required className="bg-white/5 border-white/10 font-dm" />
                </div>

                <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest text-white/50 font-dm">Datum (YYYY-MM-DD)</label>
                    <Input name="date" type="date" defaultValue={gallery?.date} required className="bg-white/5 border-white/10 font-dm uppercase tracking-widest text-sm" />
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
                    </div>
                    {coverImage && (
                        <div className="relative w-10 h-10 shrink-0 rounded overflow-hidden border border-white/20">
                            <Image src={coverImage} fill alt="Cover" className="object-cover" unoptimized />
                        </div>
                    )}
                </div>

                <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest text-white/50 font-dm">Slug / Povezava po meri (Opcijsko)</label>
                    <Input
                        name="slug"
                        defaultValue={gallery?.slug}
                        placeholder="npr. ime-priimek-dogodek (pusti prazno za avtomatsko)"
                        className="bg-white/5 border-white/10 font-dm"
                    />
                    <p className="text-[10px] text-white/40 font-dm">Povezava bo: domain.com/galerija/vas-slug. Če prazno, se ustvari iz ID-ja.</p>
                </div>

                {/* English Metadata Section */}
                <div className="col-span-1 md:col-span-2 border-t border-white/10 pt-4 mt-2 mb-2">
                    <h4 className="text-sm font-bold uppercase text-white/70 mb-4 font-dm">Angleška Verzija (Opcijsko)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs uppercase tracking-widest text-white/50 font-dm">Angleški Naslov (EN Title)</label>
                            <Input name="titleEn" defaultValue={gallery?.titleEn} placeholder="Album Name (EN)" className="bg-white/5 border-white/10 font-dm" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs uppercase tracking-widest text-white/50 font-dm">Angleški Slug / Povezava</label>
                            <Input name="slugEn" defaultValue={gallery?.slugEn} placeholder="your-album-slug" className="bg-white/5 border-white/10 font-dm" />
                        </div>
                        <div className="col-span-1 md:col-span-2 space-y-2">
                            <label className="text-xs uppercase tracking-widest text-white/50 font-dm">Angleški Opis (EN Description)</label>
                            <Input name="descriptionEn" defaultValue={gallery?.descriptionEn} placeholder="Short description..." className="bg-white/5 border-white/10 font-dm" />
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest text-white/50 font-dm">Kategorija</label>
                    <select
                        name="category"
                        defaultValue={gallery?.category || ""}
                        className="w-full h-10 px-3 rounded-md bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/20 font-dm appearance-none"
                    >
                        <option value="" className="bg-[#121212] text-white/50">-- Izberi Kategorijo --</option>
                        <option value="Koncert" className="bg-[#121212]">Koncert</option>
                        <option value="Poroka" className="bg-[#121212]">Poroka</option>
                        <option value="Krst" className="bg-[#121212]">Krst</option>
                        <option value="Rojstni dan" className="bg-[#121212]">Rojstni dan</option>
                        <option value="Šport" className="bg-[#121212]">Šport</option>
                        <option value="Portret" className="bg-[#121212]">Portret</option>
                    </select>
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
                    !isEditing || hasPhotosChanged
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

                <Reorder.Group
                    axis="y"
                    onReorder={(newOrder) => {
                        setPhotos(newOrder);
                        setHasPhotosChanged(true);
                    }}
                    values={photos}
                    layoutScroll
                    className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-4"
                >
                    {photos.map((photo) => {
                        const isCover = coverImage === photo.src || coverImage === photo.previewSrc;
                        return (
                            <Reorder.Item
                                key={photo.id}
                                value={photo}
                                className={cn(
                                    "relative aspect-square group rounded-md overflow-hidden transition-all border-2 cursor-grab active:cursor-grabbing",
                                    isCover ? "border-green-500" : "border-transparent bg-white/5"
                                )}
                            >
                                <Image src={photo.previewSrc || photo.src} alt="preview" fill className={cn("object-cover transition-opacity pointer-events-none", isCover ? "opacity-100" : "opacity-70 group-hover:opacity-100")} unoptimized />

                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                                    {!isCover && (
                                        <Button
                                            type="button"
                                            size="sm"
                                            onPointerDown={(e) => e.stopPropagation()} // Prevent drag start
                                            onClick={() => setCoverImage(photo.previewSrc || photo.src)}
                                            className="bg-white/20 hover:bg-white text-white hover:text-black gap-2 text-xs uppercase tracking-wider"
                                        >
                                            <Star className="w-3 h-3" /> Cover
                                        </Button>
                                    )}
                                    <Button
                                        type="button"
                                        size="sm"
                                        onPointerDown={(e) => e.stopPropagation()} // Prevent drag start
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
                            </Reorder.Item>
                        );
                    })}
                </Reorder.Group>
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
            {
                isImporting && (
                    <div className="fixed bottom-8 right-8 z-50 bg-[#121212] border border-white/20 p-6 rounded-lg shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom-5">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <div className="flex flex-col">
                            <span className="text-sm font-bold uppercase tracking-wider">Uvažanje...</span>
                            <span className="text-xs text-white/50">Povezujem se z Nextcloud</span>
                        </div>
                    </div>
                )
            }
        </form >
    );
}
