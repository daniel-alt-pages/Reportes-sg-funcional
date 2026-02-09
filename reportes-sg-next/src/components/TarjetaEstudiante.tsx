'use client';

import { Estudiante, COLORES_MATERIAS } from '@/types';

interface TarjetaEstudianteProps {
    estudiante: Estudiante;
    onSelect?: () => void;
    isSelected?: boolean;
}

export default function TarjetaEstudiante({
    estudiante,
    onSelect,
    isSelected
}: TarjetaEstudianteProps) {
    const nombreCompleto = `${estudiante.informacion_personal.nombres} ${estudiante.informacion_personal.apellidos}`;

    const formatNombre = (nombre: string) => {
        return nombre.toUpperCase();
    };

    // Calcular promedio general
    const puntajes = Object.values(estudiante.puntajes);
    const promedio = puntajes.length > 0
        ? puntajes.reduce((acc, p) => acc + p.puntaje, 0) / puntajes.length
        : 0;

    const getPromedioColor = () => {
        if (promedio >= 70) return 'from-green-500 to-emerald-600';
        if (promedio >= 50) return 'from-yellow-500 to-orange-500';
        return 'from-red-500 to-rose-600';
    };

    return (
        <div
            onClick={onSelect}
            className={`
        bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer
        transition-all duration-300 hover:shadow-xl hover:scale-[1.02]
        border-2 ${isSelected ? 'border-indigo-500 ring-4 ring-indigo-100' : 'border-transparent'}
      `}
        >
            {/* Header con gradiente */}
            <div className={`bg-gradient-to-r ${getPromedioColor()} px-5 py-4`}>
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-white font-bold text-lg leading-tight">
                            {formatNombre(nombreCompleto)}
                        </h3>
                        <p className="text-white/80 text-sm mt-1">
                            {estudiante.informacion_personal.tipo_identificacion} {estudiante.informacion_personal.numero_identificacion}
                        </p>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm rounded-xl px-3 py-2 text-center">
                        <div className="text-white font-bold text-2xl">{estudiante.puntaje_global}</div>
                        <div className="text-white/80 text-xs">Puntaje</div>
                    </div>
                </div>
            </div>

            {/* Puntajes por materia */}
            <div className="p-5">
                <div className="grid grid-cols-5 gap-2">
                    {Object.entries(estudiante.puntajes).map(([materia, datos]) => {
                        const nombreCorto = materia === 'lectura crítica' ? 'LC' :
                            materia === 'matemáticas' ? 'MT' :
                                materia === 'sociales y ciudadanas' ? 'SC' :
                                    materia === 'ciencias naturales' ? 'CN' : 'IN';

                        const color = COLORES_MATERIAS[materia] || '#6366f1';

                        return (
                            <div
                                key={materia}
                                className="text-center p-2 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                            >
                                <div
                                    className="text-xs font-bold mb-1 px-2 py-0.5 rounded-full inline-block"
                                    style={{ backgroundColor: `${color}20`, color: color }}
                                >
                                    {nombreCorto}
                                </div>
                                <div className="font-bold text-gray-800">{datos.puntaje}</div>
                                <div className="text-[10px] text-gray-500">
                                    {datos.correctas}/{datos.total_preguntas}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Barra de progreso general */}
                <div className="mt-4">
                    <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Promedio general</span>
                        <span className="font-bold text-gray-800">{promedio.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                            className={`h-2.5 rounded-full bg-gradient-to-r ${getPromedioColor()}`}
                            style={{ width: `${promedio}%` }}
                        ></div>
                    </div>
                </div>

                {/* Info adicional */}
                <div className="mt-4 flex justify-between items-center text-xs text-gray-500">
                    <span>📱 {estudiante.informacion_personal.telefono || 'N/A'}</span>
                    <span>📍 {estudiante.informacion_personal.municipio || 'N/A'}</span>
                </div>
            </div>
        </div>
    );
}
