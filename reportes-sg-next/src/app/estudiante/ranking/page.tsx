'use client';
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Estudiante } from '@/types';
import LiquidEther from '@/components/LiquidEther';

// Helper para obtener iniciales
const getInitials = (nombre: string, apellido: string) => {
    return `${nombre?.charAt(0) || ''}${apellido?.charAt(0) || ''}`.toUpperCase();
};

// Helper para color del avatar basado en nombre
const getAvatarGradient = (nombre: string): string => {
    const gradients = [
        'from-pink-500 to-rose-500',
        'from-purple-500 to-indigo-500',
        'from-blue-500 to-cyan-500',
        'from-teal-500 to-emerald-500',
        'from-amber-500 to-orange-500',
    ];
    const hash = nombre.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return gradients[hash % gradients.length];
};

// Helper para clasificar nivel
const clasificarNivel = (puntaje: number): { nivel: string; color: string; bg: string; border: string; icon: string } => {
    if (puntaje >= 400) return { nivel: 'Superior', color: 'text-green-700', bg: 'bg-green-100', border: 'border-green-200', icon: '⭐' };
    if (puntaje >= 325) return { nivel: 'Alto', color: 'text-blue-700', bg: 'bg-blue-100', border: 'border-blue-200', icon: '🔵' };
    if (puntaje >= 250) return { nivel: 'Medio', color: 'text-yellow-700', bg: 'bg-yellow-100', border: 'border-yellow-200', icon: '🟡' };
    return { nivel: 'Bajo', color: 'text-red-700', bg: 'bg-red-100', border: 'border-red-200', icon: '🔴' };
};

export default function RankingPage() {
    const router = useRouter();
    const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
    const [loading, setLoading] = useState(true);
    const [busqueda, setBusqueda] = useState('');
    const [filtroNivel, setFiltroNivel] = useState('todos');
    const [filtroInstitucion, setFiltroInstitucion] = useState('todas');

    useEffect(() => {
        const checkAuth = () => {
            const id = localStorage.getItem('student_id');
            if (!id) {
                router.push('/estudiante');
                return false;
            }
            return true;
        };

        const loadData = async () => {
            if (!checkAuth()) return;

            try {
                // Fetch optimizado: Usar índice de ranking ligero
                const res = await fetch('/data/ranking_index.json');
                if (res.ok) {
                    const data = await res.json();
                    // Ordenar por puntaje global descendente
                    const sorted = [...data.estudiantes].sort((a: Estudiante, b: Estudiante) =>
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

    // Obtener instituciones únicas
    const instituciones = useMemo(() => {
        const set = new Set(estudiantes.map(e => e.informacion_personal.institucion || 'Sin institución'));
        return Array.from(set).filter(Boolean);
    }, [estudiantes]);

    // Filtrar estudiantes
    const estudiantesFiltrados = useMemo(() => {
        return estudiantes.filter(est => {
            const nombreCompleto = `${est.informacion_personal.nombres} ${est.informacion_personal.apellidos}`.toLowerCase();
            const doc = est.informacion_personal.numero_identificacion || '';
            const matchBusqueda = busqueda === '' ||
                nombreCompleto.includes(busqueda.toLowerCase()) ||
                doc.includes(busqueda);

            const nivel = clasificarNivel(Number(est.puntaje_global) || 0);
            const matchNivel = filtroNivel === 'todos' || nivel.nivel.toLowerCase() === filtroNivel;

            const institucion = est.informacion_personal.institucion || '';
            const matchInstitucion = filtroInstitucion === 'todas' || institucion === filtroInstitucion;

            return matchBusqueda && matchNivel && matchInstitucion;
        });
    }, [estudiantes, busqueda, filtroNivel, filtroInstitucion]);

    const handleLogout = () => {
        localStorage.removeItem('student_id');
        localStorage.removeItem('student_name');
        localStorage.removeItem('student_email');
        router.push('/estudiante');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans relative overflow-x-hidden pb-20">
            {/* Watermark responsive and overlay */}
            <img
                src="/fondo_16_9.svg"
                alt=""
                className="fixed inset-0 z-[30] w-full h-full object-cover opacity-[0.15] pointer-events-none select-none"
                draggable="false"
            />

            <main className="relative z-40 max-w-7xl mx-auto px-6 py-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-6">
                    <div className="flex items-center gap-4 bg-white/80 backdrop-blur-md p-4 rounded-3xl border border-slate-200 shadow-sm">
                        <div className="w-14 h-14 bg-gradient-to-br from-yellow-100 to-amber-100 text-yellow-600 rounded-2xl flex items-center justify-center shadow-inner text-2xl">
                            🏆
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Ranking General</h1>
                            <p className="text-slate-500 text-sm font-medium">Resultados Simulacro ICFES</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => router.push('/estudiante/dashboard')}
                            className="px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 hover:border-slate-300 rounded-xl text-sm font-bold shadow-sm transition-all flex items-center gap-2"
                        >
                            <span>🏠</span> Volver al Inicio
                        </button>
                    </div>
                </div>

                {/* Main Card */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
                    {/* Filters */}
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50 space-y-4">
                        <div className="flex flex-wrap gap-4 items-center">
                            <div className="flex-1 min-w-[300px] relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
                                <input
                                    type="text"
                                    placeholder="Buscar por nombre o documento..."
                                    value={busqueda}
                                    onChange={(e) => setBusqueda(e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded-xl pl-12 pr-4 py-3 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                                />
                            </div>
                            <select
                                value={filtroNivel}
                                onChange={(e) => setFiltroNivel(e.target.value)}
                                className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm min-w-[160px] cursor-pointer hover:border-slate-300"
                            >
                                <option value="todos">📊 Todos los niveles</option>
                                <option value="superior">⭐ Superior</option>
                                <option value="alto">🔵 Alto</option>
                                <option value="medio">🟡 Medio</option>
                                <option value="bajo">🔴 Bajo</option>
                            </select>
                            <select
                                value={filtroInstitucion}
                                onChange={(e) => setFiltroInstitucion(e.target.value)}
                                className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm max-w-[250px] cursor-pointer hover:border-slate-300"
                            >
                                <option value="todas">🏫 Todas las instituciones</option>
                                {instituciones.map(inst => (
                                    <option key={inst} value={inst}>{inst}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-center justify-between">
                            <p className="text-slate-500 text-sm font-medium">
                                Mostrando <span className="text-indigo-600 font-bold">{estudiantesFiltrados.length}</span> de <span className="text-slate-700">{estudiantes.length}</span> estudiantes
                            </p>
                            <div className="flex gap-2">
                                <span className="text-xs text-slate-500 bg-white border border-slate-200 px-2 py-1 rounded shadow-sm font-medium">S1 = verde</span>
                                <span className="text-xs text-slate-500 bg-white border border-slate-200 px-2 py-1 rounded shadow-sm font-medium">S2 = azul</span>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full table-fixed text-left">
                            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500 font-bold sticky top-0 z-10">
                                <tr>
                                    <th className="py-4 pl-6 w-[5%] text-center">#</th>
                                    <th className="py-4 pl-2 w-[35%]">Estudiante</th>
                                    <th className="py-4 px-2 w-[20%] text-center hidden md:table-cell">Institución</th>
                                    <th className="py-4 px-2 w-[10%] text-center hidden md:table-cell">S1</th>
                                    <th className="py-4 px-2 w-[10%] text-center hidden md:table-cell">S2</th>
                                    <th className="py-4 px-2 w-[10%] text-center">Global</th>
                                    <th className="py-4 pr-6 w-[10%] text-right">Nivel</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {estudiantesFiltrados.map((est, index) => {
                                    const nivel = clasificarNivel(Number(est.puntaje_global) || 0);
                                    const nombres = est.informacion_personal.nombres || '';
                                    const apellidos = est.informacion_personal.apellidos || '';
                                    const initials = getInitials(nombres, apellidos);
                                    const gradient = getAvatarGradient(nombres + apellidos);
                                    const email = est.informacion_personal.correo_electronico || '';
                                    const institucion = est.informacion_personal.institucion || 'Sin institución';
                                    const doc = est.informacion_personal.numero_identificacion || '';

                                    // Highlight logic if using real auth context in future, for now standard row
                                    const isTop3 = index < 3;

                                    return (
                                        <tr key={doc + index} className={`group transition-all hover:bg-slate-50/80 ${isTop3 ? 'bg-gradient-to-r from-transparent via-yellow-50/10 to-transparent' : ''}`}>
                                            <td className="py-4 pl-6 text-center">
                                                <span className={`inline-block w-6 h-6 rounded-full text-xs font-bold leading-6 ${isTop3 ? 'bg-yellow-100 text-yellow-700' : 'text-slate-400 bg-slate-100'}`}>
                                                    {index + 1}
                                                </span>
                                            </td>
                                            <td className="py-4 pl-2 pr-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-xs font-bold text-white shadow-md ring-2 ring-white group-hover:scale-105 transition-transform`}>
                                                        {initials}
                                                    </div>
                                                    <div className="min-w-0 flex flex-col">
                                                        <span className="text-slate-900 font-bold text-sm leading-tight truncate max-w-[200px] group-hover:text-indigo-700 transition-colors">
                                                            {nombres} {apellidos}
                                                        </span>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-[10px] text-slate-500 font-mono bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                                                {doc}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-2 text-center hidden md:table-cell">
                                                <span className="text-[11px] text-slate-600 bg-slate-50 border border-slate-100 px-2 py-1 rounded-full truncate max-w-[150px] inline-block font-medium" title={institucion}>
                                                    {institucion}
                                                </span>
                                            </td>
                                            <td className="py-4 px-2 text-center hidden md:table-cell">
                                                <div className="flex flex-col items-center justify-center">
                                                    <span className="text-sm font-bold tabular-nums text-emerald-600 bg-emerald-50 px-2 rounded-md">
                                                        {est.s1_aciertos ?? '-'}
                                                    </span>
                                                    {est.s1_total && (
                                                        <span className="text-[9px] text-slate-400 font-medium">de {est.s1_total}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-4 px-2 text-center hidden md:table-cell">
                                                <div className="flex flex-col items-center justify-center">
                                                    <span className="text-sm font-bold tabular-nums text-blue-600 bg-blue-50 px-2 rounded-md">
                                                        {est.s2_aciertos ?? '-'}
                                                    </span>
                                                    {est.s2_total && (
                                                        <span className="text-[9px] text-slate-400 font-medium">de {est.s2_total}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-4 px-2 text-center">
                                                <span className="text-xl font-black tabular-nums tracking-tight text-slate-800 group-hover:scale-110 transition-transform inline-block group-hover:text-indigo-600">
                                                    {est.puntaje_global}
                                                </span>
                                            </td>
                                            <td className="py-4 pr-6 text-right">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-wide shadow-sm ${nivel.bg} ${nivel.border} ${nivel.color}`}>
                                                    {nivel.icon && <span>{nivel.icon}</span>}
                                                    {nivel.nivel}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Footer */}
                <footer className="text-center text-slate-400 text-sm py-8 mt-8 font-medium">
                    <p>Ranking Oficial • Seamos Genios 2026</p>
                </footer>
            </main>
        </div>
    );
}
