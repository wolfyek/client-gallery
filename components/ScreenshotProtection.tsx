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
            // Mac: Cmd+Shift+3/4/5 and Windows: Win+Shift+S
            // These usually fire on keydown before the OS grabs them (sometimes)
            if (e.key === 'PrintScreen' || e.code === 'PrintScreen') {
                triggerOverlay();
            }

            if (e.metaKey && e.shiftKey && (e.key === '3' || e.key === '4' || e.key === '5')) {
                triggerOverlay();
            }

            // Windows: Win+Shift+S (Snipping Tool)
            // Note: 's' key might be case sensitive depending on Shift, checking 'code' is safer
            if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === 's' || e.key === 'S' || e.code === 'KeyS')) {
                triggerOverlay();
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            // PrintScreen often fires on KeyUp because OS intercepts KeyDown
            if (e.key === 'PrintScreen' || e.code === 'PrintScreen') {
                triggerOverlay();
            }
        };

        const handleCopy = (e: ClipboardEvent) => {
            e.preventDefault();
            triggerOverlay();
        };

        // When usage of Snipping Tool or other external tools causes window to lose focus
        // This is an aggressive measure: it shows the overlay when you click "New" in Snipping tool (which blurs window)
        // or when you Alt-Tab. 
        // It might be annoying, but the user requested "force show".
        const handleBlur = () => {
            // We only trigger if we suspect something? No, let's trigger it. 
            // If they switch tabs/apps, they see the warning. It's safe.
            triggerOverlay();
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
        window.addEventListener('keyup', handleKeyUp);
        window.addEventListener('copy', handleCopy);
        window.addEventListener('contextmenu', handleContextMenu);
        window.addEventListener('dragstart', handleDragStart);
        window.addEventListener('blur', handleBlur);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            window.removeEventListener('copy', handleCopy);
            window.removeEventListener('contextmenu', handleContextMenu);
            window.removeEventListener('dragstart', handleDragStart);
            window.removeEventListener('blur', handleBlur);
            if (timeout) clearTimeout(timeout);
        };
    }, []);

    if (!showOverlay) return null;

    return (
        <div
            className="fixed inset-0 z-[999999] bg-black flex items-center justify-center pointer-events-none w-screen h-screen overflow-hidden"
            aria-hidden="true"
        >
            <div className="relative w-full h-full max-w-[90vw] md:max-w-5xl max-h-[90vh]">
                <Image
                    src="/copyright-warning.jpg"
                    alt="COPYRIGHT WARNING"
                    fill
                    className="object-contain"
                    priority
                    unoptimized
                />
            </div>
        </div>
    );
}
