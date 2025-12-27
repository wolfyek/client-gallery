"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTransition } from "react";
import { removeGallery } from "@/app/admin/actions";

export default function DeleteGalleryButton({ id, title }: { id: string, title: string }) {
    const [isPending, startTransition] = useTransition();

    const handleDelete = (e: React.MouseEvent) => {
        e.preventDefault();

        const confirmed = window.confirm(`Ali ste prepričani, da želite izbrisati galerijo "${title}"?\n\nTega dejanja ni mogoče razveljaviti.`);

        if (confirmed) {
            startTransition(async () => {
                await removeGallery(id);
            });
        }
    };

    return (
        <Button
            variant="ghost"
            size="icon"
            className="text-red-500 hover:text-red-400 hover:bg-red-900/20"
            onClick={handleDelete}
            disabled={isPending}
            title="Izbriši galerijo"
        >
            {isPending ? (
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
                <Trash2 className="w-5 h-5" />
            )}
        </Button>
    );
}
