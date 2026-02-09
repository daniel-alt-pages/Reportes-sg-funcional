'use client';
import { useEffect, useState } from 'react';

interface StudentComparisonBarProps {
    myScore: number;
    average: number;
    median: number;
    p90: number;
    min: number;
    max: number;
    label?: string;
}

export default function StudentComparisonBar({
    myScore,
    average,
    median,
    p90,
    min,
    max,
    label = "Puntaje Global"
}: StudentComparisonBarProps) {
    const [animated, setAnimated] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setAnimated(true), 100);
        return () => clearTimeout(timer);
    }, []);

    const range = max - min || 1;
    const getPosition = (value: number) => Math.max(0, Math.min(100, ((value - min) / range) * 100));

    const myPosition = getPosition(myScore);
    const avgPosition = getPosition(average);
    const medianPosition = getPosition(median);
    const p90Position = getPosition(p90);

    // Determinar color según posición relativa
    const getMyColor = () => {
        if (myScore >= p90) return { bg: 'bg-emerald-500', glow: 'shadow-emerald-500/50' };
        if (myScore >= average) return { bg: 'bg-blue-500', glow: 'shadow-blue-500/50' };
        return { bg: 'bg-amber-500', glow: 'shadow-amber-500/50' };
    };

    const myColor = getMyColor();

    return (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/60 shadow-lg">
            <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-bold text-slate-600 uppercase tracking-wider">{label}</h4>
                <div className="flex items-center gap-4 text-xs">
                    <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                        <span className="text-slate-500">Promedio: {average}</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                        <span className="text-slate-500">Mediana: {median}</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                        <span className="text-slate-500">P90: {p90}</span>
                    </span>
                </div>
            </div>

            {/* Barra principal */}
            <div className="relative h-8 bg-gradient-to-r from-slate-100 to-slate-50 rounded-full overflow-visible">
                {/* Rango visual */}
                <div className="absolute inset-y-0 left-0 right-0 flex items-center">
                    {/* Zona baja (rojo suave) */}
                    <div
                        className="h-full bg-gradient-to-r from-red-100 to-amber-50 rounded-l-full"
                        style={{ width: `${avgPosition}%` }}
                    ></div>
                    {/* Zona media (amarillo suave) */}
                    <div
                        className="h-full bg-gradient-to-r from-amber-50 to-blue-50"
                        style={{ width: `${p90Position - avgPosition}%` }}
                    ></div>
                    {/* Zona alta (verde suave) */}
                    <div
                        className="h-full bg-gradient-to-r from-blue-50 to-emerald-100 rounded-r-full"
                        style={{ width: `${100 - p90Position}%` }}
                    ></div>
                </div>

                {/* Marcador Promedio */}
                <div
                    className="absolute top-1/2 -translate-y-1/2 w-0.5 h-10 bg-slate-400 z-10 transition-all duration-700"
                    style={{ left: `${animated ? avgPosition : 0}%` }}
                >
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-medium text-slate-500 whitespace-nowrap">
                        Prom
                    </div>
                </div>

                {/* Marcador Mediana */}
                <div
                    className="absolute top-1/2 -translate-y-1/2 w-0.5 h-8 bg-indigo-400 z-10 transition-all duration-700 delay-100"
                    style={{ left: `${animated ? medianPosition : 0}%` }}
                ></div>

                {/* Marcador P90 */}
                <div
                    className="absolute top-1/2 -translate-y-1/2 w-0.5 h-10 bg-emerald-500 z-10 transition-all duration-700 delay-200"
                    style={{ left: `${animated ? p90Position : 0}%` }}
                >
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-medium text-emerald-600 whitespace-nowrap">
                        P90
                    </div>
                </div>

                {/* MI PUNTAJE (destacado) */}
                <div
                    className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 rounded-full ${myColor.bg} ${myColor.glow} shadow-lg z-20 flex items-center justify-center transition-all duration-1000 ease-out`}
                    style={{ left: `${animated ? myPosition : 0}%` }}
                >
                    <span className="text-white text-xs font-black">{myScore}</span>
                </div>
            </div>

            {/* Leyenda inferior */}
            <div className="flex justify-between mt-3 text-xs text-slate-400">
                <span>{min}</span>
                <span className="font-medium text-slate-600">Tu puntaje: <span className="font-black text-slate-800">{myScore}</span></span>
                <span>{max}</span>
            </div>
        </div>
    );
}
