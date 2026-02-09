'use client';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { getAllStudents, getAppConfig } from '@/lib/firestoreService';
import {
    Chart as ChartJS,
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend
} from 'chart.js';
import { Radar } from 'react-chartjs-2';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

// ============== TYPES ==============
interface Puntaje {
    puntaje: number;
    correctas: number;
    total_preguntas: number;
}

interface Estudiante {
    informacion_personal: {
        nombres: string;
        apellidos: string;
        numero_identificacion: string;
    };
    puntaje_global: number;
    puntajes: Record<string, Puntaje>;
}

// ============== CONFIG ==============
const materiasConfig = [
    { key: 'lectura crítica', label: 'Lectura Crítica', short: 'LEC', color: '#ec4899', gradient: 'from-pink-500 to-rose-600' },
    { key: 'matemáticas', label: 'Matemáticas', short: 'MAT', color: '#3b82f6', gradient: 'from-blue-500 to-indigo-600' },
    { key: 'sociales y ciudadanas', label: 'Sociales', short: 'SOC', color: '#f59e0b', gradient: 'from-amber-500 to-orange-600' },
    { key: 'ciencias naturales', label: 'Ciencias', short: 'CIE', color: '#10b981', gradient: 'from-emerald-500 to-teal-600' },
    { key: 'inglés', label: 'Inglés', short: 'ING', color: '#8b5cf6', gradient: 'from-violet-500 to-purple-600' },
];

// ============== ANIMATED NUMBER ==============
function AnimatedNumber({ value, duration = 1500, suffix = '' }: { value: number; duration?: number; suffix?: string }) {
    const [display, setDisplay] = useState(0);
    useEffect(() => {
        const startTime = Date.now();
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplay(Math.floor(eased * value));
            if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    }, [value, duration]);
    return <>{display}{suffix}</>;
}

// ============== CIRCULAR GAUGE ==============
function CircularGauge({ value, size = 160, label, onClick }: { value: number; size?: number; label: string; onClick?: () => void }) {
    const radius = (size - 20) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (value / 100) * circumference;
    const getColor = () => {
        if (value >= 80) return { stroke: '#10b981', glow: 'drop-shadow(0 0 10px rgba(16,185,129,0.8))' };
        if (value >= 60) return { stroke: '#3b82f6', glow: 'drop-shadow(0 0 10px rgba(59,130,246,0.8))' };
        if (value >= 40) return { stroke: '#f59e0b', glow: 'drop-shadow(0 0 10px rgba(245,158,11,0.8))' };
        return { stroke: '#ef4444', glow: 'drop-shadow(0 0 10px rgba(239,68,68,0.8))' };
    };
    const colors = getColor();
    return (
        <div
            className={`relative ${onClick ? 'cursor-pointer hover:scale-105 transition-transform' : ''}`}
            style={{ width: size, height: size }}
            onClick={onClick}
        >
            <svg width={size} height={size} className="transform -rotate-90">
                <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
                <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={colors.stroke} strokeWidth="8" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} style={{ filter: colors.glow, transition: 'stroke-dashoffset 1.5s ease-out' }} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-white"><AnimatedNumber value={value} suffix="%" /></span>
                <span className="text-xs text-slate-400 uppercase tracking-wider">{label}</span>
                {onClick && <span className="text-[9px] text-violet-400 mt-1">Click para ver</span>}
            </div>
        </div>
    );
}

// ============== GLOW PROGRESS BAR ==============
function GlowProgress({ value, max = 100, color = '#8b5cf6' }: { value: number; max?: number; color?: string }) {
    const percentage = Math.min((value / max) * 100, 100);
    return (
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${percentage}%`, background: `linear-gradient(90deg, ${color}, ${color}aa)`, boxShadow: `0 0 20px ${color}80` }} />
        </div>
    );
}

// ============== RANKING MEDAL WITH METALLIC ANIMATIONS ==============
function RankingMedal({ puesto, size = 'md' }: { puesto: number; size?: 'sm' | 'md' | 'lg' }) {
    const sizeClasses = {
        sm: 'w-8 h-8 text-xs',
        md: 'w-12 h-12 text-base',
        lg: 'w-16 h-16 text-xl'
    };

    // Determine medal type based on ranking
    const getMedalStyle = () => {
        if (puesto === 1) {
            // GOLD - #1 - Luxurious gold with shimmer
            return {
                background: 'linear-gradient(135deg, #ffd700 0%, #ffec8b 25%, #ffd700 50%, #b8860b 75%, #ffd700 100%)',
                border: '3px solid #b8860b',
                boxShadow: '0 0 30px rgba(255,215,0,0.8), inset 0 2px 4px rgba(255,255,255,0.6), inset 0 -2px 4px rgba(0,0,0,0.2)',
                animation: 'goldShimmer 2s ease-in-out infinite',
                icon: '👑',
                label: 'ORO',
                glowColor: 'rgba(255,215,0,0.6)'
            };
        } else if (puesto === 2) {
            // SILVER - #2 - Polished silver gleam
            return {
                background: 'linear-gradient(135deg, #c0c0c0 0%, #e8e8e8 25%, #c0c0c0 50%, #808080 75%, #c0c0c0 100%)',
                border: '3px solid #808080',
                boxShadow: '0 0 25px rgba(192,192,192,0.8), inset 0 2px 4px rgba(255,255,255,0.8), inset 0 -2px 4px rgba(0,0,0,0.2)',
                animation: 'silverGleam 2.5s ease-in-out infinite',
                icon: '🥈',
                label: 'PLATA',
                glowColor: 'rgba(192,192,192,0.5)'
            };
        } else if (puesto <= 15) {
            // BRONZE - Top 3-15 - Antique bronze with warm glow
            return {
                background: 'linear-gradient(135deg, #cd7f32 0%, #daa520 25%, #cd7f32 50%, #8b4513 75%, #cd7f32 100%)',
                border: '3px solid #8b4513',
                boxShadow: '0 0 20px rgba(205,127,50,0.7), inset 0 2px 4px rgba(255,255,255,0.4), inset 0 -2px 4px rgba(0,0,0,0.3)',
                animation: 'bronzeGlow 3s ease-in-out infinite',
                icon: '🥉',
                label: 'BRONCE',
                glowColor: 'rgba(205,127,50,0.4)'
            };
        }
        return null;
    };

    const medal = getMedalStyle();

    if (!medal) {
        // No medal for positions > 15
        return (
            <div className={`${sizeClasses[size]} rounded-full bg-slate-700/50 border border-slate-600 flex items-center justify-center font-black text-slate-400`}>
                #{puesto}
            </div>
        );
    }

    return (
        <div className="relative">
            {/* Outer glow ring */}
            <div
                className={`absolute inset-0 rounded-full blur-md`}
                style={{
                    background: medal.glowColor,
                    animation: medal.animation
                }}
            />

            {/* Medal body */}
            <div
                className={`${sizeClasses[size]} relative rounded-full flex flex-col items-center justify-center font-black text-slate-900 overflow-hidden`}
                style={{
                    background: medal.background,
                    border: medal.border,
                    boxShadow: medal.boxShadow
                }}
            >
                {/* Shimmer overlay */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        background: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.4) 50%, transparent 70%)',
                        backgroundSize: '200% 200%',
                        animation: 'shimmerMove 2s linear infinite'
                    }}
                />

                {/* Position number */}
                <span className="relative z-10 leading-none" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
                    #{puesto}
                </span>
                {size !== 'sm' && (
                    <span className="relative z-10 text-[8px] font-bold opacity-80">{medal.label}</span>
                )}
            </div>

            {/* CSS Animations - injected via style tag once */}
            <style jsx>{`
                @keyframes goldShimmer {
                    0%, 100% { filter: brightness(1) saturate(1); }
                    50% { filter: brightness(1.2) saturate(1.1); }
                }
                @keyframes silverGleam {
                    0%, 100% { filter: brightness(1) contrast(1); }
                    50% { filter: brightness(1.15) contrast(1.05); }
                }
                @keyframes bronzeGlow {
                    0%, 100% { filter: brightness(1) sepia(0); }
                    50% { filter: brightness(1.1) sepia(0.1); }
                }
                @keyframes shimmerMove {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }
            `}</style>
        </div>
    );
}

// ============== CLICKABLE METRIC CARD ==============
function ClickableCard({
    children, onClick, linkTo, router, glowColor = 'violet', className = ''
}: {
    children: React.ReactNode; onClick?: () => void; linkTo?: string; router?: any; glowColor?: string; className?: string
}) {
    const handleClick = () => {
        if (onClick) onClick();
        else if (linkTo && router) {
            sessionStorage.setItem('returnTo', '/estudiante/estadisticas');
            router.push(linkTo);
        }
    };
    const isClickable = onClick || linkTo;
    const glowColors: Record<string, string> = {
        violet: 'hover:shadow-violet-500/20 hover:border-violet-500/30',
        cyan: 'hover:shadow-cyan-500/20 hover:border-cyan-500/30',
        emerald: 'hover:shadow-emerald-500/20 hover:border-emerald-500/30',
        amber: 'hover:shadow-amber-500/20 hover:border-amber-500/30',
    };
    return (
        <div
            onClick={handleClick}
            className={`bg-slate-800/50 backdrop-blur-xl border border-white/5 rounded-2xl p-6 transition-all duration-300 ${isClickable ? `cursor-pointer hover:scale-[1.02] hover:shadow-xl ${glowColors[glowColor]}` : ''} ${className}`}
        >
            {children}
            {isClickable && <div className="mt-3 flex items-center gap-1 text-[10px] text-violet-400 font-medium"><span>→</span> Click para más detalles</div>}
        </div>
    );
}

// ============== EXPANDABLE MODAL ==============
function ExpandableModal({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose}></div>
            <div className="bg-slate-900 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden relative z-10 border border-white/10">
                <div className="sticky top-0 bg-slate-900/95 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white">{title}</h2>
                    <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-400 hover:text-white transition-colors">✕</button>
                </div>
                <div className="p-6 overflow-y-auto max-h-[calc(85vh-80px)]">{children}</div>
            </div>
        </div>
    );
}

// ============== BACK BUTTON SMART ==============
function SmartBackButton({ router }: { router: any }) {
    const handleBack = () => {
        // Check if we can go back in browser history
        if (typeof window !== 'undefined' && window.history.length > 1) {
            router.back();
        } else {
            // Fallback to dashboard
            router.push('/estudiante/dashboard');
        }
    };

    return (
        <button onClick={handleBack} className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium transition-all flex items-center gap-2 hover:border-violet-500/30">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Volver
        </button>
    );
}

// ============== MAIN COMPONENT ==============
export default function EstadisticasPage() {
    const router = useRouter();
    const [estudiante, setEstudiante] = useState<Estudiante | null>(null);
    const [todos, setTodos] = useState<Estudiante[]>([]);
    const [loading, setLoading] = useState(true);
    const [simulacroActual, setSimulacroActual] = useState('SG11-09');

    // Modal states
    const [showRankingModal, setShowRankingModal] = useState(false);
    const [showAreaModal, setShowAreaModal] = useState<string | null>(null);
    const [showGroupStatsModal, setShowGroupStatsModal] = useState(false);

    const loadData = useCallback(async () => {
        const id = localStorage.getItem('student_id');
        if (!id) { router.replace('/estudiante'); return; }
        const saved = sessionStorage.getItem('simulacro_selected');
        let currentSim = saved;
        if (!currentSim) {
            const config = await getAppConfig();
            currentSim = config.activeSimulation;
        }
        setSimulacroActual(currentSim);
        try {
            const studentsArray = await getAllStudents(currentSim);
            const unicosMap = new Map();
            studentsArray.forEach((e: Estudiante) => {
                const idNum = String(e.informacion_personal.numero_identificacion).trim();
                if (!unicosMap.has(idNum) || e.puntaje_global > unicosMap.get(idNum).puntaje_global) unicosMap.set(idNum, e);
            });
            const estudiantesUnicos = Array.from(unicosMap.values()) as Estudiante[];
            setTodos(estudiantesUnicos);
            const found = estudiantesUnicos.find(e => String(e.informacion_personal.numero_identificacion).trim() === String(id).trim());
            if (found) setEstudiante(found);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    }, [router]);

    useEffect(() => { loadData(); }, [loadData]);

    // ============== COMPUTED STATS ==============
    const groupStats = useMemo(() => {
        if (!todos.length) return { promedio: 0, mediana: 0, p10: 0, p25: 0, p75: 0, p90: 0, min: 0, max: 0, desviacion: 0, total: 0, promediosPorMateria: {} as Record<string, number> };
        const puntajes = todos.map(e => e.puntaje_global).sort((a, b) => a - b);
        const n = puntajes.length;
        const calcPercentil = (p: number) => puntajes[Math.min(Math.floor((p / 100) * n), n - 1)];
        const promedio = Math.round(puntajes.reduce((a, b) => a + b, 0) / n);
        const mediana = n % 2 === 0 ? Math.round((puntajes[n / 2 - 1] + puntajes[n / 2]) / 2) : puntajes[Math.floor(n / 2)];
        const varianza = puntajes.reduce((sum, p) => sum + Math.pow(p - promedio, 2), 0) / n;
        const promediosPorMateria: Record<string, number> = {};
        materiasConfig.forEach(m => { promediosPorMateria[m.key] = Math.round(todos.reduce((acc, e) => acc + (e.puntajes[m.key]?.puntaje || 0), 0) / n); });
        return { promedio, mediana, p10: calcPercentil(10), p25: calcPercentil(25), p75: calcPercentil(75), p90: calcPercentil(90), min: puntajes[0], max: puntajes[n - 1], desviacion: Math.round(Math.sqrt(varianza) * 10) / 10, total: n, promediosPorMateria };
    }, [todos]);

    const rankingInfo = useMemo(() => {
        if (!estudiante || !todos.length) return { puesto: 0, total: 0, percentil: 0 };
        const sorted = [...todos].sort((a, b) => b.puntaje_global - a.puntaje_global);
        const puesto = sorted.findIndex(e => e.informacion_personal.numero_identificacion === estudiante.informacion_personal.numero_identificacion) + 1;
        return { puesto, total: todos.length, percentil: Math.round(((todos.length - puesto) / todos.length) * 100) };
    }, [estudiante, todos]);

    const rankingsPorMateria = useMemo(() => {
        if (!estudiante || !todos.length) return {} as Record<string, number>;
        const rankings: Record<string, number> = {};
        materiasConfig.forEach(m => {
            const sorted = [...todos].sort((a, b) => (b.puntajes[m.key]?.puntaje || 0) - (a.puntajes[m.key]?.puntaje || 0));
            rankings[m.key] = sorted.findIndex(e => e.informacion_personal.numero_identificacion === estudiante.informacion_personal.numero_identificacion) + 1;
        });
        return rankings;
    }, [estudiante, todos]);

    // Top 10 ranking
    const top10 = useMemo(() => {
        return [...todos].sort((a, b) => b.puntaje_global - a.puntaje_global).slice(0, 10);
    }, [todos]);

    const metrics = useMemo(() => {
        if (!estudiante) return null;
        const puntajes = Object.values(estudiante.puntajes);
        const totalCorrectas = puntajes.reduce((acc, p) => acc + p.correctas, 0);
        const totalPreguntas = puntajes.reduce((acc, p) => acc + p.total_preguntas, 0);
        const areas = materiasConfig.map(m => ({ ...m, puntaje: estudiante.puntajes[m.key]?.puntaje || 0 })).sort((a, b) => b.puntaje - a.puntaje);
        return { totalCorrectas, totalPreguntas, efectividad: totalPreguntas > 0 ? Math.round((totalCorrectas / totalPreguntas) * 100) : 0, mejorArea: areas[0], peorArea: areas[areas.length - 1], brecha: areas[0].puntaje - areas[areas.length - 1].puntaje };
    }, [estudiante]);

    const radarData = useMemo(() => {
        if (!estudiante) return null;
        return {
            labels: materiasConfig.map(m => m.short),
            datasets: [
                { label: 'Tu Puntaje', data: materiasConfig.map(m => estudiante.puntajes[m.key]?.puntaje || 0), backgroundColor: 'rgba(139, 92, 246, 0.3)', borderColor: '#8b5cf6', borderWidth: 3, pointBackgroundColor: '#8b5cf6', pointBorderColor: '#fff', pointRadius: 5 },
                { label: 'Promedio', data: materiasConfig.map(m => groupStats.promediosPorMateria[m.key] || 0), backgroundColor: 'rgba(148, 163, 184, 0.1)', borderColor: '#64748b', borderWidth: 2, borderDash: [5, 5], pointRadius: 0 }
            ]
        };
    }, [estudiante, groupStats]);

    const radarOptions: any = {
        scales: { r: { angleLines: { color: 'rgba(255,255,255,0.1)' }, grid: { color: 'rgba(255,255,255,0.1)' }, pointLabels: { font: { size: 12, weight: 'bold' as const }, color: '#94a3b8' }, ticks: { display: false }, suggestedMin: 0, suggestedMax: 100 } },
        plugins: { legend: { display: true, position: 'bottom' as const, labels: { color: '#94a3b8', usePointStyle: true, padding: 20 } }, tooltip: { backgroundColor: 'rgba(15, 23, 42, 0.95)', padding: 12, cornerRadius: 8 } },
        maintainAspectRatio: false
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" style={{ boxShadow: '0 0 30px rgba(139,92,246,0.5)' }}></div>
                    <p className="text-slate-400 font-medium">Cargando métricas...</p>
                </div>
            </div>
        );
    }

    if (!estudiante || !metrics) return null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white pb-20 font-sans relative overflow-hidden">
            {/* Ambient Background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-[128px]"></div>
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-600/20 rounded-full blur-[128px]"></div>
            </div>

            {/* ============== MODALS ============== */}

            {/* Ranking Modal */}
            <ExpandableModal isOpen={showRankingModal} onClose={() => setShowRankingModal(false)} title="🏆 Ranking Completo">
                <div className="space-y-4">
                    <div className="bg-violet-500/10 border border-violet-500/30 rounded-xl p-4 mb-6">
                        <p className="text-sm text-violet-300">Tu posición: <span className="text-2xl font-black text-white">#{rankingInfo.puesto}</span> de {rankingInfo.total}</p>
                    </div>
                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Top 10 del Simulacro</h4>
                    <div className="space-y-2">
                        {top10.map((e, i) => {
                            const isYou = e.informacion_personal.numero_identificacion === estudiante.informacion_personal.numero_identificacion;
                            return (
                                <div key={i} className={`flex items-center gap-4 p-3 rounded-xl border ${isYou ? 'bg-violet-500/20 border-violet-500/40' : 'bg-slate-800/50 border-white/5'}`}>
                                    <RankingMedal puesto={i + 1} size="sm" />
                                    <div className="flex-1">
                                        <p className="font-medium text-white">{e.informacion_personal.nombres.split(' ')[0].toUpperCase()} {e.informacion_personal.apellidos.split(' ')[0].toUpperCase()} {isYou && <span className="text-violet-400">(Tú)</span>}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xl font-black text-white">{e.puntaje_global}</p>
                                        <p className="text-[10px] text-slate-500">puntos</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <button onClick={() => { setShowRankingModal(false); sessionStorage.setItem('returnTo', '/estudiante/estadisticas'); router.push('/estudiante/ranking'); }} className="w-full mt-6 py-3 bg-violet-600 hover:bg-violet-500 rounded-xl font-bold text-sm transition-colors">
                        Ver ranking completo →
                    </button>
                </div>
            </ExpandableModal>

            {/* Area Detail Modal */}
            <ExpandableModal isOpen={!!showAreaModal} onClose={() => setShowAreaModal(null)} title={`📊 Detalle: ${showAreaModal ? materiasConfig.find(m => m.key === showAreaModal)?.label : ''}`}>
                {showAreaModal && (() => {
                    const materia = materiasConfig.find(m => m.key === showAreaModal);
                    const puntaje = estudiante.puntajes[showAreaModal];
                    const ranking = rankingsPorMateria[showAreaModal];
                    const promedio = groupStats.promediosPorMateria[showAreaModal];
                    if (!materia || !puntaje) return null;
                    return (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-800/50 rounded-xl p-4 text-center">
                                    <p className="text-xs text-slate-400 uppercase mb-1">Tu Puntaje</p>
                                    <p className="text-4xl font-black" style={{ color: materia.color }}>{puntaje.puntaje}</p>
                                </div>
                                <div className="bg-slate-800/50 rounded-xl p-4 text-center">
                                    <p className="text-xs text-slate-400 uppercase mb-1">Ranking</p>
                                    <p className="text-4xl font-black text-white">#{ranking}</p>
                                </div>
                            </div>
                            <div className="bg-slate-800/50 rounded-xl p-4">
                                <div className="flex justify-between mb-2">
                                    <span className="text-slate-400 text-sm">Aciertos</span>
                                    <span className="font-bold">{puntaje.correctas} / {puntaje.total_preguntas}</span>
                                </div>
                                <GlowProgress value={puntaje.correctas} max={puntaje.total_preguntas} color={materia.color} />
                            </div>
                            <div className="bg-slate-800/50 rounded-xl p-4">
                                <p className="text-slate-400 text-sm mb-2">Comparación con el grupo</p>
                                <div className="flex items-center gap-4">
                                    <div className="flex-1">
                                        <p className="text-xs text-slate-500">Promedio grupo</p>
                                        <p className="text-xl font-bold text-slate-400">{promedio}</p>
                                    </div>
                                    <div className={`px-4 py-2 rounded-xl font-bold ${puntaje.puntaje >= promedio ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                                        {puntaje.puntaje >= promedio ? '+' : ''}{puntaje.puntaje - promedio} pts
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => { setShowAreaModal(null); sessionStorage.setItem('returnTo', '/estudiante/estadisticas'); router.push('/estudiante/analisis'); }} className="w-full py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 rounded-xl font-bold text-sm transition-colors">
                                Analizar respuestas de {materia.label} →
                            </button>
                        </div>
                    );
                })()}
            </ExpandableModal>

            {/* Group Stats Modal */}
            <ExpandableModal isOpen={showGroupStatsModal} onClose={() => setShowGroupStatsModal(false)} title="📈 Estadísticas del Grupo">
                <div className="space-y-6">
                    <div className="bg-slate-800/50 rounded-xl p-4">
                        <p className="text-slate-400 text-sm mb-3">Distribución de puntajes ({groupStats.total} estudiantes)</p>
                        <div className="grid grid-cols-2 gap-4 text-center">
                            <div><p className="text-[10px] text-slate-500">Mínimo</p><p className="text-xl font-bold text-red-400">{groupStats.min}</p></div>
                            <div><p className="text-[10px] text-slate-500">Máximo</p><p className="text-xl font-bold text-cyan-400">{groupStats.max}</p></div>
                            <div><p className="text-[10px] text-slate-500">Promedio</p><p className="text-xl font-bold text-blue-400">{groupStats.promedio}</p></div>
                            <div><p className="text-[10px] text-slate-500">Mediana</p><p className="text-xl font-bold text-violet-400">{groupStats.mediana}</p></div>
                        </div>
                    </div>
                    <div className="bg-slate-800/50 rounded-xl p-4">
                        <p className="text-slate-400 text-sm mb-3">Percentiles</p>
                        <div className="space-y-2">
                            {[{ label: 'P10 (Bajo)', value: groupStats.p10, color: 'red' }, { label: 'P25', value: groupStats.p25, color: 'amber' }, { label: 'P50 (Mediana)', value: groupStats.mediana, color: 'blue' }, { label: 'P75', value: groupStats.p75, color: 'emerald' }, { label: 'P90 (Élite)', value: groupStats.p90, color: 'cyan' }].map((p, i) => (
                                <div key={i} className="flex justify-between items-center p-2 bg-slate-900/50 rounded-lg">
                                    <span className="text-sm text-slate-400">{p.label}</span>
                                    <span className={`font-bold text-${p.color}-400`}>{p.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="bg-slate-800/50 rounded-xl p-4">
                        <p className="text-slate-400 text-sm mb-3">Promedios por Área</p>
                        <div className="space-y-3">
                            {materiasConfig.map(m => (
                                <div key={m.key} className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${m.gradient} flex items-center justify-center text-xs font-bold`}>{m.short}</div>
                                    <div className="flex-1">
                                        <GlowProgress value={groupStats.promediosPorMateria[m.key] || 0} max={100} color={m.color} />
                                    </div>
                                    <span className="text-sm font-bold w-8 text-right">{groupStats.promediosPorMateria[m.key]}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </ExpandableModal>

            {/* ============== NAVBAR ============== */}
            <nav className="relative z-50 bg-slate-900/50 backdrop-blur-xl border-b border-white/5 sticky top-0">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center font-bold shadow-lg shadow-violet-500/30">📊</div>
                        <div>
                            <h1 className="font-bold text-lg">Métricas de Desempeño</h1>
                            <span className="text-xs text-slate-400">{simulacroActual} • {estudiante.informacion_personal.nombres.split(' ')[0].toUpperCase()}</span>
                        </div>
                    </div>
                    <SmartBackButton router={router} />
                </div>
            </nav>

            <div className="relative z-10 max-w-7xl mx-auto px-6 py-8 space-y-8">

                {/* ============== HERO SECTION ============== */}
                <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600/20 to-indigo-600/20 backdrop-blur-xl border border-white/10 p-8 cursor-pointer group" onClick={() => setShowRankingModal(true)}>
                        <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/30 rounded-full blur-[100px] group-hover:bg-violet-500/50 transition-colors"></div>
                        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                            <div className="text-center md:text-left">
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-violet-500/20 rounded-full text-violet-300 text-xs font-bold uppercase tracking-wider mb-4">
                                    <span className="w-2 h-2 bg-violet-400 rounded-full animate-pulse"></span>
                                    Tu Puntaje Global
                                </div>
                                <div className="text-7xl md:text-8xl font-black tracking-tight" style={{ textShadow: '0 0 60px rgba(139,92,246,0.5)' }}>
                                    <AnimatedNumber value={estudiante.puntaje_global} />
                                </div>
                                <p className="text-2xl text-slate-400 font-medium mt-2">/ 500 puntos</p>
                                <div className={`mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${estudiante.puntaje_global >= groupStats.promedio ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                                    {estudiante.puntaje_global >= groupStats.promedio ? '↑' : '↓'} {Math.abs(estudiante.puntaje_global - groupStats.promedio)} pts vs promedio
                                </div>
                            </div>
                            <CircularGauge value={rankingInfo.percentil} size={180} label="Percentil" onClick={() => setShowRankingModal(true)} />
                        </div>
                        <div className="absolute bottom-4 right-4 text-xs text-violet-400 opacity-0 group-hover:opacity-100 transition-opacity">Click para ver ranking →</div>
                    </div>

                    <div className="space-y-4">
                        <ClickableCard onClick={() => setShowRankingModal(true)} glowColor="violet">
                            <div className="flex items-center justify-between">
                                <div>
                                    <span className="text-slate-400 text-sm font-medium">Posición</span>
                                    <div className="text-4xl font-black text-white mt-1">
                                        #<AnimatedNumber value={rankingInfo.puesto} />
                                        <span className="text-xl text-slate-500 font-normal"> / {rankingInfo.total}</span>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-2">
                                        {rankingInfo.percentil >= 90 ? '🏆 Top 10%' : rankingInfo.percentil >= 75 ? '⭐ Top 25%' : rankingInfo.percentil >= 50 ? '✓ Sobre promedio' : '📈 En progreso'}
                                    </p>
                                </div>
                                {rankingInfo.puesto <= 15 && <RankingMedal puesto={rankingInfo.puesto} size="lg" />}
                            </div>
                        </ClickableCard>

                        <ClickableCard linkTo="/estudiante/analisis" router={router} glowColor="cyan">
                            <span className="text-slate-400 text-sm font-medium">Efectividad</span>
                            <div className="text-4xl font-black text-cyan-400 mt-1"><AnimatedNumber value={metrics.efectividad} suffix="%" /></div>
                            <p className="text-xs text-slate-500 mt-2">{metrics.totalCorrectas} de {metrics.totalPreguntas} correctas</p>
                        </ClickableCard>
                    </div>
                </section>

                {/* ============== NEON TIMELINE - TU RENDIMIENTO ============== */}
                <section className="group relative bg-[#131420] border border-white/5 rounded-3xl p-4 sm:p-6 overflow-visible transition-all duration-300 hover:border-violet-500/50 hover:shadow-[0_0_40px_-10px_rgba(139,92,246,0.15)]" onClick={() => setShowGroupStatsModal(true)}>

                    {/* Hover glow effect */}
                    <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-violet-600/10 via-transparent to-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

                    {/* Header */}
                    <div className="relative flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 z-10 gap-3">
                        <div className="flex items-center gap-3">
                            <div className="h-8 sm:h-10 w-1.5 bg-gradient-to-b from-violet-500 to-fuchsia-500 rounded-full" style={{ boxShadow: '0 0 15px rgba(168,85,247,0.8)' }}></div>
                            <div>
                                <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">Tu Rendimiento</h3>
                                <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 font-medium">Posición relativa al grupo</p>
                            </div>
                        </div>
                        <button className="flex items-center gap-2 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-violet-300 bg-[#1A1B2E] px-3 sm:px-4 py-2 rounded-full hover:bg-violet-500 hover:text-white transition-all duration-300 border border-violet-500/30 w-fit" style={{ boxShadow: 'group-hover:0 0 15px rgba(139,92,246,0.4)' }}>
                            Ver detalles
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </button>
                    </div>

                    {/* NEON TIMELINE ZONE */}
                    <div className="relative z-20 mb-6 sm:mb-8 px-1 py-4">

                        {/* Zone Labels - Top */}
                        <div className="flex justify-between text-[9px] sm:text-[10px] font-bold tracking-widest uppercase mb-3 pointer-events-none">
                            <span className={`w-1/4 text-center ${rankingInfo.percentil < 25 ? 'text-rose-400 animate-pulse' : 'text-rose-500/40'}`} style={rankingInfo.percentil < 25 ? { textShadow: '0 0 8px rgba(244,63,94,0.8)' } : {}}>Bajo</span>
                            <span className={`w-1/4 text-center ${rankingInfo.percentil >= 25 && rankingInfo.percentil < 50 ? 'text-amber-400 animate-pulse' : 'text-amber-500/40'}`} style={rankingInfo.percentil >= 25 && rankingInfo.percentil < 50 ? { textShadow: '0 0 8px rgba(251,191,36,0.8)' } : {}}>Medio</span>
                            <span className={`w-1/4 text-center ${rankingInfo.percentil >= 50 && rankingInfo.percentil < 75 ? 'text-emerald-400 animate-pulse' : 'text-emerald-500/40'}`} style={rankingInfo.percentil >= 50 && rankingInfo.percentil < 75 ? { textShadow: '0 0 8px rgba(52,211,153,0.8)' } : {}}>Alto</span>
                            <span className={`w-1/4 text-center ${rankingInfo.percentil >= 75 ? 'text-cyan-400 animate-pulse' : 'text-cyan-500/40'}`} style={rankingInfo.percentil >= 75 ? { textShadow: '0 0 12px rgba(34,211,238,1)' } : {}}>Superior</span>
                        </div>

                        {/* Neon Progress Track */}
                        <div className="relative h-4 w-full rounded-full bg-[#0F1018] ring-1 ring-white/10 flex items-center overflow-visible">
                            <div className="absolute inset-0 rounded-full bg-slate-950/80"></div>

                            {/* Glowing Segments */}
                            <div className="relative w-full h-1.5 mx-1 rounded-full overflow-hidden flex pointer-events-none">
                                <div className="flex-1 bg-gradient-to-r from-rose-900 to-rose-600" style={{ boxShadow: '0 0 15px rgba(225,29,72,0.6)' }}></div>
                                <div className="flex-1 bg-gradient-to-r from-amber-700 to-amber-500" style={{ boxShadow: '0 0 15px rgba(245,158,11,0.6)' }}></div>
                                <div className="flex-1 bg-gradient-to-r from-emerald-700 to-emerald-500" style={{ boxShadow: '0 0 15px rgba(16,185,129,0.6)' }}></div>
                                <div className="flex-1 bg-gradient-to-r from-cyan-700 to-cyan-500" style={{ boxShadow: '0 0 15px rgba(6,182,212,0.6)' }}></div>
                            </div>

                            {/* Pulsing Nodes */}
                            <div className="absolute left-[25%] top-1/2 -translate-y-1/2 -translate-x-1/2 w-2 h-2 bg-[#0F1018] rounded-full border-2 border-rose-500 z-10 animate-pulse pointer-events-none"></div>
                            <div className="absolute left-[50%] top-1/2 -translate-y-1/2 -translate-x-1/2 w-2 h-2 bg-[#0F1018] rounded-full border-2 border-amber-500 z-10 animate-pulse pointer-events-none" style={{ animationDelay: '0.5s' }}></div>
                            <div className="absolute left-[75%] top-1/2 -translate-y-1/2 -translate-x-1/2 w-2 h-2 bg-[#0F1018] rounded-full border-2 border-emerald-500 z-10 animate-pulse pointer-events-none" style={{ animationDelay: '1s' }}></div>
                        </div>

                        {/* Score Axis */}
                        <div className="relative h-6 mt-2 w-full text-[8px] sm:text-[9px] text-slate-500 font-bold font-mono pointer-events-none">
                            <div className="absolute left-0 flex flex-col items-center"><div className="h-2 w-px bg-slate-800 mb-1"></div><span>{groupStats.min}</span></div>
                            <div className="absolute left-[25%] -translate-x-1/2 flex flex-col items-center"><div className="h-2 w-px bg-slate-800 mb-1"></div><span className="text-rose-500/50">{groupStats.p25}</span></div>
                            <div className="absolute left-[50%] -translate-x-1/2 flex flex-col items-center"><div className="h-2 w-px bg-slate-800 mb-1"></div><span className="text-amber-500/50">{groupStats.mediana}</span></div>
                            <div className="absolute left-[75%] -translate-x-1/2 flex flex-col items-center"><div className="h-2 w-px bg-slate-800 mb-1"></div><span className="text-emerald-500/50">{groupStats.p75}</span></div>
                            <div className="absolute right-0 flex flex-col items-center"><div className="h-2 w-px bg-slate-800 mb-1"></div><span>{groupStats.max}</span></div>
                        </div>

                        {/* USER LASER MARKER */}
                        <div
                            className="absolute flex flex-col items-center z-30 transition-all duration-1000 pointer-events-none"
                            style={{
                                left: `${Math.min(Math.max(((estudiante.puntaje_global - groupStats.min) / (groupStats.max - groupStats.min)) * 100, 3), 97)}%`,
                                top: '1.75rem'
                            }}
                        >
                            {/* Tooltip Badge */}
                            <div className="relative mb-1.5">
                                <div className="bg-violet-600 text-white text-[10px] sm:text-[11px] font-black px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-violet-400 whitespace-nowrap z-20 relative" style={{ boxShadow: '0 0 20px rgba(124,58,237,0.8)', animation: 'pulse 2s infinite' }}>
                                    {estudiante.puntaje_global} PTS
                                </div>
                                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-violet-600 rotate-45 border-b border-r border-violet-400 z-10"></div>
                            </div>

                            {/* Laser Line */}
                            <div className="w-[2px] h-8 sm:h-10 bg-gradient-to-b from-violet-400 via-fuchsia-400 to-transparent" style={{ boxShadow: '0 0 10px rgba(232,121,249,1)' }}></div>

                            {/* Impact Point */}
                            <div className="w-3 h-3 bg-white rounded-full ring-2 ring-violet-500" style={{ boxShadow: '0 0 15px rgba(255,255,255,1)' }}></div>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="relative z-10 grid grid-cols-3 gap-2 sm:gap-3">
                        <div className="group/card bg-[#1A1B2E] p-3 sm:p-4 rounded-2xl border border-white/5 flex flex-col items-center justify-center transition-colors border-l-2 border-l-transparent hover:border-l-violet-500">
                            <p className="text-[8px] sm:text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-1 group-hover/card:text-violet-400 transition-colors">Tu Puntaje</p>
                            <p className="text-lg sm:text-xl font-black text-white tracking-tighter">{estudiante.puntaje_global}</p>
                        </div>
                        <div className="relative bg-gradient-to-br from-violet-900/40 to-indigo-900/40 p-3 sm:p-4 rounded-2xl border border-violet-500/30 flex flex-col items-center justify-center overflow-hidden" style={{ boxShadow: 'inset 0 0 20px rgba(139,92,246,0.1)' }}>
                            <div className="absolute inset-0 bg-violet-500/10 mix-blend-overlay"></div>
                            <p className="relative text-[8px] sm:text-[9px] text-violet-300 font-bold uppercase tracking-widest mb-1">Percentil</p>
                            <p className="relative text-xl sm:text-2xl font-black text-white tracking-tighter" style={{ textShadow: '0 0 10px rgba(167,139,250,0.5)' }}>{rankingInfo.percentil}%</p>
                        </div>
                        <div className="group/card bg-[#1A1B2E] p-3 sm:p-4 rounded-2xl border border-white/5 flex flex-col items-center justify-center transition-colors border-r-2 border-r-transparent hover:border-r-emerald-500">
                            <p className="text-[8px] sm:text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-1 group-hover/card:text-emerald-400 transition-colors">Superaste a</p>
                            <div className="flex items-baseline gap-1">
                                <p className="text-lg sm:text-xl font-black text-emerald-400 tracking-tighter" style={{ textShadow: '0 0 8px rgba(52,211,153,0.4)' }}>{rankingInfo.total - rankingInfo.puesto}</p>
                                <span className="text-[8px] sm:text-[9px] text-slate-500 font-bold">pers.</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ============== SKILLS & COMPETENCIAS ============== */}
                <section className="bg-[#131420] border border-white/5 rounded-3xl p-4 sm:p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="h-8 sm:h-10 w-1.5 bg-gradient-to-b from-cyan-500 to-blue-500 rounded-full" style={{ boxShadow: '0 0 15px rgba(6,182,212,0.8)' }}></div>
                        <div>
                            <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">Skills & Competencias</h3>
                            <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 font-medium">Nivel de dominio por área</p>
                        </div>
                    </div>

                    {/* Skills Grid */}
                    <div className="space-y-4">
                        {materiasConfig.map((materia, index) => {
                            const puntaje = estudiante.puntajes[materia.key]?.puntaje || 0;
                            const nivel = puntaje >= 80 ? 'Experto' : puntaje >= 60 ? 'Avanzado' : puntaje >= 40 ? 'Intermedio' : 'Básico';
                            const nivelColor = puntaje >= 80 ? 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30' : puntaje >= 60 ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' : puntaje >= 40 ? 'text-amber-400 bg-amber-500/10 border-amber-500/30' : 'text-rose-400 bg-rose-500/10 border-rose-500/30';
                            const ranking = rankingsPorMateria[materia.key];

                            return (
                                <div
                                    key={materia.key}
                                    className="group bg-[#1A1B2E] rounded-2xl p-3 sm:p-4 border border-white/5 hover:border-white/10 transition-all cursor-pointer"
                                    onClick={(e) => { e.stopPropagation(); setShowAreaModal(materia.key); }}
                                    style={{ animationDelay: `${index * 100}ms` }}
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${materia.gradient} flex items-center justify-center text-sm sm:text-base font-black shadow-lg`} style={{ boxShadow: `0 0 20px ${materia.color}40` }}>
                                                {materia.short}
                                            </div>
                                            <div>
                                                <p className="text-sm sm:text-base font-bold text-white">{materia.label}</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${nivelColor}`}>{nivel}</span>
                                                    <span className="text-[9px] sm:text-[10px] text-slate-500">Ranking #{ranking}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl sm:text-3xl font-black" style={{ color: materia.color, textShadow: `0 0 15px ${materia.color}60` }}>{puntaje}</p>
                                            <p className="text-[9px] sm:text-[10px] text-slate-500 font-medium">puntos</p>
                                        </div>
                                    </div>

                                    {/* Skill Progress Bar */}
                                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-1000"
                                            style={{
                                                width: `${puntaje}%`,
                                                background: `linear-gradient(90deg, ${materia.color}80, ${materia.color})`,
                                                boxShadow: `0 0 15px ${materia.color}60`
                                            }}
                                        ></div>
                                    </div>

                                    {/* Comparison with group */}
                                    <div className="flex justify-between items-center mt-2 text-[9px] sm:text-[10px]">
                                        <span className="text-slate-500">Promedio grupo: {groupStats.promediosPorMateria[materia.key]}</span>
                                        {puntaje >= (groupStats.promediosPorMateria[materia.key] || 0) ? (
                                            <span className="text-emerald-400 font-bold">↑ +{puntaje - (groupStats.promediosPorMateria[materia.key] || 0)} pts</span>
                                        ) : (
                                            <span className="text-amber-400 font-bold">↓ {puntaje - (groupStats.promediosPorMateria[materia.key] || 0)} pts</span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* ============== STRENGTHS & WEAKNESSES ============== */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-br from-emerald-600/20 to-teal-600/20 backdrop-blur-xl border border-emerald-500/20 rounded-2xl p-6 cursor-pointer hover:border-emerald-500/40 transition-colors" onClick={() => setShowAreaModal(metrics.mejorArea.key)}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center text-2xl">💪</div>
                            <div><p className="text-emerald-400 text-xs font-bold uppercase tracking-wider">Tu Fortaleza</p><p className="text-white font-bold text-lg">{metrics.mejorArea.label}</p></div>
                        </div>
                        <div className="flex items-end justify-between">
                            <div className="text-5xl font-black text-emerald-400">{metrics.mejorArea.puntaje}</div>
                            <div className="text-right"><p className="text-xs text-slate-400">Ranking</p><p className="text-lg font-bold text-white">#{rankingsPorMateria[metrics.mejorArea.key]}</p></div>
                        </div>
                        <p className="text-xs text-emerald-400 mt-3">Click para ver detalle →</p>
                    </div>

                    <div className="bg-gradient-to-br from-amber-600/20 to-orange-600/20 backdrop-blur-xl border border-amber-500/20 rounded-2xl p-6 cursor-pointer hover:border-amber-500/40 transition-colors" onClick={() => setShowAreaModal(metrics.peorArea.key)}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center text-2xl">📈</div>
                            <div><p className="text-amber-400 text-xs font-bold uppercase tracking-wider">Área de Mejora</p><p className="text-white font-bold text-lg">{metrics.peorArea.label}</p></div>
                        </div>
                        <div className="flex items-end justify-between">
                            <div className="text-5xl font-black text-amber-400">{metrics.peorArea.puntaje}</div>
                            <div className="text-right"><p className="text-xs text-slate-400">Brecha</p><p className="text-lg font-bold text-white">-{metrics.brecha} pts</p></div>
                        </div>
                        <p className="text-xs text-amber-400 mt-3">Click para ver detalle →</p>
                    </div>
                </section>

                {/* ============== RADAR + BREAKDOWN ============== */}
                <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-slate-800/30 backdrop-blur-xl border border-white/5 rounded-2xl p-6">
                        <h3 className="text-lg font-bold mb-6 flex items-center gap-3">
                            <span className="w-1 h-6 bg-gradient-to-b from-violet-500 to-pink-500 rounded-full"></span>
                            Perfil de Competencias
                        </h3>
                        <div className="h-[320px]">{radarData && <Radar data={radarData} options={radarOptions} />}</div>
                    </div>

                    <div className="bg-slate-800/30 backdrop-blur-xl border border-white/5 rounded-2xl p-6">
                        <h3 className="text-lg font-bold mb-6 flex items-center gap-3">
                            <span className="w-1 h-6 bg-gradient-to-b from-cyan-500 to-blue-500 rounded-full"></span>
                            Desglose por Área
                        </h3>
                        <div className="space-y-4">
                            {materiasConfig.map(materia => {
                                const puntaje = estudiante.puntajes[materia.key]?.puntaje || 0;
                                const diff = puntaje - (groupStats.promediosPorMateria[materia.key] || 0);
                                return (
                                    <div key={materia.key} className="p-3 rounded-xl bg-slate-900/30 border border-white/5 cursor-pointer hover:border-white/20 transition-colors" onClick={() => setShowAreaModal(materia.key)}>
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${materia.gradient} flex items-center justify-center text-xs font-bold shadow-lg`}>{materia.short}</div>
                                                <span className="text-sm font-medium text-slate-300">{materia.label}</span>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className={`text-xs font-bold ${diff >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>{diff >= 0 ? '+' : ''}{diff}</span>
                                                <span className="text-xl font-black text-white">{puntaje}</span>
                                            </div>
                                        </div>
                                        <GlowProgress value={puntaje} max={100} color={materia.color} />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* ============== GROUP STATS ============== */}
                <section className="bg-slate-800/30 backdrop-blur-xl border border-white/5 rounded-2xl p-6 cursor-pointer hover:border-violet-500/20 transition-colors" onClick={() => setShowGroupStatsModal(true)}>
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold flex items-center gap-3">
                            <span className="w-1 h-6 bg-gradient-to-b from-amber-500 to-orange-500 rounded-full"></span>
                            Estadísticas del Grupo
                        </h3>
                        <span className="text-xs text-violet-400">{groupStats.total} estudiantes • Click para más →</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
                        {[
                            { label: 'Promedio', value: groupStats.promedio, color: 'text-blue-400' },
                            { label: 'Mediana', value: groupStats.mediana, color: 'text-violet-400' },
                            { label: 'P10', value: groupStats.p10, color: 'text-slate-400' },
                            { label: 'P25', value: groupStats.p25, color: 'text-slate-400' },
                            { label: 'P75', value: groupStats.p75, color: 'text-emerald-400' },
                            { label: 'P90', value: groupStats.p90, color: 'text-amber-400' },
                            { label: 'D.E.', value: groupStats.desviacion, color: 'text-pink-400' },
                        ].map((stat, i) => (
                            <div key={i} className="bg-slate-900/50 rounded-xl p-4 text-center border border-white/5 hover:border-white/10 transition-colors">
                                <span className="text-[10px] text-slate-500 uppercase tracking-wider">{stat.label}</span>
                                <p className={`text-2xl font-black ${stat.color}`}><AnimatedNumber value={typeof stat.value === 'number' ? stat.value : 0} /></p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Footer */}
                <div className="text-center pt-8 border-t border-white/5">
                    <p className="text-slate-500 text-sm">Seamos Genios 2026 • {simulacroActual}</p>
                </div>
            </div>
        </div>
    );
}
