'use client';

import { useEffect } from 'react';
import { SECURITY_CONFIG } from '@/config/securityConfig';

export default function SecurityProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        if (!SECURITY_CONFIG.disableConsoleAccess) return;

        // 1. Bloquear clic derecho
        const handleContextMenu = (e: MouseEvent) => {
            e.preventDefault();
        };

        // 2. Bloquear combinaciones de teclas (F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U)
        const handleKeyDown = (e: KeyboardEvent) => {
            // F12
            if (e.key === 'F12') {
                e.preventDefault();
            }
            // Ctrl + Shift + I / J / C
            if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) {
                e.preventDefault();
            }
            // Ctrl + U (Ver código fuente)
            if (e.ctrlKey && e.key === 'u') {
                e.preventDefault();
            }
            // Ctrl + S (Guardar página)
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
            }
        };

        // 3. Intento de limpiar consola periódicamente (opcional)
        const checkConsole = () => {
            if (SECURITY_CONFIG.disableConsoleAccess) {
                // Truco para detectar si la consola está abierta (puede ser molestia para el usuario)
                // console.clear();
            }
        };

        document.addEventListener('contextmenu', handleContextMenu);
        document.addEventListener('keydown', handleKeyDown);
        const interval = setInterval(checkConsole, 1000);

        return () => {
            document.removeEventListener('contextmenu', handleContextMenu);
            document.removeEventListener('keydown', handleKeyDown);
            clearInterval(interval);
        };
    }, []);

    return <>{children}</>;
}
