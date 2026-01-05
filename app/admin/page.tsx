import Link from "next/link";
import { getGalleries } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, ArrowLeft, Activity } from "lucide-react";
import { removeGallery } from "./actions";
import LogoutButton from "@/components/admin/LogoutButton";
import DeleteGalleryButton from "@/components/admin/DeleteGalleryButton";

export const dynamic = 'force-dynamic';

import { resolveNextcloudUrl, formatDate } from "@/lib/utils";
import Image from "next/image";

export default async function AdminDashboard({ searchParams }: { searchParams: { page?: string } }) {
    const allGalleries = await getGalleries();

    // Sort by date (newest first)
    allGalleries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Pagination
    const currentPage = Number(searchParams.page) || 1;
    const itemsPerPage = 5;
    const totalPages = Math.ceil(allGalleries.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const galleries = allGalleries.slice(startIndex, startIndex + itemsPerPage);

    return (
        <main className="min-h-screen bg-[#121212] text-white p-8">
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-white/10 pb-6 gap-6">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-4">
                            <h1 className="text-2xl md:text-3xl font-bold uppercase tracking-tighter">Nadzorna Plošča</h1>
                            <LogoutButton />
                        </div>
                        <Link href="/" className="flex items-center gap-1 text-xs uppercase tracking-widest text-white/50 hover:text-white transition-colors w-fit font-dm">
                            <ArrowLeft className="w-3 h-3" /> Nazaj na stran
                        </Link>
                    </div>
                    <div className="flex flex-wrap gap-4 w-full md:w-auto">
                        <Link href="/admin/logs" className="flex-1 md:flex-none">
                            <Button className="w-full md:w-auto bg-[#1e1e1e] border border-white/20 text-white hover:bg-white/10 uppercase tracking-widest gap-2 font-dm">
                                <Activity className="w-4 h-4" /> Dnevniki
                            </Button>
                        </Link>
                        <Link href="/admin/ustvari" className="flex-1 md:flex-none">
                            <Button className="w-full md:w-auto bg-white text-black hover:bg-gray-200 uppercase tracking-widest gap-2 font-dm font-bold">
                                <Plus className="w-4 h-4" /> Nova Galerija
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="grid gap-4">
                    {galleries.map((gallery) => (
                        <div
                            key={gallery.id}
                            className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg hover:border-white/20 transition-colors gap-4"
                        >
                            <div className="flex items-center gap-4 w-full md:w-auto">
                                {/* Thumbnail */}
                                <div className="relative w-16 h-12 rounded overflow-hidden bg-white/10 flex-shrink-0">
                                    <Image
                                        src={resolveNextcloudUrl(gallery.coverImage)}
                                        alt={gallery.title}
                                        fill
                                        unoptimized
                                        className="object-cover"
                                    />
                                </div>

                                <div className="flex flex-col space-y-1">
                                    <h3 className="text-lg md:text-xl font-bold uppercase break-all">{gallery.title}</h3>
                                    <p className="text-xs text-white/50 tracking-widest font-dm">{formatDate(gallery.date, 'sl')}</p>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-4 w-full md:w-auto justify-end">
                                <Link href={`/galerija/${gallery.slug || gallery.id}`} target="_blank" className="text-sm text-white/50 hover:text-white underline font-dm flex-1 md:flex-none text-right md:text-left">
                                    Poglej galerijo
                                </Link>
                                <div className="flex gap-2">
                                    <Link href={`/admin/uredi/${gallery.id}`}>
                                        <Button variant="ghost" size="icon" className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20">
                                            <Edit className="w-5 h-5" />
                                        </Button>
                                    </Link>
                                    <DeleteGalleryButton id={gallery.id} title={gallery.title} />
                                </div>
                            </div>
                        </div>
                    ))}

                    {galleries.length === 0 && (
                        <p className="text-white/50 text-center py-12">Ni galerij. Ustvari novo!</p>
                    )}

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex justify-center gap-4 pt-8">
                            <Link href={`/admin?page=${currentPage - 1}`} className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}>
                                <Button variant="outline" disabled={currentPage <= 1} className="font-dm uppercase tracking-widest">
                                    Nazaj
                                </Button>
                            </Link>
                            <span className="flex items-center text-sm font-dm text-white/50">
                                Stran {currentPage} od {totalPages}
                            </span>
                            <Link href={`/admin?page=${currentPage + 1}`} className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}>
                                <Button variant="outline" disabled={currentPage >= totalPages} className="font-dm uppercase tracking-widest">
                                    Naprej
                                </Button>
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
