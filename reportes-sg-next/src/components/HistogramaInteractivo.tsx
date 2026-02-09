'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface HistogramaInteractivoProps {
    distribucion: Record<string, number>;
    total: number;
    onRangoClick?: (rango: string, estudiantes: number) => void;
}

export default function HistogramaInteractivo({ distribucion, total, onRangoClick }: HistogramaInteractivoProps) {
    const [selectedRango, setSelectedRango] = useState<string | null>(null);
    const [hoveredRango, setHoveredRango] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'barras' | 'curva' | 'acumulado'>('barras');
    const [showPercentiles, setShowPercentiles] = useState(false);

    // Calcular estadísticas
    const stats = useMemo(() => {
        const entries = Object.entries(distribucion);
        const maxCount = Math.max(...Object.values(distribucion));
        const totalEstudiantes = Object.values(distribucion).reduce((a, b) => a + b, 0);

        // Calcular promedio ponderado
        let sumaPonderada = 0;
        entries.forEach(([rango, count]) => {
            const rangoNum = parseInt(rango.split('-')[0]);
            sumaPonderada += (rangoNum + 12.5) * count;
        });
        const promedio = totalEstudiantes > 0 ? sumaPonderada / totalEstudiantes : 0;

        // Calcular mediana
        let acumulado = 0;
        let mediana = 0;
        for (const [rango, count] of entries) {
            acumulado += count;
            if (acumulado >= totalEstudiantes / 2) {
                mediana = parseInt(rango.split('-')[0]) + 12.5;
                break;
            }
        }

        // Calcular percentiles
        const percentiles: Record<string, number> = {};
        let acum = 0;
        entries.forEach(([rango, count]) => {
            acum += count;
            percentiles[rango] = Math.round((acum / totalEstudiantes) * 100);
        });

        return { maxCount, totalEstudiantes, promedio, mediana, percentiles };
    }, [distribucion]);

    // Datos acumulados para vista alternativa
    const datosAcumulados = useMemo(() => {
        let acum = 0;
        return Object.entries(distribucion).map(([rango, count]) => {
            acum += count;
            return { rango, count, acumulado: acum, porcentajeAcum: (acum / stats.totalEstudiantes) * 100 };
        });
    }, [distribucion, stats.totalEstudiantes]);

    const handleRangoClick = (rango: string, count: number) => {
        setSelectedRango(selectedRango === rango ? null : rango);
        onRangoClick?.(rango, count);
    };

    const getRangoColor = (rangoNum: number, isSelected: boolean, isHovered: boolean) => {
        const baseOpacity = isSelected ? 1 : isHovered ? 0.9 : 0.8;

        if (rangoNum >= 400) {
            return {
                bg: `rgba(16, 185, 129, ${baseOpacity})`, // emerald
                gradient: 'from-emerald-500 via-green-400 to-teal-400',
                shadow: 'shadow-emerald-500/40',
                glow: 'emerald'
            };
        } else if (rangoNum >= 350) {
            return {
                bg: `rgba(59, 130, 246, ${baseOpacity})`, // blue
                gradient: 'from-blue-500 via-cyan-400 to-sky-400',
                shadow: 'shadow-blue-500/40',
                glow: 'blue'
            };
        } else if (rangoNum >= 300) {
            return {
                bg: `rgba(245, 158, 11, ${baseOpacity})`, // amber
                gradient: 'from-amber-500 via-yellow-400 to-orange-400',
                shadow: 'shadow-amber-500/40',
                glow: 'amber'
            };
        } else if (rangoNum >= 200) {
            return {
                bg: `rgba(139, 92, 246, ${baseOpacity})`, // violet
                gradient: 'from-violet-500 via-purple-400 to-fuchsia-400',
                shadow: 'shadow-violet-500/40',
                glow: 'violet'
            };
        }
        return {
            bg: `rgba(100, 116, 139, ${baseOpacity})`, // slate
            gradient: 'from-slate-500 via-gray-400 to-zinc-400',
            shadow: 'shadow-slate-500/40',
            glow: 'slate'
        };
    };

    return (
        <div className="bg-gradient-to-br from-slate-900/90 via-slate-800/70 to-slate-900/90 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-2xl">
            {/* Header con controles */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                        <span className="text-xl">📊</span>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white">Distribución de Puntajes</h3>
                        <p className="text-xs text-white/50">Click en las barras para ver detalles</p>
                    </div>
                </div>

                {/* Controles de visualización */}
                <div className="flex items-center gap-2">
                    <div className="flex bg-white/5 rounded-lg p-1 border border-white/10">
                        {[
                            { id: 'barras', icon: '📊', label: 'Barras' },
                            { id: 'curva', icon: '📈', label: 'Curva' },
                            { id: 'acumulado', icon: '📉', label: 'Acumulado' }
                        ].map((mode) => (
                            <button
                                key={mode.id}
                                onClick={() => setViewMode(mode.id as typeof viewMode)}
                                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-300 flex items-center gap-1.5 ${viewMode === mode.id
                                        ? 'bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-lg'
                                        : 'text-white/60 hover:text-white hover:bg-white/10'
                                    }`}
                            >
                                <span>{mode.icon}</span>
                                <span className="hidden sm:inline">{mode.label}</span>
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={() => setShowPercentiles(!showPercentiles)}
                        className={`p-2 rounded-lg transition-all duration-300 ${showPercentiles
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : 'bg-white/5 text-white/40 border border-white/10 hover:bg-white/10'
                            }`}
                        title="Mostrar percentiles"
                    >
                        <span className="text-sm">%</span>
                    </button>
                </div>
            </div>

            {/* Estadísticas rápidas */}
            <div className="grid grid-cols-4 gap-3 mb-6">
                {[
                    { label: 'Total', value: stats.totalEstudiantes, color: 'text-white' },
                    { label: 'Promedio', value: `${Math.round(stats.promedio)} pts`, color: 'text-violet-400' },
                    { label: 'Mediana', value: `${Math.round(stats.mediana)} pts`, color: 'text-cyan-400' },
                    { label: 'Superior', value: Object.entries(distribucion).filter(([r]) => parseInt(r.split('-')[0]) >= 400).reduce((a, [, c]) => a + c, 0), color: 'text-emerald-400' }
                ].map((stat) => (
                    <div key={stat.label} className="bg-white/5 rounded-xl p-3 border border-white/5">
                        <div className="text-[10px] uppercase tracking-wider text-white/40 mb-1">{stat.label}</div>
                        <div className={`text-lg font-bold ${stat.color}`}>{stat.value}</div>
                    </div>
                ))}
            </div>

            {/* Área del histograma */}
            <div className="relative min-h-[280px]">
                {/* Líneas de referencia */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-12">
                    {[0, 25, 50, 75, 100].map((pct) => (
                        <div key={pct} className="flex items-center gap-2 w-full">
                            <span className="text-[9px] text-white/20 w-6 text-right">{Math.round(stats.maxCount * (1 - pct / 100))}</span>
                            <div className="flex-1 border-b border-dashed border-white/5"></div>
                        </div>
                    ))}
                </div>

                {/* Vista de Barras */}
                {viewMode === 'barras' && (
                    <div className="relative flex items-end gap-1 h-56 px-8 pt-4">
                        <AnimatePresence>
                            {Object.entries(distribucion).map(([rango, count], index) => {
                                const height = stats.maxCount > 0 ? (count / stats.maxCount) * 100 : 0;
                                const rangoNum = parseInt(rango.split('-')[0]);
                                const isSelected = selectedRango === rango;
                                const isHovered = hoveredRango === rango;
                                const colors = getRangoColor(rangoNum, isSelected, isHovered);
                                const percentage = stats.totalEstudiantes > 0 ? ((count / stats.totalEstudiantes) * 100).toFixed(1) : '0';

                                return (
                                    <motion.div
                                        key={rango}
                                        className="flex-1 flex flex-col items-center cursor-pointer group relative"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05, duration: 0.4, ease: 'easeOut' }}
                                        onClick={() => handleRangoClick(rango, count)}
                                        onMouseEnter={() => setHoveredRango(rango)}
                                        onMouseLeave={() => setHoveredRango(null)}
                                    >
                                        {/* Tooltip flotante */}
                                        <AnimatePresence>
                                            {(isHovered || isSelected) && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: 5, scale: 0.95 }}
                                                    className="absolute -top-24 left-1/2 -translate-x-1/2 z-30"
                                                >
                                                    <div className={`bg-slate-800/95 backdrop-blur-xl border rounded-xl px-4 py-3 shadow-2xl min-w-[140px] ${isSelected ? 'border-violet-500/50' : 'border-white/20'
                                                        }`}>
                                                        <div className="text-white font-bold text-sm mb-1">{count} estudiantes</div>
                                                        <div className="text-white/60 text-xs mb-1">Rango: {rango}</div>
                                                        <div className="flex items-center gap-2">
                                                            <div className={`h-1.5 flex-1 rounded-full bg-white/10 overflow-hidden`}>
                                                                <motion.div
                                                                    initial={{ width: 0 }}
                                                                    animate={{ width: `${percentage}%` }}
                                                                    className={`h-full bg-gradient-to-r ${colors.gradient}`}
                                                                />
                                                            </div>
                                                            <span className="text-xs font-bold text-white/80">{percentage}%</span>
                                                        </div>
                                                        {showPercentiles && (
                                                            <div className="mt-2 pt-2 border-t border-white/10">
                                                                <span className="text-[10px] text-amber-400">
                                                                    Percentil {stats.percentiles[rango]}
                                                                </span>
                                                            </div>
                                                        )}
                                                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-slate-800/95"></div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        {/* Contador */}
                                        <motion.span
                                            animate={{
                                                scale: isHovered ? 1.2 : 1,
                                                color: isSelected ? '#a78bfa' : isHovered ? '#fff' : 'rgba(255,255,255,0.7)'
                                            }}
                                            className="text-xs font-bold mb-2 transition-colors duration-200"
                                        >
                                            {count}
                                        </motion.span>

                                        {/* Barra principal */}
                                        <motion.div
                                            className={`w-full rounded-t-xl relative overflow-hidden ${colors.shadow}`}
                                            initial={{ height: 0 }}
                                            animate={{
                                                height: `${Math.max(height, count > 0 ? 8 : 2)}%`,
                                                scale: isSelected ? 1.05 : isHovered ? 1.02 : 1
                                            }}
                                            transition={{ duration: 0.5, ease: 'easeOut' }}
                                            style={{
                                                minHeight: count > 0 ? '16px' : '4px',
                                                background: `linear-gradient(to top, ${colors.bg}, ${colors.bg.replace(')', ', 0.6)')}`
                                            }}
                                        >
                                            {/* Efecto de gradiente interno */}
                                            <div className={`absolute inset-0 bg-gradient-to-t ${colors.gradient} opacity-80`} />

                                            {/* Efecto de brillo en hover */}
                                            <motion.div
                                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12"
                                                initial={{ x: '-100%' }}
                                                animate={{ x: isHovered ? '200%' : '-100%' }}
                                                transition={{ duration: 0.6, ease: 'easeInOut' }}
                                            />

                                            {/* Indicador de selección */}
                                            {isSelected && (
                                                <motion.div
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    className="absolute inset-0 border-2 border-white/40 rounded-t-xl"
                                                />
                                            )}

                                            {/* Glow effect */}
                                            {(isSelected || isHovered) && (
                                                <motion.div
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 0.4 }}
                                                    className={`absolute -inset-1 bg-gradient-to-t ${colors.gradient} blur-xl -z-10`}
                                                />
                                            )}
                                        </motion.div>

                                        {/* Etiqueta del rango */}
                                        <div className="h-10 flex flex-col items-center justify-start mt-2">
                                            <motion.span
                                                animate={{
                                                    scale: isHovered ? 1.1 : 1,
                                                    color: rangoNum >= 400 ? '#34d399' : isHovered ? '#fff' : 'rgba(255,255,255,0.5)'
                                                }}
                                                className="text-[10px] font-semibold"
                                            >
                                                {rango.split('-')[0]}
                                            </motion.span>
                                            {showPercentiles && (
                                                <span className="text-[8px] text-amber-400/60">
                                                    P{stats.percentiles[rango]}
                                                </span>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                )}

                {/* Vista de Curva/Área */}
                {viewMode === 'curva' && (
                    <div className="relative h-56 px-8 pt-4">
                        <svg className="w-full h-full" viewBox={`0 0 ${Object.keys(distribucion).length * 50} 200`} preserveAspectRatio="none">
                            <defs>
                                <linearGradient id="curveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" stopColor="rgba(139, 92, 246, 0.8)" />
                                    <stop offset="100%" stopColor="rgba(139, 92, 246, 0.1)" />
                                </linearGradient>
                            </defs>

                            {/* Área rellena */}
                            <motion.path
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                d={`M 0 200 ${Object.entries(distribucion).map(([, count], i) => {
                                    const x = i * 50 + 25;
                                    const y = 200 - (count / stats.maxCount) * 180;
                                    return `L ${x} ${y}`;
                                }).join(' ')} L ${Object.keys(distribucion).length * 50} 200 Z`}
                                fill="url(#curveGradient)"
                            />

                            {/* Línea superior */}
                            <motion.path
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 1, ease: 'easeOut' }}
                                d={`M ${Object.entries(distribucion).map(([, count], i) => {
                                    const x = i * 50 + 25;
                                    const y = 200 - (count / stats.maxCount) * 180;
                                    return `${i === 0 ? '' : 'L '}${x} ${y}`;
                                }).join(' ')}`}
                                fill="none"
                                stroke="rgba(139, 92, 246, 1)"
                                strokeWidth="3"
                                strokeLinecap="round"
                            />

                            {/* Puntos */}
                            {Object.entries(distribucion).map(([rango, count], i) => {
                                const x = i * 50 + 25;
                                const y = 200 - (count / stats.maxCount) * 180;
                                return (
                                    <motion.circle
                                        key={rango}
                                        cx={x}
                                        cy={y}
                                        r="6"
                                        fill="#8b5cf6"
                                        stroke="white"
                                        strokeWidth="2"
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: i * 0.05 + 0.5 }}
                                        className="cursor-pointer hover:r-8"
                                        onClick={() => handleRangoClick(rango, count)}
                                    />
                                );
                            })}
                        </svg>

                        {/* Etiquetas X */}
                        <div className="flex justify-between px-2 mt-2">
                            {Object.keys(distribucion).map((rango) => (
                                <span key={rango} className="text-[9px] text-white/40">{rango.split('-')[0]}</span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Vista Acumulada */}
                {viewMode === 'acumulado' && (
                    <div className="relative h-56 px-8 pt-4">
                        <svg className="w-full h-full" viewBox={`0 0 ${datosAcumulados.length * 50} 200`} preserveAspectRatio="none">
                            <defs>
                                <linearGradient id="acumGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" stopColor="rgba(16, 185, 129, 0.8)" />
                                    <stop offset="100%" stopColor="rgba(16, 185, 129, 0.1)" />
                                </linearGradient>
                            </defs>

                            <motion.path
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                d={`M 0 200 ${datosAcumulados.map((d, i) => {
                                    const x = i * 50 + 25;
                                    const y = 200 - (d.porcentajeAcum / 100) * 180;
                                    return `L ${x} ${y}`;
                                }).join(' ')} L ${datosAcumulados.length * 50} 200 Z`}
                                fill="url(#acumGradient)"
                            />

                            <motion.path
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 1 }}
                                d={`M ${datosAcumulados.map((d, i) => {
                                    const x = i * 50 + 25;
                                    const y = 200 - (d.porcentajeAcum / 100) * 180;
                                    return `${i === 0 ? '' : 'L '}${x} ${y}`;
                                }).join(' ')}`}
                                fill="none"
                                stroke="#10b981"
                                strokeWidth="3"
                            />

                            {/* Línea del 50% */}
                            <line x1="0" y1="110" x2={datosAcumulados.length * 50} y2="110" stroke="rgba(255,255,255,0.2)" strokeDasharray="5,5" />
                            <text x="10" y="105" fill="rgba(255,255,255,0.4)" fontSize="10">50%</text>
                        </svg>

                        <div className="flex justify-between px-2 mt-2">
                            {datosAcumulados.map((d) => (
                                <span key={d.rango} className="text-[9px] text-white/40">{d.rango.split('-')[0]}</span>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Leyenda interactiva */}
            <div className="mt-6 pt-4 border-t border-white/10">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-4 text-xs">
                        {[
                            { range: '400+', color: 'bg-emerald-500', label: 'Superior' },
                            { range: '350-399', color: 'bg-blue-500', label: 'Alto' },
                            { range: '300-349', color: 'bg-amber-500', label: 'Medio' },
                            { range: '<300', color: 'bg-slate-500', label: 'Bajo' }
                        ].map((item) => (
                            <div key={item.range} className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
                                <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                                <span className="text-white/60">{item.label}</span>
                                <span className="text-white/30">({item.range})</span>
                            </div>
                        ))}
                    </div>

                    {selectedRango && (
                        <motion.button
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            onClick={() => setSelectedRango(null)}
                            className="px-3 py-1.5 bg-violet-500/20 text-violet-400 rounded-lg text-xs font-medium hover:bg-violet-500/30 transition-colors border border-violet-500/30"
                        >
                            Limpiar selección
                        </motion.button>
                    )}
                </div>
            </div>
        </div>
    );
}
