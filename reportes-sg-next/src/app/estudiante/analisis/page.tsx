'use client';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Modal from '@/components/ui/Modal';
import { motion } from 'framer-motion';
import {
    BarChart,
    ArrowLeft,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    TrendingUp,
    TrendingDown,
    Target,
    Zap,
    Award,
    AlertCircle,
    ChevronRight,
    Flame,
    Shield,
    BookOpen,
    Calculator,
    Globe2,
    Microscope,
    Languages
} from 'lucide-react';
import { Suspense } from 'react';

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
    puntajes: Record<string, Puntaje>;
    respuestas_detalladas: Record<string, RespuestaDetallada[]>;
}

const materias = [
    { key: 'lectura crítica', label: 'Lectura Crítica', color: '#ec4899', gradient: 'from-pink-500 to-rose-600', icon: BookOpen },
    { key: 'matemáticas', label: 'Matemáticas', color: '#3b82f6', gradient: 'from-blue-500 to-indigo-600', icon: Calculator },
    { key: 'sociales y ciudadanas', label: 'Sociales', color: '#f59e0b', gradient: 'from-amber-500 to-orange-600', icon: Globe2 },
    { key: 'ciencias naturales', label: 'Ciencias', color: '#10b981', gradient: 'from-emerald-500 to-teal-600', icon: Microscope },
    { key: 'inglés', label: 'Inglés', color: '#8b5cf6', gradient: 'from-violet-500 to-purple-600', icon: Languages },
];

function normalizeRespuestas(data: any): RespuestaDetallada[] {
    if (!data) return [];
    if (Array.isArray(data)) {
        return data.map(item => ({
            numero: item.numero,
            respuesta_estudiante: item.respuesta_estudiante || item.respuesta || '',
            respuesta_correcta: item.respuesta_correcta || item.correcta || '',
            es_correcta: Boolean(item.es_correcta)
        }));
    }
    if (typeof data === 'object') {
        return Object.entries(data).map(([key, value]: [string, any]) => ({
            numero: parseInt(key, 10),
            respuesta_estudiante: value.respuesta_estudiante || value.respuesta || '',
            respuesta_correcta: value.respuesta_correcta || value.correcta || '',
            es_correcta: Boolean(value.es_correcta)
        })).sort((a, b) => a.numero - b.numero);
    }
    return [];
}

export default function AnalisisRespuestasPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        }>
            <AnalisisContentInternal />
        </Suspense>
    );
}

// Interface para invalidaciones
interface Invalidacion {
    simulacro: string;
    sesion: string;
    numero_pregunta: number;
    materia: string;
    motivo?: string;
}

function AnalisisContentInternal() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [estudiante, setEstudiante] = useState<Estudiante | null>(null);
    const [todosEstudiantes, setTodosEstudiantes] = useState<Estudiante[]>([]);
    const [loading, setLoading] = useState(true);
    const [materiaSeleccionada, setMateriaSeleccionada] = useState('lectura crítica');
    const [invalidaciones, setInvalidaciones] = useState<Invalidacion[]>([]);
    const [preguntaSeleccionada, setPreguntaSeleccionada] = useState<RespuestaDetallada | null>(null);
    const [vistaHeatmap, setVistaHeatmap] = useState(true);

    useEffect(() => {
        const mat = searchParams.get('materia');
        if (mat) {
            setMateriaSeleccionada(decodeURIComponent(mat).toLowerCase());
        }
    }, [searchParams]);

    const loadData = useCallback(async () => {
        const id = localStorage.getItem('student_id');
        if (!id) {
            router.replace('/estudiante');
            return;
        }

        try {
            const targetId = String(id).trim();
            const currentSim = sessionStorage.getItem('simulacro_selected') || 'SG11-09';

            let resEst = await fetch(`/data/simulations/${currentSim}/estudiantes/${targetId}.json?v=${new Date().getTime()}`);
            if (!resEst.ok) {
                resEst = await fetch(`/data/estudiantes/${targetId}.json?v=${new Date().getTime()}`);
            }

            if (resEst.ok) {
                const studentData = await resEst.json();
                setEstudiante(studentData);
            }

            fetch(`/data/simulations/${currentSim}/resultados_finales.json?v=${new Date().getTime()}`)
                .then(r => r.ok ? r.json() : fetch(`/data/resultados_finales.json?v=${new Date().getTime()}`).then(r2 => r2.json()))
                .then(data => {
                    if (data?.estudiantes) {
                        const unicosMap = new Map();
                        data.estudiantes.forEach((e: any) => {
                            const idNum = String(e.informacion_personal.numero_identificacion).trim();
                            if (!unicosMap.has(idNum) || e.puntaje_global > unicosMap.get(idNum).puntaje_global) {
                                unicosMap.set(idNum, e);
                            }
                        });
                        setTodosEstudiantes(Array.from(unicosMap.values()));
                    }
                })
                .catch(err => console.warn("Could not load global stats", err));

            // Cargar invalidaciones
            fetch(`/data/invalidaciones.json?v=${new Date().getTime()}`)
                .then(r => r.ok ? r.json() : null)
                .then(data => {
                    if (data?.invalidaciones) {
                        setInvalidaciones(data.invalidaciones);
                    }
                })
                .catch(err => console.warn("Could not load invalidaciones", err));

        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [router]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Helper para verificar si una pregunta está invalidada
    const esPreguntaInvalidada = useCallback((numeroPregunta: number, materia: string): boolean => {
        // Verificar contra el archivo de invalidaciones
        const currentSim = sessionStorage.getItem('simulacro_selected') || 'SG11-09';
        // Normalizar el nombre del simulacro (SG11-09 -> S11 S-09)
        const simNormalizado = currentSim.replace('SG', 'S').replace('-', ' S-');

        return invalidaciones.some(inv =>
            inv.simulacro === simNormalizado &&
            inv.materia.toLowerCase() === materia.toLowerCase() &&
            inv.numero_pregunta === numeroPregunta
        );
    }, [invalidaciones]);

    // Helper combinado para verificar anulación por cualquier método
    const esAnuladaOInvalidada = useCallback((resp: RespuestaDetallada, materia: string): boolean => {
        // Método 1: Respuesta correcta es X, *, -
        if (['X', '*', '-'].includes(resp.respuesta_correcta)) return true;
        // Método 2: Está en el archivo de invalidaciones
        return esPreguntaInvalidada(resp.numero, materia);
    }, [esPreguntaInvalidada]);

    const respuestasMateria = useMemo(() => {
        if (!estudiante?.respuestas_detalladas) return [];
        return normalizeRespuestas(estudiante.respuestas_detalladas[materiaSeleccionada]);
    }, [estudiante, materiaSeleccionada]);

    // Estadísticas globales por pregunta (para comparar con el grupo)
    const metricasPreguntas = useMemo(() => {
        const stats: Record<number, { A: number, B: number, C: number, D: number, Total: number, correctas: number, correcta: string }> = {};
        if (!todosEstudiantes.length) return stats;

        todosEstudiantes.forEach(est => {
            const resps = normalizeRespuestas(est.respuestas_detalladas?.[materiaSeleccionada]);
            resps.forEach(r => {
                if (!stats[r.numero]) {
                    stats[r.numero] = { A: 0, B: 0, C: 0, D: 0, Total: 0, correctas: 0, correcta: r.respuesta_correcta };
                }
                const opcion = r.respuesta_estudiante.toUpperCase().trim();
                // @ts-ignore
                if (stats[r.numero][opcion] !== undefined) {
                    // @ts-ignore
                    stats[r.numero][opcion]++;
                }
                stats[r.numero].Total++;
                if (r.es_correcta) stats[r.numero].correctas++;
            });
        });

        return stats;
    }, [todosEstudiantes, materiaSeleccionada]);

    // Estadísticas del estudiante
    const estadisticas = useMemo(() => {
        if (!respuestasMateria.length) return { correctas: 0, incorrectas: 0, total: 0, porcentaje: 0 };
        const correctas = respuestasMateria.filter(r => r.es_correcta).length;
        const total = respuestasMateria.length;
        return {
            correctas,
            incorrectas: total - correctas,
            total,
            porcentaje: Math.round((correctas / total) * 100)
        };
    }, [respuestasMateria]);

    // Promedio del grupo
    const promedioGrupo = useMemo(() => {
        if (!todosEstudiantes.length || !respuestasMateria.length) return 0;
        const totalPreguntas = respuestasMateria.length;
        let sumaAciertos = 0;
        todosEstudiantes.forEach(est => {
            const resps = normalizeRespuestas(est.respuestas_detalladas?.[materiaSeleccionada]);
            sumaAciertos += resps.filter(r => r.es_correcta).length;
        });
        return Math.round((sumaAciertos / todosEstudiantes.length / totalPreguntas) * 100);
    }, [todosEstudiantes, materiaSeleccionada, respuestasMateria.length]);

    // Análisis de fortalezas y debilidades - con listas completas
    const analisisPersonal = useMemo(() => {
        if (!respuestasMateria.length || !Object.keys(metricasPreguntas).length) return null;

        const falladas = respuestasMateria.filter(r => !r.es_correcta && !['X', '*', '-'].includes(r.respuesta_correcta) && !esPreguntaInvalidada(r.numero, materiaSeleccionada));
        const acertadas = respuestasMateria.filter(r => r.es_correcta);

        // Lista completa de logros (acertadas difíciles) ordenadas por dificultad ascendente
        const logros = acertadas
            .map(r => {
                const stats = metricasPreguntas[r.numero];
                const pctGrupo = stats && stats.Total > 0 ? Math.round((stats.correctas / stats.Total) * 100) : 50;
                return { ...r, pctGrupo };
            })
            .filter(r => r.pctGrupo < 60) // Solo las que menos del 60% acertó
            .sort((a, b) => a.pctGrupo - b.pctGrupo); // Más difíciles primero

        // Lista completa para repasar (falladas fáciles) ordenadas por dificultad descendente
        const paraRepasar = falladas
            .map(r => {
                const stats = metricasPreguntas[r.numero];
                const pctGrupo = stats && stats.Total > 0 ? Math.round((stats.correctas / stats.Total) * 100) : 50;
                return { ...r, pctGrupo };
            })
            .sort((a, b) => b.pctGrupo - a.pctGrupo); // Más fáciles primero (las que más debiste acertar)

        return {
            logros,
            paraRepasar,
            totalFalladas: falladas.length,
            totalAcertadas: acertadas.length
        };
    }, [respuestasMateria, metricasPreguntas, esPreguntaInvalidada, materiaSeleccionada]);

    // Estados para expandir las listas
    const [mostrarLogros, setMostrarLogros] = useState(false);
    const [mostrarRepasar, setMostrarRepasar] = useState(false);


    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!estudiante) return null;

    const materiaActual = materias.find(m => m.key === materiaSeleccionada);
    const statsSelected = preguntaSeleccionada ? metricasPreguntas[preguntaSeleccionada.numero] : null;
    const diferencia = estadisticas.porcentaje - promedioGrupo;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white font-sans pb-20 relative">
            {/* Efectos de fondo */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-40 right-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            {/* Header */}
            <motion.nav
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="bg-slate-900/80 backdrop-blur-xl sticky top-0 z-40 border-b border-white/10"
            >
                <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${materiaActual?.gradient} flex items-center justify-center shadow-lg text-white`}>
                            {materiaActual && <materiaActual.icon className="w-5 h-5" />}
                        </div>
                        <div>
                            <h1 className="text-sm font-bold text-white leading-none mb-0.5">Análisis de Respuestas</h1>
                            <p className="text-[10px] uppercase font-bold text-white/40 tracking-wider">{materiaActual?.label}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => router.push('/estudiante/dashboard')}
                        className="p-2.5 hover:bg-white/10 rounded-xl transition-colors text-white/60 hover:text-white"
                    >
                        <ArrowLeft size={20} />
                    </button>
                </div>
            </motion.nav>

            <main className="max-w-6xl mx-auto px-4 py-6 relative z-10">

                {/* Selector de Materias */}
                <div className="flex flex-wrap gap-2 mb-6 justify-center">
                    {materias.map((materia) => (
                        <motion.button
                            key={materia.key}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setMateriaSeleccionada(materia.key)}
                            className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all border flex items-center gap-2.5 ${materiaSeleccionada === materia.key
                                ? `bg-gradient-to-r ${materia.gradient} text-white border-transparent shadow-lg`
                                : 'bg-white/5 text-white/60 border-white/10 hover:border-white/20 hover:text-white'
                                }`}
                        >
                            <materia.icon className="w-4 h-4" />
                            <span className="hidden sm:inline">{materia.label}</span>
                        </motion.button>
                    ))}
                </div>

                {/* KPI Cards Premium */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                    {/* Tu Efectividad */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative overflow-hidden bg-gradient-to-br from-emerald-500/20 to-teal-500/10 backdrop-blur-xl rounded-2xl border border-emerald-500/30 p-4 group"
                    >
                        <div className="absolute -right-4 -top-4 w-16 h-16 bg-emerald-400/20 rounded-full blur-xl"></div>
                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Tu Efectividad</span>
                        <p className="text-3xl font-black text-white mt-1">{estadisticas.porcentaje}%</p>
                        <p className="text-[10px] text-white/40 mt-1">{estadisticas.correctas}/{estadisticas.total} correctas</p>
                        <CheckCircle2 className="absolute right-3 top-3 w-5 h-5 text-emerald-400/30" />
                    </motion.div>

                    {/* Promedio Grupo */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="relative overflow-hidden bg-gradient-to-br from-blue-500/20 to-indigo-500/10 backdrop-blur-xl rounded-2xl border border-blue-500/30 p-4 group"
                    >
                        <div className="absolute -right-4 -top-4 w-16 h-16 bg-blue-400/20 rounded-full blur-xl"></div>
                        <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Promedio Grupo</span>
                        <p className="text-3xl font-black text-white mt-1">{promedioGrupo}%</p>
                        <p className="text-[10px] text-white/40 mt-1">{todosEstudiantes.length} estudiantes</p>
                        <Target className="absolute right-3 top-3 w-5 h-5 text-blue-400/30" />
                    </motion.div>

                    {/* vs Promedio */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className={`relative overflow-hidden backdrop-blur-xl rounded-2xl border p-4 group ${diferencia >= 0
                            ? 'bg-gradient-to-br from-cyan-500/20 to-emerald-500/10 border-cyan-500/30'
                            : 'bg-gradient-to-br from-rose-500/20 to-orange-500/10 border-rose-500/30'
                            }`}
                    >
                        <div className={`absolute -right-4 -top-4 w-16 h-16 ${diferencia >= 0 ? 'bg-cyan-400/20' : 'bg-rose-400/20'} rounded-full blur-xl`}></div>
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${diferencia >= 0 ? 'text-cyan-400' : 'text-rose-400'}`}>vs Promedio</span>
                        <p className={`text-3xl font-black mt-1 ${diferencia >= 0 ? 'text-cyan-400' : 'text-rose-400'}`}>
                            {diferencia >= 0 ? '+' : ''}{diferencia}%
                        </p>
                        <p className="text-[10px] text-white/40 mt-1">{diferencia >= 0 ? 'Por encima' : 'Por debajo'}</p>
                        {diferencia >= 0 ? <TrendingUp className="absolute right-3 top-3 w-5 h-5 text-cyan-400/30" /> : <TrendingDown className="absolute right-3 top-3 w-5 h-5 text-rose-400/30" />}
                    </motion.div>

                    {/* Puntaje */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className={`relative overflow-hidden bg-gradient-to-br ${materiaActual?.gradient.replace('from-', 'from-').replace('to-', 'to-')}/20 backdrop-blur-xl rounded-2xl border border-white/20 p-4 group`}
                    >
                        <div className="absolute -right-4 -top-4 w-16 h-16 bg-white/10 rounded-full blur-xl"></div>
                        <span className="text-[10px] font-bold text-white/60 uppercase tracking-wider">Puntaje ICFES</span>
                        <p className="text-3xl font-black text-white mt-1">{estudiante.puntajes[materiaSeleccionada]?.puntaje || 0}</p>
                        <p className="text-[10px] text-white/40 mt-1">de 100 puntos</p>
                        <Award className="absolute right-3 top-3 w-5 h-5 text-white/20" />
                    </motion.div>
                </div>

                {/* Insights Personalizados */}
                {analisisPersonal && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="space-y-3 mb-6"
                    >
                        {/* Lista de Mejores Logros - Expandible */}
                        {analisisPersonal.logros.length > 0 && (
                            <div className="bg-gradient-to-r from-emerald-500/10 to-transparent backdrop-blur-xl rounded-2xl border border-emerald-500/20 overflow-hidden">
                                <button
                                    onClick={() => setMostrarLogros(!mostrarLogros)}
                                    className="w-full p-4 flex items-center justify-between hover:bg-emerald-500/5 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                                            <Zap className="w-6 h-6" />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">🎯 Tus Mejores Logros</p>
                                            <p className="text-white font-bold">{analisisPersonal.logros.length} preguntas difíciles que acertaste</p>
                                        </div>
                                    </div>
                                    <div className={`w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 transition-transform ${mostrarLogros ? 'rotate-180' : ''}`}>
                                        <ChevronRight className="w-4 h-4 rotate-90" />
                                    </div>
                                </button>

                                {/* Lista expandida mejorada */}
                                {mostrarLogros && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        className="border-t border-emerald-500/10"
                                    >
                                        {/* Resumen superior */}
                                        <div className="px-4 py-3 bg-emerald-500/5 border-b border-emerald-500/10">
                                            <div className="flex flex-wrap gap-3 text-xs">
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-2.5 h-2.5 rounded-full bg-purple-500"></div>
                                                    <span className="text-white/60">Muy difíciles (&lt;30%):</span>
                                                    <span className="text-purple-400 font-bold">{analisisPersonal.logros.filter(q => q.pctGrupo < 30).length}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-2.5 h-2.5 rounded-full bg-cyan-500"></div>
                                                    <span className="text-white/60">Difíciles (30-50%):</span>
                                                    <span className="text-cyan-400 font-bold">{analisisPersonal.logros.filter(q => q.pctGrupo >= 30 && q.pctGrupo < 50).length}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                                                    <span className="text-white/60">Moderadas:</span>
                                                    <span className="text-emerald-400 font-bold">{analisisPersonal.logros.filter(q => q.pctGrupo >= 50).length}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-3 space-y-2 max-h-80 overflow-y-auto">
                                            {analisisPersonal.logros.map((q, idx) => {
                                                const esMuyDificil = q.pctGrupo < 30;
                                                const esDificil = q.pctGrupo >= 30 && q.pctGrupo < 50;

                                                return (
                                                    <motion.button
                                                        key={q.numero}
                                                        initial={{ opacity: 0, x: -20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: idx * 0.03 }}
                                                        onClick={() => setPreguntaSeleccionada(q)}
                                                        className={`w-full rounded-xl overflow-hidden border transition-all group ${esMuyDificil
                                                            ? 'bg-purple-500/5 border-purple-500/20 hover:border-purple-500/50 hover:bg-purple-500/10'
                                                            : esDificil
                                                                ? 'bg-cyan-500/5 border-cyan-500/20 hover:border-cyan-500/50 hover:bg-cyan-500/10'
                                                                : 'bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/50 hover:bg-emerald-500/10'
                                                            }`}
                                                    >
                                                        <div className="p-3">
                                                            <div className="flex items-start gap-3">
                                                                {/* Número de pregunta */}
                                                                <div className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center flex-shrink-0 ${esMuyDificil ? 'bg-purple-500' : esDificil ? 'bg-cyan-500' : 'bg-emerald-500'
                                                                    }`}>
                                                                    <span className="text-white font-bold text-sm">{q.numero}</span>
                                                                </div>

                                                                {/* Info principal */}
                                                                <div className="flex-1 min-w-0 text-left">
                                                                    <div className="flex items-center gap-2 mb-1.5">
                                                                        {/* Tag de dificultad */}
                                                                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${esMuyDificil
                                                                            ? 'bg-purple-500/20 text-purple-400'
                                                                            : esDificil
                                                                                ? 'bg-cyan-500/20 text-cyan-400'
                                                                                : 'bg-emerald-500/20 text-emerald-400'
                                                                            }`}>
                                                                            {esMuyDificil ? '💎 Difícil' : esDificil ? '🎯 Difícil' : '✨ Logro'}
                                                                        </span>
                                                                        <span className="text-emerald-400 text-[9px] font-bold">🏆 ¡Acertaste!</span>
                                                                    </div>

                                                                    {/* Barra de porcentaje invertida */}
                                                                    <div className="mb-2">
                                                                        <div className="flex items-center justify-between text-[10px] mb-1">
                                                                            <span className="text-white/50">% del grupo que acertó</span>
                                                                            <span className={`font-bold ${esMuyDificil ? 'text-purple-400' : esDificil ? 'text-cyan-400' : 'text-emerald-400'}`}>{q.pctGrupo}%</span>
                                                                        </div>
                                                                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                                            <div
                                                                                className={`h-full rounded-full transition-all ${esMuyDificil ? 'bg-purple-500' : esDificil ? 'bg-cyan-500' : 'bg-emerald-500'
                                                                                    }`}
                                                                                style={{ width: `${q.pctGrupo}%` }}
                                                                            />
                                                                        </div>
                                                                    </div>

                                                                    {/* Respuesta */}
                                                                    <div className="flex items-center gap-2 text-xs">
                                                                        <span className="text-white/40">Tu respuesta correcta:</span>
                                                                        <span className="w-6 h-6 rounded bg-emerald-500/30 text-emerald-300 flex items-center justify-center font-bold">{q.respuesta_correcta}</span>
                                                                    </div>
                                                                </div>

                                                                {/* Chevron */}
                                                                <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/60 transition-colors flex-shrink-0 mt-3" />
                                                            </div>
                                                        </div>
                                                    </motion.button>
                                                );
                                            })}
                                        </div>

                                        {/* Footer con tip */}
                                        <div className="px-4 py-2 bg-gradient-to-r from-emerald-500/10 to-transparent border-t border-emerald-500/10">
                                            <p className="text-[10px] text-emerald-400/70 flex items-center gap-1.5">
                                                <Award className="w-3 h-3" />
                                                <span>¡Excelente! Acertaste preguntas que la mayoría falló - muestra <strong className="text-emerald-400">dominio del tema</strong></span>
                                            </p>
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        )}

                        {/* Lista de Preguntas para Repasar - Expandible */}
                        {analisisPersonal.paraRepasar.length > 0 && (
                            <div className="bg-gradient-to-r from-amber-500/10 to-transparent backdrop-blur-xl rounded-2xl border border-amber-500/20 overflow-hidden">
                                <button
                                    onClick={() => setMostrarRepasar(!mostrarRepasar)}
                                    className="w-full p-4 flex items-center justify-between hover:bg-amber-500/5 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400">
                                            <AlertCircle className="w-6 h-6" />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">⚠️ Para Repasar</p>
                                            <p className="text-white font-bold">{analisisPersonal.paraRepasar.length} preguntas que deberías revisar</p>
                                        </div>
                                    </div>
                                    <div className={`w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 transition-transform ${mostrarRepasar ? 'rotate-180' : ''}`}>
                                        <ChevronRight className="w-4 h-4 rotate-90" />
                                    </div>
                                </button>

                                {/* Lista expandida mejorada */}
                                {mostrarRepasar && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        className="border-t border-amber-500/10"
                                    >
                                        {/* Resumen superior */}
                                        <div className="px-4 py-3 bg-amber-500/5 border-b border-amber-500/10">
                                            <div className="flex flex-wrap gap-3 text-xs">
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div>
                                                    <span className="text-white/60">Fáciles falladas:</span>
                                                    <span className="text-rose-400 font-bold">{analisisPersonal.paraRepasar.filter(q => q.pctGrupo >= 60).length}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                                                    <span className="text-white/60">Medias falladas:</span>
                                                    <span className="text-amber-400 font-bold">{analisisPersonal.paraRepasar.filter(q => q.pctGrupo >= 40 && q.pctGrupo < 60).length}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-2.5 h-2.5 rounded-full bg-purple-500"></div>
                                                    <span className="text-white/60">Difíciles:</span>
                                                    <span className="text-purple-400 font-bold">{analisisPersonal.paraRepasar.filter(q => q.pctGrupo < 40).length}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-3 space-y-2 max-h-80 overflow-y-auto">
                                            {analisisPersonal.paraRepasar.map((q, idx) => {
                                                const esFacil = q.pctGrupo >= 60;
                                                const esMedia = q.pctGrupo >= 40 && q.pctGrupo < 60;
                                                const esDificil = q.pctGrupo < 40;

                                                return (
                                                    <motion.button
                                                        key={q.numero}
                                                        initial={{ opacity: 0, x: -20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: idx * 0.03 }}
                                                        onClick={() => setPreguntaSeleccionada(q)}
                                                        className={`w-full rounded-xl overflow-hidden border transition-all group ${esFacil
                                                            ? 'bg-rose-500/5 border-rose-500/20 hover:border-rose-500/50 hover:bg-rose-500/10'
                                                            : esMedia
                                                                ? 'bg-amber-500/5 border-amber-500/20 hover:border-amber-500/50 hover:bg-amber-500/10'
                                                                : 'bg-purple-500/5 border-purple-500/20 hover:border-purple-500/50 hover:bg-purple-500/10'
                                                            }`}
                                                    >
                                                        <div className="p-3">
                                                            <div className="flex items-start gap-3">
                                                                {/* Número de pregunta */}
                                                                <div className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center flex-shrink-0 ${esFacil ? 'bg-rose-500' : esMedia ? 'bg-amber-500' : 'bg-purple-600'
                                                                    }`}>
                                                                    <span className="text-white font-bold text-sm">{q.numero}</span>
                                                                </div>

                                                                {/* Info principal */}
                                                                <div className="flex-1 min-w-0 text-left">
                                                                    <div className="flex items-center gap-2 mb-1.5">
                                                                        {/* Tag de prioridad */}
                                                                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${esFacil
                                                                            ? 'bg-rose-500/20 text-rose-400'
                                                                            : esMedia
                                                                                ? 'bg-amber-500/20 text-amber-400'
                                                                                : 'bg-purple-500/20 text-purple-400'
                                                                            }`}>
                                                                            {esFacil ? '🔥 Prioritaria' : esMedia ? '⚡ Media' : '💡 Difícil'}
                                                                        </span>
                                                                    </div>

                                                                    {/* Barra de porcentaje */}
                                                                    <div className="mb-2">
                                                                        <div className="flex items-center justify-between text-[10px] mb-1">
                                                                            <span className="text-white/50">% del grupo que acertó</span>
                                                                            <span className={`font-bold ${esFacil ? 'text-rose-400' : esMedia ? 'text-amber-400' : 'text-purple-400'}`}>{q.pctGrupo}%</span>
                                                                        </div>
                                                                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                                            <div
                                                                                className={`h-full rounded-full transition-all ${esFacil ? 'bg-rose-500' : esMedia ? 'bg-amber-500' : 'bg-purple-500'
                                                                                    }`}
                                                                                style={{ width: `${q.pctGrupo}%` }}
                                                                            />
                                                                        </div>
                                                                    </div>

                                                                    {/* Respuestas */}
                                                                    <div className="flex items-center gap-3 text-xs">
                                                                        <div className="flex items-center gap-1.5">
                                                                            <span className="text-white/40">Tu respuesta:</span>
                                                                            <span className="w-6 h-6 rounded bg-rose-500/30 text-rose-300 flex items-center justify-center font-bold">{q.respuesta_estudiante}</span>
                                                                        </div>
                                                                        <div className="text-white/20">→</div>
                                                                        <div className="flex items-center gap-1.5">
                                                                            <span className="text-white/40">Correcta:</span>
                                                                            <span className="w-6 h-6 rounded bg-emerald-500/30 text-emerald-300 flex items-center justify-center font-bold">{q.respuesta_correcta}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Chevron */}
                                                                <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/60 transition-colors flex-shrink-0 mt-3" />
                                                            </div>
                                                        </div>
                                                    </motion.button>
                                                );
                                            })}
                                        </div>

                                        {/* Footer con tip */}
                                        <div className="px-4 py-2 bg-gradient-to-r from-amber-500/10 to-transparent border-t border-amber-500/10">
                                            <p className="text-[10px] text-amber-400/70 flex items-center gap-1.5">
                                                <Zap className="w-3 h-3" />
                                                <span>Prioriza las preguntas <strong className="text-amber-400">fáciles</strong> que fallaste - son puntos recuperables rápidamente</span>
                                            </p>
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        )}
                    </motion.div>
                )}

                {/* Toggle Vista */}
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-bold flex items-center gap-2">
                        <BarChart className="w-4 h-4 text-white/40" />
                        {vistaHeatmap ? 'Mapa de Respuestas' : 'Lista Detallada'}
                    </h3>
                    <div className="flex bg-white/5 rounded-lg p-1 border border-white/10">
                        <button
                            onClick={() => setVistaHeatmap(true)}
                            className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${vistaHeatmap ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'}`}
                        >
                            Heatmap
                        </button>
                        <button
                            onClick={() => setVistaHeatmap(false)}
                            className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${!vistaHeatmap ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'}`}
                        >
                            Lista
                        </button>
                    </div>
                </div>

                {/* Vista Heatmap - Segmentado por Sesiones ICFES */}
                {vistaHeatmap ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-4 mb-6"
                    >
                        {/* Segmentar por sesiones según la materia */}
                        {(() => {
                            // Configuración de sesiones por materia (usando numeración GLOBAL del examen)
                            type SesionConfig = { s1: { start: number; end: number } | null; s2: { start: number; end: number } | null };
                            const sesionesConfig: Record<string, SesionConfig> = {
                                'matemáticas': { s1: { start: 1, end: 25 }, s2: { start: 26, end: 50 } },
                                'lectura crítica': { s1: { start: 26, end: 66 }, s2: null }, // Única sesión (S1)
                                'sociales y ciudadanas': { s1: { start: 67, end: 91 }, s2: { start: 1, end: 25 } },
                                'ciencias naturales': { s1: { start: 92, end: 120 }, s2: { start: 51, end: 79 } },
                                'inglés': { s1: null, s2: { start: 80, end: 134 } }, // Única sesión (S2)
                            };

                            const config = sesionesConfig[materiaSeleccionada] || { s1: { start: 1, end: 25 }, s2: { start: 26, end: 50 } };

                            // Separar respuestas por sesión
                            const sesion1 = config.s1
                                ? respuestasMateria.filter(r => r.numero >= config.s1!.start && r.numero <= config.s1!.end)
                                : [];
                            const sesion2 = config.s2
                                ? respuestasMateria.filter(r => r.numero >= config.s2!.start && r.numero <= config.s2!.end)
                                : [];

                            // Función para renderizar cada celda
                            const renderCell = (resp: RespuestaDetallada) => {
                                const esAnulada = esAnuladaOInvalidada(resp, materiaSeleccionada);
                                const stats = metricasPreguntas[resp.numero];
                                const dificultad = stats ? Math.round((stats.correctas / stats.Total) * 100) : 50;

                                let bgColor = 'bg-emerald-500';
                                let borderColor = 'border-emerald-400/30';
                                let shadowColor = 'shadow-emerald-500/20';

                                if (esAnulada) {
                                    bgColor = 'bg-slate-500';
                                    borderColor = 'border-slate-400/30';
                                    shadowColor = 'shadow-slate-500/20';
                                } else if (!resp.es_correcta) {
                                    if (dificultad < 40) {
                                        bgColor = 'bg-amber-500';
                                        borderColor = 'border-amber-400/30';
                                        shadowColor = 'shadow-amber-500/20';
                                    } else {
                                        bgColor = 'bg-rose-500';
                                        borderColor = 'border-rose-400/30';
                                        shadowColor = 'shadow-rose-500/20';
                                    }
                                }

                                return (
                                    <motion.button
                                        key={resp.numero}
                                        whileHover={{ scale: 1.15, zIndex: 10 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => setPreguntaSeleccionada(resp)}
                                        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg ${bgColor} ${borderColor} border flex items-center justify-center text-[10px] sm:text-xs font-bold text-white shadow-md ${shadowColor} hover:shadow-lg transition-all cursor-pointer relative group`}
                                    >
                                        {resp.numero}
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 rounded text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 border border-white/10">
                                            {resp.es_correcta ? '✅ Correcta' : esAnulada ? '⚫ Anulada' : `❌ Incorrecta (${dificultad}% acertó)`}
                                        </div>
                                    </motion.button>
                                );
                            };

                            // Función para renderizar sesión
                            const renderSession = (respuestas: RespuestaDetallada[], sesionLabel: string, sesionDesc: string, colorAccent: string) => {
                                if (respuestas.length === 0) return null;

                                const correctas = respuestas.filter(r => r.es_correcta).length;
                                const anuladas = respuestas.filter(r => esAnuladaOInvalidada(r, materiaSeleccionada)).length;
                                const total = respuestas.length - anuladas;
                                const pct = total > 0 ? Math.round((correctas / total) * 100) : 0;

                                const first = respuestas[0]?.numero || 0;
                                const last = respuestas[respuestas.length - 1]?.numero || 0;

                                return (
                                    <div key={sesionLabel} className={`bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden`}>
                                        {/* Header de sesión */}
                                        <div className={`px-4 py-2.5 border-b border-white/10 bg-gradient-to-r ${colorAccent} to-transparent`}>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white font-bold text-xs">
                                                        {sesionLabel}
                                                    </div>
                                                    <div>
                                                        <h4 className="text-white font-bold text-sm">{sesionDesc}</h4>
                                                        <p className="text-white/40 text-[10px]">Preguntas {first} - {last}</p>
                                                    </div>
                                                </div>
                                                <div className={`px-2.5 py-1 rounded-lg text-xs font-bold ${pct >= 70 ? 'bg-emerald-500/20 text-emerald-400' : pct >= 50 ? 'bg-amber-500/20 text-amber-400' : 'bg-rose-500/20 text-rose-400'}`}>
                                                    {correctas}/{total} ({pct}%)
                                                </div>
                                            </div>
                                        </div>

                                        {/* Grid de respuestas */}
                                        <div className="p-3">
                                            <div className="flex flex-wrap gap-1.5">
                                                {respuestas.map(renderCell)}
                                            </div>
                                        </div>
                                    </div>
                                );
                            };

                            // Determinar etiquetas según la materia
                            const esUnicaSesion = !config.s1 || !config.s2;
                            const esIngles = materiaSeleccionada === 'inglés';

                            return (
                                <>
                                    {sesion1.length > 0 && renderSession(
                                        sesion1,
                                        esUnicaSesion ? 'S1' : 'S1',
                                        esUnicaSesion ? 'Sesión Única' : 'Primera Jornada',
                                        'from-blue-500/20'
                                    )}
                                    {sesion2.length > 0 && renderSession(
                                        sesion2,
                                        esIngles && esUnicaSesion ? 'S2' : 'S2',
                                        esIngles && esUnicaSesion ? 'Sesión Única' : 'Segunda Jornada',
                                        'from-purple-500/20'
                                    )}
                                </>
                            );
                        })()}

                        {/* Leyenda compacta */}
                        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 px-4 py-3">
                            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
                                <div className="flex items-center gap-2 text-xs text-white/70">
                                    <div className="w-4 h-4 rounded bg-emerald-500 shadow-sm"></div>
                                    <span>Correcta</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-white/70">
                                    <div className="w-4 h-4 rounded bg-rose-500 shadow-sm"></div>
                                    <span>Incorrecta (fácil)</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-white/70">
                                    <div className="w-4 h-4 rounded bg-amber-500 shadow-sm"></div>
                                    <span>Incorrecta (difícil)</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-white/70">
                                    <div className="w-4 h-4 rounded bg-slate-500 shadow-sm"></div>
                                    <span>Anulada</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    /* Vista Lista */
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-4 mb-6"
                    >
                        {/* Usar la misma configuración de sesiones */}
                        {(() => {
                            type SesionConfig = { s1: { start: number; end: number } | null; s2: { start: number; end: number } | null };
                            const sesionesConfig: Record<string, SesionConfig> = {
                                'matemáticas': { s1: { start: 1, end: 25 }, s2: { start: 26, end: 50 } },
                                'lectura crítica': { s1: { start: 26, end: 66 }, s2: null },
                                'sociales y ciudadanas': { s1: { start: 67, end: 91 }, s2: { start: 1, end: 25 } },
                                'ciencias naturales': { s1: { start: 92, end: 120 }, s2: { start: 51, end: 79 } },
                                'inglés': { s1: null, s2: { start: 80, end: 134 } },
                            };

                            const config = sesionesConfig[materiaSeleccionada] || { s1: { start: 1, end: 25 }, s2: { start: 26, end: 50 } };

                            const sesion1 = config.s1
                                ? respuestasMateria.filter(r => r.numero >= config.s1!.start && r.numero <= config.s1!.end)
                                : [];
                            const sesion2 = config.s2
                                ? respuestasMateria.filter(r => r.numero >= config.s2!.start && r.numero <= config.s2!.end)
                                : [];

                            const renderListSession = (respuestas: RespuestaDetallada[], sesionLabel: string, sesionDesc: string, colorAccent: string) => {
                                if (respuestas.length === 0) return null;

                                const correctas = respuestas.filter(r => r.es_correcta).length;
                                const anuladas = respuestas.filter(r => esAnuladaOInvalidada(r, materiaSeleccionada)).length;
                                const total = respuestas.length - anuladas;
                                const pct = total > 0 ? Math.round((correctas / total) * 100) : 0;
                                const first = respuestas[0]?.numero || 0;
                                const last = respuestas[respuestas.length - 1]?.numero || 0;

                                return (
                                    <div key={sesionLabel} className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
                                        {/* Header de sesión */}
                                        <div className={`px-4 py-3 border-b border-white/10 bg-gradient-to-r ${colorAccent} to-transparent`}>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white font-bold text-xs">
                                                        {sesionLabel}
                                                    </div>
                                                    <div>
                                                        <h4 className="text-white font-bold text-sm">{sesionDesc}</h4>
                                                        <p className="text-white/40 text-[10px]">Preguntas {first} - {last}</p>
                                                    </div>
                                                </div>
                                                <div className={`px-2.5 py-1 rounded-lg text-xs font-bold ${pct >= 70 ? 'bg-emerald-500/20 text-emerald-400' : pct >= 50 ? 'bg-amber-500/20 text-amber-400' : 'bg-rose-500/20 text-rose-400'}`}>
                                                    {correctas}/{total} ({pct}%)
                                                </div>
                                            </div>
                                        </div>

                                        {/* Tabla de respuestas */}
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="bg-white/5 text-white/40 text-[10px] uppercase font-bold tracking-wider border-b border-white/10">
                                                        <th className="py-2.5 px-4 text-left w-16">#</th>
                                                        <th className="py-2.5 px-4 text-center">Tu Resp.</th>
                                                        <th className="py-2.5 px-4 text-center">Correcta</th>
                                                        <th className="py-2.5 px-4 text-center">Estado</th>
                                                        <th className="py-2.5 px-4 text-center hidden sm:table-cell">% Grupo</th>
                                                        <th className="py-2.5 px-4 text-right"></th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-white/5">
                                                    {respuestas.map((resp, idx) => {
                                                        const esAnulada = esAnuladaOInvalidada(resp, materiaSeleccionada);
                                                        const stats = metricasPreguntas[resp.numero];
                                                        const pctGrupo = stats ? Math.round((stats.correctas / stats.Total) * 100) : 0;

                                                        return (
                                                            <motion.tr
                                                                key={resp.numero}
                                                                initial={{ opacity: 0 }}
                                                                animate={{ opacity: 1 }}
                                                                transition={{ delay: idx * 0.02 }}
                                                                onClick={() => setPreguntaSeleccionada(resp)}
                                                                className="group hover:bg-white/5 cursor-pointer transition-colors"
                                                            >
                                                                <td className="py-2.5 px-4 font-bold text-white/40 group-hover:text-white">{resp.numero}</td>
                                                                <td className="py-2.5 px-4 text-center">
                                                                    <span className={`inline-flex w-7 h-7 items-center justify-center rounded-lg font-bold text-xs ${resp.es_correcta ? 'bg-emerald-500 text-white' : esAnulada ? 'bg-slate-500/50 text-white/50' : 'bg-rose-500 text-white'}`}>
                                                                        {resp.respuesta_estudiante || '-'}
                                                                    </span>
                                                                </td>
                                                                <td className="py-2.5 px-4 text-center">
                                                                    {esAnulada ? (
                                                                        <span className="text-white/30">-</span>
                                                                    ) : (
                                                                        <span className="font-bold text-white/70 bg-white/10 px-2 py-0.5 rounded text-xs">{resp.respuesta_correcta}</span>
                                                                    )}
                                                                </td>
                                                                <td className="py-2.5 px-4 text-center">
                                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${resp.es_correcta ? 'bg-emerald-500/20 text-emerald-400' : esAnulada ? 'bg-slate-500/20 text-slate-400' : 'bg-rose-500/20 text-rose-400'}`}>
                                                                        {resp.es_correcta ? 'OK' : esAnulada ? 'ANUL' : 'FAIL'}
                                                                    </span>
                                                                </td>
                                                                <td className="py-2.5 px-4 text-center hidden sm:table-cell">
                                                                    {!esAnulada && (
                                                                        <span className={`text-xs font-bold ${pctGrupo >= 60 ? 'text-emerald-400' : pctGrupo >= 40 ? 'text-amber-400' : 'text-rose-400'}`}>
                                                                            {pctGrupo}%
                                                                        </span>
                                                                    )}
                                                                </td>
                                                                <td className="py-2.5 px-4 text-right">
                                                                    <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/60 transition-colors" />
                                                                </td>
                                                            </motion.tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                );
                            };

                            const esUnicaSesion = !config.s1 || !config.s2;
                            const esIngles = materiaSeleccionada === 'inglés';

                            return (
                                <>
                                    {sesion1.length > 0 && renderListSession(
                                        sesion1,
                                        'S1',
                                        esUnicaSesion ? 'Sesión Única' : 'Primera Jornada',
                                        'from-blue-500/20'
                                    )}
                                    {sesion2.length > 0 && renderListSession(
                                        sesion2,
                                        esIngles && esUnicaSesion ? 'S2' : 'S2',
                                        esIngles && esUnicaSesion ? 'Sesión Única' : 'Segunda Jornada',
                                        'from-purple-500/20'
                                    )}
                                </>
                            );
                        })()}
                    </motion.div>
                )}
            </main>

            {/* Modal de Detalle */}
            <Modal
                isOpen={!!preguntaSeleccionada}
                onClose={() => setPreguntaSeleccionada(null)}
                title={`Pregunta #${preguntaSeleccionada?.numero}`}
            >
                {preguntaSeleccionada && (() => {
                    const esInvalidada = esAnuladaOInvalidada(preguntaSeleccionada, materiaSeleccionada);
                    return (
                        <div className="space-y-5">
                            {/* Estado de la respuesta - Premium Dark */}
                            <div className={`p-4 rounded-2xl flex items-center gap-4 ${preguntaSeleccionada.es_correcta ? 'bg-gradient-to-r from-emerald-500/20 to-emerald-500/5 border border-emerald-500/30' :
                                esInvalidada ? 'bg-gradient-to-r from-slate-500/20 to-slate-500/5 border border-slate-500/30' :
                                    'bg-gradient-to-r from-rose-500/20 to-rose-500/5 border border-rose-500/30'
                                }`}>
                                <div className={`p-3 rounded-xl ${preguntaSeleccionada.es_correcta ? 'bg-emerald-500/20 text-emerald-400' :
                                    esInvalidada ? 'bg-slate-500/20 text-slate-400' :
                                        'bg-rose-500/20 text-rose-400'
                                    }`}>
                                    {preguntaSeleccionada.es_correcta ? <CheckCircle2 size={28} /> :
                                        esInvalidada ? <AlertTriangle size={28} /> :
                                            <XCircle size={28} />}
                                </div>
                                <div>
                                    <h4 className="font-bold text-lg text-white">
                                        {preguntaSeleccionada.es_correcta ? '¡Correcta!' :
                                            esInvalidada ? 'Pregunta Invalidada' :
                                                'Incorrecta'}
                                    </h4>
                                    <p className="text-sm text-white/60">
                                        {esInvalidada
                                            ? '⚠️ Esta pregunta fue invalidada y no afecta tu puntaje.'
                                            : preguntaSeleccionada.es_correcta
                                                ? '🎯 Has dominado este concepto.'
                                                : `La correcta era ${preguntaSeleccionada.respuesta_correcta}, tú marcaste ${preguntaSeleccionada.respuesta_estudiante}.`
                                        }
                                    </p>
                                </div>
                            </div>

                            {/* Dificultad de la pregunta - Premium Dark */}
                            {statsSelected && !esInvalidada && (
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-xs font-bold text-white/40 uppercase tracking-wider">Dificultad Global</span>
                                        <span className="font-bold text-white tabular-nums">{Math.round((statsSelected.correctas / statsSelected.Total) * 100)}% acertó</span>
                                    </div>
                                    <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(statsSelected.correctas / statsSelected.Total) * 100}%` }}
                                            transition={{ duration: 0.8 }}
                                            className={`h-full rounded-full ${(statsSelected.correctas / statsSelected.Total) >= 0.6 ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' : (statsSelected.correctas / statsSelected.Total) >= 0.4 ? 'bg-gradient-to-r from-amber-500 to-amber-400' : 'bg-gradient-to-r from-rose-500 to-rose-400'}`}
                                        />
                                    </div>
                                    <p className="text-xs text-white/50 mt-3">
                                        {(statsSelected.correctas / statsSelected.Total) < 0.4
                                            ? '🔥 Pregunta difícil - pocos la acertaron'
                                            : (statsSelected.correctas / statsSelected.Total) >= 0.7
                                                ? '✅ Pregunta fácil - la mayoría acertó'
                                                : '⚖️ Pregunta de dificultad media'}
                                    </p>
                                </div>
                            )}

                            {/* Distribución de respuestas - Premium Dark */}
                            {statsSelected && !esInvalidada && (
                                <div>
                                    <h5 className="font-bold text-white/70 mb-4 text-sm flex items-center gap-2">
                                        <BarChart size={16} className="text-purple-400" />
                                        Cómo respondió el grupo
                                    </h5>
                                    <div className="space-y-3">
                                        {['A', 'B', 'C', 'D'].map(opt => {
                                            // @ts-ignore
                                            const count = statsSelected[opt] || 0;
                                            const total = statsSelected.Total || 1;
                                            const pct = Math.round((count / total) * 100);
                                            const isCorrect = opt === preguntaSeleccionada.respuesta_correcta;
                                            const isSelected = opt === preguntaSeleccionada.respuesta_estudiante;

                                            let barColor = 'bg-white/20';
                                            let borderClass = 'border-transparent';
                                            if (isCorrect) {
                                                barColor = 'bg-gradient-to-r from-emerald-500 to-emerald-400';
                                                borderClass = 'border-emerald-500/30';
                                            }
                                            else if (isSelected) {
                                                barColor = 'bg-gradient-to-r from-rose-500 to-rose-400';
                                                borderClass = 'border-rose-500/30';
                                            }

                                            return (
                                                <div key={opt} className={`p-3 rounded-xl bg-white/5 border ${borderClass}`}>
                                                    <div className="flex justify-between text-xs mb-2">
                                                        <span className={`font-bold flex items-center gap-2 ${isCorrect ? 'text-emerald-400' : isSelected && !isCorrect ? 'text-rose-400' : 'text-white/60'}`}>
                                                            <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${isCorrect ? 'bg-emerald-500 text-white' : isSelected ? 'bg-rose-500 text-white' : 'bg-white/10 text-white/50'}`}>
                                                                {opt}
                                                            </span>
                                                            {isCorrect && '✓ Correcta'}
                                                            {isSelected && !isCorrect && '← Tu respuesta'}
                                                        </span>
                                                        <span className="font-bold text-white tabular-nums">{pct}%</span>
                                                    </div>
                                                    <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${pct}%` }}
                                                            transition={{ duration: 0.6, delay: 0.1 }}
                                                            className={`h-full rounded-full ${barColor}`}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={() => setPreguntaSeleccionada(null)}
                                className="w-full py-3.5 bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30"
                            >
                                Cerrar
                            </button>
                        </div>
                    );
                })()}
            </Modal>
        </div>
    );
}
