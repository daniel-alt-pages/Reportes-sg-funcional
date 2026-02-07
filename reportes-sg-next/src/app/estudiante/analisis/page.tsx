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
    PieChart,
    TrendingUp
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
    { key: 'lectura crítica', label: 'Lectura Crítica', color: '#ec4899', bg: 'bg-pink-50', text: 'text-pink-600', ring: 'ring-pink-500' },
    { key: 'matemáticas', label: 'Matemáticas', color: '#3b82f6', bg: 'bg-blue-50', text: 'text-blue-600', ring: 'ring-blue-500' },
    { key: 'sociales y ciudadanas', label: 'Ciencias Sociales', color: '#f59e0b', bg: 'bg-amber-50', text: 'text-amber-600', ring: 'ring-amber-500' },
    { key: 'ciencias naturales', label: 'Ciencias Naturales', color: '#10b981', bg: 'bg-emerald-50', text: 'text-emerald-600', ring: 'ring-emerald-500' },
    { key: 'inglés', label: 'Inglés', color: '#8b5cf6', bg: 'bg-purple-50', text: 'text-purple-600', ring: 'ring-purple-500' },
];

export default function AnalisisRespuestasPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>}>
            <AnalisisContentInternal />
        </Suspense>
    );
}

function AnalisisContentInternal() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [estudiante, setEstudiante] = useState<Estudiante | null>(null);
    const [todosEstudiantes, setTodosEstudiantes] = useState<Estudiante[]>([]);
    const [loading, setLoading] = useState(true);
    const [materiaSeleccionada, setMateriaSeleccionada] = useState('lectura crítica');

    // Estado para el Modal
    const [preguntaSeleccionada, setPreguntaSeleccionada] = useState<RespuestaDetallada | null>(null);

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
            // Cargar datos individuales del estudiante (Rápido y Consistente)
            const targetId = String(id).trim();
            const resEst = await fetch(`/data/estudiantes/${targetId}.json?v=${new Date().getTime()}`);

            if (resEst.ok) {
                const studentData = await resEst.json();
                setEstudiante(studentData);
            } else {
                console.error("Student data not found in individual file");
            }

            // Cargar datos globales SOLO para las estadísticas comparativas (Segundo plano)
            // No bloquea la vista principal del estudiante
            fetch(`/data/resultados_finales.json?v=${new Date().getTime()}`)
                .then(r => r.ok ? r.json() : null)
                .then(data => {
                    if (data && data.estudiantes) {
                        const unicosMap = new Map();
                        data.estudiantes.forEach((e: any) => {
                            const idNum = String(e.informacion_personal.numero_identificacion).trim();
                            if (!unicosMap.has(idNum) || e.puntaje_global > unicosMap.get(idNum).puntaje_global) {
                                unicosMap.set(idNum, e);
                            }
                        });
                        setTodosEstudiantes(Array.from(unicosMap.values()) as Estudiante[]);
                    }
                })
                .catch(err => console.warn("Could not load global stats", err));

        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [router]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const respuestasMateria = useMemo(() => {
        if (!estudiante?.respuestas_detalladas) return [];
        return estudiante.respuestas_detalladas[materiaSeleccionada] || [];
    }, [estudiante, materiaSeleccionada]);

    // Estadísticas Globales por Pregunta
    const metricasPreguntas = useMemo(() => {
        const stats: Record<number, { A: number, B: number, C: number, D: number, Total: number }> = {};
        if (!todosEstudiantes.length) return stats;

        todosEstudiantes.forEach(est => {
            const resps = est.respuestas_detalladas?.[materiaSeleccionada] || [];
            resps.forEach(r => {
                if (!stats[r.numero]) stats[r.numero] = { A: 0, B: 0, C: 0, D: 0, Total: 0 };
                const opcion = r.respuesta_estudiante.toUpperCase().trim();
                // @ts-ignore
                if (stats[r.numero][opcion] !== undefined) {
                    // @ts-ignore
                    stats[r.numero][opcion]++;
                }
                stats[r.numero].Total++;
            });
        });

        return stats;
    }, [todosEstudiantes, materiaSeleccionada]);

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

    const handleLogout = () => {
        localStorage.removeItem('student_id');
        router.replace('/estudiante');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!estudiante) return null;

    const materiaActual = materias.find(m => m.key === materiaSeleccionada);

    // Obtener stats de la pregunta seleccionada para el modal
    const statsSelected = preguntaSeleccionada ? metricasPreguntas[preguntaSeleccionada.numero] : null;

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20 relative">
            {/* Watermark responsive and overlay */}
            <img
                src="/fondo_16_9.svg"
                alt=""
                className="fixed inset-0 z-[30] w-full h-full object-cover opacity-[0.18] pointer-events-none select-none"
                draggable="false"
            />

            {/* Header Flotante */}
            <motion.nav
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-slate-200 shadow-sm"
            >
                <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white ${materiaActual?.bg.replace('bg-', 'bg-gradient-to-br from-').replace('50', '500')} to-slate-700 shadow-lg`}>
                            <PieChart size={18} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-sm font-bold text-slate-800 leading-none mb-0.5">Análisis de Respuestas</h1>
                            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Resultados Detallados</p>
                        </div>
                    </div>
                    <button
                        onClick={() => router.push('/estudiante/dashboard')}
                        className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
                    >
                        <ArrowLeft size={20} />
                    </button>
                </div>
            </motion.nav>

            <main className="max-w-6xl mx-auto px-4 py-8">

                {/* Selector de Materias (Pills animadas) */}
                <div className="flex flex-wrap gap-2 mb-8 justify-center">
                    {materias.map((materia) => (
                        <motion.button
                            key={materia.key}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setMateriaSeleccionada(materia.key)}
                            className={`px-4 py-2 rounded-full text-sm font-bold transition-all border flex items-center gap-2 ${materiaSeleccionada === materia.key
                                ? `bg-white ${materia.text} border-transparent shadow-lg ring-2 ${materia.ring}`
                                : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                                }`}
                        >
                            <div className={`w-2 h-2 rounded-full ${materiaSeleccionada === materia.key ? materia.bg.replace('50', '500') : 'bg-slate-300'}`}></div>
                            {materia.label}
                        </motion.button>
                    ))}
                </div>

                {/* Score Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center justify-between"
                    >
                        <div>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Aciertos</p>
                            <p className="text-3xl font-black text-slate-800">{estadisticas.correctas}</p>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <CheckCircle2 size={24} />
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center justify-between"
                    >
                        <div>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Efectividad</p>
                            <p className="text-3xl font-black text-slate-800">{estadisticas.porcentaje}%</p>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                            <TrendingUp size={24} />
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center justify-between"
                    >
                        <div>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Puntaje</p>
                            <p className={`text-3xl font-black ${materiaActual?.text}`}>{estudiante.puntajes[materiaSeleccionada]?.puntaje}</p>
                        </div>
                        <div className={`w-12 h-12 rounded-full ${materiaActual?.bg} ${materiaActual?.text} flex items-center justify-center`}>
                            <BarChart size={24} />
                        </div>
                    </motion.div>
                </div>

                {/* Tabla Interactiva */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden"
                >
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-50/50 text-slate-400 text-xs uppercase font-bold tracking-wider border-b border-slate-100">
                                    <th className="py-4 px-6 text-left w-20">#</th>
                                    <th className="py-4 px-6 text-center">Tu Respuesta</th>
                                    <th className="py-4 px-6 text-center">Correcta</th>
                                    <th className="py-4 px-6 text-center">Estado</th>
                                    <th className="py-4 px-6 text-right">Detalle</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {respuestasMateria.map((resp, idx) => {
                                    const esAnulada = ['X', '*', '-'].includes(resp.respuesta_correcta);
                                    let estado = resp.es_correcta ? 'Correcta' : 'Incorrecta';
                                    let estadoColor = resp.es_correcta ? 'bg-emerald-100 text-emerald-700' : 'bg-red-50 text-red-600';

                                    if (esAnulada) {
                                        estado = 'Anulada';
                                        estadoColor = 'bg-slate-100 text-slate-500';
                                    }

                                    return (
                                        <motion.tr
                                            key={resp.numero}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: idx * 0.02 }}
                                            onClick={() => setPreguntaSeleccionada(resp)}
                                            className="group hover:bg-slate-50 cursor-pointer transition-colors"
                                        >
                                            <td className="py-4 px-6 font-bold text-slate-400 group-hover:text-slate-600">
                                                {resp.numero}
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <span className={`inline-flex w-8 h-8 items-center justify-center rounded-lg font-bold shadow-sm ${resp.es_correcta ? 'bg-emerald-500 text-white' :
                                                    esAnulada ? 'bg-slate-200 text-slate-500' :
                                                        'bg-red-500 text-white'
                                                    }`}>
                                                    {resp.respuesta_estudiante}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                {esAnulada ? (
                                                    <span className="text-slate-300 font-bold">-</span>
                                                ) : (
                                                    <span className="font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded">
                                                        {resp.respuesta_correcta}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${estadoColor}`}>
                                                    {estado}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                <span className="text-slate-300 group-hover:text-blue-500 font-bold text-xs transition-colors">
                                                    Ver Stats &rarr;
                                                </span>
                                            </td>
                                        </motion.tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            </main>

            {/* MODAL DE DETALLE */}
            <Modal
                isOpen={!!preguntaSeleccionada}
                onClose={() => setPreguntaSeleccionada(null)}
                title={`Análisis Pregunta #${preguntaSeleccionada?.numero}`}
            >
                {preguntaSeleccionada && (
                    <div className="space-y-6">
                        {/* Estado */}
                        <div className={`p-4 rounded-xl flex items-center gap-4 ${preguntaSeleccionada.es_correcta ? 'bg-emerald-50 text-emerald-800' :
                            ['X', '*', '-'].includes(preguntaSeleccionada.respuesta_correcta) ? 'bg-slate-100 text-slate-600' :
                                'bg-red-50 text-red-800'
                            }`}>
                            <div className={`p-2 rounded-full ${preguntaSeleccionada.es_correcta ? 'bg-emerald-200 text-emerald-700' :
                                ['X', '*', '-'].includes(preguntaSeleccionada.respuesta_correcta) ? 'bg-slate-200 text-slate-500' :
                                    'bg-red-200 text-red-700'
                                }`}>
                                {preguntaSeleccionada.es_correcta ? <CheckCircle2 size={24} /> :
                                    ['X', '*', '-'].includes(preguntaSeleccionada.respuesta_correcta) ? <AlertTriangle size={24} /> :
                                        <XCircle size={24} />}
                            </div>
                            <div>
                                <h4 className="font-bold text-lg">
                                    {preguntaSeleccionada.es_correcta ? '¡Respuesta Correcta!' :
                                        ['X', '*', '-'].includes(preguntaSeleccionada.respuesta_correcta) ? 'Pregunta Anulada' :
                                            'Respuesta Incorrecta'}
                                </h4>
                                <p className="text-sm opacity-80">
                                    {['X', '*', '-'].includes(preguntaSeleccionada.respuesta_correcta)
                                        ? 'Esta pregunta no afecta tu puntaje.'
                                        : preguntaSeleccionada.es_correcta
                                            ? 'Has dominado este concepto.'
                                            : `La respuesta correcta era la opción ${preguntaSeleccionada.respuesta_correcta}.`
                                    }
                                </p>
                            </div>
                        </div>

                        {/* Comparativa Global */}
                        {statsSelected && !['X', '*', '-'].includes(preguntaSeleccionada.respuesta_correcta) && (
                            <div>
                                <h5 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                                    <BarChart size={18} />
                                    Tendencia de Estudiantes
                                </h5>
                                <div className="space-y-3">
                                    {['A', 'B', 'C', 'D'].map(opt => {
                                        // @ts-ignore
                                        const count = statsSelected[opt] || 0;
                                        const total = statsSelected.Total || 1;
                                        const pct = Math.round((count / total) * 100);
                                        const isCorrect = opt === preguntaSeleccionada.respuesta_correcta;
                                        const isSelected = opt === preguntaSeleccionada.respuesta_estudiante;

                                        let barColor = 'bg-slate-100';
                                        let textColor = 'text-slate-500';

                                        if (isCorrect) { barColor = 'bg-emerald-500'; textColor = 'text-emerald-600 font-bold'; }
                                        else if (isSelected) { barColor = 'bg-red-400'; textColor = 'text-red-500 font-bold'; }

                                        return (
                                            <div key={opt} className="group">
                                                <div className="flex justify-between text-xs mb-1">
                                                    <span className={`font-medium ${textColor}`}>
                                                        Opción {opt} {isCorrect && '(Correcta)'} {isSelected && !isCorrect && '(Tu respuesta)'}
                                                    </span>
                                                    <span className="font-bold text-slate-700">{pct}%</span>
                                                </div>
                                                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${pct}%` }}
                                                        transition={{ duration: 1, ease: "easeOut" }}
                                                        className={`h-full rounded-full ${barColor}`}
                                                    ></motion.div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                <p className="text-xs text-slate-400 mt-3 text-center">
                                    Comparado con todos los estudiantes evaluados hasta ahora.
                                </p>
                            </div>
                        )}

                        {/* Botón de Cerrar Alternativo */}
                        <button
                            onClick={() => setPreguntaSeleccionada(null)}
                            className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors mt-4"
                        >
                            Cerrar
                        </button>
                    </div>
                )}
            </Modal>
        </div>
    );
}
