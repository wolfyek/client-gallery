"use client";

import { Trash2 } from "lucide-react";
import { deleteAllLogs } from "@/app/actions/logging";
import { useState, useTransition } from "react";

export default function DeleteAllLogsButton() {
    const [isPending, startTransition] = useTransition();

    const handleDelete = async () => {
        if (confirm("Ali ste prepričani, da želite izbrisati VSE dnevnike? Tega dejanja ni mogoče razveljaviti.")) {
            startTransition(async () => {
                await deleteAllLogs();
            });
        }
    };

    return (
        <button
            onClick={handleDelete}
            disabled={isPending}
            className="flex items-center gap-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white px-4 py-2 rounded-lg transition-all text-xs font-bold uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
            title="Izbriši vse dnevnike"
        >
            <Trash2 className="w-4 h-4" />
            {isPending ? "Brisanje..." : "Izbriši Vse"}
        </button>
    );
}
