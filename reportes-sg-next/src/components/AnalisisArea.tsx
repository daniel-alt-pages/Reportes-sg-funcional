
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
    Users
} from 'lucide-react';

// Tipos para el análisis
type MateriaKey = 'matemáticas' | 'lectura crítica' | 'sociales y ciudadanas' | 'ciencias naturales' | 'inglés';

interface AnalisisProps {
    estudiantes: Estudiante[];
    filtroInstitucion: string;
    onClose: () => void;
}

// Configuración visual de las áreas con iconos profesionales
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

    // Filtrar estudiantes según selección global
    const estudiantesActuales = useMemo(() => {
        if (!filtroInstitucion || filtroInstitucion === 'todas') return estudiantes;
        return estudiantes.filter(e => e.informacion_personal.institucion === filtroInstitucion);
    }, [estudiantes, filtroInstitucion]);

    // Cálculos de estadísticas por área y pregunta
    const statsArea = useMemo(() => {
        if (!areaSeleccionada) return null;

        const conteoPreguntas: Record<number, {
            numero: number;
            correcta: string;
            total: number;
            aciertos: number;
            opciones: Record<string, Estudiante[]>;
        }> = {};

        estudiantesActuales.forEach(est => {
            const respuestas = est.respuestas_detalladas?.[areaSeleccionada] || [];
            respuestas.forEach(resp => {
                if (!conteoPreguntas[resp.numero]) {
                    conteoPreguntas[resp.numero] = {
                        numero: resp.numero,
                        correcta: resp.respuesta_correcta,
                        total: 0,
                        aciertos: 0,
                        opciones: { 'A': [], 'B': [], 'C': [], 'D': [], '-': [] }
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

        return Object.values(conteoPreguntas).sort((a, b) => a.numero - b.numero);
    }, [estudiantesActuales, areaSeleccionada]);

    // Render: ChromaGrid (Selección de Área)
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
                        // Solo contar estudiantes con puntaje > 0 en esta área
                        const estudiantesConPuntaje = estudiantesActuales.filter(est => (est.puntajes?.[key]?.puntaje || 0) > 0);
                        const sumaPuntajes = estudiantesConPuntaje.reduce((acc, est) => acc + (est.puntajes?.[key]?.puntaje || 0), 0);
                        const promedio = estudiantesConPuntaje.length > 0 ? Math.round(sumaPuntajes / estudiantesConPuntaje.length) : 0;

                        return (
                            <button
                                key={key}
                                onClick={() => setAreaSeleccionada(key as MateriaKey)}
                                className="group relative h-72 rounded-3xl overflow-hidden cursor-pointer transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/20 border border-white/10 hover:border-white/30"
                            >
                                {/* Fondo Gradiente Animado */}
                                <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient} opacity-30 group-hover:opacity-100 transition-opacity duration-500`} />
                                <div className="absolute inset-0 bg-black/40 group-hover:bg-transparent transition-colors duration-500" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />

                                {/* Contenido */}
                                <div className="absolute inset-0 p-7 flex flex-col justify-between z-10">
                                    <div className="flex justify-between items-start">
                                        <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/20 group-hover:bg-white/20 transition-colors shadow-lg shadow-black/20">
                                            {config.icon}
                                        </div>
                                        {/* Promedio rediseñado: Corner Top-Right */}
                                        <div className="text-right transform translate-x-1 group-hover:translate-x-0 transition-transform duration-300">
                                            <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-0.5 block">Promedio</span>
                                            <span className="text-4xl font-black text-white leading-none">{promedio}</span>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-2xl font-bold text-white leading-tight mb-3 group-hover:text-white/90 transition-colors w-full break-words">
                                            {config.label}
                                        </h3>
                                        <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
                                            <div className="h-full bg-white transition-all duration-1000 w-0 group-hover:w-full" style={{ transitionDuration: '1s' }} />
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

    // Render: Vista Detallada (Preguntas)
    const config = AREAS_CONFIG[areaSeleccionada];

    return (
        <div className="animate-in slide-in-from-right-8 duration-500">
            {/* Header Sticky Profesional */}
            <div className="sticky top-0 z-30 bg-[#0f111a]/90 backdrop-blur-md border-b border-white/10 mb-8 -mx-6 px-8 py-4 flex items-center justify-between shadow-2xl shadow-black/50">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => setAreaSeleccionada(null)}
                        className="group flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all border border-white/5 hover:border-white/10"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        <span className="font-medium">Volver</span>
                    </button>
                    <div className="h-8 w-px bg-white/10 mx-2"></div>
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

                {/* Métricas Resumen - Compacto y Limpio */}
                <div className="flex items-center gap-8 bg-black/20 px-6 py-2 rounded-xl border border-white/5">
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] text-white/30 uppercase tracking-widest font-bold">Preguntas</span>
                        <span className="text-xl font-bold text-white tabular-nums">{statsArea?.length || 0}</span>
                    </div>
                    <div className="w-px h-8 bg-white/10"></div>
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] text-white/30 uppercase tracking-widest font-bold">Efectividad</span>
                        <span className="text-xl font-bold text-emerald-400 tabular-nums">
                            {Math.round((statsArea?.reduce((acc, q) => acc + (q.aciertos / q.total) * 100, 0) || 0) / (statsArea?.length || 1))}%
                        </span>
                    </div>
                </div>
            </div>

            {/* Lista de Preguntas */}
            <div className="space-y-4 max-w-6xl mx-auto pb-24 px-4">
                {statsArea?.map((preg) => {
                    const porcentajeError = 100 - Math.round((preg.aciertos / preg.total) * 100);
                    const isExpanded = preguntaExpandida === preg.numero;

                    // Colores semánticos más sutiles
                    const isCritical = porcentajeError > 60;
                    const isModerate = porcentajeError > 30;

                    const statusColor = isCritical ? 'text-rose-400' : isModerate ? 'text-amber-400' : 'text-emerald-400';
                    const statusIcon = isCritical ? <AlertCircle className="w-4 h-4" /> : isModerate ? <div className="w-2 h-2 rounded-full bg-amber-400" /> : <CheckCircle2 className="w-4 h-4" />;

                    return (
                        <div
                            key={preg.numero}
                            className={`group bg-[#13151f] border rounded-xl overflow-hidden transition-all duration-300 ${isExpanded ? 'border-purple-500/50 shadow-xl shadow-purple-900/10' : 'border-white/5 hover:border-white/10 hover:shadow-lg'}`}
                        >
                            {/* Cabecera de la Pregunta */}
                            <button
                                onClick={() => setPreguntaExpandida(isExpanded ? null : preg.numero)}
                                className="w-full px-6 py-5 flex items-center justify-between"
                            >
                                <div className="flex items-center gap-6">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold border transition-colors ${isExpanded ? 'bg-purple-500/10 border-purple-500/30 text-purple-300' : 'bg-white/5 border-white/10 text-white/50 group-hover:text-white group-hover:bg-white/10'}`}>
                                        {preg.numero}
                                    </div>
                                    <div className="text-left">
                                        <div className="flex items-center gap-4 mb-1.5">
                                            <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-white/5 border border-white/10">
                                                <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Clave</span>
                                                <span className="text-sm font-bold text-white px-1">{preg.correcta}</span>
                                            </div>
                                            {isCritical && (
                                                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
                                                    <AlertCircle className="w-3 h-3" />
                                                    <span>Crítico</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-8 ml-auto mr-8">
                                    {/* Mini estadística en cabecera */}
                                    <div className="flex flex-col items-end min-w-[100px]">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-sm font-bold tabular-nums ${statusColor}`}>{porcentajeError}%</span>
                                            <span className="text-[10px] uppercase text-white/30 font-medium">Error</span>
                                        </div>
                                        <div className="w-24 h-1 bg-white/5 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${isCritical ? 'bg-rose-500' : isModerate ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                                style={{ width: `${porcentajeError}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className={`w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/40 transition-all duration-300 ${isExpanded ? 'rotate-180 bg-white/10 text-white' : 'group-hover:text-white group-hover:bg-white/10'}`}>
                                    <ChevronDown className="w-4 h-4" />
                                </div>
                            </button>

                            {/* Detalle Expandido */}
                            {isExpanded && (
                                <div className="px-6 pb-8 pt-2 border-t border-dashed border-white/10 bg-black/20 animate-in slide-in-from-top-1">
                                    <div className="flex items-center gap-2 mb-6 opacity-60">
                                        <Users className="w-4 h-4" />
                                        <h4 className="text-xs font-bold uppercase tracking-widest">Distribución de Estudiantes</h4>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        {Object.entries(preg.opciones).map(([opcion, estudiantesConEstaOpcion]) => {
                                            if (opcion === '-') return null;

                                            const esCorrecta = opcion === preg.correcta;
                                            const totalOpcion = estudiantesConEstaOpcion.length;
                                            const porcentaje = Math.round((totalOpcion / preg.total) * 100);
                                            const esDominante = porcentaje > 40;

                                            return (
                                                <div
                                                    key={opcion}
                                                    className={`
                                                        relative overflow-hidden rounded-xl border p-5 transition-all
                                                        ${esCorrecta
                                                            ? 'bg-gradient-to-br from-emerald-900/20 to-emerald-900/5 border-emerald-500/30'
                                                            : 'bg-[#0f111a] border-white/5 hover:border-white/10'
                                                        }
                                                        ${esDominante ? 'lg:col-span-2' : ''}
                                                    `}
                                                >
                                                    {esCorrecta && (
                                                        <div className="absolute top-0 right-0 bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-bl-xl text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 border-b border-l border-emerald-500/20">
                                                            <CheckCircle2 className="w-3 h-3" /> Correcta
                                                        </div>
                                                    )}

                                                    <div className="flex justify-between items-start mb-4">
                                                        <div className="flex items-center gap-4">
                                                            <span className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold ${esCorrecta ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'bg-white/5 text-white/40 border border-white/5'}`}>
                                                                {opcion}
                                                            </span>
                                                            <div>
                                                                <span className="block text-3xl font-black text-white leading-none mb-1">{porcentaje}%</span>
                                                                <span className="text-xs text-white/30 uppercase font-medium">{totalOpcion} respuestas</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Barra de progreso */}
                                                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mb-6">
                                                        <div
                                                            className={`h-full rounded-full ${esCorrecta ? 'bg-emerald-500' : 'bg-white/20'}`}
                                                            style={{ width: `${porcentaje}%` }}
                                                        />
                                                    </div>

                                                    {/* Grid de Avatares/Nombres mejorado */}
                                                    <div className={`
                                                        grid gap-3
                                                        ${esDominante ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}
                                                        ${totalOpcion > 12 ? 'max-h-64 overflow-y-auto pr-2 custom-scrollbar' : ''}
                                                    `}>
                                                        {estudiantesConEstaOpcion.map((est, idx) => (
                                                            <div
                                                                key={idx}
                                                                className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors group/item"
                                                            >
                                                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-[9px] font-bold text-white shadow-sm ring-1 ring-white/10 group-hover/item:ring-white/30">
                                                                    {est.informacion_personal.nombres?.[0]}{est.informacion_personal.apellidos?.[0]}
                                                                </div>
                                                                <div className="flex flex-col min-w-0">
                                                                    <span className="text-xs text-white/70 font-medium truncate group-hover/item:text-white transition-colors">
                                                                        {est.informacion_personal.nombres} {est.informacion_personal.apellidos}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                        {estudiantesConEstaOpcion.length === 0 && (
                                                            <div className="col-span-full py-4 text-center border border-dashed border-white/5 rounded-lg">
                                                                <span className="text-white/20 text-xs italic">Ningún estudiante seleccionó esta opción</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// Nota: Asegurarse de tener 'lucide-react' instalado
