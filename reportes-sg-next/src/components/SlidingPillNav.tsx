
import React, { useState, useRef, useEffect } from 'react';

interface NavItem {
    id: string;
    label: string;
    icon: string;
}

interface SlidingPillNavProps {
    items: NavItem[];
    activeId: string;
    onSelect: (id: string) => void;
}

export default function SlidingPillNav({ items, activeId, onSelect }: SlidingPillNavProps) {
    const [pillStyle, setPillStyle] = useState({ left: 0, width: 0, opacity: 0 });
    const navRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Encontrar el botón activo y mover la píldora
        if (navRef.current) {
            const activeBtn = navRef.current.querySelector<HTMLButtonElement>(`button[data-active="true"]`);
            if (activeBtn) {
                const { offsetLeft, offsetWidth } = activeBtn;
                setPillStyle({
                    left: offsetLeft,
                    width: offsetWidth,
                    opacity: 1
                });
            }
        }
    }, [activeId]); // Recalcular cuando cambie el activo

    return (
        <nav
            ref={navRef}
            className="relative flex items-center gap-1 p-1 bg-white/5 border border-white/5 rounded-2xl overflow-x-auto hide-scrollbar mask-gradient-x"
        >
            {/* La Píldora Deslizante (Fondo Animado) */}
            <div
                className="absolute h-[calc(100%-8px)] top-1 bg-purple-600 rounded-xl shadow-lg shadow-purple-500/20 transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1.0)] z-0"
                style={{
                    left: pillStyle.left,
                    width: pillStyle.width,
                    opacity: pillStyle.opacity
                }}
            />

            {items.map((item) => {
                const isActive = activeId === item.id;
                return (
                    <button
                        key={item.id}
                        data-active={isActive}
                        onClick={() => onSelect(item.id)}
                        className={`
                            relative z-10 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors duration-200
                            ${isActive ? 'text-white' : 'text-white/60 hover:text-white'}
                        `}
                    >
                        <span className="text-lg">{item.icon}</span>
                        <span>{item.label}</span>
                    </button>
                );
            })}
        </nav>
    );
}
