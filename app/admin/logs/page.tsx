import { getLogs } from "@/lib/logs";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Download, Activity, Clock } from "lucide-react";
import LogoutButton from "@/components/admin/LogoutButton";
import LogDeleteButton from "@/components/admin/LogDeleteButton";
import DeleteAllLogsButton from "@/components/admin/DeleteAllLogsButton";
import { formatSlovenianDate } from "@/lib/utils";

export const dynamic = 'force-dynamic';

export default async function LogsPage() {
    const logs = await getLogs();

    return (
        <main className="min-h-screen bg-[#121212] text-white p-8">
            <div className="max-w-6xl mx-auto space-y-12">

                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/10 pb-6">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-4">
                            <h1 className="text-3xl font-bold uppercase tracking-tighter">Dnevniki</h1>
                            <DeleteAllLogsButton />
                            <LogoutButton />
                        </div>
                        <Link href="/admin" className="flex items-center gap-1 text-xs uppercase tracking-widest text-white/50 hover:text-white transition-colors w-fit font-dm">
                            <ArrowLeft className="w-3 h-3" /> Nazaj na Nadzorno Ploščo
                        </Link>
                    </div>
                </div>

                {/* Download Logs Section */}
                <section className="space-y-6">
                    <div className="flex items-center gap-2 text-xl font-bold uppercase tracking-wide border-l-4 border-blue-500 pl-4 py-1">
                        <Download className="w-6 h-6 text-blue-500" />
                        <h2>Prenosi</h2>
                    </div>

                    <div className="bg-[#1e1e1e] rounded-lg border border-white/10 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-white/70 font-dm">
                                <thead className="bg-white/5 uppercase tracking-widest text-xs font-bold text-white/50">
                                    <tr>
                                        <th className="p-4">E-naslov</th>
                                        <th className="p-4">Predogled</th>
                                        <th className="p-4">Ime Datoteke</th>
                                        <th className="p-4">Datum</th>
                                        <th className="p-4 w-12"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {logs.downloads.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="p-8 text-center text-white/30 italic font-dm">Ni zabeleženih prenosov.</td>
                                        </tr>
                                    ) : (
                                        logs.downloads.map((log) => (
                                            <tr key={log.id} className="hover:bg-white/5 transition-colors group">
                                                <td className="p-4 font-medium text-white">{log.email}</td>
                                                <td className="p-4">
                                                    <div className="w-12 h-12 relative rounded overflow-hidden bg-black/50 border border-white/10">
                                                        {log.photoSrc && (
                                                            <Image
                                                                src={log.photoSrc}
                                                                alt={log.photoName}
                                                                fill
                                                                className="object-cover"
                                                                sizes="50px"
                                                            />
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-4 font-mono text-xs text-white/60">{log.photoName}</td>
                                                <td className="p-4 text-xs whitespace-nowrap">
                                                    {new Date(log.timestamp).toLocaleString("sl-SI")}
                                                </td>
                                                <td className="p-4 text-right">
                                                    <LogDeleteButton id={log.id} type="download" />
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>

                {/* Activity Logs Section */}
                <section className="space-y-6">
                    <div className="flex items-center gap-2 text-xl font-bold uppercase tracking-wide border-l-4 border-green-500 pl-4 py-1">
                        <Activity className="w-6 h-6 text-green-500" />
                        <h2>Aktivnosti</h2>
                    </div>

                    <div className="bg-[#1e1e1e] rounded-lg border border-white/10 overflow-hidden">
                        <table className="w-full text-left text-sm text-white/70 font-dm">
                            <thead className="bg-white/5 uppercase tracking-widest text-xs font-bold text-white/50">
                                <tr>
                                    <th className="p-4 w-32">Tip</th>
                                    <th className="p-4">Opis</th>
                                    <th className="p-4 w-32">Uporabnik</th>
                                    <th className="p-4 w-48">Čas</th>
                                    <th className="p-4 w-12"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {logs.activity.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-white/30 italic font-dm">Ni zabeleženih aktivnosti.</td>
                                    </tr>
                                ) : (
                                    logs.activity.map((log) => (
                                        <tr key={log.id} className="hover:bg-white/5 transition-colors group">
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider
                                                    ${log.type === 'CREATE_GALLERY' ? 'bg-green-500/20 text-green-400' :
                                                        log.type === 'UPDATE_GALLERY' ? 'bg-blue-500/20 text-blue-400' :
                                                            log.type === 'DELETE_GALLERY' ? 'bg-red-500/20 text-red-400' : 'bg-gray-500/20 text-gray-400'}
                                                `}>
                                                    {log.type.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="p-4">{log.description}</td>
                                            <td className="p-4 font-mono text-xs">{log.user}</td>
                                            <td className="p-4 text-xs flex items-center gap-2">
                                                <Clock className="w-3 h-3 opacity-50" />
                                                {new Date(log.timestamp).toLocaleString("sl-SI")}
                                            </td>
                                            <td className="p-4 text-right">
                                                <LogDeleteButton id={log.id} type="activity" />
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>

            </div>
        </main>
    );
}
