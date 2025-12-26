"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        const res = await fetch("/api/auth", {
            method: "POST",
            body: JSON.stringify({ username, password }),
        });

        if (res.ok) {
            router.push("/admin");
            router.refresh();
        } else {
            setError(true);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#121212] text-white p-4">
            <div className="w-full max-w-sm flex flex-col items-center space-y-8 p-10 bg-white/5 border border-white/10 rounded-lg">
                <div className="flex flex-col items-center space-y-4">
                    <Lock className="w-8 h-8 text-white mb-2" />
                    <h1 className="text-2xl font-bold tracking-tighter uppercase text-center">
                        Admin Prijava
                    </h1>
                </div>

                <form onSubmit={handleLogin} className="w-full space-y-4">
                    <Input
                        type="text"
                        placeholder="Uporabniško ime"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className={`text-center tracking-widest bg-black/40 border-white/20 text-white placeholder:text-white/40 focus:bg-black/60 ${error ? 'border-red-500' : ''}`}
                    />
                    <Input
                        type="password"
                        placeholder="Geslo"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={`text-center tracking-widest bg-black/40 border-white/20 text-white placeholder:text-white/40 focus:bg-black/60 ${error ? 'border-red-500' : ''}`}
                    />
                    <Button type="submit" className="w-full uppercase tracking-widest bg-white text-black hover:bg-gray-200">
                        Vstopi
                    </Button>
                    {error && (
                        <p className="text-xs text-red-500 text-center uppercase tracking-widest font-bold">
                            Napačno uporabniško ime ali geslo
                        </p>
                    )}
                </form>
            </div>
        </div>
    );
}
