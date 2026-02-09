'use client';

import React from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, Lightbulb, Target, Users } from 'lucide-react';

interface InsightCardProps {
    type: 'positive' | 'negative' | 'warning' | 'info';
    title: string;
    description: string;
    metric?: {
        value: string | number;
        label: string;
    };
    actionLabel?: string;
    onAction?: () => void;
}

export default function InsightCard({
    type,
    title,
    description,
    metric,
    actionLabel,
    onAction
}: InsightCardProps) {
    const configs = {
        positive: {
            icon: <TrendingUp className="w-5 h-5" />,
            bgGradient: 'from-emerald-500/20 to-green-600/20',
            borderColor: 'border-emerald-500/30',
            iconBg: 'bg-emerald-500/20',
            iconColor: 'text-emerald-400',
            accentColor: 'text-emerald-400'
        },
        negative: {
            icon: <TrendingDown className="w-5 h-5" />,
            bgGradient: 'from-red-500/20 to-rose-600/20',
            borderColor: 'border-red-500/30',
            iconBg: 'bg-red-500/20',
            iconColor: 'text-red-400',
            accentColor: 'text-red-400'
        },
        warning: {
            icon: <AlertTriangle className="w-5 h-5" />,
            bgGradient: 'from-amber-500/20 to-orange-600/20',
            borderColor: 'border-amber-500/30',
            iconBg: 'bg-amber-500/20',
            iconColor: 'text-amber-400',
            accentColor: 'text-amber-400'
        },
        info: {
            icon: <Lightbulb className="w-5 h-5" />,
            bgGradient: 'from-blue-500/20 to-indigo-600/20',
            borderColor: 'border-blue-500/30',
            iconBg: 'bg-blue-500/20',
            iconColor: 'text-blue-400',
            accentColor: 'text-blue-400'
        }
    };

    const config = configs[type];

    return (
        <div className={`
            bg-gradient-to-br ${config.bgGradient}
            border ${config.borderColor}
            rounded-xl p-4
            hover-lift
            group
        `}>
            {/* Header */}
            <div className="flex items-start gap-3 mb-2">
                <div className={`${config.iconBg} ${config.iconColor} p-2 rounded-lg`}>
                    {config.icon}
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-white truncate">{title}</h4>
                    <p className="text-xs text-white/60 mt-1 line-clamp-2">{description}</p>
                </div>
            </div>

            {/* Metric (opcional) */}
            {metric && (
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/10">
                    <span className={`text-2xl font-black ${config.accentColor}`}>
                        {metric.value}
                    </span>
                    <span className="text-xs text-white/50">{metric.label}</span>
                </div>
            )}

            {/* Action (opcional) */}
            {actionLabel && onAction && (
                <button
                    onClick={onAction}
                    className={`
                        mt-3 text-xs font-medium ${config.accentColor}
                        hover:underline flex items-center gap-1
                        opacity-0 group-hover:opacity-100 transition-opacity
                    `}
                >
                    {actionLabel} →
                </button>
            )}
        </div>
    );
}

// Componente helper para generar insights automáticos
interface AutoInsightsProps {
    stats: {
        promedio: number;
        tasaAprobacion: number;
        coeficienteVariacion: number;
        materiaMasDebil: { nombre: string; promedio: number } | null;
        materiaMasFuerte: { nombre: string; promedio: number } | null;
        niveles: { bajo: number; superior: number };
        total: number;
    };
}

export function AutoInsights({ stats }: AutoInsightsProps) {
    const insights: InsightCardProps[] = [];

    // Insight de tasa de aprobación
    if (stats.tasaAprobacion >= 70) {
        insights.push({
            type: 'positive',
            title: 'Excelente Tasa de Aprobación',
            description: `El ${stats.tasaAprobacion}% de los estudiantes superaron los 300 puntos`,
            metric: { value: `${stats.tasaAprobacion}%`, label: 'aprobados' }
        });
    } else if (stats.tasaAprobacion < 50) {
        insights.push({
            type: 'warning',
            title: 'Tasa de Aprobación Baja',
            description: `Solo el ${stats.tasaAprobacion}% de los estudiantes superaron los 300 puntos`,
            metric: { value: `${stats.tasaAprobacion}%`, label: 'aprobados' }
        });
    }

    // Insight de variabilidad
    if (stats.coeficienteVariacion > 20) {
        insights.push({
            type: 'info',
            title: 'Alta Variabilidad',
            description: `El coeficiente de variación (${stats.coeficienteVariacion}%) indica resultados muy dispersos`,
            metric: { value: `${stats.coeficienteVariacion}%`, label: 'CV' }
        });
    }

    // Insight de materia débil
    if (stats.materiaMasDebil) {
        insights.push({
            type: 'negative',
            title: 'Área de Oportunidad',
            description: `${stats.materiaMasDebil.nombre} tiene el promedio más bajo`,
            metric: { value: stats.materiaMasDebil.promedio, label: 'promedio' }
        });
    }

    // Insight de materia fuerte
    if (stats.materiaMasFuerte && stats.materiaMasFuerte.promedio > 55) {
        insights.push({
            type: 'positive',
            title: 'Fortaleza Identificada',
            description: `${stats.materiaMasFuerte.nombre} es la materia con mejor desempeño`,
            metric: { value: stats.materiaMasFuerte.promedio, label: 'promedio' }
        });
    }

    // Insight de estudiantes en nivel bajo
    const porcentajeBajo = (stats.niveles.bajo / stats.total) * 100;
    if (porcentajeBajo > 20) {
        insights.push({
            type: 'warning',
            title: 'Atención Requerida',
            description: `${stats.niveles.bajo} estudiantes (${porcentajeBajo.toFixed(0)}%) están en nivel Bajo`,
            metric: { value: stats.niveles.bajo, label: 'estudiantes' }
        });
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {insights.slice(0, 4).map((insight, i) => (
                <InsightCard key={i} {...insight} />
            ))}
        </div>
    );
}
