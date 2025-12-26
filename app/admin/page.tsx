import Link from "next/link";
import { getGalleries } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, ArrowLeft, Activity } from "lucide-react";
import { removeGallery } from "./actions";
import LogoutButton from "@/components/admin/LogoutButton";

export default async function AdminDashboard() {
    const galleries = await getGalleries();

    return (
        <main className="min-h-screen bg-[#121212] text-white p-8">
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="flex items-center justify-between border-b border-white/10 pb-6">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-4">
                            <h1 className="text-3xl font-bold uppercase tracking-tighter">Nadzorna Plošča</h1>
                            <LogoutButton />
                        </div>
                        <Link href="/" className="flex items-center gap-1 text-xs uppercase tracking-widest text-white/50 hover:text-white transition-colors w-fit font-dm">
                            <ArrowLeft className="w-3 h-3" /> Nazaj na stran
                        </Link>
                    </div>
                    <div className="flex gap-4">
                        <Link href="/admin/logs">
                            <Button className="bg-[#1e1e1e] border border-white/20 text-white hover:bg-white/10 uppercase tracking-widest gap-2 font-dm">
                                <Activity className="w-4 h-4" /> Dnevniki
                            </Button>
                        </Link>
                        <Link href="/admin/ustvari">
                            <Button className="bg-white text-black hover:bg-gray-200 uppercase tracking-widest gap-2 font-dm font-bold">
                                <Plus className="w-4 h-4" /> Nova Galerija
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="grid gap-4">
                    {galleries.map((gallery) => (
                        <div
                            key={gallery.id}
                            className="flex items-center justify-between p-6 bg-white/5 border border-white/10 rounded-lg hover:border-white/20 transition-colors"
                        >
                            <div className="flex flex-col space-y-1">
                                <h3 className="text-xl font-bold uppercase">{gallery.title}</h3>
                                <p className="text-xs text-white/50 tracking-widest font-dm">{gallery.date}</p>
                            </div>

                            <div className="flex items-center gap-4">
                                <Link href={`/galerija/${gallery.id}`} target="_blank" className="text-sm text-white/50 hover:text-white underline font-dm">
                                    Poglej Galerijo
                                </Link>
                                <Link href={`/admin/uredi/${gallery.id}`}>
                                    <Button variant="ghost" size="icon" className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20">
                                        <Edit className="w-5 h-5" />
                                    </Button>
                                </Link>
                                <form action={removeGallery.bind(null, gallery.id)}>
                                    <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-400 hover:bg-red-900/20">
                                        <Trash2 className="w-5 h-5" />
                                    </Button>
                                </form>
                            </div>
                        </div>
                    ))}

                    {galleries.length === 0 && (
                        <p className="text-white/50 text-center py-12">Ni galerij. Ustvari novo!</p>
                    )}
                </div>
            </div>
        </main>
    );
}
