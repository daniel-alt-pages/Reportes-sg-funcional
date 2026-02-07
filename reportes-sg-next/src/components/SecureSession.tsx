'use client';
import { useEffect } from 'react';

export default function SecureSession() {
    useEffect(() => {
        // Solo activar en producción para permitir debugging local
        if (process.env.NODE_ENV !== 'production') return;

        // 1. Deshabilitar Clic Derecho
        const handleContextMenu = (e: MouseEvent) => {
            e.preventDefault();
        };

        // 2. Deshabilitar Atajos de Teclado (F12, Ctrl+Shift+I, etc.)
        const handleKeyDown = (e: KeyboardEvent) => {
            // F12
            if (e.key === 'F12') {
                e.preventDefault();
                return;
            }

            // Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C (DevTools)
            if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) {
                e.preventDefault();
                return;
            }

            // Ctrl+U (Ver Fuente)
            if (e.ctrlKey && e.key === 'u') {
                e.preventDefault();
                return;
            }
        };

        // 3. Método "Debugger" loop (Deshabilitado por ser muy intrusivo, pero si el usuario insiste se puede activar)
        // const antiDebug = setInterval(() => {
        //     debugger;
        // }, 1000);

        document.addEventListener('contextmenu', handleContextMenu);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('contextmenu', handleContextMenu);
            document.removeEventListener('keydown', handleKeyDown);
            // clearInterval(antiDebug);
        };
    }, []);

    return null; // Este componente no renderiza nada visual
}
