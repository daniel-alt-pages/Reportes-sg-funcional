'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles } from 'lucide-react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    title?: string;
    className?: string;
    variant?: 'light' | 'dark';
}

export function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs));
}

export default function Modal({ isOpen, onClose, children, title, className, variant = 'dark' }: ModalProps) {
    // Cerrar con Escape
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    // Bloquear scroll
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
    }, [isOpen]);

    const isDark = variant === 'dark';

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop con blur mejorado */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4"
                    >
                        {/* Contenido del Modal */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            transition={{ type: "spring", duration: 0.5, bounce: 0.25 }}
                            onClick={(e) => e.stopPropagation()}
                            className={cn(
                                "relative w-full max-w-lg max-h-[90vh] overflow-hidden rounded-3xl shadow-2xl",
                                isDark
                                    ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-white/10"
                                    : "bg-white border border-gray-200",
                                className
                            )}
                        >
                            {/* Efectos decorativos de fondo */}
                            {isDark && (
                                <>
                                    <div className="absolute top-0 left-0 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
                                    <div className="absolute bottom-0 right-0 w-40 h-40 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
                                </>
                            )}

                            {/* Header Premium */}
                            <div className={cn(
                                "sticky top-0 z-10 flex items-center justify-between p-5 border-b backdrop-blur-xl",
                                isDark
                                    ? "border-white/10 bg-slate-900/80"
                                    : "border-gray-100 bg-white/80"
                            )}>
                                {title && (
                                    <div className="flex items-center gap-3">
                                        {isDark && (
                                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
                                                <Sparkles className="w-4 h-4 text-white" />
                                            </div>
                                        )}
                                        <h3 className={cn(
                                            "text-lg font-bold",
                                            isDark ? "text-white" : "text-slate-800"
                                        )}>{title}</h3>
                                    </div>
                                )}
                                <button
                                    onClick={onClose}
                                    className={cn(
                                        "p-2.5 -mr-2 rounded-xl transition-all duration-200 group",
                                        isDark
                                            ? "text-white/40 hover:text-white hover:bg-white/10"
                                            : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                                    )}
                                >
                                    <X size={18} className="group-hover:rotate-90 transition-transform duration-200" />
                                </button>
                            </div>

                            {/* Body con scroll */}
                            <div className={cn(
                                "p-5 overflow-y-auto max-h-[calc(90vh-80px)] relative z-10",
                                isDark ? "text-white" : "text-slate-800"
                            )}>
                                {children}
                            </div>

                            {/* Borde inferior decorativo */}
                            {isDark && (
                                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
                            )}
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
