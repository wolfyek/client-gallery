"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";

export default function PasswordGate({
    correctPassword,
    children,
    galleryTitle,
    coverImage,
}: {
    correctPassword?: string;
    children: React.ReactNode;
    galleryTitle: string;
    coverImage: string;
}) {
    const [password, setPassword] = useState("");
    const [unlocked, setUnlocked] = useState(!correctPassword); // Unlock immediately if no password
    const [error, setError] = useState(false);

    const handleUnlock = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === correctPassword) {
            setUnlocked(true);
            setError(false);
        } else {
            setError(true);
            // Shake animation trigger logic could go here
        }
    };

    if (!unlocked) {
        return (
            <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#121212] text-white">
                {/* Background Image without Blur */}
                <div className="absolute inset-0 z-0">
                    <Image
                        src={coverImage}
                        alt="Background"
                        fill
                        className="object-cover opacity-60"
                        priority
                    />
                    <div className="absolute inset-0 bg-black/20" /> {/* Subtle overlay for text contrast */}
                </div>

                {/* Back Link */}
                <Link
                    href="/"
                    className="absolute top-8 left-8 z-20 flex items-center gap-2 text-white/80 hover:text-white transition-colors uppercase tracking-widest text-xs drop-shadow-md"
                >
                    <ArrowLeft className="w-4 h-4" /> Nazaj na galerije
                </Link>

                {/* Login Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-sm flex flex-col items-center space-y-8 p-10 relative z-10 bg-black/60 backdrop-blur-md border border-white/10 rounded-sm shadow-2xl"
                >
                    <div className="flex flex-col items-center space-y-4">
                        <Lock className="w-8 h-8 text-white mb-2" />
                        <h2 className="text-3xl font-bold tracking-tighter uppercase text-center text-white">
                            {galleryTitle}
                        </h2>
                        <p className="text-sm tracking-widest uppercase text-white/70">
                            Zasebna Galerija
                        </p>
                    </div>

                    <form onSubmit={handleUnlock} className="w-full space-y-4">
                        <div className="relative">
                            <Input
                                type="password"
                                placeholder="Vnesite geslo"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className={`text-center tracking-widest bg-black/40 border-white/20 text-white placeholder:text-white/40 focus:bg-black/60 transition-colors ${error ? 'border-red-500/50' : ''}`}
                            />
                        </div>
                        <Button type="submit" className="w-full uppercase tracking-widest shadow-lg bg-white text-black hover:bg-gray-200">
                            Vstopi
                        </Button>
                        {error && (
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-xs text-red-500 text-center uppercase tracking-widest mt-2 font-bold"
                            >
                                Napačno geslo
                            </motion.p>
                        )}
                    </form>
                </motion.div>
            </div>
        );
    }

    return <>{children}</>;
}
