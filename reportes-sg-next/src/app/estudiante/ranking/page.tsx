'use client';
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Estudiante } from '@/types';

// ============== SVG ICONS (No emojis as per UUPM guidelines) ==============
const TrophyIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path fillRule="evenodd" d="M5.166 2.621v.858c-1.035.148-2.059.33-3.071.543a.75.75 0 0 0-.584.859 6.753 6.753 0 0 0 6.138 5.6 6.73 6.73 0 0 0 2.743 1.346A6.707 6.707 0 0 1 9.279 15H8.54c-1.036 0-1.875.84-1.875 1.875V19.5h-.75a2.25 2.25 0 0 0-2.25 2.25c0 .414.336.75.75.75h15.19a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-2.25-2.25h-.75v-2.625c0-1.036-.84-1.875-1.875-1.875h-.739a6.706 6.706 0 0 1-1.112-3.173 6.73 6.73 0 0 0 2.743-1.347 6.753 6.753 0 0 0 6.139-5.6.75.75 0 0 0-.585-.858 47.077 47.077 0 0 0-3.07-.543V2.62a.75.75 0 0 0-.658-.744 49.22 49.22 0 0 0-6.093-.377c-2.063 0-4.096.128-6.093.377a.75.75 0 0 0-.657.744Zm0 2.629c0 1.196.312 2.32.857 3.294A5.266 5.266 0 0 1 3.16 5.337a45.6 45.6 0 0 1 2.006-.343v.256Zm13.5 0v-.256c.674.1 1.343.214 2.006.343a5.265 5.265 0 0 1-2.863 3.207 6.72 6.72 0 0 0 .857-3.294Z" clipRule="evenodd" />
    </svg>
);

const HomeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M11.47 3.841a.75.75 0 0 1 1.06 0l8.69 8.69a.75.75 0 1 0 1.06-1.061l-8.689-8.69a2.25 2.25 0 0 0-3.182 0l-8.69 8.69a.75.75 0 1 0 1.061 1.06l8.69-8.689Z" />
        <path d="m12 5.432 8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 0 1-.75-.75v-4.5a.75.75 0 0 0-.75-.75h-3a.75.75 0 0 0-.75.75V21a.75.75 0 0 1-.75.75H5.625a1.875 1.875 0 0 1-1.875-1.875v-6.198a2.29 2.29 0 0 0 .091-.086L12 5.432Z" />
    </svg>
);

const SearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path fillRule="evenodd" d="M10.5 3.75a6.75 6.75 0 1 0 0 13.5 6.75 6.75 0 0 0 0-13.5ZM2.25 10.5a8.25 8.25 0 1 1 14.59 5.28l4.69 4.69a.75.75 0 1 1-1.06 1.06l-4.69-4.69A8.25 8.25 0 0 1 2.25 10.5Z" clipRule="evenodd" />
    </svg>
);

const ChartIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path fillRule="evenodd" d="M3 6a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6Zm4.5 7.5a.75.75 0 0 1 .75.75v2.25a.75.75 0 0 1-1.5 0v-2.25a.75.75 0 0 1 .75-.75Zm3.75-1.5a.75.75 0 0 0-1.5 0v4.5a.75.75 0 0 0 1.5 0V12Zm2.25-3a.75.75 0 0 1 .75.75v6.75a.75.75 0 0 1-1.5 0V9.75A.75.75 0 0 1 13.5 9Zm3.75-1.5a.75.75 0 0 0-1.5 0v9a.75.75 0 0 0 1.5 0v-9Z" clipRule="evenodd" />
    </svg>
);

const BuildingIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path fillRule="evenodd" d="M4.5 2.25a.75.75 0 0 0 0 1.5v16.5h-.75a.75.75 0 0 0 0 1.5h16.5a.75.75 0 0 0 0-1.5h-.75V3.75a.75.75 0 0 0 0-1.5h-15ZM9 6a.75.75 0 0 0 0 1.5h1.5a.75.75 0 0 0 0-1.5H9Zm-.75 3.75A.75.75 0 0 1 9 9h1.5a.75.75 0 0 1 0 1.5H9a.75.75 0 0 1-.75-.75ZM9 12a.75.75 0 0 0 0 1.5h1.5a.75.75 0 0 0 0-1.5H9Zm3.75-5.25A.75.75 0 0 1 13.5 6H15a.75.75 0 0 1 0 1.5h-1.5a.75.75 0 0 1-.75-.75ZM13.5 9a.75.75 0 0 0 0 1.5H15a.75.75 0 0 0 0-1.5h-1.5Zm-.75 3.75a.75.75 0 0 1 .75-.75H15a.75.75 0 0 1 0 1.5h-1.5a.75.75 0 0 1-.75-.75ZM9 19.5v-2.25a.75.75 0 0 1 .75-.75h4.5a.75.75 0 0 1 .75.75v2.25a.75.75 0 0 1-.75.75h-4.5A.75.75 0 0 1 9 19.5Z" clipRule="evenodd" />
    </svg>
);

const StarIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clipRule="evenodd" />
    </svg>
);

const ArrowUpIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path fillRule="evenodd" d="M11.47 2.47a.75.75 0 0 1 1.06 0l7.5 7.5a.75.75 0 1 1-1.06 1.06l-6.22-6.22V21a.75.75 0 0 1-1.5 0V4.81l-6.22 6.22a.75.75 0 1 1-1.06-1.06l7.5-7.5Z" clipRule="evenodd" />
    </svg>
);

const ArrowDownIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path fillRule="evenodd" d="M12 2.25a.75.75 0 0 1 .75.75v16.19l6.22-6.22a.75.75 0 1 1 1.06 1.06l-7.5 7.5a.75.75 0 0 1-1.06 0l-7.5-7.5a.75.75 0 1 1 1.06-1.06l6.22 6.22V3a.75.75 0 0 1 .75-.75Z" clipRule="evenodd" />
    </svg>
);

// Design System Variables (from UUPM)
const COLORS = {
    primary: '#1E40AF',
    secondary: '#3B82F6',
    cta: '#F59E0B',
    background: '#F8FAFC',
    text: '#1E3A8A',
    rank1: '#FFD700', // Gold
    rank2: '#C0C0C0', // Silver
    rank3: '#CD7F32', // Bronze
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444'
};

// Helper para obtener iniciales
const getInitials = (nombre: string, apellido: string) => {
    return `${nombre?.charAt(0) || ''}${apellido?.charAt(0) || ''}`.toUpperCase();
};

// Helper para color del avatar basado en nombre
const getAvatarGradient = (nombre: string): string => {
    const gradients = [
        'from-blue-500 to-indigo-600',
        'from-violet-500 to-purple-600',
        'from-cyan-500 to-blue-600',
        'from-emerald-500 to-teal-600',
        'from-amber-500 to-orange-600',
    ];
    const hash = nombre.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return gradients[hash % gradients.length];
};

// Helper para clasificar nivel con colores del design system
const clasificarNivel = (puntaje: number): { nivel: string; color: string; bg: string; border: string } => {
    if (puntaje >= 400) return { nivel: 'Superior', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' };
    if (puntaje >= 325) return { nivel: 'Alto', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' };
    if (puntaje >= 250) return { nivel: 'Medio', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' };
    return { nivel: 'Bajo', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' };
};

// ============== RANKING MEDAL COMPONENT (SVG-based, no emojis) ==============
function RankingMedal({ puesto, size = 'md' }: { puesto: number; size?: 'sm' | 'md' | 'lg' }) {
    const sizeClasses = {
        sm: 'w-8 h-8 text-xs',
        md: 'w-12 h-12 text-sm',
        lg: 'w-16 h-16 text-lg'
    };

    const getMedalStyle = () => {
        if (puesto === 1) {
            return {
                gradient: 'from-yellow-300 via-yellow-400 to-yellow-500',
                ring: 'ring-yellow-400/50',
                shadow: 'shadow-yellow-400/40',
                innerGlow: 'bg-yellow-200',
            };
        } else if (puesto === 2) {
            return {
                gradient: 'from-slate-200 via-slate-300 to-slate-400',
                ring: 'ring-slate-300/50',
                shadow: 'shadow-slate-400/40',
                innerGlow: 'bg-slate-100',
            };
        } else if (puesto === 3) {
            return {
                gradient: 'from-orange-300 via-orange-400 to-orange-500',
                ring: 'ring-orange-400/50',
                shadow: 'shadow-orange-400/40',
                innerGlow: 'bg-orange-200',
            };
        } else if (puesto <= 10) {
            return {
                gradient: 'from-indigo-400 via-indigo-500 to-indigo-600',
                ring: 'ring-indigo-400/30',
                shadow: 'shadow-indigo-400/30',
                innerGlow: 'bg-indigo-300',
            };
        } else if (puesto <= 15) {
            return {
                gradient: 'from-cyan-400 via-cyan-500 to-cyan-600',
                ring: 'ring-cyan-400/30',
                shadow: 'shadow-cyan-400/30',
                innerGlow: 'bg-cyan-300',
            };
        }
        return null;
    };

    const medal = getMedalStyle();

    if (!medal) {
        return (
            <div className={`${sizeClasses[size]} rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-500 transition-all duration-200`}>
                {puesto}
            </div>
        );
    }

    return (
        <div className={`relative ${sizeClasses[size]} rounded-full bg-gradient-to-br ${medal.gradient} ring-2 ${medal.ring} shadow-lg ${medal.shadow} flex items-center justify-center font-black text-white transition-all duration-200 hover:scale-110 cursor-pointer group`}>
            <span className="drop-shadow-md">{puesto}</span>
            {puesto <= 3 && (
                <div className={`absolute -top-1 -right-1 w-4 h-4 ${medal.innerGlow} rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300`}>
                    <StarIcon className="w-4 h-4 text-yellow-600" />
                </div>
            )}
        </div>
    );
}

// ============== KPI CARD COMPONENT ==============
function KPICard({ label, value, subvalue, icon, color = 'blue', trend }: {
    label: string;
    value: string | number;
    subvalue?: string;
    icon?: React.ReactNode;
    color?: 'blue' | 'green' | 'purple' | 'amber';
    trend?: 'up' | 'down' | 'neutral';
}) {
    const colorClasses = {
        blue: { bg: 'bg-blue-50', border: 'border-blue-100', text: 'text-blue-700', accent: 'text-blue-600' },
        green: { bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-700', accent: 'text-emerald-600' },
        purple: { bg: 'bg-violet-50', border: 'border-violet-100', text: 'text-violet-700', accent: 'text-violet-600' },
        amber: { bg: 'bg-amber-50', border: 'border-amber-100', text: 'text-amber-700', accent: 'text-amber-600' },
    };
    const c = colorClasses[color];

    return (
        <div className={`${c.bg} ${c.border} border rounded-xl p-4 transition-all duration-200 hover:shadow-md cursor-pointer group`}>
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">{label}</p>
                    <p className={`text-2xl font-bold ${c.text} tabular-nums`}>{value}</p>
                    {subvalue && <p className="text-xs text-slate-500 mt-0.5">{subvalue}</p>}
                </div>
                <div className="flex flex-col items-end gap-1">
                    {icon && <div className={`${c.accent} opacity-70 group-hover:opacity-100 transition-opacity`}>{icon}</div>}
                    {trend && (
                        <div className={`flex items-center gap-0.5 text-xs font-medium ${trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-red-500' : 'text-slate-400'}`}>
                            {trend === 'up' ? <ArrowUpIcon /> : trend === 'down' ? <ArrowDownIcon /> : null}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ============== PODIUM COMPONENT ==============
function Podium({ estudiantes, myId }: { estudiantes: Estudiante[]; myId: string }) {
    const positions = [1, 0, 2]; // Silver, Gold, Bronze order for display

    return (
        <div className="grid grid-cols-3 gap-3 sm:gap-6 items-end">
            {positions.map((podiumIndex) => {
                const est = estudiantes[podiumIndex];
                if (!est) return <div key={podiumIndex}></div>;
                const puesto = podiumIndex + 1;
                const isMe = String(est.informacion_personal.numero_identificacion).trim() === String(myId).trim();
                const nombres = est.informacion_personal.nombres || '';
                const apellidos = est.informacion_personal.apellidos || '';
                const initials = getInitials(nombres, apellidos);
                const gradient = getAvatarGradient(nombres + apellidos);

                const podiumHeight = puesto === 1 ? 'h-28 sm:h-36' : puesto === 2 ? 'h-20 sm:h-28' : 'h-16 sm:h-24';
                const podiumBg = puesto === 1 ? 'from-yellow-400 to-amber-500' : puesto === 2 ? 'from-slate-300 to-slate-400' : 'from-orange-400 to-orange-500';

                return (
                    <div
                        key={podiumIndex}
                        className={`flex flex-col items-center ${puesto === 1 ? 'order-2' : puesto === 2 ? 'order-1' : 'order-3'} group cursor-pointer`}
                    >
                        {/* Avatar */}
                        <div className={`relative mb-2 ${isMe ? 'ring-4 ring-indigo-400 ring-offset-2' : ''} rounded-full transition-transform duration-200 group-hover:scale-105`}>
                            <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold text-sm sm:text-lg shadow-lg`}>
                                {initials}
                            </div>
                            {isMe && (
                                <span className="absolute -top-1 -right-1 bg-indigo-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full shadow-md">TÚ</span>
                            )}
                        </div>

                        {/* Name */}
                        <p className="text-xs sm:text-sm font-semibold text-slate-800 text-center truncate max-w-full px-1 mb-1">
                            {nombres.split(' ')[0]} {apellidos.split(' ')[0]?.charAt(0)}.
                        </p>

                        {/* Score */}
                        <p className="text-lg sm:text-2xl font-black text-slate-900 tabular-nums mb-2">{est.puntaje_global}</p>

                        {/* Podium Base */}
                        <div className={`bg-gradient-to-t ${podiumBg} ${podiumHeight} w-full rounded-t-xl shadow-lg flex flex-col items-center justify-start pt-3 transition-all duration-200 group-hover:shadow-xl`}>
                            <RankingMedal puesto={puesto} size="md" />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

export default function RankingPage() {
    const router = useRouter();
    const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
    const [loading, setLoading] = useState(true);
    const [busqueda, setBusqueda] = useState('');
    const [filtroNivel, setFiltroNivel] = useState('todos');
    const [filtroInstitucion, setFiltroInstitucion] = useState('todas');
    const [simulacro, setSimulacro] = useState<string>('');
    const [myId, setMyId] = useState<string>('');

    useEffect(() => {
        const checkAuth = () => {
            const id = localStorage.getItem('student_id');
            if (!id) {
                router.push('/estudiante');
                return false;
            }
            setMyId(id);
            return true;
        };

        const loadData = async () => {
            if (!checkAuth()) return;

            try {
                const currentSim = sessionStorage.getItem('simulacro_selected') || 'SG11-09';
                setSimulacro(currentSim);

                const res = await fetch(`/data/simulations/${currentSim}/students.json?v=${Date.now()}`);
                if (res.ok) {
                    const data = await res.json();

                    // Handle both data structures:
                    // SG11-09 uses: { estudiantes: [...] }
                    // SG11-08 uses: { students: { id: {...}, ... } }
                    let studentsArray: Estudiante[] = [];

                    if (data.estudiantes && Array.isArray(data.estudiantes)) {
                        studentsArray = data.estudiantes;
                    } else if (data.students && typeof data.students === 'object') {
                        // Convert object to array
                        studentsArray = Object.values(data.students);
                    }

                    if (studentsArray.length === 0) {
                        console.warn('No students found in data');
                        setLoading(false);
                        return;
                    }

                    const sorted = [...studentsArray].sort((a: Estudiante, b: Estudiante) =>
                        (Number(b.puntaje_global) || 0) - (Number(a.puntaje_global) || 0)
                    );
                    setEstudiantes(sorted);
                }
            } catch (error) {
                console.error('Error loading data:', error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [router]);

    // Mi información de ranking
    const myRankingInfo = useMemo(() => {
        if (!myId || !estudiantes.length) return null;
        const myIndex = estudiantes.findIndex(e =>
            String(e.informacion_personal.numero_identificacion).trim() === String(myId).trim()
        );
        if (myIndex === -1) return null;
        const me = estudiantes[myIndex];
        const puntajes = estudiantes.map(e => Number(e.puntaje_global) || 0);
        const promedio = Math.round(puntajes.reduce((a, b) => a + b, 0) / puntajes.length);
        const percentil = Math.round(((estudiantes.length - myIndex - 1) / estudiantes.length) * 100);

        return {
            puesto: myIndex + 1,
            total: estudiantes.length,
            percentil,
            puntaje: Number(me.puntaje_global) || 0,
            promedio,
            diff: (Number(me.puntaje_global) || 0) - promedio,
            nombre: `${me.informacion_personal.nombres} ${me.informacion_personal.apellidos}`
        };
    }, [estudiantes, myId]);

    // Obtener instituciones únicas
    const instituciones = useMemo(() => {
        const set = new Set(estudiantes.map(e => e.informacion_personal.institucion || 'Sin institución'));
        return Array.from(set).filter(Boolean);
    }, [estudiantes]);

    // Filtrar estudiantes
    const estudiantesFiltrados = useMemo(() => {
        return estudiantes.filter(est => {
            const nombreCompleto = `${est.informacion_personal.nombres} ${est.informacion_personal.apellidos}`.toLowerCase();
            const matchBusqueda = busqueda === '' || nombreCompleto.includes(busqueda.toLowerCase());

            const nivel = clasificarNivel(Number(est.puntaje_global) || 0);
            const matchNivel = filtroNivel === 'todos' || nivel.nivel.toLowerCase() === filtroNivel;

            const institucion = est.informacion_personal.institucion || '';
            const matchInstitucion = filtroInstitucion === 'todas' || institucion === filtroInstitucion;

            return matchBusqueda && matchNivel && matchInstitucion;
        });
    }, [estudiantes, busqueda, filtroNivel, filtroInstitucion]);



    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-600 font-medium">Cargando ranking...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white font-sans relative overflow-x-hidden pb-20">
            {/* Animated Background */}
            <div className="fixed inset-0 z-0">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
                {/* Header */}
                <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                    <div className="flex items-center gap-4 bg-white/5 backdrop-blur-xl p-4 rounded-2xl border border-white/10 shadow-xl">
                        <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/30">
                            <TrophyIcon />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
                                🏆 Ranking General
                            </h1>
                            <p className="text-white/50 text-sm font-medium">
                                Simulacro: <span className="text-cyan-400 font-bold">{simulacro || 'Cargando...'}</span>
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => router.push('/estudiante/dashboard')}
                        className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:border-white/30 rounded-xl text-sm font-bold shadow-lg transition-all duration-300 flex items-center gap-2 cursor-pointer backdrop-blur-sm"
                    >
                        <HomeIcon /> Volver al Inicio
                    </button>
                </header>

                {/* KPI Cards - My Position */}
                {myRankingInfo && (
                    <section className="mb-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Tu Posición */}
                        <div className="relative overflow-hidden bg-gradient-to-br from-amber-500/20 to-orange-500/10 backdrop-blur-xl rounded-2xl border border-amber-500/30 p-5 group hover:scale-[1.02] transition-all duration-300">
                            <div className="absolute -right-6 -top-6 w-24 h-24 bg-amber-400/20 rounded-full blur-2xl"></div>
                            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Tu Posición</span>
                            <p className="text-4xl font-black text-white mt-1 drop-shadow-lg">#{myRankingInfo.puesto}</p>
                            <p className="text-xs text-white/50 mt-1">de {myRankingInfo.total} estudiantes</p>
                            <div className="absolute right-4 top-4 text-amber-400/50 group-hover:text-amber-400 transition-colors">
                                <TrophyIcon />
                            </div>
                        </div>

                        {/* Tu Puntaje */}
                        <div className="relative overflow-hidden bg-gradient-to-br from-blue-500/20 to-cyan-500/10 backdrop-blur-xl rounded-2xl border border-blue-500/30 p-5 group hover:scale-[1.02] transition-all duration-300">
                            <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-400/20 rounded-full blur-2xl"></div>
                            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Tu Puntaje</span>
                            <p className="text-4xl font-black text-white mt-1 drop-shadow-lg">{myRankingInfo.puntaje}</p>
                            <p className="text-xs text-white/50 mt-1">puntos globales</p>
                            <div className="absolute right-4 top-4 text-blue-400/50 group-hover:text-blue-400 transition-colors">
                                <ChartIcon />
                            </div>
                        </div>

                        {/* vs Promedio */}
                        <div className={`relative overflow-hidden backdrop-blur-xl rounded-2xl border p-5 group hover:scale-[1.02] transition-all duration-300 ${myRankingInfo.diff >= 0
                            ? 'bg-gradient-to-br from-emerald-500/20 to-green-500/10 border-emerald-500/30'
                            : 'bg-gradient-to-br from-rose-500/20 to-red-500/10 border-rose-500/30'
                            }`}>
                            <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full blur-2xl ${myRankingInfo.diff >= 0 ? 'bg-emerald-400/20' : 'bg-rose-400/20'}`}></div>
                            <span className={`text-xs font-bold uppercase tracking-wider ${myRankingInfo.diff >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>vs Promedio</span>
                            <p className={`text-4xl font-black mt-1 drop-shadow-lg ${myRankingInfo.diff >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {myRankingInfo.diff >= 0 ? '+' : ''}{myRankingInfo.diff}
                            </p>
                            <p className="text-xs text-white/50 mt-1">Promedio: {myRankingInfo.promedio}</p>
                            <div className={`absolute right-4 top-4 transition-colors ${myRankingInfo.diff >= 0 ? 'text-emerald-400/50 group-hover:text-emerald-400' : 'text-rose-400/50 group-hover:text-rose-400'}`}>
                                {myRankingInfo.diff >= 0 ? <ArrowUpIcon /> : <ArrowDownIcon />}
                            </div>
                        </div>

                        {/* Percentil */}
                        <div className="relative overflow-hidden bg-gradient-to-br from-purple-500/20 to-violet-500/10 backdrop-blur-xl rounded-2xl border border-purple-500/30 p-5 group hover:scale-[1.02] transition-all duration-300">
                            <div className="absolute -right-6 -top-6 w-24 h-24 bg-purple-400/20 rounded-full blur-2xl"></div>
                            <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Percentil</span>
                            <p className="text-4xl font-black text-white mt-1 drop-shadow-lg">{myRankingInfo.percentil}%</p>
                            <p className="text-xs text-white/50 mt-1">mejor que el resto</p>
                            <div className="absolute right-4 top-4 text-purple-400/50 group-hover:text-purple-400 transition-colors">
                                <StarIcon className="w-5 h-5" />
                            </div>
                        </div>
                    </section>
                )}

                {/* Top Estudiantes - Responsive: Top 5 en desktop, Top 3 en móvil */}
                <section className="mb-6 bg-gradient-to-b from-white/5 to-transparent backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl p-4 sm:p-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-black text-white flex items-center gap-2">
                            <span className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center shadow-lg shadow-amber-500/30">
                                <StarIcon className="w-4 h-4 text-white" />
                            </span>
                            <span className="hidden sm:inline">Top 5 Estudiantes</span>
                            <span className="sm:hidden">Top 3</span>
                        </h2>
                        <div className="text-xs text-white/40 hidden lg:block">
                            🔥 Los mejores puntajes del simulacro
                        </div>
                    </div>

                    {/* Desktop: Top 5 en grid horizontal */}
                    <div className="hidden lg:grid lg:grid-cols-5 gap-3">
                        {estudiantes.slice(0, 5).map((est, idx) => {
                            const puesto = idx + 1;
                            const nombres = est.informacion_personal.nombres || '';
                            const apellidos = est.informacion_personal.apellidos || '';
                            const initials = getInitials(nombres, apellidos);
                            const isMe = String(est.informacion_personal.numero_identificacion).trim() === String(myId).trim();

                            const podiumStyles = {
                                1: { bg: 'from-amber-400 to-amber-600', ring: 'ring-amber-400/50', shadow: 'shadow-amber-500/40', text: 'text-amber-400', badge: 'bg-amber-500' },
                                2: { bg: 'from-slate-300 to-slate-500', ring: 'ring-slate-400/40', shadow: 'shadow-slate-400/30', text: 'text-slate-300', badge: 'bg-slate-400' },
                                3: { bg: 'from-orange-400 to-orange-600', ring: 'ring-orange-400/40', shadow: 'shadow-orange-500/30', text: 'text-orange-400', badge: 'bg-orange-500' },
                                4: { bg: 'from-indigo-400 to-indigo-600', ring: 'ring-indigo-400/30', shadow: 'shadow-indigo-500/30', text: 'text-indigo-400', badge: 'bg-indigo-500' },
                                5: { bg: 'from-cyan-400 to-cyan-600', ring: 'ring-cyan-400/30', shadow: 'shadow-cyan-500/30', text: 'text-cyan-400', badge: 'bg-cyan-500' },
                            }[puesto] || { bg: 'from-gray-400 to-gray-600', ring: 'ring-gray-400/30', shadow: '', text: 'text-gray-400', badge: 'bg-gray-500' };

                            return (
                                <div
                                    key={est.informacion_personal.numero_identificacion}
                                    className={`relative group p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 text-center ${isMe ? 'ring-2 ring-cyan-400 bg-cyan-500/10' : ''}`}
                                >
                                    {/* Crown for #1 */}
                                    {puesto === 1 && (
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-2xl animate-bounce">👑</div>
                                    )}

                                    {/* Position Badge */}
                                    <div className={`absolute -top-2 -left-2 w-7 h-7 ${podiumStyles.badge} rounded-full flex items-center justify-center text-xs font-black text-white shadow-lg`}>
                                        {puesto}
                                    </div>

                                    {/* Avatar */}
                                    <div className={`w-14 h-14 mx-auto mb-2 rounded-xl bg-gradient-to-br ${podiumStyles.bg} flex items-center justify-center text-lg font-black text-white shadow-xl ${podiumStyles.shadow} ring-2 ${podiumStyles.ring} group-hover:scale-110 transition-transform duration-300`}>
                                        {initials}
                                    </div>

                                    {/* Name */}
                                    <p className="text-white font-bold text-sm truncate student-name">
                                        {nombres.split(' ')[0].toUpperCase()}
                                    </p>
                                    <p className="text-white/40 text-[10px] truncate">
                                        {apellidos.split(' ')[0].toUpperCase()}
                                    </p>

                                    {/* Score */}
                                    <p className={`text-2xl font-black mt-1 ${podiumStyles.text}`}>
                                        {est.puntaje_global}
                                    </p>

                                    {/* You badge */}
                                    {isMe && (
                                        <span className="absolute top-2 right-2 bg-cyan-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">TÚ</span>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Mobile: Top 3 podio clásico */}
                    <div className="lg:hidden flex justify-center items-end gap-3">
                        {/* 2nd Place */}
                        {estudiantes[1] && (
                            <div className="flex flex-col items-center group">
                                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center text-lg font-black text-slate-700 shadow-xl ring-2 ring-slate-400/30 group-hover:scale-110 transition-transform ${String(estudiantes[1].informacion_personal.numero_identificacion).trim() === String(myId).trim() ? 'ring-2 ring-cyan-400' : ''}`}>
                                    {getInitials(estudiantes[1].informacion_personal.nombres || '', estudiantes[1].informacion_personal.apellidos || '')}
                                </div>
                                <span className="text-white font-bold text-xs mt-1 student-name">{estudiantes[1].informacion_personal.nombres?.split(' ')[0]?.toUpperCase()}</span>
                                <span className="text-xl font-black text-slate-300">{estudiantes[1].puntaje_global}</span>
                                <div className="w-20 h-20 mt-1 bg-gradient-to-t from-slate-600 to-slate-400 rounded-t-xl flex items-center justify-center">
                                    <span className="text-3xl font-black text-slate-200/20">2</span>
                                </div>
                            </div>
                        )}

                        {/* 1st Place */}
                        {estudiantes[0] && (
                            <div className="flex flex-col items-center group -mt-4">
                                <div className="text-2xl mb-1 animate-bounce">👑</div>
                                <div className={`w-16 h-16 rounded-xl bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-500 flex items-center justify-center text-xl font-black text-amber-800 shadow-xl ring-2 ring-amber-400/50 group-hover:scale-110 transition-transform ${String(estudiantes[0].informacion_personal.numero_identificacion).trim() === String(myId).trim() ? 'ring-2 ring-cyan-400' : ''}`}>
                                    {getInitials(estudiantes[0].informacion_personal.nombres || '', estudiantes[0].informacion_personal.apellidos || '')}
                                </div>
                                <span className="text-white font-bold text-sm mt-1 student-name">{estudiantes[0].informacion_personal.nombres?.split(' ')[0]?.toUpperCase()}</span>
                                <span className="text-2xl font-black text-amber-400">{estudiantes[0].puntaje_global}</span>
                                <div className="w-24 h-28 mt-1 bg-gradient-to-t from-amber-600 via-amber-500 to-amber-400 rounded-t-xl flex items-center justify-center">
                                    <span className="text-4xl font-black text-amber-300/20">1</span>
                                </div>
                            </div>
                        )}

                        {/* 3rd Place */}
                        {estudiantes[2] && (
                            <div className="flex flex-col items-center group">
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-base font-black text-orange-100 shadow-xl ring-2 ring-orange-500/30 group-hover:scale-110 transition-transform ${String(estudiantes[2].informacion_personal.numero_identificacion).trim() === String(myId).trim() ? 'ring-2 ring-cyan-400' : ''}`}>
                                    {getInitials(estudiantes[2].informacion_personal.nombres || '', estudiantes[2].informacion_personal.apellidos || '')}
                                </div>
                                <span className="text-white font-bold text-xs mt-1 student-name">{estudiantes[2].informacion_personal.nombres?.split(' ')[0]?.toUpperCase()}</span>
                                <span className="text-lg font-black text-orange-400">{estudiantes[2].puntaje_global}</span>
                                <div className="w-16 h-16 mt-1 bg-gradient-to-t from-orange-700 to-orange-500 rounded-t-xl flex items-center justify-center">
                                    <span className="text-2xl font-black text-orange-400/20">3</span>
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                {/* Filters & Table - Optimizado */}
                <section className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
                    {/* Filters - Más compacto */}
                    <div className="p-3 sm:p-4 border-b border-white/10 bg-white/5 flex flex-wrap gap-2 items-center justify-between">
                        {/* Left: Search + Filters */}
                        <div className="flex flex-wrap gap-2 items-center flex-1">
                            <div className="relative flex-1 min-w-[150px] max-w-[280px]">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">
                                    <SearchIcon />
                                </span>
                                <input
                                    type="text"
                                    placeholder="Buscar..."
                                    value={busqueda}
                                    onChange={(e) => setBusqueda(e.target.value)}
                                    className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-3 py-2 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-sm"
                                />
                            </div>
                            <select
                                value={filtroNivel}
                                onChange={(e) => setFiltroNivel(e.target.value)}
                                className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm cursor-pointer"
                            >
                                <option value="todos" className="bg-slate-900">Nivel</option>
                                <option value="superior" className="bg-slate-900">Superior</option>
                                <option value="alto" className="bg-slate-900">Alto</option>
                                <option value="medio" className="bg-slate-900">Medio</option>
                                <option value="bajo" className="bg-slate-900">Bajo</option>
                            </select>
                            <select
                                value={filtroInstitucion}
                                onChange={(e) => setFiltroInstitucion(e.target.value)}
                                className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm cursor-pointer hidden sm:block max-w-[180px]"
                            >
                                <option value="todas" className="bg-slate-900">Institución</option>
                                {instituciones.map(inst => (
                                    <option key={inst} value={inst} className="bg-slate-900">{inst.slice(0, 20)}</option>
                                ))}
                            </select>
                        </div>

                        {/* Right: Count + Legend */}
                        <div className="flex items-center gap-3">
                            <span className="text-white/50 text-xs">
                                <span className="text-cyan-400 font-bold">{estudiantesFiltrados.length}</span>/{estudiantes.length}
                            </span>
                            <div className="hidden md:flex items-center gap-1.5 text-[10px]">
                                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>S
                                </span>
                                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>A
                                </span>
                                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>M
                                </span>
                                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400">
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>B
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Table - Sin columna de institución que gasta espacio */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-white/5 border-b border-white/10 text-[10px] uppercase tracking-wider text-white/50 font-bold">
                                <tr>
                                    <th className="py-3 pl-3 sm:pl-4 w-14 text-center">#</th>
                                    <th className="py-3 pl-2">Estudiante</th>
                                    <th className="py-3 px-2 text-center w-24">Puntaje</th>
                                    <th className="py-3 pr-3 sm:pr-4 text-center w-20">Nivel</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {estudiantesFiltrados.map((est, index) => {
                                    const nivel = clasificarNivel(Number(est.puntaje_global) || 0);
                                    const nombres = est.informacion_personal.nombres || '';
                                    const apellidos = est.informacion_personal.apellidos || '';
                                    const initials = getInitials(nombres, apellidos);
                                    const gradient = getAvatarGradient(nombres + apellidos);
                                    const institucion = est.informacion_personal.institucion || '';
                                    const doc = est.informacion_personal.numero_identificacion || '';
                                    const isMe = String(doc).trim() === String(myId).trim();
                                    const realIndex = estudiantes.findIndex(e =>
                                        e.informacion_personal.numero_identificacion === doc
                                    );
                                    const puesto = realIndex + 1;

                                    const nivelDark = {
                                        Superior: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', short: 'SUP' },
                                        Alto: { bg: 'bg-blue-500/20', text: 'text-blue-400', short: 'ALT' },
                                        Medio: { bg: 'bg-amber-500/20', text: 'text-amber-400', short: 'MED' },
                                        Bajo: { bg: 'bg-rose-500/20', text: 'text-rose-400', short: 'BAJ' },
                                    }[nivel.nivel] || { bg: 'bg-white/10', text: 'text-white/60', short: '-' };

                                    return (
                                        <tr
                                            key={doc + index}
                                            className={`group transition-all duration-150 cursor-pointer ${isMe
                                                ? 'bg-gradient-to-r from-cyan-500/15 via-blue-500/10 to-purple-500/5 border-l-2 border-l-cyan-400'
                                                : 'hover:bg-white/5'
                                                }`}
                                        >
                                            <td className="py-2.5 pl-3 sm:pl-4 text-center">
                                                <RankingMedal puesto={puesto} size="sm" />
                                            </td>
                                            <td className="py-2.5 pl-2 pr-2">
                                                <div className="flex items-center gap-2">
                                                    <div className={`relative w-8 h-8 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center text-[10px] font-bold text-white shadow ring-1 ring-white/10 group-hover:scale-105 transition-transform flex-shrink-0`}>
                                                        {initials}
                                                        {isMe && (
                                                            <span className="absolute -top-1 -right-1 bg-cyan-500 text-white text-[6px] font-bold w-3 h-3 rounded-full flex items-center justify-center">✓</span>
                                                        )}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <span className={`block text-sm font-bold truncate student-name ${isMe ? 'text-cyan-400' : 'text-white group-hover:text-cyan-400'} transition-colors`}>
                                                            {nombres.split(' ')[0].toUpperCase()} {apellidos.split(' ')[0].toUpperCase()}
                                                        </span>
                                                        {institucion && (
                                                            <span className="text-[9px] text-white/30 truncate block max-w-[150px] sm:max-w-[200px]">
                                                                {institucion}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-2.5 px-2 text-center">
                                                <span className={`text-lg font-black tabular-nums ${isMe ? 'text-cyan-400' : 'text-white group-hover:text-cyan-400'} transition-colors`}>
                                                    {est.puntaje_global}
                                                </span>
                                            </td>
                                            <td className="py-2.5 pr-3 sm:pr-4 text-center">
                                                <span className={`inline-block px-2 py-1 rounded text-[9px] font-bold uppercase ${nivelDark.bg} ${nivelDark.text}`}>
                                                    {nivelDark.short}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Footer */}
                <footer className="text-center text-white/30 text-xs py-6 mt-4 font-medium">
                    <p>🏆 Ranking Oficial • Seamos Genios 2026</p>
                </footer>
            </main>
        </div>
    );
}
