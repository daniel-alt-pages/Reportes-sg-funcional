
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Download, FileSpreadsheet, FileText, ChevronDown } from 'lucide-react';
import { Estudiante } from '@/types';
import { generateExcelReport } from '@/lib/reportGenerator';

interface ExportMenuProps {
    estudiantes: Estudiante[];
    disabled?: boolean;
    onOpenPreview: () => void;
}

export default function ExportMenu({ estudiantes, disabled, onOpenPreview }: ExportMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
    const menuRef = useRef<HTMLDivElement>(null);

    // Cerrar al hacer click fuera o al hacer scroll (para evitar que flote desalineado)
    useEffect(() => {
        function handleGlobalClick(event: MouseEvent) {
            // Si el click no fue en el botón del menú
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {

                // Y tampoco fue en el dropdown (que está en el portal)
                const dropdown = document.getElementById('export-dropdown-portal');
                if (dropdown && !dropdown.contains(event.target as Node)) {
                    setIsOpen(false);
                }
            }
        }

        function handleScroll() {
            if (isOpen) setIsOpen(false); // Cerrar al hacer scroll para evitar desalineación simple
        }

        window.addEventListener("mousedown", handleGlobalClick);
        window.addEventListener("scroll", handleScroll, true);

        return () => {
            window.removeEventListener("mousedown", handleGlobalClick);
            window.removeEventListener("scroll", handleScroll, true);
        };
    }, [isOpen]);

    const handleToggle = () => {
        if (!disabled) {
            if (!isOpen && menuRef.current) {
                const rect = menuRef.current.getBoundingClientRect();
                setCoords({
                    top: rect.bottom + 6,
                    left: rect.left,
                    width: rect.width
                });
            }
            setIsOpen(!isOpen);
        }
    };

    const handleExportExcel = () => {
        setIsOpen(false);
        onOpenPreview();
    };

    const handleExportCSV = () => {
        setIsOpen(false);
        alert("Generando CSV básico...");
    };

    return (
        <div ref={menuRef} className="w-full">
            <button
                onClick={handleToggle}
                disabled={disabled}
                className={`
                    w-full px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2
                    ${disabled
                        ? 'bg-white/5 text-white/30 cursor-not-allowed'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 active:scale-95'
                    }
                `}
            >
                <Download className="w-4 h-4" />
                <span>Exportar</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && typeof document !== 'undefined' && createPortal(
                <div
                    id="export-dropdown-portal"
                    style={{
                        position: 'fixed',
                        top: coords.top,
                        left: coords.left,
                        width: coords.width,
                        zIndex: 9999
                    }}
                    className="bg-[#1a1d2d] border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 ring-1 ring-white/10"
                >
                    <div className="p-1">
                        <button
                            onClick={handleExportExcel}
                            className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-white/5 flex items-center gap-3 transition-colors group"
                        >
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-colors flex-shrink-0">
                                <FileSpreadsheet className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                                <span className="block text-sm font-medium text-white truncate">Excel Profesional</span>
                                <span className="block text-[10px] text-white/40">Estilos y formato</span>
                            </div>
                        </button>

                        <button
                            onClick={handleExportCSV}
                            className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-white/5 flex items-center gap-3 transition-colors group"
                        >
                            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-colors flex-shrink-0">
                                <FileText className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                                <span className="block text-sm font-medium text-white truncate">CSV Plano</span>
                                <span className="block text-[10px] text-white/40">Datos crudos</span>
                            </div>
                        </button>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
