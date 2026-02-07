'use client';

import { useState } from 'react';
import { Estudiante, EstadisticasGrupo, MATERIAS_NOMBRES, COLORES_MATERIAS } from '@/types';
import classNames from 'classnames';

interface StudentDetailModalProps {
    estudiante: Estudiante | null;
    estadisticas: EstadisticasGrupo | null;
    isOpen: boolean;
    onClose: () => void;
}

export default function StudentDetailModal({ estudiante, estadisticas, isOpen, onClose }: StudentDetailModalProps) {
    const [activeTab, setActiveTab] = useState<'resumen' | 'auditoria'>('resumen');
    const [auditMateria, setAuditMateria] = useState<string>('matemáticas');
    const [selectedPregunta, setSelectedPregunta] = useState<number | null>(null);

    if (!isOpen || !estudiante) return null;

    const materiasDisponibles = Object.keys(estudiante.respuestas_detalladas || {});

    const detectarPatron = (respuestas: any[], index: number) => {
        if (index < 3) return false;
        const current = respuestas[index].respuesta_estudiante;
        return (
            respuestas[index - 1].respuesta_estudiante === current &&
            respuestas[index - 2].respuesta_estudiante === current &&
            respuestas[index - 3].respuesta_estudiante === current
        );
    };

    const respuestasActuales = estudiante.respuestas_detalladas?.[auditMateria] || [];
    const tasaAciertoMateria = respuestasActuales.length > 0
        ? (respuestasActuales.filter(r => r.es_correcta).length / respuestasActuales.length) * 100
        : 0;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/90 backdrop-blur-md transition-opacity animate-in fade-in duration-300"
                onClick={onClose}
            />

            <div className="relative bg-[#0f111a] w-full max-w-7xl h-[90vh] rounded-3xl shadow-2xl border border-white/10 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                <div className="bg-[#14161f] px-8 py-6 border-b border-white/5 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-6">
                        <div className="relative">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-2xl shadow-lg shadow-purple-900/40 ring-1 ring-white/10">
                                🎓
                            </div>
                            <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-[#14161f] flex items-center justify-center text-[10px] font-bold ${estudiante.puntaje_global >= 325 ? 'bg-green-500 text-black' : 'bg-yellow-500 text-black'}`}>
                                {estudiante.puntaje_global >= 325 ? 'A' : 'B'}
                            </div>
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white tracking-tight leading-none mb-1">
                                {estudiante.informacion_personal.nombres} {estudiante.informacion_personal.apellidos}
                            </h2>
                            <div className="flex items-center gap-4 text-sm text-white/40 font-medium">
                                <span className="flex items-center gap-1.5">
                                    <span className="w-1 h-1 rounded-full bg-white/40" />
                                    {estudiante.informacion_personal.numero_identificacion}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <span className="w-1 h-1 rounded-full bg-white/40" />
                                    {estudiante.informacion_personal.institucion || 'Sin Institución'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-8">
                        <div className="text-right">
                            <div className="text-[10px] text-white/30 uppercase font-bold tracking-widest mb-0.5">Global Score</div>
                            <div className="text-4xl font-black text-white tabular-nums tracking-tight">
                                {estudiante.puntaje_global}
                                <span className="text-lg text-white/20 font-medium ml-1">/500</span>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="bg-white/5 hover:bg-white/10 text-white/40 hover:text-white rounded-xl p-3 transition-all"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                <div className="flex border-b border-white/5 bg-[#14161f] px-8 gap-8">
                    <button
                        onClick={() => setActiveTab('resumen')}
                        className={`py-4 text-sm font-bold tracking-wide transition-all relative ${activeTab === 'resumen' ? 'text-white' : 'text-white/40 hover:text-white/70'}`}
                    >
                        📊 Resumen General
                        {activeTab === 'resumen' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]" />}
                    </button>
                    <button
                        onClick={() => setActiveTab('auditoria')}
                        className={`py-4 text-sm font-bold tracking-wide transition-all relative ${activeTab === 'auditoria' ? 'text-white' : 'text-white/40 hover:text-white/70'}`}
                    >
                        📋 Auditoría de Respuestas
                        {activeTab === 'auditoria' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]" />}
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto bg-[#0f111a] p-8 custom-scrollbar">
                    {activeTab === 'resumen' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-500">
                            {Object.entries(estudiante.puntajes || {}).map(([materia, data], idx) => (
                                <div key={materia} className="bg-[#14161f] border border-white/5 rounded-2xl p-6 relative group overflow-hidden hover:border-white/10 transition-all hover:-translate-y-1 hover:shadow-xl">
                                    <div
                                        className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500"
                                        style={{ background: `radial-gradient(circle at top right, ${COLORES_MATERIAS[materia] || '#fff'}, transparent 70%)` }}
                                    />
                                    <div className="flex justify-between items-start mb-6 relative z-10">
                                        <div>
                                            <h3 className="text-lg font-bold text-white capitalize flex items-center gap-2">
                                                {materia.includes('mat') ? '🔢' :
                                                    materia.includes('lec') ? '📖' :
                                                        materia.includes('soc') ? '🌍' :
                                                            materia.includes('cie') ? '🔬' : '🔤'}
                                                {MATERIAS_NOMBRES[materia] || materia}
                                            </h3>
                                            <p className="text-xs text-white/40 mt-1 font-medium">Puntaje Estandarizado</p>
                                        </div>
                                        <div className="text-4xl font-black text-white">{data.puntaje}</div>
                                    </div>
                                    <div className="relative h-3 bg-white/5 rounded-full overflow-hidden mb-4">
                                        <div
                                            className="h-full rounded-full transition-all duration-1000 ease-out"
                                            style={{
                                                width: `${(data.correctas / data.total_preguntas) * 100}%`,
                                                backgroundColor: COLORES_MATERIAS[materia] || '#fff'
                                            }}
                                        />
                                    </div>
                                    <div className="flex justify-between items-end relative z-10">
                                        <div>
                                            <div className="text-2xl font-bold text-white tabular-nums">
                                                {data.correctas}<span className="text-sm text-white/30 font-medium mx-1">/</span><span className="text-sm text-white/30">{data.total_preguntas}</span>
                                            </div>
                                            <div className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Aciertos</div>
                                        </div>
                                        <div className="text-right">
                                            <div className={`text-sm font-bold ${data.correctas / data.total_preguntas > 0.6 ? 'text-green-400' : 'text-yellow-400'}`}>
                                                {Math.round((data.correctas / data.total_preguntas) * 100)}%
                                            </div>
                                            <div className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Efectividad</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'auditoria' && (
                        <div className="flex flex-col h-full animate-in slide-in-from-bottom-4 duration-500">
                            {tasaAciertoMateria < 40 && (
                                <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center text-xl">📉</div>
                                    <div>
                                        <h4 className="text-red-400 font-bold">Rendimiento Crítico Detectado</h4>
                                        <p className="text-sm text-red-300/60">El estudiante tiene menos del 40% de aciertos en {auditMateria}. Revisa las preguntas en rojo.</p>
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-wrap gap-2 mb-8 select-none">
                                {materiasDisponibles.map(mat => (
                                    <button
                                        key={mat}
                                        onClick={() => {
                                            setAuditMateria(mat);
                                            setSelectedPregunta(null);
                                        }}
                                        className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all border ${auditMateria === mat
                                            ? 'bg-white text-black border-white shadow-lg shadow-white/20 scale-105'
                                            : 'bg-white/5 text-white/40 border-transparent hover:bg-white/10 hover:text-white'
                                            }`}
                                    >
                                        {MATERIAS_NOMBRES[mat] || mat}
                                    </button>
                                ))}
                            </div>

                            {(() => {
                                const respuestas = estudiante.respuestas_detalladas?.[auditMateria] || [];

                                const getSesion = (mat: string, num: number) => {
                                    const m = mat.toLowerCase();
                                    if (m.includes('matemáticas') || m.includes('matematicas')) return num <= 25 ? 1 : 2;
                                    if (m.includes('lectura')) return 1;
                                    if (m.includes('sociales') || m.includes('ciudadanas')) return num <= 25 ? 2 : 1;
                                    if (m.includes('naturales') || m.includes('ciencias')) return num >= 92 ? 1 : 2;
                                    if (m.includes('inglés') || m.includes('ingles')) return 2;
                                    return 1;
                                };

                                const porSesion = respuestas.reduce((acc, resp) => {
                                    const sesion = getSesion(auditMateria, resp.numero);
                                    if (!acc[sesion]) acc[sesion] = [];
                                    acc[sesion].push(resp);
                                    return acc;
                                }, {} as Record<number, typeof respuestas>);

                                const sesionesDisponibles = Object.keys(porSesion).map(Number).sort();

                                return (
                                    <div className="flex gap-8 h-full overflow-hidden">
                                        <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar">
                                            {sesionesDisponibles.map(numSesion => {
                                                const respuestasSesion = porSesion[numSesion];
                                                if (!respuestasSesion || respuestasSesion.length === 0) return null;
                                                const respuestasOrdenadas = [...respuestasSesion].sort((a, b) => a.numero - b.numero);

                                                return (
                                                    <div key={numSesion} className="mb-8 animate-in slide-in-from-left-4 duration-500 stagger-100">
                                                        <div className="flex items-center gap-3 mb-4 sticky top-0 bg-[#0f111a]/95 backdrop-blur z-20 py-2 border-b border-white/5">
                                                            <div className={`w-2 h-8 rounded-full ${numSesion === 1 ? 'bg-purple-500' : 'bg-blue-500'}`}></div>
                                                            <h3 className="text-white font-bold text-lg">Sesión {numSesion}</h3>
                                                            <span className="text-xs text-white/40 bg-white/5 px-2 py-1 rounded-lg border border-white/5">
                                                                {respuestasOrdenadas.length} preguntas
                                                            </span>
                                                        </div>

                                                        <div className="grid grid-cols-[repeat(auto-fill,minmax(45px,1fr))] gap-2.5">
                                                            {respuestasOrdenadas.map((resp, idx, arr) => {
                                                                const esPatron = detectarPatron(arr, idx);
                                                                const isSelected = selectedPregunta === resp.numero;
                                                                return (
                                                                    <button
                                                                        key={resp.numero}
                                                                        onClick={() => setSelectedPregunta(isSelected ? null : resp.numero)}
                                                                        className={classNames(
                                                                            "w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold transition-all duration-200 relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0f111a]",
                                                                            isSelected
                                                                                ? "bg-white text-black shadow-lg scale-110 z-10 ring-white"
                                                                                : resp.es_correcta
                                                                                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500 hover:text-black hover:border-transparent"
                                                                                    : resp.respuesta_estudiante === 'NR'
                                                                                        ? "bg-gray-800/50 text-gray-500 border border-gray-700/50 hover:bg-gray-700 hover:text-white"
                                                                                        : "bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500 hover:text-white hover:border-transparent",
                                                                            { "ring-2 ring-yellow-500 z-10 shadow-yellow-500/20": esPatron && !isSelected }
                                                                        )}
                                                                    >
                                                                        {resp.numero}
                                                                        {esPatron && <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse shadow-lg" />}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        <div className="w-96 shrink-0 h-full overflow-y-auto custom-scrollbar pb-6 pl-4 border-l border-white/5">
                                            <div className="sticky top-0 h-[80vh]">
                                                {selectedPregunta ? (
                                                    (() => {
                                                        const resp = estudiante.respuestas_detalladas?.[auditMateria]?.find(r => r.numero === selectedPregunta);
                                                        const statsPregunta = estadisticas?.materias[auditMateria]?.[`pregunta_${selectedPregunta}`];
                                                        const numSesion = getSesion(auditMateria, selectedPregunta);

                                                        if (!resp) return null;

                                                        return (
                                                            <div className="bg-[#0f111a]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl animate-in slide-in-from-right-4 fade-in duration-300 relative overflow-hidden h-full flex flex-col">
                                                                {/* Background Glow Effect */}
                                                                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />
                                                                <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

                                                                {/* --- HEADER --- */}
                                                                <div className="relative flex justify-between items-start mb-6 pb-6 border-b border-white/5 shrink-0">
                                                                    <div>
                                                                        <div className="flex items-center gap-2 mb-2">
                                                                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_10px_#a855f7]" />
                                                                            <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-white/50">Sesión {numSesion}</span>
                                                                        </div>
                                                                        <div className="flex items-baseline gap-3">
                                                                            <h3 className="text-3xl font-black text-white tracking-tight">P.{selectedPregunta}</h3>
                                                                            <span className={classNames("text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded border",
                                                                                resp.es_correcta ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                                                                            )}>
                                                                                {resp.es_correcta ? "ACIERTO" : "FALLO"}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-6">
                                                                    {/* Comparativa Cards (Solo Tú vs Correcta) */}
                                                                    <div className="grid grid-cols-2 gap-4">
                                                                        {/* Tu Respuesta */}
                                                                        <div className="group relative overflow-hidden rounded-xl bg-[#1a1b26] border border-white/5 p-4 flex flex-col items-center justify-center min-h-[110px]">
                                                                            <div className="text-[10px] text-white/40 uppercase font-bold tracking-wider mb-2">Tu Respuesta</div>
                                                                            <div className={classNames("font-black transition-all",
                                                                                (resp.respuesta_estudiante || 'NR').length > 2 ? "text-lg text-center" : "text-4xl",
                                                                                resp.es_correcta ? "text-white" : "text-rose-400 drop-shadow-[0_0_15px_rgba(244,63,94,0.5)]"
                                                                            )}>
                                                                                {resp.respuesta_estudiante || 'NR'}
                                                                            </div>
                                                                        </div>

                                                                        {/* Correcta */}
                                                                        <div className="group relative overflow-hidden rounded-xl bg-[#1a1b26] border border-white/5 p-4 flex flex-col items-center justify-center min-h-[110px]">
                                                                            <div className="absolute inset-0 bg-emerald-500/5" />
                                                                            <div className="text-[10px] text-emerald-500/60 uppercase font-bold tracking-wider mb-2 relative z-10">Correcta</div>
                                                                            <div className={classNames("font-black text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.5)] relative z-10 text-center",
                                                                                resp.respuesta_correcta.length > 2 ? "text-lg break-words leading-tight" : "text-4xl"
                                                                            )}>
                                                                                {resp.respuesta_correcta}
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    {/* Dificultad Gauge (Neon Minimalista - High Contrast) */}
                                                                    {statsPregunta && (
                                                                        <div className="bg-[#0f1016] rounded-2xl p-6 border border-white/5 relative overflow-hidden">
                                                                            <div className="flex justify-between items-center mb-4">
                                                                                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Tasa de Acierto</span>
                                                                                <div className={classNames("px-3 py-1 rounded-lg flex items-center shadow-lg transition-all",
                                                                                    statsPregunta.porcentaje_acierto < 30 ? "bg-rose-500 shadow-rose-500/30" :
                                                                                        statsPregunta.porcentaje_acierto < 70 ? "bg-amber-500 shadow-amber-500/30" : "bg-emerald-500 shadow-emerald-500/30"
                                                                                )}>
                                                                                    <span className="text-[10px] font-black uppercase text-white tracking-wider">
                                                                                        Dificultad {statsPregunta.porcentaje_acierto < 30 ? "Alta" : statsPregunta.porcentaje_acierto < 70 ? "Media" : "Baja"}
                                                                                    </span>
                                                                                </div>
                                                                            </div>

                                                                            <div className="flex items-end gap-3 mb-2">
                                                                                <span className={classNames("text-5xl font-black tabular-nums tracking-tighter leading-none shadow-current drop-shadow-lg",
                                                                                    statsPregunta.porcentaje_acierto < 30 ? "text-rose-500" :
                                                                                        statsPregunta.porcentaje_acierto < 70 ? "text-amber-500" : "text-emerald-500"
                                                                                )}>
                                                                                    {statsPregunta.porcentaje_acierto}
                                                                                </span>
                                                                                <span className="text-sm font-bold text-white/30 mb-1">%</span>
                                                                            </div>

                                                                            {/* Neon Progress Bar */}
                                                                            <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden mt-2">
                                                                                <div
                                                                                    className={classNames("h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_20px_currentColor]",
                                                                                        statsPregunta.porcentaje_acierto < 30 ? "bg-rose-500 text-rose-500" :
                                                                                            statsPregunta.porcentaje_acierto < 70 ? "bg-amber-500 text-amber-500" : "bg-emerald-500 text-emerald-500"
                                                                                    )}
                                                                                    style={{ width: `${statsPregunta.porcentaje_acierto}%` }}
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                    {/* Insights Text (Dynamic) */}
                                                                    {statsPregunta && (
                                                                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 flex gap-3 items-start">
                                                                            <div className="text-lg">💡</div>
                                                                            <p className="text-xs text-blue-200/80 leading-relaxed">
                                                                                {statsPregunta.porcentaje_acierto > 80
                                                                                    ? <>Pregunta <span className="text-emerald-300 font-bold">muy fácil</span>. La mayoría del grupo la acertó.</>
                                                                                    : statsPregunta.porcentaje_acierto < 20
                                                                                        ? <>Pregunta <span className="text-red-300 font-bold">extremadamente difícil</span>. Casi nadie pudo responderla correctamente.</>
                                                                                        : <>Esta pregunta tiene una dificultad <span className="text-white font-bold">media</span>. Revisa si caíste en algún distractor común.</>
                                                                                }
                                                                            </p>
                                                                        </div>
                                                                    )}

                                                                    {/* Global Stats (Bars) */}
                                                                    {statsPregunta ? (
                                                                        <div className="relative space-y-4 pt-2">
                                                                            <div className="flex items-center justify-between">
                                                                                <div className="text-xs text-white/40 uppercase font-bold tracking-wider">Distribución</div>
                                                                            </div>

                                                                            <div className="space-y-2">
                                                                                {['A', 'B', 'C', 'D'].map(opcion => {
                                                                                    const pct = statsPregunta.distribucion[opcion as keyof typeof statsPregunta.distribucion] || 0;
                                                                                    const isCorrect = opcion === resp.respuesta_correcta;
                                                                                    const isSelected = opcion === resp.respuesta_estudiante;

                                                                                    const barColor = isCorrect
                                                                                        ? "bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-[0_0_10px_rgb(52,211,153)]"
                                                                                        : isSelected
                                                                                            ? "bg-gradient-to-r from-rose-600 to-rose-400 shadow-[0_0_10px_rgb(244,63,94)]"
                                                                                            : "bg-white/10";

                                                                                    const textColor = isCorrect ? "text-emerald-400 font-bold" : "text-white/30";

                                                                                    return (
                                                                                        <div key={opcion} className="flex items-center gap-3 group">
                                                                                            <div className={classNames("w-4 text-xs font-black text-center transition-colors", textColor)}>{opcion}</div>
                                                                                            <div className="flex-1 h-3 bg-[#0f111a] rounded-full overflow-hidden relative border border-white/5">
                                                                                                <div
                                                                                                    className={classNames("h-full rounded-full transition-all duration-700 ease-out", barColor)}
                                                                                                    style={{ width: `${pct}%` }}
                                                                                                />
                                                                                            </div>
                                                                                            <div className="w-8 text-right text-[10px] font-mono font-medium text-white/60">{pct}%</div>
                                                                                        </div>
                                                                                    )
                                                                                })}
                                                                            </div>
                                                                        </div>
                                                                    ) : null}
                                                                </div>
                                                            </div>
                                                        );
                                                    })()
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center py-20 text-center bg-white/5 border border-white/5 rounded-2xl h-[400px]">
                                                        <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center text-4xl mb-6 shadow-xl ring-1 ring-white/10 grayscale opacity-40">👆</div>
                                                        <h3 className="text-white font-bold text-lg mb-2">Selecciona una pregunta</h3>
                                                        <p className="text-white/40 text-sm max-w-[200px] leading-relaxed">Haz clic en cualquier número de la izquierda para ver el análisis detallado de la respuesta.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}

                            {(!estudiante.respuestas_detalladas || !estudiante.respuestas_detalladas[auditMateria]) && (
                                <div className="flex-1 flex flex-col items-center justify-center text-white/20">
                                    <div className="text-6xl mb-4 grayscale opacity-20">📊</div>
                                    <p>No hay datos detallados disponibles para esta materia.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
