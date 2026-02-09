'use client';
import { useEffect, useState } from 'react';

interface AnimatedPercentileGaugeProps {
    value: number; // percentil 0-100
    size?: 'sm' | 'md' | 'lg';
    label?: string;
    sublabel?: string;
}

const sizeConfig = {
    sm: { width: 120, strokeWidth: 8, fontSize: 'text-2xl', sublabelSize: 'text-[8px]' },
    md: { width: 160, strokeWidth: 12, fontSize: 'text-3xl', sublabelSize: 'text-[10px]' },
    lg: { width: 200, strokeWidth: 14, fontSize: 'text-4xl', sublabelSize: 'text-xs' }
};

export default function AnimatedPercentileGauge({
    value,
    size = 'md',
    label = 'Percentil',
    sublabel = 'Mejor que'
}: AnimatedPercentileGaugeProps) {
    const [animatedValue, setAnimatedValue] = useState(0);
    const [mounted, setMounted] = useState(false);

    const config = sizeConfig[size];
    const radius = (config.width - config.strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const center = config.width / 2;

    useEffect(() => {
        setMounted(true);
        // Animación del valor
        const duration = 1500;
        const startTime = Date.now();
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Easing cubic out
            const eased = 1 - Math.pow(1 - progress, 3);
            setAnimatedValue(Math.round(value * eased));
            if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    }, [value]);

    // Colores según percentil
    const getColor = () => {
        if (value >= 90) return { stroke: '#10b981', glow: 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.5))' };
        if (value >= 75) return { stroke: '#3b82f6', glow: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.5))' };
        if (value >= 50) return { stroke: '#6366f1', glow: 'drop-shadow(0 0 8px rgba(99, 102, 241, 0.4))' };
        if (value >= 25) return { stroke: '#f59e0b', glow: 'drop-shadow(0 0 8px rgba(245, 158, 11, 0.5))' };
        return { stroke: '#ef4444', glow: 'drop-shadow(0 0 8px rgba(239, 68, 68, 0.5))' };
    };

    const color = getColor();
    const strokeDashoffset = mounted ? circumference - (circumference * value) / 100 : circumference;

    return (
        <div className="relative flex flex-col items-center justify-center">
            <svg
                width={config.width}
                height={config.width}
                className="transform -rotate-90"
                style={{ filter: color.glow }}
            >
                <defs>
                    <linearGradient id={`gaugeGradient-${value}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={color.stroke} stopOpacity="1" />
                        <stop offset="100%" stopColor={color.stroke} stopOpacity="0.6" />
                    </linearGradient>
                </defs>

                {/* Fondo */}
                <circle
                    cx={center}
                    cy={center}
                    r={radius}
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth={config.strokeWidth}
                    className="text-slate-100"
                />

                {/* Arco de progreso */}
                <circle
                    cx={center}
                    cy={center}
                    r={radius}
                    fill="transparent"
                    stroke={`url(#gaugeGradient-${value})`}
                    strokeWidth={config.strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                />
            </svg>

            {/* Contenido central */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`${config.fontSize} font-black text-slate-800`}>
                    {animatedValue}%
                </span>
                <span className={`${config.sublabelSize} uppercase font-bold text-slate-400 tracking-wider`}>
                    {sublabel}
                </span>
            </div>
        </div>
    );
}
