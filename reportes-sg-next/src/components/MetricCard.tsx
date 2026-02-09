'use client';

import React, { useEffect, useState } from 'react';

interface MetricCardProps {
    titulo: string;
    valor: string | number;
    subtitulo?: string;
    icono: string;
    color: string;
    delta?: number;        // Cambio porcentual (positivo/negativo)
    deltaLabel?: string;   // Etiqueta del delta (ej: "vs SG11-08")
    size?: 'sm' | 'md';    // Tamaño de la tarjeta
    animateValue?: boolean; // Animar el valor al montar
}

export default function MetricCard({
    titulo,
    valor,
    subtitulo,
    icono,
    color,
    delta,
    deltaLabel,
    size = 'md',
    animateValue = true
}: MetricCardProps) {
    const [displayValue, setDisplayValue] = useState(animateValue ? 0 : valor);
    const numericValue = typeof valor === 'number' ? valor : parseFloat(String(valor)) || 0;

    // Animación del contador
    useEffect(() => {
        if (!animateValue || typeof valor !== 'number') {
            setDisplayValue(valor);
            return;
        }

        const duration = 1000;
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplayValue(Math.round(numericValue * eased));

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        requestAnimationFrame(animate);
    }, [valor, animateValue, numericValue]);

    const sizeClasses = {
        sm: 'p-3 gap-3',
        md: 'p-5 gap-4'
    };

    const iconSizes = {
        sm: 'w-10 h-10 min-w-[2.5rem] text-2xl',
        md: 'w-14 h-14 min-w-[3.5rem] text-3xl'
    };

    const valueSizes = {
        sm: 'text-2xl',
        md: 'text-3xl'
    };

    return (
        <div className={`
            glass-premium rounded-2xl ${sizeClasses[size]} 
            flex items-center hover-lift group 
            shadow-xl relative overflow-hidden
            animate-slide-up
        `}>
            {/* Efecto de brillo de fondo */}
            <div className={`
                absolute -right-4 -top-4 w-24 h-24 
                bg-gradient-to-br ${color} 
                opacity-20 blur-2xl rounded-full 
                group-hover:opacity-40 transition-opacity duration-500
            `} />

            {/* Icono */}
            <div className={`
                ${iconSizes[size]} rounded-2xl 
                bg-gradient-to-br ${color} 
                flex items-center justify-center shadow-lg shadow-black/30 
                group-hover:scale-110 transition-transform duration-300
                ring-1 ring-white/20 z-10
            `}>
                <span className="drop-shadow-md">{icono}</span>
            </div>

            {/* Contenido */}
            <div className="flex-1 relative z-10 min-w-0">
                <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest mb-1 truncate">
                    {titulo}
                </p>
                <div className="flex flex-col items-start gap-1">
                    <p className={`${valueSizes[size]} font-black text-white leading-none tracking-tight animate-count-up`}>
                        {displayValue}
                    </p>

                    {/* Subtítulo y/o Delta */}
                    <div className="flex items-center gap-2 flex-wrap">
                        {subtitulo && (
                            <div className="px-2 py-0.5 rounded-full bg-white/10 border border-white/5 backdrop-blur-sm">
                                <p className="text-[10px] text-white/80 font-semibold">{subtitulo}</p>
                            </div>
                        )}

                        {delta !== undefined && (
                            <div className={`
                                flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold
                                ${delta >= 0
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : 'bg-red-500/20 text-red-400'
                                }
                            `}>
                                <span>{delta >= 0 ? '↑' : '↓'}</span>
                                <span>{Math.abs(delta)}%</span>
                                {deltaLabel && <span className="text-white/50 font-normal">{deltaLabel}</span>}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

