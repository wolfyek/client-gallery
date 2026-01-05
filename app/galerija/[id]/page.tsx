import { getGallery } from "@/lib/storage";
import GalleryClient from "@/components/GalleryClient";
import Link from "next/link";
import { redirect } from "next/navigation";

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

    // Canonical Redirection: If gallery has a slug but we accessed it via ID (or different casing), redirect.
    // We check if params.id is NOT the slug, and a slug exists.
    if (gallery.slug && params.id !== gallery.slug) {
        redirect(`/galerija/${gallery.slug}`);
    }

    return (
        <GalleryClient gallery={gallery} />
    );
}
