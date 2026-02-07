import React from 'react';
import { DashboardStats, InstitucionData } from '@/types';
import MetricCard from './MetricCard';

interface DashboardOverviewProps {
    stats: DashboardStats;
    rankingInstitucional: [string, InstitucionData][];
}

export default function DashboardOverview({ stats, rankingInstitucional }: DashboardOverviewProps) {
    return (
        <div className="space-y-6">
            {/* Métricas principales */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                <MetricCard titulo="Total" valor={stats.total} icono="👥" color="from-blue-600 to-blue-800" />
                <MetricCard titulo="Promedio" valor={`${stats.promedio}`} subtitulo="/500 pts" icono="📊" color="from-purple-600 to-purple-800" />
                <MetricCard titulo="Máximo" valor={stats.maximo} icono="🏆" color="from-amber-500 to-amber-700" />
                <MetricCard titulo="Superior" valor={stats.niveles.superior} subtitulo={`${((stats.niveles.superior / stats.total) * 100).toFixed(0)}%`} icono="⭐" color="from-green-600 to-green-800" />
                <MetricCard titulo="Alto" valor={stats.niveles.alto} subtitulo={`${((stats.niveles.alto / stats.total) * 100).toFixed(0)}%`} icono="🔵" color="from-sky-500 to-sky-700" />
                <MetricCard titulo="Sesiones OK" valor={stats.conAmbas} subtitulo={`${((stats.conAmbas / stats.total) * 100).toFixed(0)}% completas`} icono="✅" color="from-teal-500 to-teal-700" />
            </div>

            {/* Fila de gráficos principales */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Distribución por nivel */}
                <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        📊 Distribución por Nivel
                    </h3>
                    <div className="space-y-3">
                        {[
                            { nivel: 'Superior', count: stats.niveles.superior, color: 'bg-green-500', emoji: '⭐' },
                            { nivel: 'Alto', count: stats.niveles.alto, color: 'bg-blue-500', emoji: '🔵' },
                            { nivel: 'Medio', count: stats.niveles.medio, color: 'bg-yellow-500', emoji: '🟡' },
                            { nivel: 'Bajo', count: stats.niveles.bajo, color: 'bg-red-500', emoji: '🔴' },
                        ].map(item => (
                            <div key={item.nivel} className="flex items-center gap-3">
                                <span className="w-16 text-sm text-white/70">{item.emoji} {item.nivel}</span>
                                <div className="flex-1 h-8 bg-white/10 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full ${item.color} flex items-center justify-end pr-2 transition-all duration-500`}
                                        style={{ width: `${(item.count / stats.total) * 100}%` }}
                                    >
                                        <span className="text-white text-xs font-bold">{item.count}</span>
                                    </div>
                                </div>
                                <span className="w-12 text-right text-white/50 text-sm">
                                    {((item.count / stats.total) * 100).toFixed(0)}%
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Distribución de puntajes */}
                <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        📈 Histograma de Puntajes
                    </h3>
                    <div className="flex items-end gap-1 h-40">
                        {Object.entries(stats.distribucion).map(([rango, count]) => {
                            const maxCount = Math.max(...Object.values(stats.distribucion));
                            const height = maxCount > 0 ? (count / maxCount) * 100 : 0;
                            const isHighlight = rango.includes('400') || rango.includes('450');
                            return (
                                <div key={rango} className="flex-1 flex flex-col items-center gap-1">
                                    <span className="text-xs text-white/70">{count}</span>
                                    <div
                                        className={`w-full rounded-t transition-all duration-500 ${isHighlight ? 'bg-gradient-to-t from-green-600 to-green-400' : 'bg-gradient-to-t from-purple-600 to-purple-400'}`}
                                        style={{ height: `${height}%`, minHeight: count > 0 ? '8px' : '2px' }}
                                    />
                                    <span className="text-[9px] text-white/40 rotate-45 origin-left whitespace-nowrap">
                                        {rango.split('-')[0]}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Promedios por materia */}
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    📚 Promedio por Materia
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {stats.promediosPorMateria.map((mat) => {
                        // Colores temáticos por materia
                        const getMateriaStyle = (nombre: string) => {
                            if (nombre.includes('matem')) return {
                                stroke: 'stroke-violet-400', text: 'text-violet-300',
                                bg: 'from-violet-600/30 to-violet-900/50', border: 'border-violet-400/40',
                                emoji: '🔢'
                            };
                            if (nombre.includes('lectura')) return {
                                stroke: 'stroke-amber-400', text: 'text-amber-300',
                                bg: 'from-amber-600/30 to-amber-900/50', border: 'border-amber-400/40',
                                emoji: '📖'
                            };
                            if (nombre.includes('sociales')) return {
                                stroke: 'stroke-emerald-400', text: 'text-emerald-300',
                                bg: 'from-emerald-600/30 to-emerald-900/50', border: 'border-emerald-400/40',
                                emoji: '🌍'
                            };
                            if (nombre.includes('ciencias')) return {
                                stroke: 'stroke-cyan-400', text: 'text-cyan-300',
                                bg: 'from-cyan-600/30 to-cyan-900/50', border: 'border-cyan-400/40',
                                emoji: '🔬'
                            };
                            return {
                                stroke: 'stroke-rose-400', text: 'text-rose-300',
                                bg: 'from-rose-600/30 to-rose-900/50', border: 'border-rose-400/40',
                                emoji: '🔤'
                            };
                        };
                        const style = getMateriaStyle(mat.nombre.toLowerCase());
                        const porcentaje = mat.promedio;

                        return (
                            <div key={mat.nombre} className={`bg-gradient-to-br ${style.bg} rounded-2xl p-4 text-center border ${style.border} hover:scale-105 transition-all duration-300`}>
                                {/* Círculo de progreso */}
                                <div className="relative w-20 h-20 mx-auto mb-2">
                                    <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
                                        <circle cx="40" cy="40" r="32" fill="none" strokeWidth="6" className="stroke-white/10" />
                                        <circle
                                            cx="40" cy="40" r="32" fill="none" strokeWidth="6"
                                            className={`${style.stroke} transition-all duration-1000`}
                                            strokeLinecap="round"
                                            strokeDasharray={`${(porcentaje / 100) * 201} 201`}
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-2xl">{style.emoji}</span>
                                    </div>
                                </div>
                                {/* Puntaje */}
                                <div className={`text-3xl font-black ${style.text}`}>
                                    {mat.promedio}
                                </div>
                                {/* Nombre */}
                                <h4 className="text-white text-xs font-semibold capitalize mt-1 truncate">
                                    {mat.nombre}
                                </h4>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Top 5 y En Riesgo */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top 5 */}
                <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        🏆 Top 5 Estudiantes
                    </h3>
                    <div className="space-y-3">
                        {stats.top5.map((est, idx) => (
                            <div key={idx} className="flex items-center gap-3 bg-white/5 rounded-lg p-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${idx === 0 ? 'bg-yellow-500 text-yellow-900' :
                                    idx === 1 ? 'bg-gray-300 text-gray-700' :
                                        idx === 2 ? 'bg-amber-600 text-amber-100' : 'bg-white/20 text-white'
                                    }`}>
                                    {idx + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-white font-medium text-sm truncate">
                                        {est.informacion_personal.nombres} {est.informacion_personal.apellidos}
                                    </div>
                                    <div className="text-white/40 text-xs truncate">
                                        {est.informacion_personal.institucion}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xl font-black text-green-400">{est.puntaje_global}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* En riesgo */}
                <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        ⚠️ Requieren Atención
                    </h3>
                    {stats.enRiesgo.length > 0 ? (
                        <div className="space-y-3">
                            {stats.enRiesgo.map((est, idx) => (
                                <div key={idx} className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                                    <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                                        <span className="text-red-400">⚠️</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-white font-medium text-sm truncate">
                                            {est.informacion_personal.nombres} {est.informacion_personal.apellidos}
                                        </div>
                                        <div className="text-white/40 text-xs truncate">
                                            {est.puntaje_global} pts - Global
                                        </div>
                                    </div>
                                    <button className="text-xs bg-white/10 hover:bg-white/20 px-2 py-1 rounded transition-colors text-white">
                                        Ver
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-white/40">
                            Excelente, no hay estudiantes en rango crítico.
                        </div>
                    )}
                </div>
            </div>

            {/* Ranking Institucional */}
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    🏫 Ranking por Institución
                </h3>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left text-white/60 text-sm">
                                <th className="pb-3 px-2">#</th>
                                <th className="pb-3 px-2">Institución</th>
                                <th className="pb-3 px-2 text-center">Estudiantes</th>
                                <th className="pb-3 px-2 text-center">Promedio</th>
                                <th className="pb-3 px-2">Distribución</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rankingInstitucional.map(([nombre, data], idx) => (
                                <tr key={nombre} className="border-t border-white/5">
                                    <td className="py-3 px-2 text-white/50">{idx + 1}</td>
                                    <td className="py-3 px-2 text-white font-medium">{nombre}</td>
                                    <td className="py-3 px-2 text-center text-white/70">{data.estudiantes.length}</td>
                                    <td className="py-3 px-2 text-center">
                                        <span className={`font-bold ${data.promedio >= 400 ? 'text-green-400' : data.promedio >= 325 ? 'text-blue-400' : 'text-yellow-400'}`}>
                                            {data.promedio}
                                        </span>
                                    </td>
                                    <td className="py-3 px-2">
                                        <div className="flex gap-1 items-center">
                                            <span className="bg-green-500/20 text-green-400 text-xs px-2 py-0.5 rounded">⭐{data.niveles.superior}</span>
                                            <span className="bg-blue-500/20 text-blue-400 text-xs px-2 py-0.5 rounded">🔵{data.niveles.alto}</span>
                                            <span className="bg-yellow-500/20 text-yellow-400 text-xs px-2 py-0.5 rounded">🟡{data.niveles.medio}</span>
                                            <span className="bg-red-500/20 text-red-400 text-xs px-2 py-0.5 rounded">🔴{data.niveles.bajo}</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
