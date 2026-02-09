import React, { useState, useEffect, useMemo } from 'react';
import { X, Save, Download, AlertCircle, Check, BarChart2, FileText, Users, AlertTriangle, Database, LayoutDashboard, PieChart, TrendingUp, Trophy, Link, UserCircle } from 'lucide-react';
import { Estudiante } from '@/types';
import { generateExcelReport } from '@/lib/reportGenerator';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    estudiantesOriginales: Estudiante[];
    onUpdateEstudiantes: (nuevos: Estudiante[]) => void;
}

// Helpers estadísticos simples
const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);
const avg = (arr: number[]) => arr.length ? sum(arr) / arr.length : 0;
const stdDev = (arr: number[]) => {
    if (arr.length <= 1) return 0;
    const mean = avg(arr);
    return Math.sqrt(arr.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / arr.length);
};

export default function ExportPreviewModal({ isOpen, onClose, estudiantesOriginales, onUpdateEstudiantes }: Props) {
    const [datosEdicion, setDatosEdicion] = useState<Estudiante[]>([]);
    const [filasEditadas, setFilasEditadas] = useState<Set<string>>(new Set());
    const [activeTab, setActiveTab] = useState<'dashboard' | 'stats' | 'ranking' | 'risk' | 'audit' | 'corr' | 'profile' | 'db'>('dashboard');

    useEffect(() => {
        if (isOpen) {
            setDatosEdicion(JSON.parse(JSON.stringify(estudiantesOriginales)));
            setFilasEditadas(new Set());
            setActiveTab('dashboard');
        }
    }, [isOpen, estudiantesOriginales]);

    // ==========================================
    // 🧠 MOTOR DE CÁLCULO EN VIVO
    // ==========================================
    const stats = useMemo(() => {
        if (!datosEdicion.length) return null;

        const puntajesGlobales = datosEdicion.map(e => Number(e.puntaje_global) || 0);
        const kpis = {
            promedio: avg(puntajesGlobales),
            max: Math.max(...puntajesGlobales),
            min: Math.min(...puntajesGlobales),
            exito: puntajesGlobales.filter(p => p >= 300).length / puntajesGlobales.length
        };

        // Análisis por Materia
        const materias = ['matemáticas', 'lectura crítica', 'sociales y ciudadanas', 'ciencias naturales', 'inglés'];
        const materiaStats = materias.map(m => {
            const scores = datosEdicion.map(e => Number(e.puntajes?.[m]?.puntaje) || 0);
            return {
                nombre: m.toUpperCase(),
                promedio: avg(scores),
                desviacion: stdDev(scores),
                min: Math.min(...scores),
                max: Math.max(...scores)
            };
        });

        // Análisis de Preguntas (El pesado)
        const qAnalysis: Record<string, any> = {};
        datosEdicion.forEach(est => {
            if (est.respuestas_detalladas) {
                Object.entries(est.respuestas_detalladas).forEach(([materia, resps]) => {
                    if (!qAnalysis[materia]) qAnalysis[materia] = {};

                    // Verificar que resps sea un array antes de iterar
                    const respArray = Array.isArray(resps) ? resps : [];

                    respArray.forEach(r => {
                        // 🚫 Ignorar preguntas anuladas - no son relevantes para diagnóstico
                        const respCorrectaStr = String(r.respuesta_correcta || '').toUpperCase();
                        if (respCorrectaStr.includes('ANULADA') || respCorrectaStr === '*ANULADA*') {
                            return; // Saltar esta pregunta completamente
                        }

                        if (!qAnalysis[materia][r.numero]) {
                            qAnalysis[materia][r.numero] = {
                                failed: 0, total: 0,
                                correct: r.respuesta_correcta,
                                counts: {},
                                students: {} // Para auditoría
                            };
                        }
                        const qa = qAnalysis[materia][r.numero];
                        qa.total++;
                        if (!r.es_correcta) qa.failed++;

                        const opt = (r.respuesta_estudiante || 'NR').trim().toUpperCase();
                        qa.counts[opt] = (qa.counts[opt] || 0) + 1;

                        // Guardar nombre para auditoría
                        if (!qa.students[opt]) qa.students[opt] = [];
                        const name = `${est.informacion_personal.nombres} ${est.informacion_personal.apellidos}`.trim() || est.informacion_personal.numero_identificacion;
                        qa.students[opt].push(name);
                    });
                });
            }
        });

        // Aplanar preguntas críticas
        const criticalQuestions: any[] = [];
        Object.entries(qAnalysis).forEach(([mat, qs]: [string, any]) => {
            Object.entries(qs).forEach(([num, data]: [string, any]) => {
                const rate = data.failed / data.total;
                if (rate > 0.40) {
                    criticalQuestions.push({ materia: mat, num, ...data, rate });
                }
            });
        });

        // Ranking
        const ranking = [...datosEdicion].sort((a, b) => (Number(b.puntaje_global) || 0) - (Number(a.puntaje_global) || 0)).slice(0, 10);

        // === CORRELACIÓN ENTRE ÁREAS ===
        const calcCorrelation = (x: number[], y: number[]): number => {
            if (x.length !== y.length || x.length === 0) return 0;
            const n = x.length;
            const sumX = x.reduce((a, b) => a + b, 0);
            const sumY = y.reduce((a, b) => a + b, 0);
            const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
            const sumX2 = x.reduce((a, b) => a + b * b, 0);
            const sumY2 = y.reduce((a, b) => a + b * b, 0);
            const numerator = n * sumXY - sumX * sumY;
            const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
            return denominator === 0 ? 0 : numerator / denominator;
        };

        const areaLabels = ['MAT', 'LEC', 'SOC', 'CIE', 'ING'];
        const areaScoresMap: Record<string, number[]> = {};
        materias.forEach(key => {
            areaScoresMap[key] = datosEdicion.map(e => Number(e.puntajes?.[key]?.puntaje) || 0);
        });

        const correlationMatrix: { row: string; cols: { col: string; value: number }[] }[] = [];
        materias.forEach((keyRow, rowIdx) => {
            const cols: { col: string; value: number }[] = [];
            materias.forEach((keyCol, colIdx) => {
                const corr = calcCorrelation(areaScoresMap[keyRow], areaScoresMap[keyCol]);
                cols.push({ col: areaLabels[colIdx], value: corr });
            });
            correlationMatrix.push({ row: areaLabels[rowIdx], cols });
        });

        // Encontrar correlaciones más fuerte y débil
        let maxCorr = -1, minCorr = 1;
        let maxPair = ['', ''], minPair = ['', ''];
        for (let i = 0; i < materias.length; i++) {
            for (let j = i + 1; j < materias.length; j++) {
                const corr = calcCorrelation(areaScoresMap[materias[i]], areaScoresMap[materias[j]]);
                if (corr > maxCorr) { maxCorr = corr; maxPair = [areaLabels[i], areaLabels[j]]; }
                if (corr < minCorr) { minCorr = corr; minPair = [areaLabels[i], areaLabels[j]]; }
            }
        }
        const correlationInsights = { maxCorr, maxPair, minCorr, minPair };

        // === PERFIL POR NIVEL ===
        const niveles: Record<string, { estudiantes: typeof datosEdicion; color: string; emoji: string; rango: string }> = {
            'Superior': { estudiantes: [], color: 'emerald', emoji: '🏆', rango: '> 400' },
            'Alto': { estudiantes: [], color: 'blue', emoji: '⭐', rango: '301-400' },
            'Básico': { estudiantes: [], color: 'amber', emoji: '📚', rango: '201-300' },
            'Bajo': { estudiantes: [], color: 'rose', emoji: '🚨', rango: '≤ 200' }
        };

        datosEdicion.forEach(est => {
            const global = Number(est.puntaje_global) || 0;
            if (global > 400) niveles['Superior'].estudiantes.push(est);
            else if (global > 300) niveles['Alto'].estudiantes.push(est);
            else if (global > 200) niveles['Básico'].estudiantes.push(est);
            else if (global > 0) niveles['Bajo'].estudiantes.push(est);
        });

        const perfilPorNivel = Object.entries(niveles).map(([nivel, data]) => {
            const ests = data.estudiantes;
            if (ests.length === 0) return null;

            const globalScores = ests.map(e => Number(e.puntaje_global) || 0);
            const promedioGlobal = globalScores.reduce((a, b) => a + b, 0) / globalScores.length;

            const areasStats = materias.map((key, i) => {
                const scores = ests.map(e => Number(e.puntajes?.[key]?.puntaje) || 0).filter(s => s > 0);
                return {
                    area: materiaStats[i].nombre,
                    promedio: scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0
                };
            });

            const sorted = [...areasStats].sort((a, b) => b.promedio - a.promedio);
            const fortaleza = sorted[0];
            const debilidad = sorted[sorted.length - 1];
            const brecha = fortaleza.promedio - debilidad.promedio;

            return {
                nivel,
                ...data,
                count: ests.length,
                promedioGlobal,
                fortaleza,
                debilidad,
                brecha,
                areasStats
            };
        }).filter(Boolean);

        return { kpis, materiaStats, criticalQuestions, ranking, correlationMatrix, correlationInsights, perfilPorNivel };
    }, [datosEdicion]);

    const handleCellEdit = (id: string, campo: string, valor: string) => {
        setDatosEdicion(prev => prev.map(est => {
            if (est.informacion_personal.numero_identificacion === id) {
                const nuevo = { ...est };
                // @ts-ignore - Acceso dinámico simple para demo
                if (['nombres', 'apellidos', 'institucion'].includes(campo)) nuevo.informacion_personal[campo] = valor;
                setFilasEditadas(s => new Set(s).add(id));
                return nuevo;
            }
            return est;
        }));
    };

    const handleExportar = async () => {
        onUpdateEstudiantes(datosEdicion);
        await generateExcelReport(datosEdicion, 'Reporte_Final_Corregido');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div className="bg-[#0f111a] w-full max-w-[95vw] h-[95vh] rounded-xl border border-white/10 shadow-2xl flex flex-col overflow-hidden">

                {/* HEADBAR */}
                <div className="h-16 border-b border-white/10 bg-[#13151f] flex items-center justify-between px-6 shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="bg-emerald-500/10 p-2 rounded-lg">
                            <FileText className="w-6 h-6 text-emerald-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">Previsualización en Vivo de Excel</h2>
                            <p className="text-white/40 text-xs">Los cambios en "Base de Datos" actualizan todas las pestañas automáticamente.</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="px-4 py-2 rounded-lg text-white/50 hover:text-white hover:bg-white/5 text-sm transition-colors">
                            Cerrar
                        </button>
                        <button onClick={handleExportar} className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all">
                            <Download className="w-4 h-4" /> Exportar .XLSX
                        </button>
                    </div>
                </div>

                {/* CONTENT AREA */}
                <div className="flex-1 overflow-auto bg-[#090a0f] relative custom-scrollbar">
                    {!stats ? (
                        <div className="flex items-center justify-center h-full text-white/50">Calculando estadísticas...</div>
                    ) : (
                        <div className="p-8 pb-32 min-w-[1000px]"> {/* Extra padding bottom for tabs */}

                            {/* === TAB: DASHBOARD === */}
                            {activeTab === 'dashboard' && (
                                <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-300">
                                    <h3 className="text-2xl font-bold text-white mb-6">📊 Dashboard Ejecutivo</h3>

                                    {/* KPIS */}
                                    <div className="grid grid-cols-4 gap-4">
                                        {[
                                            { l: 'Promedio Global', v: stats.kpis.promedio.toFixed(1), c: 'text-blue-400', b: 'border-blue-500/30' },
                                            { l: 'Máximo', v: stats.kpis.max, c: 'text-emerald-400', b: 'border-emerald-500/30' },
                                            { l: 'Mínimo', v: stats.kpis.min, c: 'text-rose-400', b: 'border-rose-500/30' },
                                            { l: '% Éxito (>300)', v: (stats.kpis.exito * 100).toFixed(1) + '%', c: 'text-amber-400', b: 'border-amber-500/30' },
                                        ].map((k, i) => (
                                            <div key={i} className={`bg-[#13151f] p-6 rounded-xl border ${k.b} shadow-lg`}>
                                                <div className="text-white/40 text-xs font-bold uppercase tracking-wider mb-2">{k.l}</div>
                                                <div className={`text-4xl font-bold ${k.c}`}>{k.v}</div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* TABLA RENDIMIENTO */}
                                    <div className="bg-[#13151f] rounded-xl border border-white/10 overflow-hidden">
                                        <div className="px-6 py-4 border-b border-white/10 font-bold text-white">Rendimiento por Competencias</div>
                                        <table className="w-full text-left">
                                            <thead className="bg-white/5 text-xs text-white/50 uppercase">
                                                <tr>
                                                    <th className="p-4">Área</th>
                                                    <th className="p-4">Promedio</th>
                                                    <th className="p-4">Desviación</th>
                                                    <th className="p-4 w-1/2">Visualización</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {stats.materiaStats.map((m: any, i: number) => (
                                                    <tr key={i} className="hover:bg-white/5">
                                                        <td className="p-3 pl-6 font-bold text-white text-sm">{m.nombre}</td>
                                                        <td className="p-3 text-blue-300 font-mono font-bold">{m.promedio.toFixed(1)}</td>
                                                        <td className="p-3 text-white/50 font-mono">{m.desviacion.toFixed(1)}</td>
                                                        <td className="p-3 pr-6">
                                                            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                                                <div className="h-full bg-blue-500" style={{ width: `${Math.min(100, (m.promedio / 100) * 100)}%` }} />
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* === TAB: STATISTICS === */}
                            {activeTab === 'stats' && (
                                <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-300">
                                    <h3 className="text-2xl font-bold text-white mb-6">🔬 Estadísticas Avanzadas</h3>
                                    <div className="bg-[#13151f] rounded-xl border border-white/10 overflow-hidden">
                                        <table className="w-full text-left">
                                            <thead className="bg-indigo-900/30 text-indigo-300 text-xs uppercase font-bold">
                                                <tr>
                                                    <th className="p-4">Competencia</th>
                                                    <th className="p-4">Promedio</th>
                                                    <th className="p-4">Mínimo</th>
                                                    <th className="p-4">Máximo</th>
                                                    <th className="p-4">Desviación Estándar</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5 text-sm">
                                                {stats.materiaStats.map((m: any, i: number) => (
                                                    <tr key={i} className="hover:bg-white/5">
                                                        <td className="p-4 font-bold text-white">{m.nombre}</td>
                                                        <td className="p-4 font-mono text-blue-400">{m.promedio.toFixed(1)}</td>
                                                        <td className="p-4 font-mono text-rose-400">{m.min}</td>
                                                        <td className="p-4 font-mono text-emerald-400">{m.max}</td>
                                                        <td className="p-4 font-mono text-amber-400">{m.desviacion.toFixed(2)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* === TAB: RANKING === */}
                            {activeTab === 'ranking' && (
                                <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-300">
                                    <h3 className="text-2xl font-bold text-white mb-6">🏆 Cuadro de Honor</h3>
                                    <div className="bg-[#13151f] rounded-xl border border-white/10 overflow-hidden max-w-4xl mx-auto">
                                        <table className="w-full text-left">
                                            <thead className="bg-amber-900/20 text-amber-500 text-xs uppercase font-bold">
                                                <tr>
                                                    <th className="p-4 text-center w-16">Rank</th>
                                                    <th className="p-4">Estudiante</th>
                                                    <th className="p-4 text-center">Global</th>
                                                    <th className="p-4 text-center">Medalla</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5 text-sm">
                                                {stats.ranking.map((est: Estudiante, i: number) => {
                                                    const medals = ['🥇 ORO', '🥈 PLATA', '🥉 BRONCE'];
                                                    const isTop = i < 3;
                                                    return (
                                                        <tr key={`${est.informacion_personal.numero_identificacion || 'rank'}-${i}`} className="hover:bg-amber-500/5 transition-colors">
                                                            <td className="p-4 text-center font-mono text-white/30">{i + 1}</td>
                                                            <td className={`p-4 ${isTop ? 'font-bold text-white' : 'text-white/70'}`}>
                                                                {est.informacion_personal.nombres} {est.informacion_personal.apellidos}
                                                            </td>
                                                            <td className="p-4 text-center font-bold text-emerald-400">{est.puntaje_global}</td>
                                                            <td className="p-4 text-center text-xs">{i < 3 ? medals[i] : '-'}</td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* === TAB: ANÁLISIS RIESGO (Enriquecido) === */}
                            {activeTab === 'risk' && (
                                <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                                                🚨 Diagnóstico de Riesgo
                                                <span className="text-sm bg-rose-500/20 text-rose-400 px-2 py-1 rounded border border-rose-500/30">
                                                    {stats.criticalQuestions.length} Preguntas Críticas
                                                </span>
                                            </h3>
                                            <p className="text-white/40 text-sm mt-1">Preguntas con tasa de fallo {'>'} 40%, desglosadas por distractores.</p>
                                        </div>
                                    </div>

                                    <div className="overflow-hidden rounded-xl border border-white/10 bg-[#13151f]">
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-rose-900/30 text-rose-200 text-xs uppercase font-bold">
                                                <tr>
                                                    <th className="p-3 w-32">Área</th>
                                                    <th className="p-3 w-16 text-center">#</th>
                                                    <th className="p-3 w-24 text-center">Fallo</th>
                                                    <th className="p-3 w-32">Nivel Riesgo</th>
                                                    <th className="p-3 text-center w-16">Corr.</th>
                                                    <th className="p-3 text-center w-16">% A</th>
                                                    <th className="p-3 text-center w-16">% B</th>
                                                    <th className="p-3 text-center w-16">% C</th>
                                                    <th className="p-3 text-center w-16">% D</th>
                                                    <th className="p-3 w-48">Distractor Fuerte</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5 text-slate-300">
                                                {stats.criticalQuestions.map((q: any, i: number) => {
                                                    const total = Math.max(q.total, 1);
                                                    const getPct = (k: string) => {
                                                        const val = q.counts[k] || 0;
                                                        return ((val / total) * 100).toFixed(1) + '%';
                                                    };

                                                    // Buscando distractor
                                                    const opts = ['A', 'B', 'C', 'D'].map(l => ({ l, v: (q.counts[l] || 0) / total }));
                                                    const distractors = opts.filter(o => o.l !== q.correct.toUpperCase());
                                                    distractors.sort((a, b) => b.v - a.v);
                                                    const topD = distractors[0];
                                                    const isHigh = topD.v > 0.3;

                                                    return (
                                                        <tr key={i} className="hover:bg-white/5 transition-colors group">
                                                            <td className="p-3 font-semibold text-white/50 group-hover:text-white uppercase text-xs">{q.materia}</td>
                                                            <td className="p-3 text-center font-bold text-white">{q.num}</td>
                                                            <td className="p-3 text-center font-bold text-rose-400">{(q.rate * 100).toFixed(1)}%</td>
                                                            <td className="p-3">
                                                                <div className="h-1.5 w-full bg-rose-900/30 rounded-full overflow-hidden">
                                                                    <div className="h-full bg-rose-500" style={{ width: `${q.rate * 100}%` }} />
                                                                </div>
                                                            </td>
                                                            <td className="p-3 text-center font-bold text-emerald-400 bg-emerald-500/5">{q.correct}</td>
                                                            {['A', 'B', 'C', 'D'].map(opt => (
                                                                <td key={opt} className={`p-3 text-center text-xs ${opt === q.correct.toUpperCase() ? 'text-emerald-400 font-bold bg-emerald-500/10' : 'text-white/40'}`}>
                                                                    {getPct(opt)}
                                                                </td>
                                                            ))}
                                                            <td className="p-3 text-xs">
                                                                {topD.v > 0 ? (
                                                                    <span className={`px-2 py-0.5 rounded border ${isHigh ? 'border-rose-500/50 text-rose-300 bg-rose-500/10 font-bold' : 'border-white/10 text-white/50'}`}>
                                                                        Opción {topD.l} ({(topD.v * 100).toFixed(0)}%)
                                                                    </span>
                                                                ) : '-'}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* === TAB: CORRELACIÓN ENTRE ÁREAS === */}
                            {activeTab === 'corr' && stats.correlationMatrix && (
                                <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
                                    <div>
                                        <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                                            🔗 Correlación entre Áreas
                                        </h3>
                                        <p className="text-white/40 text-sm mt-1">¿Los estudiantes fuertes en un área también lo son en otras?</p>
                                    </div>

                                    <div className="bg-[#13151f] rounded-xl border border-white/10 overflow-hidden p-6">
                                        <h4 className="text-lg font-bold text-white mb-4">Matriz de Correlación de Pearson</h4>
                                        <table className="w-auto mx-auto">
                                            <thead>
                                                <tr>
                                                    <th className="w-16"></th>
                                                    {stats.correlationMatrix[0]?.cols.map((c: any) => (
                                                        <th key={c.col} className="w-20 p-3 text-center font-bold bg-violet-600 text-white text-xs">{c.col}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {stats.correlationMatrix.map((row: any, rowIdx: number) => (
                                                    <tr key={row.row}>
                                                        <td className="p-3 text-center font-bold bg-violet-600 text-white text-xs">{row.row}</td>
                                                        {row.cols.map((c: any, colIdx: number) => {
                                                            let bgColor = 'bg-white/5';
                                                            if (rowIdx === colIdx) bgColor = 'bg-violet-200/20';
                                                            else if (c.value >= 0.7) bgColor = 'bg-emerald-500/40';
                                                            else if (c.value >= 0.5) bgColor = 'bg-emerald-500/20';
                                                            else if (c.value >= 0.3) bgColor = 'bg-amber-500/20';
                                                            else bgColor = 'bg-rose-500/20';
                                                            return (
                                                                <td key={c.col} className={`w-20 p-3 text-center font-mono text-sm ${bgColor}`}>
                                                                    {c.value.toFixed(2)}
                                                                </td>
                                                            );
                                                        })}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        <div className="mt-6 flex justify-center gap-6 text-xs text-white/60">
                                            <span className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-emerald-500/40"></span> ≥ 0.70 Fuerte</span>
                                            <span className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-emerald-500/20"></span> 0.50-0.69 Moderada</span>
                                            <span className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-amber-500/20"></span> 0.30-0.49 Débil</span>
                                            <span className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-rose-500/20"></span> &lt; 0.30 Muy débil</span>
                                        </div>
                                    </div>

                                    {stats.correlationInsights && (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
                                                <div className="text-emerald-400 font-bold text-sm mb-2">🔗 Correlación Más Fuerte</div>
                                                <div className="text-white text-xl font-bold">{stats.correlationInsights.maxPair[0]} ↔ {stats.correlationInsights.maxPair[1]}</div>
                                                <div className="text-emerald-300 font-mono">r = {stats.correlationInsights.maxCorr.toFixed(2)}</div>
                                            </div>
                                            <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4">
                                                <div className="text-rose-400 font-bold text-sm mb-2">⚡ Correlación Más Débil</div>
                                                <div className="text-white text-xl font-bold">{stats.correlationInsights.minPair[0]} ↔ {stats.correlationInsights.minPair[1]}</div>
                                                <div className="text-rose-300 font-mono">r = {stats.correlationInsights.minCorr.toFixed(2)}</div>
                                            </div>
                                        </div>
                                    )}

                                    {/* GUÍA EDUCATIVA */}
                                    <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-5 space-y-4">
                                        <h4 className="text-blue-400 font-bold text-base flex items-center gap-2">📖 ¿Qué significa esto?</h4>

                                        <div className="space-y-3 text-sm">
                                            <div>
                                                <div className="text-white font-semibold">¿Qué es "r" (Coeficiente de Pearson)?</div>
                                                <p className="text-white/60">Mide qué tan relacionadas están dos áreas. Si los estudiantes buenos en una también lo son en otra, r será alto.</p>
                                            </div>

                                            <div>
                                                <div className="text-white font-semibold">¿Por qué r va de -1 a 1?</div>
                                                <div className="text-white/60 space-y-1">
                                                    <p>• <span className="text-emerald-400">r = 1.00</span>: Correlación perfecta (suben juntas)</p>
                                                    <p>• <span className="text-white/50">r = 0.00</span>: Sin relación (independientes)</p>
                                                    <p>• <span className="text-rose-400">r = -1.00</span>: Correlación inversa (una sube, otra baja)</p>
                                                </div>
                                            </div>

                                            <div>
                                                <div className="text-white font-semibold">¿Cómo usar esta información?</div>
                                                <div className="text-white/60">
                                                    <p>• <span className="text-emerald-400">≥0.70</span>: Áreas muy relacionadas. Mejorar una puede ayudar a la otra.</p>
                                                    <p>• <span className="text-amber-400">0.30-0.69</span>: Relación moderada. Considerar enseñanza integrada.</p>
                                                    <p>• <span className="text-rose-400">&lt;0.30</span>: Áreas independientes. Requieren estrategias separadas.</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* === TAB: PERFIL POR NIVEL === */}
                            {activeTab === 'profile' && stats.perfilPorNivel && (
                                <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
                                    <div>
                                        <h3 className="text-2xl font-bold text-white">👤 Perfil del Estudiante por Nivel</h3>
                                        <p className="text-white/40 text-sm mt-1">Caracterización del estudiante promedio en cada nivel</p>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        {stats.perfilPorNivel.map((perfil: any) => (
                                            <div key={perfil.nivel} className="bg-[#13151f] rounded-xl border border-white/10 overflow-hidden">
                                                <div className={`px-4 py-3 border-b border-white/10 bg-gradient-to-r ${perfil.nivel === 'Superior' ? 'from-emerald-500/20 to-emerald-500/5' :
                                                    perfil.nivel === 'Alto' ? 'from-blue-500/20 to-blue-500/5' :
                                                        perfil.nivel === 'Básico' ? 'from-amber-500/20 to-amber-500/5' :
                                                            'from-rose-500/20 to-rose-500/5'
                                                    }`}>
                                                    <div className="flex justify-between items-center">
                                                        <span className="font-bold text-lg text-white">{perfil.emoji} NIVEL {perfil.nivel.toUpperCase()}</span>
                                                        <span className="text-white/50 text-sm">{perfil.count} estudiantes</span>
                                                    </div>
                                                    <div className="text-white/40 text-xs">{perfil.rango}</div>
                                                </div>
                                                <div className="p-4 space-y-3">
                                                    <div className="flex justify-between">
                                                        <span className="text-white/50">Promedio Global:</span>
                                                        <span className="font-bold text-xl text-white">{perfil.promedioGlobal.toFixed(0)}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-white/50">💪 Área fuerte:</span>
                                                        <span className="font-medium text-emerald-400">{perfil.fortaleza?.area} ({perfil.fortaleza?.promedio.toFixed(1)})</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-white/50">📉 Área débil:</span>
                                                        <span className="font-medium text-rose-400">{perfil.debilidad?.area} ({perfil.debilidad?.promedio.toFixed(1)})</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-white/50">📊 Brecha:</span>
                                                        <span className={`font-medium ${perfil.brecha > 15 ? 'text-amber-400' : 'text-white/60'}`}>{perfil.brecha.toFixed(1)} pts</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* GUÍA EDUCATIVA */}
                                    <div className="bg-teal-500/5 border border-teal-500/20 rounded-xl p-5 space-y-4">
                                        <h4 className="text-teal-400 font-bold text-base">📖 ¿Cómo interpretar estos perfiles?</h4>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <div className="text-white font-semibold mb-2">¿Qué significan los niveles?</div>
                                                <div className="text-white/60 space-y-1">
                                                    <p>• <span className="text-emerald-400">SUPERIOR (&gt;400)</span>: Excelencia académica</p>
                                                    <p>• <span className="text-blue-400">ALTO (301-400)</span>: Buen desempeño</p>
                                                    <p>• <span className="text-amber-400">BÁSICO (201-300)</span>: Requiere refuerzo</p>
                                                    <p>• <span className="text-rose-400">BAJO (≤200)</span>: Intervención urgente</p>
                                                </div>
                                            </div>

                                            <div>
                                                <div className="text-white font-semibold mb-2">¿Qué es la brecha entre áreas?</div>
                                                <div className="text-white/60 space-y-1">
                                                    <p>Diferencia entre el área más fuerte y la más débil.</p>
                                                    <p>• <span className="text-amber-400">&gt;15 pts</span>: Perfil desigual, atención diferenciada</p>
                                                    <p>• <span className="text-white/50">&lt;10 pts</span>: Perfil homogéneo</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="text-white/50 text-xs pt-2 border-t border-white/10">
                                            💡 Use el área más fuerte como ancla para el aprendizaje. Los estudiantes de nivel BAJO requieren intervención integral.
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* === TAB: AUDITORÍA (Segmentación) === */}
                            {activeTab === 'audit' && (
                                <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
                                    <h3 className="text-2xl font-bold text-white">📋 Auditoría Nominal de Respuestas</h3>

                                    <div className="grid grid-cols-1 gap-8">
                                        {stats.criticalQuestions.slice(0, 10).map((q: any, i: number) => ( // Locked to top 10 for perf
                                            <div key={i} className="bg-[#13151f] border border-white/10 rounded-xl overflow-hidden shadow-lg">
                                                <div className="px-4 py-3 bg-[#1a1d2d] border-b border-white/10 flex justify-between items-center">
                                                    <span className="font-bold text-white text-sm uppercase flex items-center gap-2">
                                                        <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                                                        {q.materia} - Pregunta {q.num}
                                                    </span>
                                                    <span className="text-xs font-mono text-white/40 bg-white/5 px-2 py-1 rounded">Fallo: {(q.rate * 100).toFixed(0)}%</span>
                                                </div>
                                                <div className="grid grid-cols-5 divide-x divide-white/10">
                                                    {['A', 'B', 'C', 'D', 'NR'].map(opt => {
                                                        const isCorrect = opt === q.correct.toUpperCase();
                                                        const students = q.students[opt] || [];
                                                        const isDistractor = !isCorrect && students.length > 0 && (students.length / q.total > 0.25);

                                                        return (
                                                            <div key={opt} className={`p-0 ${isCorrect ? 'bg-emerald-500/5' : isDistractor ? 'bg-rose-500/5' : ''}`}>
                                                                <div className={`p-2 text-center text-xs font-bold border-b border-white/10 ${isCorrect ? 'text-emerald-400' : isDistractor ? 'text-rose-400' : 'text-white/40'}`}>
                                                                    Opción {opt} ({students.length})
                                                                </div>
                                                                <div className="max-h-48 overflow-y-auto custom-scrollbar p-2 space-y-1">
                                                                    {students.length > 0 ? students.map((S: string, idx: number) => (
                                                                        <div key={idx} className="text-[10px] text-white/60 truncate hover:text-white p-1 hover:bg-white/5 rounded" title={S}>
                                                                            {idx + 1}. {S}
                                                                        </div>
                                                                    )) : (
                                                                        <div className="text-[10px] text-white/20 text-center py-4">-</div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                        {stats.criticalQuestions.length > 10 && (
                                            <div className="text-center text-white/30 italic p-4 bg-white/5 rounded-lg border border-white/5">
                                                ⚠️ Mostrando solo las primeras 10 preguntas críticas para optimizar rendimiento de vista previa. El reporte Excel incluirá todas.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}


                            {/* === TAB: BASE DE DATOS (Editable) === */}
                            {activeTab === 'db' && (
                                <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-300">
                                    <h3 className="text-2xl font-bold text-white">💾 Base de Datos Maestra</h3>
                                    <div className="bg-[#13151f] rounded-xl border border-white/10 overflow-hidden shadow-2xl">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left text-sm whitespace-nowrap">
                                                <thead className="bg-[#1a1d2d] text-white/50 text-xs uppercase font-bold sticky top-0 z-10 shadow-md">
                                                    <tr>
                                                        <th className="p-3 w-16 text-center">#</th>
                                                        <th className="p-3 w-32">ID</th>
                                                        <th className="p-3 w-48">Nombres</th>
                                                        <th className="p-3 w-48">Apellidos</th>
                                                        <th className="p-3 w-48">Institución</th>
                                                        <th className="p-3 w-20 text-center text-emerald-400">Global</th>
                                                        <th className="p-3 text-center w-16">Mat</th>
                                                        <th className="p-3 text-center w-16">Lec</th>
                                                        <th className="p-3 text-center w-16">Soc</th>
                                                        <th className="p-3 text-center w-16">Cie</th>
                                                        <th className="p-3 text-center w-16">Ing</th>
                                                        <th className="p-3 text-center w-24 text-blue-300">S1</th>
                                                        <th className="p-3 text-center w-24 text-blue-300">S2</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-white/5">
                                                    {datosEdicion.map((est, i) => (
                                                        <tr key={`${est.informacion_personal.numero_identificacion || 'unknown'}-${i}`} className="hover:bg-white/5 group transition-colors">
                                                            <td className="p-3 text-center text-white/20 text-xs">{i + 1}</td>
                                                            <td className="p-3 font-mono text-white/30 text-xs">{est.informacion_personal.numero_identificacion}</td>
                                                            <td className="p-3">
                                                                <input
                                                                    value={est.informacion_personal.nombres}
                                                                    onChange={(e) => handleCellEdit(est.informacion_personal.numero_identificacion, 'nombres', e.target.value)}
                                                                    className="bg-transparent text-white w-full outline-none focus:text-purple-400 focus:bg-white/5 rounded px-2 py-1 transition-all"
                                                                />
                                                            </td>
                                                            <td className="p-3">
                                                                <input
                                                                    value={est.informacion_personal.apellidos}
                                                                    onChange={(e) => handleCellEdit(est.informacion_personal.numero_identificacion, 'apellidos', e.target.value)}
                                                                    className="bg-transparent text-white w-full outline-none focus:text-purple-400 focus:bg-white/5 rounded px-2 py-1 transition-all"
                                                                />
                                                            </td>
                                                            <td className="p-3">
                                                                <input
                                                                    value={est.informacion_personal.institucion}
                                                                    onChange={(e) => handleCellEdit(est.informacion_personal.numero_identificacion, 'institucion', e.target.value)}
                                                                    className="bg-transparent text-white/60 w-full outline-none focus:text-purple-400 focus:bg-white/5 rounded px-2 py-1 transition-all text-xs uppercase"
                                                                />
                                                            </td>
                                                            <td className="p-3 font-bold text-center text-emerald-400 bg-emerald-500/5">{est.puntaje_global}</td>
                                                            <td className="p-3 text-center text-white/50">{est.puntajes?.['matemáticas']?.puntaje}</td>
                                                            <td className="p-3 text-center text-white/50">{est.puntajes?.['lectura crítica']?.puntaje}</td>
                                                            <td className="p-3 text-center text-white/50">{est.puntajes?.['sociales y ciudadanas']?.puntaje}</td>
                                                            <td className="p-3 text-center text-white/50">{est.puntajes?.['ciencias naturales']?.puntaje}</td>
                                                            <td className="p-3 text-center text-white/50">{est.puntajes?.['inglés']?.puntaje}</td>
                                                            <td className="p-3 text-center font-mono text-blue-300/70 text-xs">
                                                                {est.s1_aciertos !== undefined && est.s1_total ? `${est.s1_aciertos}/${est.s1_total}` : '-'}
                                                            </td>
                                                            <td className="p-3 text-center font-mono text-blue-300/70 text-xs">
                                                                {est.s2_aciertos !== undefined && est.s2_total ? `${est.s2_aciertos}/${est.s2_total}` : '-'}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}

                        </div>
                    )}
                </div>

                {/* BOTTOM TAB BAR (Excel Style) */}
                <div className="h-14 bg-[#090a0f] border-t border-white/10 flex items-center px-4 space-x-2 overflow-x-auto custom-scrollbar shrink-0 shadow-[0_-5px_15px_rgba(0,0,0,0.3)] z-50">
                    {[
                        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, color: 'text-blue-400' },
                        { id: 'stats', label: 'Estadísticas', icon: TrendingUp, color: 'text-purple-400' },
                        { id: 'ranking', label: 'Ranking', icon: Trophy, color: 'text-amber-400' },
                        { id: 'risk', label: 'Análisis Preguntas', icon: AlertTriangle, color: 'text-rose-400' },
                        { id: 'corr', label: 'Correlación', icon: Link, color: 'text-violet-400' },
                        { id: 'profile', label: 'Perfil por Nivel', icon: UserCircle, color: 'text-teal-400' },
                        { id: 'audit', label: 'Segmentación', icon: Users, color: 'text-cyan-400' },
                        { id: 'db', label: 'Base de Datos', icon: Database, color: 'text-emerald-400' },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            //@ts-ignore
                            onClick={() => setActiveTab(tab.id)}
                            className={`
                                h-10 px-4 flex items-center gap-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap
                                ${activeTab === tab.id
                                    ? 'bg-[#1a1d2d] text-white border border-white/10 shadow-lg scale-105'
                                    : 'text-white/40 hover:text-white hover:bg-white/5'}
                            `}
                        >
                            <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? tab.color : 'grayscale opacity-50'}`} />
                            {tab.label}
                        </button>
                    ))}
                </div>

            </div>
        </div>
    );
}
