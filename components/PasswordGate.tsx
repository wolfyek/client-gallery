"use client";

import { useState } from "react";
import { Lock, ArrowRight, Loader2 } from "lucide-react";
import { getTranslation, type Language } from "@/lib/i18n";

interface PasswordGateProps {
    isLocked: boolean;
    onUnlock: (password: string) => Promise<boolean>;
    galleryTitle: string;
    coverImage?: string;
    lang?: Language;
}

import { resolveNextcloudUrl } from "@/lib/utils";

export default function PasswordGate({ isLocked, onUnlock, galleryTitle, coverImage, lang = 'sl' }: PasswordGateProps) {
    const t = getTranslation(lang);
    const [password, setPassword] = useState("");
    const [error, setError] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    if (!isLocked) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(false);

        const success = await onUnlock(password);
        if (!success) {
            setError(true);
            setIsLoading(false);
        }
        // If success, parent handles removal (isLoading stays true until unmount)
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0a0a] text-white p-6">
            {/* Background Image with low opacity */}
            {coverImage && (
                <div
                    className="absolute inset-0 bg-cover bg-center opacity-20 pointer-events-none blur-sm"
                    style={{ backgroundImage: `url(${resolveNextcloudUrl(coverImage)})` }}
                />
            )}

            <div className="relative w-full max-w-md p-8 md:p-12 space-y-8 text-center bg-black/40 backdrop-blur-md rounded-3xl border border-white/10 shadow-2xl">
                {/* Header */}
                <div className="space-y-4">
                    <div className="w-12 h-12 md:w-16 md:h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto border border-white/10">
                        <Lock className="w-6 h-6 md:w-8 md:h-8 text-white/80" />
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-xl md:text-3xl font-light tracking-wide font-dm uppercase">{t.password_required}</h1>
                        <p className="text-sm md:text-base text-white/40 font-dm">{t.password_desc}</p>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                setError(false);
                            }}
                            placeholder={t.enter_password}
                            className={`w-full bg-white/5 border ${error ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-white/30'} 
                                rounded-xl px-4 py-4 text-center text-lg placeholder:text-white/20 outline-none transition-all font-dm tracking-widest`}
                            autoFocus
                        />
                        {error && (
                            <p className="text-red-400 text-xs font-dm animate-pulse">{t.wrong_password}</p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading || !password}
                        className="w-full bg-white text-black py-4 rounded-xl font-medium tracking-wide hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group font-dm"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>{t.loading}</span>
                            </>
                        ) : (
                            <>
                                <span>{t.enter_gallery}</span>
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>
                </form>

                {/* Footer */}
                <div className="pt-8">
                    <p className="text-xs text-white/20 font-dm uppercase tracking-widest">
                        {t.home_title} © {new Date().getFullYear()} {t.footer_rights}
                    </p>
                </div>
            </div>
        </div>
    );
}
