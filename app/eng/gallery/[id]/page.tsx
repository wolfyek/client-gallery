import { getGallery } from "@/lib/storage";
import GalleryClient from "@/components/GalleryClient";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function EnglishGalleryPage({ params }: { params: { id: string } }) {
    const gallery = await getGallery(params.id);

    if (!gallery) {
        return (
            <div className="flex min-h-screen items-center justify-center text-white">
                <div className="text-center">
                    <h1 className="text-4xl mb-4">404</h1>
                    <p className="uppercase tracking-widest text-white/50">Gallery not found</p>
                    <Link href="/eng" className="mt-8 inline-block underline underline-offset-4 uppercase text-xs tracking-widest">Back to Home</Link>
                </div>
            </div>
        );
    }

    // Canonical Redirection for English
    if (gallery.slug && params.id !== gallery.slug) {
        redirect(`/eng/gallery/${gallery.slug}`);
    }

    return (
        <GalleryClient gallery={gallery} lang="en" />
    );
}
