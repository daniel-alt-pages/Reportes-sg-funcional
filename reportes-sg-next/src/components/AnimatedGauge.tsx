'use client';

import React, { useEffect, useState } from 'react';

interface AnimatedGaugeProps {
    value: number;
    maxValue?: number;
    label: string;
    suffix?: string;
    sublabel?: string;
    size?: 'sm' | 'md' | 'lg';
    colorScheme?: 'green' | 'blue' | 'purple' | 'amber' | 'auto';
}

export default function AnimatedGauge({
    value,
    maxValue = 100,
    label,
    suffix = '%',
    sublabel,
    size = 'md',
}: AnimatedGaugeProps) {
    const [animatedValue, setAnimatedValue] = useState(0);

    const sizes = {
        sm: { width: 160, strokeWidth: 14, fontSize: 'text-3xl', labelSize: 'text-xs' },
        md: { width: 200, strokeWidth: 18, fontSize: 'text-5xl', labelSize: 'text-sm' },
        lg: { width: 260, strokeWidth: 22, fontSize: 'text-6xl', labelSize: 'text-base' }
    };
    const s = sizes[size];

    const center = s.width / 2;
    const radius = (s.width - s.strokeWidth) / 2 - 10;
    const circumference = 2 * Math.PI * radius;
    const arcLength = circumference * 0.75;
    const progress = animatedValue / maxValue;
    const dashOffset = arcLength * (1 - progress);

    // Animación suave
    useEffect(() => {
        const duration = 1800;
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const prog = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - prog, 3);
            setAnimatedValue(value * eased);

            if (prog < 1) {
                requestAnimationFrame(animate);
            }
        };
        requestAnimationFrame(animate);
    }, [value]);

    // Color dinámico según porcentaje
    const percent = value / maxValue * 100;
    const getColor = () => {
        if (percent >= 70) return {
            gradient: ['#10b981', '#34d399', '#6ee7b7'],
            glow: 'rgba(16, 185, 129, 0.6)',
            text: 'text-emerald-400',
            label: 'Excelente', emoji: '🔥'
        };
        if (percent >= 50) return {
            gradient: ['#0891b2', '#22d3ee', '#67e8f9'],
            glow: 'rgba(34, 211, 238, 0.6)',
            text: 'text-cyan-400',
            label: 'Bueno', emoji: '✨'
        };
        if (percent >= 30) return {
            gradient: ['#d97706', '#fbbf24', '#fcd34d'],
            glow: 'rgba(251, 191, 36, 0.6)',
            text: 'text-amber-400',
            label: 'Regular', emoji: '⚡'
        };
        return {
            gradient: ['#dc2626', '#f87171', '#fca5a5'],
            glow: 'rgba(248, 113, 113, 0.6)',
            text: 'text-rose-400',
            label: 'Bajo', emoji: '⚠️'
        };
    };
    const color = getColor();

    const gradientId = `gauge-gradient-${label.replace(/\s/g, '')}`;

    return (
        <div className="flex flex-col items-center">
            {/* Título */}
            <h3 className={`${s.labelSize} font-bold text-white/90 mb-4`}>{label}</h3>

            {/* Gauge SVG */}
            <div className="relative" style={{ width: s.width, height: s.width * 0.78 }}>
                <svg
                    width={s.width}
                    height={s.width * 0.78}
                    viewBox={`0 0 ${s.width} ${s.width * 0.78}`}
                >
                    <defs>
                        {/* Gradiente del arco */}
                        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor={color.gradient[0]} />
                            <stop offset="50%" stopColor={color.gradient[1]} />
                            <stop offset="100%" stopColor={color.gradient[2]} />
                        </linearGradient>

                        {/* Glow */}
                        <filter id={`glow-${gradientId}`} x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur stdDeviation="6" result="blur" />
                            <feMerge>
                                <feMergeNode in="blur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>

                    {/* Arco de fondo */}
                    <circle
                        cx={center}
                        cy={center}
                        r={radius}
                        fill="none"
                        stroke="rgba(255,255,255,0.08)"
                        strokeWidth={s.strokeWidth}
                        strokeLinecap="round"
                        strokeDasharray={`${arcLength} ${circumference}`}
                        transform={`rotate(135, ${center}, ${center})`}
                    />

                    {/* Arco de progreso */}
                    <circle
                        cx={center}
                        cy={center}
                        r={radius}
                        fill="none"
                        stroke={`url(#${gradientId})`}
                        strokeWidth={s.strokeWidth}
                        strokeLinecap="round"
                        strokeDasharray={`${arcLength} ${circumference}`}
                        strokeDashoffset={dashOffset}
                        transform={`rotate(135, ${center}, ${center})`}
                        filter={`url(#glow-${gradientId})`}
                        className="transition-all duration-300 ease-out"
                        style={{ filter: `drop-shadow(0 0 12px ${color.glow})` }}
                    />

                    {/* Punto al final del arco */}
                    {animatedValue > 0 && (
                        <circle
                            cx={center + radius * Math.cos((135 + 270 * progress) * Math.PI / 180)}
                            cy={center + radius * Math.sin((135 + 270 * progress) * Math.PI / 180)}
                            r={s.strokeWidth / 2 + 2}
                            fill="white"
                            style={{ filter: `drop-shadow(0 0 8px ${color.glow})` }}
                        />
                    )}
                </svg>

                {/* Contenido central */}
                <div
                    className="absolute inset-0 flex flex-col items-center justify-center"
                    style={{ paddingTop: s.width * 0.08 }}
                >
                    <span className={`${s.fontSize} font-black ${color.text}`}>
                        {animatedValue.toFixed(1)}
                        <span className="text-lg font-bold text-white/50">{suffix}</span>
                    </span>
                    {sublabel && (
                        <span className="text-xs text-white/50 mt-1">{sublabel}</span>
                    )}
                    <div className="mt-2 px-3 py-1 rounded-full bg-white/10 border border-white/10">
                        <span className="text-xs font-bold text-white/80">
                            {color.emoji} {color.label}
                        </span>
                    </div>
                </div>
            </div>

            {/* Leyenda simple */}
            <div className="flex gap-4 mt-4 text-[10px]">
                <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                    <span className="text-white/40">&lt;30%</span>
                </span>
                <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    <span className="text-white/40">30-50%</span>
                </span>
                <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
                    <span className="text-white/40">50-70%</span>
                </span>
                <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span className="text-white/40">&gt;70%</span>
                </span>
            </div>
        </div>
    );
}
