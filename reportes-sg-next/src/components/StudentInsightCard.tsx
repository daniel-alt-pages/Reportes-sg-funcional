'use client';
import { ReactNode } from 'react';

type InsightType = 'strength' | 'weakness' | 'tip' | 'achievement' | 'warning';

interface StudentInsightCardProps {
    type: InsightType;
    title: string;
    description: string;
    metric?: string | number;
    metricLabel?: string;
    icon?: ReactNode;
}

const typeConfig: Record<InsightType, {
    gradient: string;
    iconBg: string;
    border: string;
    defaultIcon: string;
}> = {
    strength: {
        gradient: 'from-emerald-50 to-green-50',
        iconBg: 'bg-emerald-100 text-emerald-600',
        border: 'border-emerald-200',
        defaultIcon: '💪'
    },
    weakness: {
        gradient: 'from-amber-50 to-orange-50',
        iconBg: 'bg-amber-100 text-amber-600',
        border: 'border-amber-200',
        defaultIcon: '📚'
    },
    tip: {
        gradient: 'from-blue-50 to-indigo-50',
        iconBg: 'bg-blue-100 text-blue-600',
        border: 'border-blue-200',
        defaultIcon: '💡'
    },
    achievement: {
        gradient: 'from-purple-50 to-pink-50',
        iconBg: 'bg-purple-100 text-purple-600',
        border: 'border-purple-200',
        defaultIcon: '🏆'
    },
    warning: {
        gradient: 'from-red-50 to-orange-50',
        iconBg: 'bg-red-100 text-red-600',
        border: 'border-red-200',
        defaultIcon: '⚠️'
    }
};

export default function StudentInsightCard({
    type,
    title,
    description,
    metric,
    metricLabel,
    icon
}: StudentInsightCardProps) {
    const config = typeConfig[type];

    return (
        <div className={`relative bg-gradient-to-br ${config.gradient} rounded-2xl p-5 border ${config.border} overflow-hidden group hover:shadow-lg transition-all duration-300`}>
            {/* Decoración de fondo */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/40 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity"></div>

            <div className="relative z-10 flex items-start gap-4">
                {/* Icono */}
                <div className={`flex-shrink-0 w-12 h-12 rounded-xl ${config.iconBg} flex items-center justify-center text-2xl shadow-sm`}>
                    {icon || config.defaultIcon}
                </div>

                {/* Contenido */}
                <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-800 text-sm mb-1">{title}</h4>
                    <p className="text-slate-600 text-xs leading-relaxed">{description}</p>
                </div>

                {/* Métrica opcional */}
                {metric !== undefined && (
                    <div className="flex-shrink-0 text-right">
                        <div className="text-2xl font-black text-slate-800">{metric}</div>
                        {metricLabel && <div className="text-[10px] text-slate-500 uppercase tracking-wider">{metricLabel}</div>}
                    </div>
                )}
            </div>
        </div>
    );
}

// Generador de insights automáticos
interface StudentData {
    puntaje_global: number;
    puntajes: Record<string, { puntaje: number; correctas: number; total_preguntas: number }>;
}

interface GroupStats {
    promedio: number;
    mediana: number;
    p90: number;
    promediosPorMateria: Record<string, number>;
}

export function generateStudentInsights(
    estudiante: StudentData,
    groupStats: GroupStats,
    ranking: { puesto: number; total: number; percentil: number }
): StudentInsightCardProps[] {
    const insights: StudentInsightCardProps[] = [];
    const materias = Object.entries(estudiante.puntajes);

    // Encontrar materia más fuerte y más débil
    const sorted = materias.sort((a, b) => b[1].puntaje - a[1].puntaje);
    const strongest = sorted[0];
    const weakest = sorted[sorted.length - 1];

    // Insight de fortaleza
    if (strongest) {
        const [key, data] = strongest;
        const label = key.charAt(0).toUpperCase() + key.slice(1).toLowerCase();
        insights.push({
            type: 'strength',
            title: `Tu fortaleza: ${label}`,
            description: `Obtuviste ${data.puntaje} puntos, destacándote en esta área. ¡Sigue así!`,
            metric: data.puntaje,
            metricLabel: 'pts'
        });
    }

    // Insight de debilidad con recomendación
    if (weakest && weakest[1].puntaje < 60) {
        const [key, data] = weakest;
        const label = key.charAt(0).toUpperCase() + key.slice(1).toLowerCase();
        insights.push({
            type: 'weakness',
            title: `Área de mejora: ${label}`,
            description: `Con ${data.puntaje} puntos, esta es tu oportunidad de crecimiento. Dedica tiempo extra a practicar.`,
            metric: data.puntaje,
            metricLabel: 'pts'
        });
    }

    // Insight de logro si está en top
    if (ranking.percentil >= 90) {
        insights.push({
            type: 'achievement',
            title: '¡Top 10% del grupo!',
            description: `Estás en el puesto #${ranking.puesto} de ${ranking.total}. Un logro excepcional.`,
            metric: `#${ranking.puesto}`,
            metricLabel: 'ranking'
        });
    } else if (ranking.percentil >= 75) {
        insights.push({
            type: 'achievement',
            title: '¡Cuartil superior!',
            description: `Estás mejor que el 75% de tus compañeros. ¡Excelente trabajo!`,
            metric: ranking.percentil,
            metricLabel: '% mejor que'
        });
    }

    // Tip de mejora
    if (estudiante.puntaje_global < groupStats.p90) {
        const gap = groupStats.p90 - estudiante.puntaje_global;
        insights.push({
            type: 'tip',
            title: 'Meta: Llegar al P90',
            description: `Necesitas ${gap} puntos más para alcanzar el top 10%. Enfócate en ${weakest?.[0] || 'tus áreas débiles'}.`,
            metric: `+${gap}`,
            metricLabel: 'pts faltantes'
        });
    }

    // Warning si está muy bajo
    if (ranking.percentil < 25) {
        insights.push({
            type: 'warning',
            title: 'Requiere atención',
            description: 'Tu puntaje está por debajo del 75% del grupo. Considera buscar apoyo adicional.',
        });
    }

    return insights.slice(0, 4); // Máximo 4 insights
}
