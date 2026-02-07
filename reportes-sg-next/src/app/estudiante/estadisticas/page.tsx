'use client';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ANALIZAR_DESEMPENO, CALCULAR_CONSISTENCIA } from '@/utils/feedbackGenerator';
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

ChartJS.register(
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend
);

interface RespuestaDetallada {
    numero: number;
    respuesta_estudiante: string;
    respuesta_correcta: string;
    es_correcta: boolean;
}

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
    respuestas_detalladas: Record<string, RespuestaDetallada[]>;
}

const materiasConfig = [
    { key: 'lectura crítica', label: 'Lectura Crítica', color: '#ec4899', bg: 'bg-pink-50', text: 'text-pink-600' },
    { key: 'matemáticas', label: 'Matemáticas', color: '#3b82f6', bg: 'bg-blue-50', text: 'text-blue-600' },
    { key: 'sociales y ciudadanas', label: 'Sociales', color: '#f59e0b', bg: 'bg-amber-50', text: 'text-amber-600' },
    { key: 'ciencias naturales', label: 'Ciencias', color: '#10b981', bg: 'bg-emerald-50', text: 'text-emerald-600' },
    { key: 'inglés', label: 'Inglés', color: '#8b5cf6', bg: 'bg-purple-50', text: 'text-purple-600' },
];

export default function EstadisticasPage() {
    const router = useRouter();
    const [estudiante, setEstudiante] = useState<Estudiante | null>(null);
    const [todos, setTodos] = useState<Estudiante[]>([]);
    const [loading, setLoading] = useState(true);

    const loadData = useCallback(async () => {
        const id = localStorage.getItem('student_id');
        if (!id) {
            router.replace('/estudiante');
            return;
        }

        try {
            const res = await fetch(`/data/resultados_finales.json?v=${new Date().getTime()}`);
            if (!res.ok) throw new Error('Error');

            const data = await res.json();

            // Eliminar duplicados por número de identificación
            const unicosMap = new Map();
            data.estudiantes.forEach((e: any) => {
                const idNum = String(e.informacion_personal.numero_identificacion).trim();
                // Si ya existe, podríamos decidir quedarnos con el de mayor puntaje
                // Por ahora, sobreescribimos (asumiendo que el último es el más reciente) o chequeamos puntaje
                if (!unicosMap.has(idNum) || e.puntaje_global > unicosMap.get(idNum).puntaje_global) {
                    unicosMap.set(idNum, e);
                }
            });
            const estudiantesUnicos = Array.from(unicosMap.values()) as Estudiante[];

            setTodos(estudiantesUnicos);

            const targetId = String(id).trim();
            const found = estudiantesUnicos.find(
                (e: any) => String(e.informacion_personal.numero_identificacion).trim() === targetId
            );

            if (found) {
                setEstudiante(found);
            } else {
                console.error("Estudiante no encontrado. ID:", targetId);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [router]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const rankingInfo = useMemo(() => {
        if (!estudiante || !todos.length) return { puesto: 0, total: 0, percentil: 0 };

        // Ordenar descendentemente por puntaje global
        const sorted = [...todos].sort((a, b) => b.puntaje_global - a.puntaje_global);
        const puesto = sorted.findIndex(e => e.informacion_personal.numero_identificacion === estudiante.informacion_personal.numero_identificacion) + 1;

        // Calcular percentil real (cuántos están por debajo)
        const debajo = todos.length - puesto;
        const percentil = Math.round((debajo / todos.length) * 100);

        return { puesto, total: todos.length, percentil };
    }, [estudiante, todos]);

    const radarData: any = useMemo(() => {
        if (!estudiante) return { labels: [], datasets: [] };
        const dataPoints = materiasConfig.map(m => estudiante.puntajes[m.key]?.puntaje || 0);

        return {
            labels: materiasConfig.map(m => m.label),
            datasets: [
                {
                    label: 'Mi Desempeño',
                    data: dataPoints,
                    backgroundColor: 'rgba(59, 130, 246, 0.2)', // Azul suave transparente
                    borderColor: '#3b82f6', // Azul vibrante
                    borderWidth: 3,
                    pointBackgroundColor: '#fff',
                    pointBorderColor: '#3b82f6',
                    pointHoverBackgroundColor: '#3b82f6',
                    pointHoverBorderColor: '#fff',
                    pointRadius: 4,
                    pointHoverRadius: 6,
                },
            ],
        };
    }, [estudiante]);

    const radarOptions = {
        scales: {
            r: {
                angleLines: { color: 'rgba(0,0,0,0.05)' },
                grid: { color: 'rgba(0,0,0,0.05)' },
                pointLabels: {
                    font: { size: 12, family: "'Inter', sans-serif", weight: '600' as const },
                    color: '#64748b'
                },
                ticks: { display: false, backdropColor: 'transparent' },
                suggestedMin: 0,
                suggestedMax: 100
            },
        },
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                titleFont: { family: "'Inter', sans-serif" },
                bodyFont: { family: "'Inter', sans-serif" },
                padding: 12,
                cornerRadius: 8,
                displayColors: false
            }
        },
        maintainAspectRatio: false
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!estudiante) return null;

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 font-sans relative">
            {/* Watermark responsive and overlay */}
            <img
                src="/fondo_16_9.svg"
                alt=""
                className="fixed inset-0 z-[30] w-full h-full object-cover opacity-[0.15] pointer-events-none select-none"
                draggable="false"
            />

            {/* Navbar Moderno con sombra suave */}
            <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200/60">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-blue-500/20">
                            SG
                        </div>
                        <span className="font-bold text-lg tracking-tight text-slate-800">Métricas & Ranking</span>
                    </div>
                    <button
                        onClick={() => router.push('/estudiante/dashboard')}
                        className="group flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium text-sm transition-all"
                    >
                        <span>Volver</span>
                    </button>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">

                {/* Hero Section: Ranking Estelar */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Ranking Card */}
                    <div className="lg:col-span-2 bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-50 group-hover:opacity-100 transition-opacity"></div>

                        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 h-full">
                            <div className="text-left space-y-2 flex-1">
                                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
                                    Tu Posición Global
                                </span>
                                <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tight">
                                    #{rankingInfo.puesto}
                                    <span className="text-2xl md:text-3xl text-slate-400 font-medium ml-2">/ {rankingInfo.total}</span>
                                </h1>
                                <p className="text-slate-500 font-medium text-lg">
                                    {rankingInfo.percentil > 80
                                        ? "¡Estás en la cima! Superior a la mayoría."
                                        : rankingInfo.percentil > 50
                                            ? "Buen trabajo, estás por encima del promedio."
                                            : "Tienes oportunidad de escalar posiciones."}
                                </p>
                            </div>

                            {/* Circular Progress Indicador de Percentil */}
                            <div className="relative w-40 h-40 flex-shrink-0">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle
                                        cx="80" cy="80" r="70"
                                        stroke="currentColor" strokeWidth="12" fill="transparent"
                                        className="text-slate-100"
                                    />
                                    <circle
                                        cx="80" cy="80" r="70"
                                        stroke="currentColor" strokeWidth="12" fill="transparent"
                                        strokeDasharray={440}
                                        strokeDashoffset={440 - (440 * rankingInfo.percentil) / 100}
                                        className={`text-${rankingInfo.percentil > 80 ? 'emerald' : rankingInfo.percentil > 50 ? 'blue' : 'amber'}-500 transition-all duration-1000 ease-out`}
                                        strokeLinecap="round"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-3xl font-bold text-slate-800">{rankingInfo.percentil}%</span>
                                    <span className="text-[10px] uppercase font-bold text-slate-400">Mejor que</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* KPI Vertical Stack */}
                    <div className="space-y-6">
                        <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-3xl p-6 text-white shadow-lg shadow-blue-600/20 flex flex-col justify-between h-full relative overflow-hidden">
                            <div className="absolute inset-0 bg-[url('/assets/noise.png')] opacity-10 mix-blend-overlay"></div>
                            <div className="relative z-10">
                                <p className="text-blue-100 text-sm font-medium uppercase tracking-wider mb-1">Puntaje Global</p>
                                <div className="text-6xl font-black tracking-tight">{estudiante.puntaje_global}</div>
                            </div>
                            <div className="relative z-10 mt-4 pt-4 border-t border-white/20">
                                <p className="text-sm font-medium text-blue-100">
                                    Meta sugerida: <span className="text-white font-bold">{Math.min(500, estudiante.puntaje_global + 30)}</span> pts
                                </p>
                            </div>
                        </div>
                    </div>
                    {/* Top Leads (Mini Leaderboard) */}
                    <div className="bg-white rounded-3xl p-6 shadow-lg shadow-slate-200/50 border border-slate-100 flex flex-col h-full overflow-hidden">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <span>🏆</span> Top 5 Estudiantes
                        </h3>
                        <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
                            {todos
                                .sort((a, b) => b.puntaje_global - a.puntaje_global)
                                .slice(0, 5)
                                .map((est, index) => {
                                    const isMe = est.informacion_personal.numero_identificacion === estudiante.informacion_personal.numero_identificacion;
                                    return (
                                        <div key={index} className={`flex items-center justify-between p-3 rounded-xl border ${isMe ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-slate-100'}`}>
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${index === 0 ? 'bg-yellow-100 text-yellow-700' :
                                                    index === 1 ? 'bg-gray-200 text-gray-700' :
                                                        index === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-200 text-slate-500'
                                                    }`}>
                                                    {index + 1}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className={`text-xs font-bold ${isMe ? 'text-indigo-900' : 'text-slate-700'}`}>
                                                        {est.informacion_personal.nombres.split(' ')[0]} {est.informacion_personal.apellidos.split(' ')[0]}
                                                    </span>
                                                    {isMe && <span className="text-[10px] text-indigo-500 font-bold">¡Tú!</span>}
                                                </div>
                                            </div>
                                            <span className="text-sm font-black text-slate-800">{est.puntaje_global}</span>
                                        </div>
                                    )
                                })
                            }
                        </div>
                    </div>
                </div>

                {/* Radar Chart Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-1 bg-white rounded-3xl p-8 shadow-lg shadow-slate-200/50 border border-slate-100 flex flex-col items-center justify-center">
                        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2 place-self-start">
                            <span className="w-1.5 h-6 bg-blue-500 rounded-full"></span>
                            Mapa de Habilidades
                        </h3>
                        <div className="h-[300px] w-full relative">
                            {/* @ts-ignore */}
                            {radarData && <Radar data={radarData} options={radarOptions} />}
                        </div>
                    </div>

                    {/* Tabla de Métricas Avanzadas */}
                    <div className="md:col-span-2 bg-white rounded-3xl shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden">
                        <div className="p-8 border-b border-slate-100">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <span className="w-1.5 h-6 bg-indigo-500 rounded-full"></span>
                                Desglose por Competencia
                            </h3>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50 text-xs uppercase text-slate-500 font-semibold tracking-wider">
                                        <th className="p-6">Área</th>
                                        <th className="p-6 text-center">Puntaje</th>
                                        <th className="p-6 text-center">Nivel</th>
                                        <th className="p-6 w-1/3">Brecha al Siguiente Nivel</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {materiasConfig.map(materia => {
                                        const puntaje = estudiante.puntajes[materia.key]?.puntaje || 0;
                                        const analisis = ANALIZAR_DESEMPENO(materia.key, puntaje);

                                        return (
                                            <tr key={materia.key} className="hover:bg-slate-50 transition-colors group">
                                                <td className="p-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-sm ${materia.bg} ${materia.text}`}>
                                                            {materia.key === 'matemáticas' && '📐'}
                                                            {materia.key === 'lectura crítica' && '📖'}
                                                            {materia.key === 'sociales y ciudadanas' && '🌍'}
                                                            {materia.key === 'ciencias naturales' && '🔬'}
                                                            {materia.key === 'inglés' && '🇬🇧'}
                                                        </div>
                                                        <span className="font-bold text-slate-700">{materia.label}</span>
                                                    </div>
                                                </td>
                                                <td className="p-6 text-center">
                                                    <span className="text-xl font-black text-slate-800">{puntaje}</span>
                                                </td>
                                                <td className="p-6 text-center">
                                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${analisis.nivel === 4 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                        analisis.nivel === 3 ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                            analisis.nivel === 2 ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                                'bg-red-50 text-red-700 border-red-200'
                                                        }`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${analisis.nivel === 4 ? 'bg-emerald-500' : analisis.nivel === 3 ? 'bg-blue-500' : analisis.nivel === 2 ? 'bg-amber-500' : 'bg-red-500'}`}></span>
                                                        {analisis.etiqueta}
                                                    </span>
                                                </td>
                                                <td className="p-6">
                                                    <div className="flex flex-col gap-1.5">
                                                        <div className="flex justify-between text-xs font-medium text-slate-500">
                                                            <span>Progreso Nivel</span>
                                                            <span>{analisis.distancia_siguiente_nivel > 0 ? `+${analisis.distancia_siguiente_nivel} pts para subir` : '¡Máximo!'}</span>
                                                        </div>
                                                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full transition-all duration-1000 ease-out ${analisis.nivel === 4 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                                                                style={{ width: `${analisis.performance_relativo}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="text-center pt-8 border-t border-slate-200">
                    <p className="text-slate-400 text-sm font-medium">
                        Seamos Genios 2026 &bull; Análisis de Desempeño Profesional
                    </p>
                </div>
            </div>
        </div>
    );
}
