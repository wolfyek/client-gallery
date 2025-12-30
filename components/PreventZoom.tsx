'use client';

import { useEffect } from 'react';

export default function PreventZoom() {
    useEffect(() => {
        const handleTouchMove = (e: TouchEvent) => {
            if (e.touches.length > 1) {
                e.preventDefault();
            }
        };

        const handleGestureStart = (e: Event) => {
            e.preventDefault();
        };

        // @ts-ignore - gesturestart is iOS specific
        document.addEventListener('gesturestart', handleGestureStart);
        document.addEventListener('touchmove', handleTouchMove, { passive: false });

        return () => {
            // @ts-ignore
            document.removeEventListener('gesturestart', handleGestureStart);
            document.removeEventListener('touchmove', handleTouchMove);
        };
    }, []);

    return null;
}
