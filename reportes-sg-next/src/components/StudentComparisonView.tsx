import React, { useState, useEffect } from 'react';
import { Estudiante, MATERIAS_NOMBRES, COLORES_MATERIAS } from '@/types';
import classNames from 'classnames';

interface StudentComparisonViewProps {
    estudiantes: Estudiante[]; // Lista completa para selección
    initialEstudiante1?: Estudiante;
    initialEstudiante2?: Estudiante;
    onClose: () => void;
}

export default function StudentComparisonView({ estudiantes, initialEstudiante1, initialEstudiante2, onClose }: StudentComparisonViewProps) {
    const [est1, setEst1] = useState<Estudiante | undefined>(initialEstudiante1);
    const [est2, setEst2] = useState<Estudiante | undefined>(initialEstudiante2);
    const [searchTerm1, setSearchTerm1] = useState('');
    const [searchTerm2, setSearchTerm2] = useState('');
    const [showSelector1, setShowSelector1] = useState(false);
    const [showSelector2, setShowSelector2] = useState(false);

    // Filtered lists for search
    const filteredEstudiantes1 = estudiantes.filter(e =>
        `${e.informacion_personal.nombres} ${e.informacion_personal.apellidos} ${e.informacion_personal.numero_identificacion}`
            .toLowerCase().includes(searchTerm1.toLowerCase())
    ).slice(0, 10);

    const filteredEstudiantes2 = estudiantes.filter(e =>
        `${e.informacion_personal.nombres} ${e.informacion_personal.apellidos} ${e.informacion_personal.numero_identificacion}`
            .toLowerCase().includes(searchTerm2.toLowerCase())
    ).slice(0, 10);

    // Stats calculation helper
    const getStats = (est: Estudiante | undefined) => {
        if (!est?.puntajes) return null;
        return Object.entries(est.puntajes).map(([key, val]) => ({
            materia: key,
            puntaje: val.puntaje,
            nombre: MATERIAS_NOMBRES[key] || key,
            color: COLORES_MATERIAS[key] || '#fff'
        }));
    };

    const stats1 = getStats(est1);
    const stats2 = getStats(est2);

    return (
        <div className="fixed inset-0 z-50 bg-[#0f111a] flex flex-col animate-in fade-in zoom-in-95 duration-300">
            {/* Header */}
            <div className="bg-[#14161f] border-b border-white/10 p-4 flex justify-between items-center shrink-0">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <span className="text-purple-500">⚔️</span> Versus Mode
                </h2>
                <button onClick={onClose} className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors">
                    Cerrar Comparación
                </button>
            </div>

            {/* Main Content Split */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Side (Player 1) */}
                <div className="flex-1 border-r border-white/5 flex flex-col p-6 overflow-y-auto relative">
                    <div className="mb-6 relative z-20">
                        <label className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-2 block">Estudiante A</label>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Buscar estudiante..."
                                value={searchTerm1}
                                onChange={(e) => { setSearchTerm1(e.target.value); setShowSelector1(true); }}
                                onFocus={() => setShowSelector1(true)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:ring-2 focus:ring-purple-500/50 outline-none"
                            />
                            {showSelector1 && searchTerm1 && (
                                <div className="absolute top-full left-0 w-full bg-[#1a1b26] border border-white/10 rounded-xl mt-2 shadow-2xl z-50 max-h-60 overflow-y-auto">
                                    {filteredEstudiantes1.map(e => (
                                        <div
                                            key={e.informacion_personal.numero_identificacion}
                                            onClick={() => { setEst1(e); setShowSelector1(false); }}
                                            className="p-3 hover:bg-white/5 cursor-pointer border-b border-white/5 last:border-0"
                                        >
                                            <div className="font-bold text-white">{e.informacion_personal.nombres} {e.informacion_personal.apellidos}</div>
                                            <div className="text-xs text-white/40">{e.informacion_personal.numero_identificacion}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {est1 ? (
                        <div className="space-y-6 animate-in slide-in-from-left-4 duration-500">
                            <div className="text-center">
                                <div className="w-24 h-24 mx-auto bg-gradient-to-br from-purple-600 to-indigo-600 rounded-full flex items-center justify-center text-4xl shadow-lg ring-4 ring-purple-500/20 mb-4">
                                    👨‍🎓
                                </div>
                                <h3 className="text-2xl font-bold text-white">{est1.informacion_personal.nombres}</h3>
                                <p className="text-white/40">{est1.informacion_personal.institucion}</p>
                                <div className="mt-4 inline-block bg-white/5 px-6 py-2 rounded-full border border-white/10">
                                    <span className="text-sm text-white/40 uppercase font-bold mr-2">Global</span>
                                    <span className="text-2xl font-black text-white">{est1.puntaje_global}</span>
                                </div>
                            </div>

                            {/* Skills Bars */}
                            <div className="space-y-4">
                                {stats1?.map((stat, idx) => {
                                    const diff = stats2 ? stat.puntaje - (stats2.find(s => s.materia === stat.materia)?.puntaje || 0) : 0;
                                    return (
                                        <div key={idx} className="group">
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="text-white font-medium">{stat.nombre}</span>
                                                <div className="flex gap-2">
                                                    {diff !== 0 && (
                                                        <span className={`font-bold ${diff > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                            {diff > 0 ? `+${diff}` : diff}
                                                        </span>
                                                    )}
                                                    <span className="text-white/60">{stat.puntaje}</span>
                                                </div>
                                            </div>
                                            <div className="h-2 bg-white/5 rounded-full overflow-hidden flex justify-end">
                                                <div
                                                    className="h-full rounded-full"
                                                    style={{ width: `${stat.puntaje}%`, backgroundColor: stat.color }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : <div className="flex-1 flex items-center justify-center text-white/20">Selecciona un estudiante</div>}
                </div>

                {/* Center VS Divider */}
                <div className="w-px bg-white/10 relative flex items-center justify-center">
                    <div className="absolute bg-[#0f111a] border border-white/10 rounded-full p-2 text-white/40 font-black text-xl italic z-10">VS</div>
                </div>

                {/* Right Side (Player 2) */}
                <div className="flex-1 flex flex-col p-6 overflow-y-auto relative">
                    <div className="mb-6 relative z-20">
                        <label className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2 block">Estudiante B</label>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Buscar oponente..."
                                value={searchTerm2}
                                onChange={(e) => { setSearchTerm2(e.target.value); setShowSelector2(true); }}
                                onFocus={() => setShowSelector2(true)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500/50 outline-none text-right"
                            />
                            {showSelector2 && searchTerm2 && (
                                <div className="absolute top-full right-0 w-full bg-[#1a1b26] border border-white/10 rounded-xl mt-2 shadow-2xl z-50 max-h-60 overflow-y-auto">
                                    {filteredEstudiantes2.map(e => (
                                        <div
                                            key={e.informacion_personal.numero_identificacion}
                                            onClick={() => { setEst2(e); setShowSelector2(false); }}
                                            className="p-3 hover:bg-white/5 cursor-pointer border-b border-white/5 last:border-0 text-right"
                                        >
                                            <div className="font-bold text-white">{e.informacion_personal.nombres} {e.informacion_personal.apellidos}</div>
                                            <div className="text-xs text-white/40">{e.informacion_personal.numero_identificacion}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {est2 ? (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                            <div className="text-center">
                                <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-600 to-cyan-600 rounded-full flex items-center justify-center text-4xl shadow-lg ring-4 ring-blue-500/20 mb-4">
                                    👩‍🎓
                                </div>
                                <h3 className="text-2xl font-bold text-white">{est2.informacion_personal.nombres}</h3>
                                <p className="text-white/40">{est2.informacion_personal.institucion}</p>
                                <div className="mt-4 inline-block bg-white/5 px-6 py-2 rounded-full border border-white/10">
                                    <span className="text-sm text-white/40 uppercase font-bold mr-2">Global</span>
                                    <span className="text-2xl font-black text-white">{est2.puntaje_global}</span>
                                </div>
                            </div>

                            {/* Skills Bars (Mirrored) */}
                            <div className="space-y-4">
                                {stats2?.map((stat, idx) => {
                                    const diff = stats1 ? stat.puntaje - (stats1.find(s => s.materia === stat.materia)?.puntaje || 0) : 0;
                                    return (
                                        <div key={idx} className="group">
                                            <div className="flex justify-between text-sm mb-1 flex-row-reverse">
                                                <span className="text-white font-medium">{stat.nombre}</span>
                                                <div className="flex gap-2 flex-row-reverse">
                                                    {diff !== 0 && (
                                                        <span className={`font-bold ${diff > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                            {diff > 0 ? `+${diff}` : diff}
                                                        </span>
                                                    )}
                                                    <span className="text-white/60">{stat.puntaje}</span>
                                                </div>
                                            </div>
                                            <div className="h-2 bg-white/5 rounded-full overflow-hidden flex justify-start">
                                                <div
                                                    className="h-full rounded-full"
                                                    style={{ width: `${stat.puntaje}%`, backgroundColor: stat.color }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : <div className="flex-1 flex items-center justify-center text-white/20">Selecciona un oponente</div>}
                </div>
            </div>
        </div>
    );
}
