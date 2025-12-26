import GalleryForm from "@/components/admin/GalleryForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getGallery } from "@/lib/storage";

export default async function EditGalleryPage({ params }: { params: { id: string } }) {
    const gallery = await getGallery(params.id);

    if (!gallery) return <div className="text-white">Galerija ni najdena</div>;

    return (
        <main className="min-h-screen bg-[#121212] text-white p-8">
            <div className="max-w-4xl mx-auto space-y-8">
                <Link href="/admin" className="flex items-center gap-2 text-white/50 hover:text-white transition-colors uppercase tracking-widest text-xs">
                    <ArrowLeft className="w-4 h-4" /> Nazaj na nadzorno ploščo
                </Link>

                <h1 className="text-3xl font-bold uppercase tracking-tighter">Uredi: {gallery.title}</h1>

                <div className="bg-white/5 border border-white/10 p-8 rounded-lg">
                    <GalleryForm gallery={gallery} />
                </div>
            </div>
        </main>
    );
}
