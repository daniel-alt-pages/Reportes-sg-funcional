'use client';

import { useMemo } from 'react';
import { Estudiante } from '@/types';

interface ProfileByLevelProps {
    estudiantes: Estudiante[];
}

// Configuración de áreas
const AREAS_CONFIG = [
    { key: 'matematicas', name: 'Matemáticas' },
    { key: 'lectura_critica', name: 'Lectura Crítica' },
    { key: 'sociales_ciudadanas', name: 'Sociales' },
    { key: 'ciencias_naturales', name: 'Ciencias' },
    { key: 'ingles', name: 'Inglés' }
];

// Configuración de niveles
const NIVELES_CONFIG = {
    'Superior': { emoji: '🏆', color: 'emerald', bgClass: 'bg-emerald-500/10', borderClass: 'border-emerald-500/30', textClass: 'text-emerald-400', rango: '> 400', minScore: 401 },
    'Alto': { emoji: '⭐', color: 'blue', bgClass: 'bg-blue-500/10', borderClass: 'border-blue-500/30', textClass: 'text-blue-400', rango: '301-400', minScore: 301, maxScore: 400 },
    'Básico': { emoji: '📚', color: 'amber', bgClass: 'bg-amber-500/10', borderClass: 'border-amber-500/30', textClass: 'text-amber-400', rango: '201-300', minScore: 201, maxScore: 300 },
    'Bajo': { emoji: '🚨', color: 'rose', bgClass: 'bg-rose-500/10', borderClass: 'border-rose-500/30', textClass: 'text-rose-400', rango: '≤ 200', maxScore: 200 }
};

type NivelKey = keyof typeof NIVELES_CONFIG;

export default function ProfileByLevel({ estudiantes }: ProfileByLevelProps) {
    const perfiles = useMemo(() => {
        // Agrupar estudiantes por nivel
        const grupos: Record<NivelKey, Estudiante[]> = {
            'Superior': [],
            'Alto': [],
            'Básico': [],
            'Bajo': []
        };

        estudiantes.forEach(est => {
            const global = Number(est.puntaje_global) || 0;
            if (global > 400) grupos['Superior'].push(est);
            else if (global > 300) grupos['Alto'].push(est);
            else if (global > 200) grupos['Básico'].push(est);
            else if (global > 0) grupos['Bajo'].push(est);
        });

        // Calcular estadísticas por nivel
        return Object.entries(grupos).map(([nivel, ests]) => {
            if (ests.length === 0) return null;

            const config = NIVELES_CONFIG[nivel as NivelKey];

            // Helper para obtener puntaje con múltiples keys posibles
            const getScore = (est: Estudiante, key: string): number => {
                if (!est.puntajes) return 0;
                if (est.puntajes[key]?.puntaje) return Number(est.puntajes[key].puntaje);
                // Nombres exactos del JSON primero
                const variations: Record<string, string[]> = {
                    'matematicas': ['matemáticas', 'matematicas', 'Matemáticas', 'MATEMATICAS'],
                    'lectura_critica': ['lectura crítica', 'lectura_critica', 'Lectura Crítica', 'LECTURA_CRITICA'],
                    'sociales_ciudadanas': ['sociales y ciudadanas', 'sociales_ciudadanas', 'Sociales y Ciudadanas', 'SOCIALES_CIUDADANAS'],
                    'ciencias_naturales': ['ciencias naturales', 'ciencias_naturales', 'Ciencias Naturales', 'CIENCIAS_NATURALES'],
                    'ingles': ['inglés', 'ingles', 'Inglés', 'INGLES']
                };
                for (const variant of (variations[key] || [])) {
                    if (est.puntajes[variant]?.puntaje) return Number(est.puntajes[variant].puntaje);
                }
                return 0;
            };

            // Promedio global
            const globalScores = ests.map(e => Number(e.puntaje_global) || 0);
            const promedioGlobal = globalScores.reduce((a, b) => a + b, 0) / globalScores.length;

            // Estadísticas por área
            const areasStats = AREAS_CONFIG.map(area => {
                const scores = ests.map(e => getScore(e, area.key)).filter(s => s > 0);
                return {
                    area: area.name,
                    key: area.key,
                    promedio: scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0
                };
            });

            // Encontrar fortaleza y debilidad
            const sorted = [...areasStats].sort((a, b) => b.promedio - a.promedio);
            const fortaleza = sorted[0];
            const debilidad = sorted[sorted.length - 1];
            const brecha = fortaleza.promedio - debilidad.promedio;

            // Recomendación
            let recomendacion = '';
            if (nivel === 'Superior') recomendacion = 'Programas de enriquecimiento y mentoría';
            else if (nivel === 'Alto') recomendacion = `Reforzar ${debilidad.area} para alcanzar nivel Superior`;
            else if (nivel === 'Básico') recomendacion = `Intervención focalizada en ${debilidad.area}`;
            else recomendacion = '¡ATENCIÓN URGENTE! Plan de intervención integral';

            return {
                nivel: nivel as NivelKey,
                config,
                count: ests.length,
                promedioGlobal,
                fortaleza,
                debilidad,
                brecha,
                recomendacion,
                areasStats
            };
        }).filter(Boolean);
    }, [estudiantes]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    👤 Perfil del Estudiante por Nivel
                </h2>
                <p className="text-white/50 mt-1">
                    Caracterización del estudiante promedio en cada nivel de desempeño
                </p>
            </div>

            {/* Cards de perfil por nivel */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {perfiles.map((perfil) => perfil && (
                    <div
                        key={perfil.nivel}
                        className={`${perfil.config.bgClass} border ${perfil.config.borderClass} rounded-xl p-5 space-y-4`}
                    >
                        {/* Header del nivel */}
                        <div className="flex justify-between items-start">
                            <div>
                                <div className={`${perfil.config.textClass} font-bold text-lg`}>
                                    {perfil.config.emoji} NIVEL {perfil.nivel.toUpperCase()}
                                </div>
                                <div className="text-white/50 text-sm">{perfil.config.rango}</div>
                            </div>
                            <div className={`${perfil.config.textClass} text-3xl font-bold`}>
                                {perfil.count}
                                <span className="text-sm font-normal text-white/50 ml-1">estudiantes</span>
                            </div>
                        </div>

                        {/* Estadísticas principales */}
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-white/50">Promedio Global:</span>
                                <span className="font-bold text-xl text-white">{perfil.promedioGlobal.toFixed(0)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-white/50">💪 Área fuerte:</span>
                                <span className="font-medium text-emerald-400">
                                    {perfil.fortaleza.area} ({perfil.fortaleza.promedio.toFixed(1)})
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-white/50">📉 Área débil:</span>
                                <span className="font-medium text-rose-400">
                                    {perfil.debilidad.area} ({perfil.debilidad.promedio.toFixed(1)})
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-white/50">📊 Brecha:</span>
                                <span className={`font-medium ${perfil.brecha > 15 ? 'text-amber-400' : 'text-white/60'}`}>
                                    {perfil.brecha.toFixed(1)} pts
                                </span>
                            </div>
                        </div>

                        {/* Recomendación */}
                        <div className="pt-3 border-t border-white/10">
                            <div className="text-white/40 text-xs mb-1">💡 Recomendación:</div>
                            <div className="text-white/70 text-sm italic">{perfil.recomendacion}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Tabla detallada de promedios */}
            <div className="bg-[#0a0b10]/50 backdrop-blur border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">📊 Detalle de Promedios por Área y Nivel</h3>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/10">
                                <th className="p-3 text-left text-white/70 font-medium">Nivel</th>
                                {AREAS_CONFIG.map(area => (
                                    <th key={area.key} className="p-3 text-center text-white/70 font-medium text-sm">
                                        {area.name}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {perfiles.map((perfil) => perfil && (
                                <tr key={perfil.nivel} className="border-b border-white/5">
                                    <td className={`p-3 font-bold ${perfil.config.textClass}`}>
                                        {perfil.config.emoji} {perfil.nivel}
                                    </td>
                                    {perfil.areasStats.map(stat => {
                                        let bgClass = '';
                                        if (stat.promedio >= 80) bgClass = 'bg-emerald-500/20';
                                        else if (stat.promedio >= 60) bgClass = 'bg-amber-500/10';
                                        else if (stat.promedio > 0) bgClass = 'bg-rose-500/10';

                                        return (
                                            <td key={stat.key} className={`p-3 text-center ${bgClass}`}>
                                                <span className="font-mono text-white">
                                                    {stat.promedio.toFixed(1)}
                                                </span>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Guía de interpretación */}
            <div className="bg-teal-500/5 border border-teal-500/20 rounded-xl p-5">
                <h4 className="text-teal-400 font-bold mb-3">📖 ¿Cómo usar este análisis?</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-white/60">
                    <div>
                        <p className="font-semibold text-white mb-1">¿Qué significan los niveles?</p>
                        <ul className="space-y-1">
                            <li>• <span className="text-emerald-400">SUPERIOR (&gt;400)</span>: Excelencia académica</li>
                            <li>• <span className="text-blue-400">ALTO (301-400)</span>: Buen desempeño</li>
                            <li>• <span className="text-amber-400">BÁSICO (201-300)</span>: Requiere refuerzo</li>
                            <li>• <span className="text-rose-400">BAJO (≤200)</span>: Intervención urgente</li>
                        </ul>
                    </div>
                    <div>
                        <p className="font-semibold text-white mb-1">¿Qué es la brecha entre áreas?</p>
                        <p>Diferencia entre el área más fuerte y la más débil.</p>
                        <ul className="space-y-1 mt-1">
                            <li>• <span className="text-amber-400">&gt;15 pts</span>: Perfil desigual</li>
                            <li>• <span className="text-white/50">&lt;10 pts</span>: Perfil homogéneo</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
