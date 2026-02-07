import React from 'react';

interface FloatingActionBarProps {
    selectedCount: number;
    onClear: () => void;
    onExport: () => void;
    onCompare: () => void;
}

export default function FloatingActionBar({ selectedCount, onClear, onExport, onCompare }: FloatingActionBarProps) {
    if (selectedCount === 0) return null;

    return (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-[#1a1b26] border border-white/20 rounded-2xl shadow-2xl z-50 px-6 py-4 flex items-center gap-6 animate-in slide-in-from-bottom-5 fade-in duration-300">
            <div className="flex items-center gap-3">
                <span className="bg-purple-600 text-white font-bold px-2 py-1 rounded-lg text-sm">{selectedCount}</span>
                <span className="text-white font-medium">Seleccionados</span>
            </div>

            <div className="h-8 w-px bg-white/10" />

            <div className="flex items-center gap-2">
                <button
                    onClick={onCompare}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-lg text-sm font-medium transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2"
                >
                    ⚔️ Comparar
                </button>
                <div className="w-px h-6 bg-white/10 mx-2" />
                <button
                    onClick={onExport}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                    📤 Exportar
                </button>
                <button
                    onClick={onClear}
                    className="px-4 py-2 hover:bg-red-500/10 text-red-400 hover:text-red-300 rounded-lg text-sm font-medium transition-colors"
                >
                    ✕ Cancelar
                </button>
            </div>
        </div>
    );
}
