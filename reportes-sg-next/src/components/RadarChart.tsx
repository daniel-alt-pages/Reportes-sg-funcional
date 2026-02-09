'use client';

import React, { useState } from 'react';
import { BarChart3, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface AreaData {
    label: string;
    value: number;
    maxValue?: number;
}

interface RadarChartProps {
    data: AreaData[];
    size?: number;
    showLabels?: boolean;
    fillColor?: string;
    strokeColor?: string;
}

// Colores vibrantes para cada área
const AREA_CONFIG: Record<string, {
    color: string;
    gradient: string;
    glow: string;
    icon: string;
    fullName: string;
}> = {
    'LEC': {
        color: '#a855f7',
        gradient: 'from-purple-500 to-violet-600',
        glow: 'rgba(168, 85, 247, 0.5)',
        icon: '📖',
        fullName: 'Lectura Crítica'
    },
    'MAT': {
        color: '#3b82f6',
        gradient: 'from-blue-500 to-indigo-600',
        glow: 'rgba(59, 130, 246, 0.5)',
        icon: '🔢',
        fullName: 'Matemáticas'
    },
    'SOC': {
        color: '#f59e0b',
        gradient: 'from-amber-500 to-orange-600',
        glow: 'rgba(245, 158, 11, 0.5)',
        icon: '🌍',
        fullName: 'Sociales y Ciudadanas'
    },
    'CIEN': {
        color: '#22c55e',
        gradient: 'from-emerald-500 to-green-600',
        glow: 'rgba(34, 197, 94, 0.5)',
        icon: '🔬',
        fullName: 'Ciencias Naturales'
    },
    'ING': {
        color: '#ec4899',
        gradient: 'from-pink-500 to-rose-600',
        glow: 'rgba(236, 72, 153, 0.5)',
        icon: '🌐',
        fullName: 'Inglés'
    },
};

const getAreaConfig = (label: string) => {
    const key = label.toUpperCase().substring(0, 4);
    return AREA_CONFIG[key] || AREA_CONFIG['LEC'];
};

// Determinar el nivel de rendimiento
const getPerformanceLevel = (value: number, max: number = 100) => {
    const percent = (value / max) * 100;
    if (percent >= 70) return { label: 'Excelente', color: 'text-emerald-400', bg: 'bg-emerald-500/20', icon: TrendingUp };
    if (percent >= 55) return { label: 'Bueno', color: 'text-cyan-400', bg: 'bg-cyan-500/20', icon: TrendingUp };
    if (percent >= 40) return { label: 'Regular', color: 'text-amber-400', bg: 'bg-amber-500/20', icon: Minus };
    return { label: 'Bajo', color: 'text-rose-400', bg: 'bg-rose-500/20', icon: TrendingDown };
};

export default function RadarChart({ data }: RadarChartProps) {
    const [hoveredArea, setHoveredArea] = useState<string | null>(null);

    // Ordenar datos de mayor a menor
    const sortedData = [...data]
        .map(d => ({ ...d, config: getAreaConfig(d.label) }))
        .sort((a, b) => b.value - a.value);

    const maxValue = Math.max(...data.map(d => d.maxValue || 100), 100);
    const avgValue = data.reduce((a, b) => a + b.value, 0) / data.length;

    // Identificar fortaleza y debilidad
    const strongest = sortedData[0];
    const weakest = sortedData[sortedData.length - 1];
    const gap = strongest.value - weakest.value;

    return (
        <div className="w-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-purple-400" />
                    Perfil por Área
                </h3>
                <div className="flex items-center gap-3 text-xs">
                    <span className="text-white/40">Promedio:</span>
                    <span className="font-bold text-white bg-white/10 px-2 py-0.5 rounded">
                        {avgValue.toFixed(0)} pts
                    </span>
                </div>
            </div>

            {/* Barras de rendimiento */}
            <div className="space-y-4">
                {sortedData.map((item, idx) => {
                    const config = item.config;
                    const percent = (item.value / maxValue) * 100;
                    const performance = getPerformanceLevel(item.value, maxValue);
                    const isStrongest = item.label === strongest.label;
                    const isWeakest = item.label === weakest.label;
                    const isHovered = hoveredArea === item.label;

                    return (
                        <div
                            key={item.label}
                            className={`group relative p-3 rounded-xl transition-all duration-300 cursor-pointer ${isHovered ? 'bg-white/10 scale-[1.02]' : 'bg-white/5 hover:bg-white/8'
                                } ${isStrongest ? 'ring-1 ring-emerald-500/30' : ''} ${isWeakest ? 'ring-1 ring-rose-500/30' : ''}`}
                            onMouseEnter={() => setHoveredArea(item.label)}
                            onMouseLeave={() => setHoveredArea(null)}
                            style={{ animationDelay: `${idx * 80}ms` }}
                        >
                            {/* Badges de fortaleza/debilidad */}
                            {isStrongest && (
                                <span className="absolute -top-2 right-3 text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                                    💪 Fortaleza
                                </span>
                            )}
                            {isWeakest && (
                                <span className="absolute -top-2 right-3 text-[10px] font-bold text-rose-400 bg-rose-500/20 px-2 py-0.5 rounded-full border border-rose-500/30">
                                    📚 A reforzar
                                </span>
                            )}

                            {/* Fila principal */}
                            <div className="flex items-center gap-4">
                                {/* Icono y nombre */}
                                <div className="flex items-center gap-3 w-44 min-w-[176px]">
                                    <div
                                        className={`w-10 h-10 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center text-lg shadow-lg transition-transform duration-300 ${isHovered ? 'scale-110' : ''}`}
                                        style={{ boxShadow: isHovered ? `0 0 20px ${config.glow}` : 'none' }}
                                    >
                                        {config.icon}
                                    </div>
                                    <div>
                                        <span
                                            className="font-bold text-sm transition-colors"
                                            style={{ color: config.color }}
                                        >
                                            {item.label}
                                        </span>
                                        <span className="block text-[10px] text-white/40 leading-tight">
                                            {config.fullName}
                                        </span>
                                    </div>
                                </div>

                                {/* Barra de progreso */}
                                <div className="flex-1">
                                    <div className="h-8 bg-black/30 rounded-lg overflow-hidden border border-white/5">
                                        <div
                                            className={`h-full rounded-lg bg-gradient-to-r ${config.gradient} flex items-center justify-end pr-3 transition-all duration-700 ease-out`}
                                            style={{
                                                width: `${Math.max(percent, 8)}%`,
                                                boxShadow: `0 0 15px ${config.glow}`
                                            }}
                                        >
                                            <span className="text-white font-black text-sm drop-shadow-lg">
                                                {item.value}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Indicador de nivel */}
                                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${performance.bg} min-w-[100px] justify-center`}>
                                    <performance.icon className={`w-3.5 h-3.5 ${performance.color}`} />
                                    <span className={`text-xs font-bold ${performance.color}`}>
                                        {performance.label}
                                    </span>
                                </div>
                            </div>

                            {/* Detalles expandidos al hover */}
                            {isHovered && (
                                <div className="mt-3 pt-3 border-t border-white/10 grid grid-cols-3 gap-4 animate-in fade-in duration-200">
                                    <div className="text-center">
                                        <span className="text-[10px] text-white/40 block">Puntaje</span>
                                        <span className="text-lg font-black" style={{ color: config.color }}>
                                            {item.value}
                                        </span>
                                    </div>
                                    <div className="text-center">
                                        <span className="text-[10px] text-white/40 block">vs Promedio</span>
                                        <span className={`text-lg font-black ${item.value >= avgValue ? 'text-emerald-400' : 'text-rose-400'}`}>
                                            {item.value >= avgValue ? '+' : ''}{(item.value - avgValue).toFixed(0)}
                                        </span>
                                    </div>
                                    <div className="text-center">
                                        <span className="text-[10px] text-white/40 block">Rendimiento</span>
                                        <span className="text-lg font-black text-white">
                                            {percent.toFixed(0)}%
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Resumen inferior */}
            <div className="mt-6 grid grid-cols-3 gap-3">
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-center">
                    <span className="text-[10px] text-emerald-400 font-bold block mb-1">MEJOR ÁREA</span>
                    <span className="text-white font-bold text-sm flex items-center justify-center gap-1">
                        {strongest.config.icon} {strongest.label}
                    </span>
                    <span className="text-emerald-400 font-black">{strongest.value} pts</span>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                    <span className="text-[10px] text-white/50 font-bold block mb-1">BRECHA</span>
                    <span className={`text-2xl font-black ${gap > 10 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {gap}
                    </span>
                    <span className="text-white/40 text-[10px] block">puntos</span>
                </div>
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 text-center">
                    <span className="text-[10px] text-rose-400 font-bold block mb-1">A MEJORAR</span>
                    <span className="text-white font-bold text-sm flex items-center justify-center gap-1">
                        {weakest.config.icon} {weakest.label}
                    </span>
                    <span className="text-rose-400 font-black">{weakest.value} pts</span>
                </div>
            </div>

            {/* Tip educativo */}
            <div className="mt-4 p-3 bg-blue-500/5 border border-blue-500/20 rounded-xl">
                <p className="text-xs text-blue-300/80">
                    💡 <strong>Consejo:</strong> Enfoca el refuerzo en <span className="text-rose-400 font-bold">{weakest.config.fullName}</span> para
                    cerrar la brecha de {gap} puntos. Las áreas con nivel "Excelente" pueden servir como ancla de motivación.
                </p>
            </div>
        </div>
    );
}
