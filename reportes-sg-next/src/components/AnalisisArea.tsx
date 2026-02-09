
import React, { useState, useMemo } from 'react';
import { Estudiante } from '@/types';
import {
    Calculator,
    BookOpen,
    Globe2,
    Microscope,
    Languages,
    ArrowLeft,
    ChevronDown,
    BarChart3,
    CheckCircle2,
    AlertCircle,
    Users,
    TrendingUp,
    TrendingDown,
    Target,
    Flame,
    Zap,
    Filter,
    LayoutGrid
} from 'lucide-react';

type MateriaKey = 'matemáticas' | 'lectura crítica' | 'sociales y ciudadanas' | 'ciencias naturales' | 'inglés';

interface AnalisisProps {
    estudiantes: Estudiante[];
    filtroInstitucion: string;
    onClose: () => void;
}

const AREAS_CONFIG: Record<MateriaKey | string, { label: string; color: string; gradient: string; icon: React.ReactNode }> = {
    'matemáticas': {
        label: 'Matemáticas',
        color: '#8b5cf6',
        gradient: 'from-violet-600 to-indigo-900',
        icon: <Calculator className="w-8 h-8" strokeWidth={1.5} />
    },
    'lectura crítica': {
        label: 'Lectura Crítica',
        color: '#f59e0b',
        gradient: 'from-amber-500 to-orange-900',
        icon: <BookOpen className="w-8 h-8" strokeWidth={1.5} />
    },
    'sociales y ciudadanas': {
        label: 'Sociales',
        color: '#ef4444',
        gradient: 'from-red-500 to-rose-900',
        icon: <Globe2 className="w-8 h-8" strokeWidth={1.5} />
    },
    'ciencias naturales': {
        label: 'Ciencias',
        color: '#10b981',
        gradient: 'from-emerald-500 to-teal-900',
        icon: <Microscope className="w-8 h-8" strokeWidth={1.5} />
    },
    'inglés': {
        label: 'Inglés',
        color: '#0ea5e9',
        gradient: 'from-sky-500 to-blue-900',
        icon: <Languages className="w-8 h-8" strokeWidth={1.5} />
    }
};

export default function AnalisisArea({ estudiantes, filtroInstitucion, onClose }: AnalisisProps) {
    const [areaSeleccionada, setAreaSeleccionada] = useState<MateriaKey | null>(null);
    const [preguntaExpandida, setPreguntaExpandida] = useState<number | null>(null);
    const [ordenarPor, setOrdenarPor] = useState<'numero' | 'dificultad' | 'discriminacion'>('numero');
    const [vistaHeatmap, setVistaHeatmap] = useState(true);

    const estudiantesActuales = useMemo(() => {
        if (!filtroInstitucion || filtroInstitucion === 'todas') return estudiantes;
        return estudiantes.filter(e => e.informacion_personal.institucion === filtroInstitucion);
    }, [estudiantes, filtroInstitucion]);

    // Cálculos de estadísticas por área y pregunta con métricas avanzadas
    const statsArea = useMemo(() => {
        if (!areaSeleccionada) return null;

        const conteoPreguntas: Record<number, {
            numero: number;
            correcta: string;
            total: number;
            aciertos: number;
            opciones: Record<string, Estudiante[]>;
            indiceDificultad: number;
            indiceDiscriminacion: number;
            distractorMasElegido: { opcion: string; count: number };
        }> = {};

        // Calcular puntaje total por estudiante para índice de discriminación
        const puntajesTotales = estudiantesActuales.map(est => {
            const respuestasObj = est.respuestas_detalladas?.[areaSeleccionada] || {};
            const respuestas = Array.isArray(respuestasObj)
                ? respuestasObj
                : Object.entries(respuestasObj).map(([num, data]: [string, any]) => ({
                    numero: parseInt(num),
                    respuesta_estudiante: data.respuesta || '',
                    respuesta_correcta: data.correcta || '',
                    es_correcta: data.es_correcta || false
                }));
            return {
                estudiante: est,
                total: respuestas.filter(r => r.es_correcta).length,
                respuestas
            };
        }).sort((a, b) => b.total - a.total);

        // División en grupos superior e inferior (27% cada uno)
        const n = puntajesTotales.length;
        const cutoff = Math.ceil(n * 0.27);
        const grupoSuperior = new Set(puntajesTotales.slice(0, cutoff).map(p => p.estudiante.informacion_personal.numero_identificacion));
        const grupoInferior = new Set(puntajesTotales.slice(-cutoff).map(p => p.estudiante.informacion_personal.numero_identificacion));

        estudiantesActuales.forEach(est => {
            const respuestasObj = est.respuestas_detalladas?.[areaSeleccionada] || {};
            const respuestas = Array.isArray(respuestasObj)
                ? respuestasObj
                : Object.entries(respuestasObj).map(([num, data]: [string, any]) => ({
                    numero: parseInt(num),
                    respuesta_estudiante: data.respuesta || '',
                    respuesta_correcta: data.correcta || '',
                    es_correcta: data.es_correcta || false
                }));

            respuestas.forEach(resp => {
                if (!conteoPreguntas[resp.numero]) {
                    conteoPreguntas[resp.numero] = {
                        numero: resp.numero,
                        correcta: resp.respuesta_correcta,
                        total: 0,
                        aciertos: 0,
                        opciones: { 'A': [], 'B': [], 'C': [], 'D': [], '-': [] },
                        indiceDificultad: 0,
                        indiceDiscriminacion: 0,
                        distractorMasElegido: { opcion: '-', count: 0 }
                    };
                }

                const data = conteoPreguntas[resp.numero];
                data.total++;
                if (resp.es_correcta) data.aciertos++;

                const opcion = resp.respuesta_estudiante || '-';
                if (!data.opciones[opcion]) data.opciones[opcion] = [];
                data.opciones[opcion].push(est);
            });
        });

        // Calcular métricas avanzadas
        Object.values(conteoPreguntas).forEach(preg => {
            // Índice de dificultad (% de aciertos)
            preg.indiceDificultad = preg.total > 0 ? Math.round((preg.aciertos / preg.total) * 100) : 0;

            // Índice de discriminación
            let aciertosSuperiores = 0;
            let aciertosInferiores = 0;
            Object.entries(preg.opciones).forEach(([opcion, ests]) => {
                if (opcion === preg.correcta) {
                    ests.forEach(e => {
                        if (grupoSuperior.has(e.informacion_personal.numero_identificacion)) aciertosSuperiores++;
                        if (grupoInferior.has(e.informacion_personal.numero_identificacion)) aciertosInferiores++;
                    });
                }
            });
            preg.indiceDiscriminacion = cutoff > 0 ? Math.round(((aciertosSuperiores - aciertosInferiores) / cutoff) * 100) : 0;

            // Distractor más elegido
            let maxDistractor = { opcion: '-', count: 0 };
            Object.entries(preg.opciones).forEach(([opcion, ests]) => {
                if (opcion !== preg.correcta && opcion !== '-' && ests.length > maxDistractor.count) {
                    maxDistractor = { opcion, count: ests.length };
                }
            });
            preg.distractorMasElegido = maxDistractor;
        });

        let sorted = Object.values(conteoPreguntas);
        if (ordenarPor === 'dificultad') {
            sorted = sorted.sort((a, b) => a.indiceDificultad - b.indiceDificultad);
        } else if (ordenarPor === 'discriminacion') {
            sorted = sorted.sort((a, b) => a.indiceDiscriminacion - b.indiceDiscriminacion);
        } else {
            sorted = sorted.sort((a, b) => a.numero - b.numero);
        }

        return sorted;
    }, [estudiantesActuales, areaSeleccionada, ordenarPor]);

    // KPIs globales del área
    const kpisArea = useMemo(() => {
        if (!statsArea || statsArea.length === 0) return null;

        const preguntasMasDificiles = [...statsArea].sort((a, b) => a.indiceDificultad - b.indiceDificultad).slice(0, 3);
        const preguntasMasFaciles = [...statsArea].sort((a, b) => b.indiceDificultad - a.indiceDificultad).slice(0, 3);
        const preguntasCriticas = statsArea.filter(p => p.indiceDificultad < 40);
        const promedioAciertos = Math.round(statsArea.reduce((acc, p) => acc + p.indiceDificultad, 0) / statsArea.length);
        const preguntasMalaDiscriminacion = statsArea.filter(p => p.indiceDiscriminacion < 20);

        return {
            preguntasMasDificiles,
            preguntasMasFaciles,
            preguntasCriticas,
            promedioAciertos,
            preguntasMalaDiscriminacion,
            totalPreguntas: statsArea.length
        };
    }, [statsArea]);

    // Render: Selección de Área
    if (!areaSeleccionada) {
        return (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                            <BarChart3 className="w-8 h-8 text-purple-400" />
                            Análisis Detallado por Área
                        </h2>
                        <div className="flex items-center gap-2 mt-2 ml-11">
                            <div className="px-2.5 py-0.5 rounded-full bg-white/10 border border-white/10 text-xs font-medium text-white/70">
                                {filtroInstitucion === 'todas' ? 'Todas las Instituciones' : filtroInstitucion}
                            </div>
                            <span className="text-white/40 text-sm">• {estudiantesActuales.length} Estudiantes</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="group px-5 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-white/70 hover:text-white transition-all flex items-center gap-2 border border-white/5 hover:border-white/10">
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Volver al Dashboard
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                    {Object.entries(AREAS_CONFIG).map(([key, config]) => {
                        const estudiantesConPuntaje = estudiantesActuales.filter(est => (est.puntajes?.[key]?.puntaje || 0) > 0);
                        const sumaPuntajes = estudiantesConPuntaje.reduce((acc, est) => acc + (est.puntajes?.[key]?.puntaje || 0), 0);
                        const promedio = estudiantesConPuntaje.length > 0 ? Math.round(sumaPuntajes / estudiantesConPuntaje.length) : 0;

                        return (
                            <button
                                key={key}
                                onClick={() => setAreaSeleccionada(key as MateriaKey)}
                                className="group relative h-72 rounded-3xl overflow-hidden cursor-pointer transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/20 border border-white/10 hover:border-white/30"
                            >
                                <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient} opacity-30 group-hover:opacity-100 transition-opacity duration-500`} />
                                <div className="absolute inset-0 bg-black/40 group-hover:bg-transparent transition-colors duration-500" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />

                                <div className="absolute inset-0 p-7 flex flex-col justify-between z-10">
                                    <div className="flex justify-between items-start">
                                        <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/20 group-hover:bg-white/20 transition-colors shadow-lg shadow-black/20">
                                            {config.icon}
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-0.5 block">Promedio</span>
                                            <span className="text-4xl font-black text-white leading-none">{promedio}</span>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-2xl font-bold text-white leading-tight mb-3">{config.label}</h3>
                                        <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
                                            <div className="h-full bg-white transition-all duration-1000 w-0 group-hover:w-full" />
                                        </div>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    }

    const config = AREAS_CONFIG[areaSeleccionada];

    return (
        <div className="animate-in slide-in-from-right-8 duration-500">
            {/* Header */}
            <div className="sticky top-0 z-30 bg-[#0f111a]/90 backdrop-blur-md border-b border-white/10 mb-6 -mx-6 px-8 py-4 flex items-center justify-between shadow-2xl shadow-black/50">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => setAreaSeleccionada(null)}
                        className="group flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all border border-white/5"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        <span className="font-medium">Volver</span>
                    </button>
                    <div className="h-8 w-px bg-white/10"></div>
                    <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg bg-gradient-to-br ${config.gradient} shadow-lg text-white`}>
                            {React.cloneElement(config.icon as React.ReactElement<{ className?: string }>, { className: 'w-6 h-6' })}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white tracking-tight leading-none">{config.label}</h2>
                            <p className="text-xs text-white/40 font-medium tracking-wide mt-1 uppercase">Análisis de Items</p>
                        </div>
                    </div>
                </div>

                {/* Métricas Resumen */}
                <div className="flex items-center gap-6 bg-black/20 px-6 py-2 rounded-xl border border-white/5">
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] text-white/30 uppercase tracking-widest font-bold">Preguntas</span>
                        <span className="text-xl font-bold text-white tabular-nums">{statsArea?.length || 0}</span>
                    </div>
                    <div className="w-px h-8 bg-white/10"></div>
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] text-white/30 uppercase tracking-widest font-bold">Efectividad</span>
                        <span className="text-xl font-bold text-emerald-400 tabular-nums">{kpisArea?.promedioAciertos || 0}%</span>
                    </div>
                    <div className="w-px h-8 bg-white/10"></div>
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] text-white/30 uppercase tracking-widest font-bold">Críticas</span>
                        <span className="text-xl font-bold text-rose-400 tabular-nums">{kpisArea?.preguntasCriticas.length || 0}</span>
                    </div>
                </div>
            </div>

            {/* KPI Cards */}
            {kpisArea && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 max-w-6xl mx-auto px-4">
                    {/* Preguntas más difíciles */}
                    <div className="bg-gradient-to-br from-rose-500/10 to-transparent backdrop-blur-xl rounded-2xl border border-rose-500/20 p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <Flame className="w-5 h-5 text-rose-400" />
                            <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">Más Difíciles</span>
                        </div>
                        <div className="flex gap-2">
                            {kpisArea.preguntasMasDificiles.map(p => (
                                <div key={p.numero} className="flex-1 bg-rose-500/20 rounded-lg p-2 text-center">
                                    <span className="block text-lg font-black text-white">#{p.numero}</span>
                                    <span className="text-[10px] text-rose-300">{p.indiceDificultad}%</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Preguntas más fáciles */}
                    <div className="bg-gradient-to-br from-emerald-500/10 to-transparent backdrop-blur-xl rounded-2xl border border-emerald-500/20 p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Más Fáciles</span>
                        </div>
                        <div className="flex gap-2">
                            {kpisArea.preguntasMasFaciles.map(p => (
                                <div key={p.numero} className="flex-1 bg-emerald-500/20 rounded-lg p-2 text-center">
                                    <span className="block text-lg font-black text-white">#{p.numero}</span>
                                    <span className="text-[10px] text-emerald-300">{p.indiceDificultad}%</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Baja discriminación */}
                    <div className="bg-gradient-to-br from-amber-500/10 to-transparent backdrop-blur-xl rounded-2xl border border-amber-500/20 p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <AlertCircle className="w-5 h-5 text-amber-400" />
                            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Revisar (Baja Disc.)</span>
                        </div>
                        {kpisArea.preguntasMalaDiscriminacion.length > 0 ? (
                            <div className="flex gap-2 flex-wrap">
                                {kpisArea.preguntasMalaDiscriminacion.slice(0, 3).map(p => (
                                    <div key={p.numero} className="bg-amber-500/20 rounded-lg px-3 py-1">
                                        <span className="text-sm font-bold text-white">#{p.numero}</span>
                                    </div>
                                ))}
                                {kpisArea.preguntasMalaDiscriminacion.length > 3 && (
                                    <span className="text-amber-300 text-xs self-center">+{kpisArea.preguntasMalaDiscriminacion.length - 3} más</span>
                                )}
                            </div>
                        ) : (
                            <p className="text-white/40 text-sm">Todas las preguntas discriminan bien</p>
                        )}
                    </div>
                </div>
            )}

            {/* Controles */}
            <div className="flex items-center justify-between mb-4 max-w-6xl mx-auto px-4">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setVistaHeatmap(!vistaHeatmap)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${vistaHeatmap ? 'bg-purple-500/20 border-purple-500/30 text-purple-300' : 'bg-white/5 border-white/10 text-white/60 hover:text-white'}`}
                    >
                        <LayoutGrid className="w-4 h-4" />
                        Heatmap
                    </button>
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-white/40" />
                    <select
                        value={ordenarPor}
                        onChange={(e) => setOrdenarPor(e.target.value as any)}
                        className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm cursor-pointer"
                    >
                        <option value="numero" className="bg-slate-900">Por Número</option>
                        <option value="dificultad" className="bg-slate-900">Por Dificultad</option>
                        <option value="discriminacion" className="bg-slate-900">Por Discriminación</option>
                    </select>
                </div>
            </div>

            {/* Heatmap Visual */}
            {vistaHeatmap && statsArea && (
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-4 mb-6 max-w-6xl mx-auto mx-4">
                    <div className="flex flex-wrap gap-2">
                        {statsArea.map((preg) => {
                            const esAnulada = ['X', '*', '-', 'ANULADA', '*ANULADA*'].includes(preg.correcta.toUpperCase());
                            let bgColor = 'bg-emerald-500';

                            if (esAnulada) {
                                bgColor = 'bg-slate-600';
                            } else if (preg.indiceDificultad < 30) {
                                bgColor = 'bg-rose-600';
                            } else if (preg.indiceDificultad < 50) {
                                bgColor = 'bg-amber-500';
                            } else if (preg.indiceDificultad < 70) {
                                bgColor = 'bg-yellow-500';
                            } else {
                                bgColor = 'bg-emerald-500';
                            }

                            return (
                                <button
                                    key={preg.numero}
                                    onClick={() => setPreguntaExpandida(preguntaExpandida === preg.numero ? null : preg.numero)}
                                    className={`w-10 h-10 rounded-lg ${bgColor} flex items-center justify-center text-xs font-bold text-white shadow-lg hover:scale-110 transition-transform cursor-pointer relative group ${preguntaExpandida === preg.numero ? 'ring-2 ring-white' : ''}`}
                                    title={`P${preg.numero}: ${preg.indiceDificultad}% aciertos`}
                                >
                                    {preg.numero}
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 rounded text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 border border-white/10">
                                        {esAnulada ? 'Anulada' : `${preg.indiceDificultad}% aciertos | Disc: ${preg.indiceDiscriminacion}%`}
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Leyenda */}
                    <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-white/10">
                        <div className="flex items-center gap-2 text-xs text-white/60">
                            <div className="w-4 h-4 rounded bg-emerald-500"></div>
                            <span>Fácil (≥70%)</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-white/60">
                            <div className="w-4 h-4 rounded bg-yellow-500"></div>
                            <span>Media (50-69%)</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-white/60">
                            <div className="w-4 h-4 rounded bg-amber-500"></div>
                            <span>Difícil (30-49%)</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-white/60">
                            <div className="w-4 h-4 rounded bg-rose-600"></div>
                            <span>Muy difícil (&lt;30%)</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-white/60">
                            <div className="w-4 h-4 rounded bg-slate-600"></div>
                            <span>Anulada</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Lista de Preguntas Detallada */}
            <div className="space-y-3 max-w-6xl mx-auto pb-24 px-4">
                {statsArea?.map((preg) => {
                    const porcentajeError = 100 - preg.indiceDificultad;
                    const isExpanded = preguntaExpandida === preg.numero;
                    const esAnulada = ['X', '*', '-', 'ANULADA', '*ANULADA*'].includes(preg.correcta.toUpperCase());

                    const isCritical = preg.indiceDificultad < 40;
                    const isModerate = preg.indiceDificultad < 60;
                    const isBadDiscrimination = preg.indiceDiscriminacion < 20;

                    const statusColor = isCritical ? 'text-rose-400' : isModerate ? 'text-amber-400' : 'text-emerald-400';

                    return (
                        <div
                            key={preg.numero}
                            className={`group bg-[#13151f] border rounded-xl overflow-hidden transition-all duration-300 ${isExpanded ? 'border-purple-500/50 shadow-xl shadow-purple-900/10' : 'border-white/5 hover:border-white/10'}`}
                        >
                            {/* Cabecera */}
                            <button
                                onClick={() => setPreguntaExpandida(isExpanded ? null : preg.numero)}
                                className="w-full px-5 py-4 flex items-center justify-between"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold border transition-colors ${isExpanded ? 'bg-purple-500/10 border-purple-500/30 text-purple-300' : 'bg-white/5 border-white/10 text-white/50 group-hover:text-white'}`}>
                                        {preg.numero}
                                    </div>
                                    <div className="text-left">
                                        <div className="flex items-center gap-3 mb-1">
                                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/5 border border-white/10">
                                                <span className="text-[9px] font-bold text-white/40 uppercase">Clave</span>
                                                <span className="text-sm font-bold text-white">{esAnulada ? '-' : preg.correcta}</span>
                                            </div>
                                            {esAnulada && (
                                                <span className="px-2 py-0.5 rounded-full bg-slate-500/20 text-slate-400 text-[10px] font-bold">ANULADA</span>
                                            )}
                                            {isCritical && !esAnulada && (
                                                <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 text-[10px] font-bold flex items-center gap-1">
                                                    <AlertCircle className="w-3 h-3" /> Crítico
                                                </span>
                                            )}
                                            {isBadDiscrimination && !esAnulada && (
                                                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold">Revisar</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6 ml-auto mr-4">
                                    {!esAnulada && (
                                        <>
                                            <div className="flex flex-col items-end min-w-[80px]">
                                                <span className="text-[9px] uppercase text-white/30 font-medium">Dificultad</span>
                                                <span className={`text-sm font-bold tabular-nums ${statusColor}`}>{preg.indiceDificultad}%</span>
                                            </div>
                                            <div className="flex flex-col items-end min-w-[80px]">
                                                <span className="text-[9px] uppercase text-white/30 font-medium">Discriminación</span>
                                                <span className={`text-sm font-bold tabular-nums ${preg.indiceDiscriminacion >= 30 ? 'text-emerald-400' : preg.indiceDiscriminacion >= 20 ? 'text-amber-400' : 'text-rose-400'}`}>
                                                    {preg.indiceDiscriminacion}%
                                                </span>
                                            </div>
                                        </>
                                    )}
                                    <div className="w-20 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${isCritical ? 'bg-rose-500' : isModerate ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                            style={{ width: `${preg.indiceDificultad}%` }}
                                        />
                                    </div>
                                </div>

                                <div className={`w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/40 transition-all duration-300 ${isExpanded ? 'rotate-180 bg-white/10 text-white' : ''}`}>
                                    <ChevronDown className="w-4 h-4" />
                                </div>
                            </button>

                            {/* Detalle Expandido */}
                            {isExpanded && (
                                <div className="px-5 pb-6 pt-2 border-t border-dashed border-white/10 bg-black/20 animate-in slide-in-from-top-1">
                                    <div className="flex items-center gap-2 mb-4 opacity-60">
                                        <Users className="w-4 h-4" />
                                        <h4 className="text-xs font-bold uppercase tracking-widest">Distribución de Respuestas</h4>
                                    </div>

                                    {/* Gráfico de barras horizontal */}
                                    <div className="space-y-3 mb-6">
                                        {['A', 'B', 'C', 'D'].map(opcion => {
                                            const estudiantesOpcion = preg.opciones[opcion] || [];
                                            const porcentaje = preg.total > 0 ? Math.round((estudiantesOpcion.length / preg.total) * 100) : 0;
                                            const esCorrecta = opcion === preg.correcta;
                                            const esDistractor = opcion === preg.distractorMasElegido.opcion;

                                            return (
                                                <div key={opcion} className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold ${esCorrecta ? 'bg-emerald-500 text-white' : 'bg-white/5 text-white/50 border border-white/10'}`}>
                                                        {opcion}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className={`text-xs font-medium ${esCorrecta ? 'text-emerald-400' : 'text-white/60'}`}>
                                                                    {esCorrecta && '✓ Correcta'}
                                                                    {esDistractor && !esCorrecta && '⚠️ Distractor más elegido'}
                                                                </span>
                                                            </div>
                                                            <span className="text-sm font-bold text-white tabular-nums">{porcentaje}% <span className="text-white/40 text-xs">({estudiantesOpcion.length})</span></span>
                                                        </div>
                                                        <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full transition-all duration-500 ${esCorrecta ? 'bg-emerald-500' : esDistractor ? 'bg-amber-500' : 'bg-white/20'}`}
                                                                style={{ width: `${porcentaje}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Lista de estudiantes que eligieron cada opción (colapsable) */}
                                    <details className="group/details">
                                        <summary className="cursor-pointer text-xs text-white/40 hover:text-white/60 transition-colors flex items-center gap-2 mb-3">
                                            <span>Ver estudiantes por opción</span>
                                            <ChevronDown className="w-3 h-3 group-open/details:rotate-180 transition-transform" />
                                        </summary>
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                            {Object.entries(preg.opciones).map(([opcion, estudiantesConEstaOpcion]) => {
                                                if (opcion === '-' || estudiantesConEstaOpcion.length === 0) return null;
                                                const esCorrecta = opcion === preg.correcta;

                                                return (
                                                    <div
                                                        key={opcion}
                                                        className={`rounded-xl border p-4 ${esCorrecta ? 'bg-emerald-900/10 border-emerald-500/20' : 'bg-white/5 border-white/5'}`}
                                                    >
                                                        <div className="flex items-center gap-2 mb-3">
                                                            <span className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${esCorrecta ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white/50'}`}>
                                                                {opcion}
                                                            </span>
                                                            <span className="text-xs text-white/40">{estudiantesConEstaOpcion.length} estudiantes</span>
                                                        </div>
                                                        <div className={`grid gap-1 ${estudiantesConEstaOpcion.length > 8 ? 'max-h-32 overflow-y-auto pr-2' : ''}`}>
                                                            {estudiantesConEstaOpcion.map((est, idx) => (
                                                                <div key={idx} className="flex items-center gap-2 py-1 text-xs text-white/60 hover:text-white/80">
                                                                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-[8px] font-bold text-white">
                                                                        {est.informacion_personal.nombres?.[0]}{est.informacion_personal.apellidos?.[0]}
                                                                    </div>
                                                                    <span className="truncate">{est.informacion_personal.nombres} {est.informacion_personal.apellidos}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </details>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
