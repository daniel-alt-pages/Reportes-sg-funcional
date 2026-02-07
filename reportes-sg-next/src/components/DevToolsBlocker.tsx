'use client';

import { useEffect } from 'react';

export default function DevToolsBlocker() {
    useEffect(() => {
        // Disable right-click context menu
        const handleContextMenu = (e: MouseEvent) => {
            e.preventDefault();
        };

        // Disable keyboard shortcuts for devtools
        const handleKeyDown = (e: KeyboardEvent) => {
            if (
                // F12
                e.key === 'F12' ||
                // Ctrl+Shift+I (Chrome/Edge/Firefox)
                (e.ctrlKey && e.shiftKey && e.key === 'I') ||
                // Ctrl+Shift+C (Chrome/Edge element inspector)
                (e.ctrlKey && e.shiftKey && e.key === 'C') ||
                // Ctrl+Shift+J (Chrome/Edge console)
                (e.ctrlKey && e.shiftKey && e.key === 'J') ||
                // Ctrl+U (View Source)
                (e.ctrlKey && e.key === 'u')
            ) {
                e.preventDefault();
            }
        };

        // Initial console clearing and warning
        const clearConsole = () => {
            // This is a soft measure, advanced users can bypass it but it deters most
            console.clear();
            console.log('%c¡Alto!', 'color: red; font-size: 50px; font-weight: bold; text-shadow: 2px 2px 0px black;');
            console.log('%cEsta es una función del navegador para desarrolladores. Si alguien te dijo que copiaras y pegaras algo aquí para habilitar una función o "hackear" algo, es una estafa.', 'font-size: 20px;');
        };

        document.addEventListener('contextmenu', handleContextMenu);
        document.addEventListener('keydown', handleKeyDown);

        // Clear console periodically
        const interval = setInterval(clearConsole, 2000);
        clearConsole();

        return () => {
            document.removeEventListener('contextmenu', handleContextMenu);
            document.removeEventListener('keydown', handleKeyDown);
            clearInterval(interval);
        };
    }, []);

    return null;
}
