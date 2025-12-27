"use client";

import { Trash2 } from "lucide-react";
import { useTransition } from "react";
import { removeLogAction } from "@/app/admin/actions";

export default function LogDeleteButton({ id, type }: { id: string, type: 'activity' | 'download' }) {
    const [isPending, startTransition] = useTransition();

    const handleDelete = () => {
        if (confirm("Ali ste prepričani, da želite izbrisati ta zapis?")) {
            startTransition(async () => {
                await removeLogAction(id, type);
            });
        }
    };

    return (
        <button
            onClick={handleDelete}
            disabled={isPending}
            className="p-2 text-white/30 hover:text-red-400 hover:bg-white/5 rounded-full transition-all"
            title="Izbriši zapis"
        >
            {isPending ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
                <Trash2 className="w-4 h-4" />
            )}
        </button>
    );
}
