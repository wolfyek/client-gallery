import { getGallery } from "@/lib/storage";
import PasswordGate from "@/components/PasswordGate";
import GalleryGrid from "@/components/GalleryGrid";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { formatSlovenianDate } from "@/lib/utils";

export default async function GalleryPage({ params }: { params: { id: string } }) {
    const gallery = await getGallery(params.id);

    if (!gallery) {
        return (
            <div className="flex min-h-screen items-center justify-center text-white">
                <div className="text-center">
                    <h1 className="text-4xl mb-4">404</h1>
                    <p className="uppercase tracking-widest text-white/50">Galerija ni najdena</p>
                    <Link href="/" className="mt-8 inline-block underline underline-offset-4 uppercase text-xs tracking-widest">Nazaj na domačo stran</Link>
                </div>
            </div>
        );
    }

    return (
        <PasswordGate
            correctPassword={gallery.password}
            galleryTitle={gallery.title}
            coverImage={gallery.coverImage}
        >
            <main className="min-h-screen bg-[#121212] text-white">

                {/* Navigation / Back Button */}
                <nav className="fixed top-0 left-0 w-full z-50 px-6 py-6 mix-blend-difference">
                    <Link href="/" className="flex items-center gap-2 text-white/70 hover:text-white transition-colors uppercase tracking-widest text-xs">
                        <ArrowLeft className="w-4 h-4" /> Nazaj na galerije
                    </Link>
                </nav>

                {/* Hero / Header Section */}
                <header className="pt-32 pb-16 px-6 text-center max-w-4xl mx-auto space-y-6">
                    <span className="text-xs tracking-[0.3em] uppercase text-white/60 font-dm">
                        {formatSlovenianDate(gallery.date)}
                    </span>

                    <h1 className="text-5xl md:text-7xl font-bold tracking-tighter uppercase">
                        {gallery.title}
                    </h1>

                    <p className="text-lg md:text-xl text-white/70 font-light max-w-2xl mx-auto leading-relaxed font-dm">
                        {gallery.description}
                    </p>

                    <div className="h-px w-12 bg-white/20 mx-auto mt-8" />
                </header>

                {/* Gallery Content */}
                <GalleryGrid
                    photos={gallery.photos}
                    galleryTitle={gallery.title}
                    allowDownloads={gallery.downloadable ?? true} // Default to true for existing galleries
                />

                {/* Footer */}
                <footer className="py-24 text-center text-white/20 text-xs uppercase tracking-widest font-dm">
                    Farkaš Timi Fotografija
                </footer>
            </main>
        </PasswordGate>
    );
}
