"use client";

import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
    const router = useRouter();

    const handleLogout = async () => {
        await fetch("/api/auth", { method: "DELETE" });
        router.push("/prijava");
        router.refresh();
    };

    return (
        <Button
            onClick={handleLogout}
            variant="ghost"
            className="text-white/50 hover:text-red-500 hover:bg-red-900/10 uppercase tracking-widest text-xs gap-2"
        >
            <LogOut className="w-4 h-4" /> Odjava
        </Button>
    );
}
