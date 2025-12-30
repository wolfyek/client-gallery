'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

export default function ScreenshotProtection() {
    const [showOverlay, setShowOverlay] = useState(false);

    useEffect(() => {
        let timeout: NodeJS.Timeout;

        const triggerOverlay = () => {
            setShowOverlay(true);
            // Clear existing timeout if any
            if (timeout) clearTimeout(timeout);
            // Hide after 3 seconds - long enough to ruin the screenshot, short enough to not be stuck
            timeout = setTimeout(() => {
                setShowOverlay(false);
            }, 3000);
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            // PrintScreen
            if (e.key === 'PrintScreen' || e.code === 'PrintScreen') {
                triggerOverlay();
            }

            // Mac: Cmd+Shift+3 (Fullscreen), Cmd+Shift+4 (Selection), Cmd+Shift+5 (Recording/Options)
            if (e.metaKey && e.shiftKey && (e.key === '3' || e.key === '4' || e.key === '5')) {
                triggerOverlay();
            }

            // Windows: Win+Shift+S (Snipping Tool)
            // Note: 's' key might be case sensitive depending on Shift
            if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === 's' || e.key === 'S')) {
                triggerOverlay();
            }
        };

        // Prevent Right Click
        const handleContextMenu = (e: MouseEvent) => {
            e.preventDefault();
        };

        // Prevent Dragging images
        const handleDragStart = (e: DragEvent) => {
            e.preventDefault();
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('contextmenu', handleContextMenu);
        window.addEventListener('dragstart', handleDragStart);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('contextmenu', handleContextMenu);
            window.removeEventListener('dragstart', handleDragStart);
            if (timeout) clearTimeout(timeout);
        };
    }, []);

    if (!showOverlay) return null;

    return (
        <div
            className="fixed inset-0 z-[999999] bg-black flex items-center justify-center pointer-events-none w-screen h-screen overflow-hidden"
            aria-hidden="true"
        >
            <div className="relative w-full h-full">
                <Image
                    src="/copyright-warning.jpg"
                    alt="COPYRIGHT WARNING"
                    fill
                    className="object-cover"
                    priority
                    unoptimized // Ensure it loads instantly without heavy optimization processing if possible
                />
            </div>
        </div>
    );
}
