import React from 'react';

export default function MetricCard({ titulo, valor, subtitulo, icono, color }: {
    titulo: string;
    valor: string | number;
    subtitulo?: string;
    icono: string;
    color: string;
}) {
    return (
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 flex items-center gap-4 hover:bg-white/10 transition-all hover:scale-[1.02] group shadow-xl relative overflow-hidden">
            {/* Efecto de brillo de fondo */}
            <div className={`absolute -right-4 -top-4 w-24 h-24 bg-gradient-to-br ${color} opacity-20 blur-2xl rounded-full group-hover:opacity-30 transition-opacity`} />

            <div className={`w-14 h-14 min-w-[3.5rem] rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg shadow-black/30 group-hover:scale-110 transition-transform ring-1 ring-white/20 z-10`}>
                <span className="text-3xl drop-shadow-md">{icono}</span>
            </div>

            <div className="flex-1 relative z-10">
                <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest mb-1">{titulo}</p>
                <div className="flex flex-col items-start gap-1">
                    <p className="text-3xl font-bold text-white leading-none tracking-tight">{valor}</p>
                    {subtitulo && (
                        <div className="px-2 py-0.5 rounded-full bg-white/10 border border-white/5 backdrop-blur-sm">
                            <p className="text-[10px] text-white/80 font-semibold">{subtitulo}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
