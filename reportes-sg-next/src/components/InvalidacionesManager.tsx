'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, Plus, Trash2, RefreshCw, X, Check } from 'lucide-react';

interface Invalidacion {
    simulacro: string;
    sesion: string;
    numero_pregunta: number;
    materia?: string;
    motivo?: string;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onReprocesar?: () => void;
}

export default function InvalidacionesManager({ isOpen, onClose, onReprocesar }: Props) {
    const [invalidaciones, setInvalidaciones] = useState<Invalidacion[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Form para nueva invalidación
    const [showForm, setShowForm] = useState(false);
    const [newInv, setNewInv] = useState<Partial<Invalidacion>>({
        simulacro: 'S11 S-08',
        sesion: 'S1',
        numero_pregunta: 1,
        materia: '',
        motivo: ''
    });

    const cargarInvalidaciones = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/invalidaciones');
            const data = await res.json();
            if (data.success) {
                setInvalidaciones(data.invalidaciones);
            } else {
                setError(data.error);
            }
        } catch (e) {
            setError('Error al cargar invalidaciones');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            cargarInvalidaciones();
        }
    }, [isOpen]);

    const agregarInvalidacion = async () => {
        if (!newInv.numero_pregunta) {
            setError('El número de pregunta es requerido');
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/invalidaciones', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newInv)
            });
            const data = await res.json();
            if (data.success) {
                setInvalidaciones(data.invalidaciones);
                setSuccess('Invalidación agregada. Reprocesa para aplicar cambios.');
                setShowForm(false);
                setNewInv({ simulacro: 'S11 S-08', sesion: 'S1', numero_pregunta: 1, materia: '', motivo: '' });
            } else {
                setError(data.error);
            }
        } catch (e) {
            setError('Error al agregar invalidación');
        } finally {
            setLoading(false);
        }
    };

    const eliminarInvalidacion = async (inv: Invalidacion) => {
        if (!confirm(`¿Eliminar invalidación de pregunta ${inv.numero_pregunta} (${inv.sesion})?`)) return;

        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/invalidaciones', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sesion: inv.sesion, numero_pregunta: inv.numero_pregunta })
            });
            const data = await res.json();
            if (data.success) {
                setInvalidaciones(data.invalidaciones);
                setSuccess('Invalidación eliminada. Reprocesa para aplicar cambios.');
            } else {
                setError(data.error);
            }
        } catch (e) {
            setError('Error al eliminar invalidación');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6">
            <div className="bg-[#0f111a] w-full max-w-2xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="p-6 border-b border-white/10 bg-[#13151f] flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-500/20 rounded-lg">
                            <AlertTriangle className="w-6 h-6 text-amber-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Gestión de Invalidaciones</h2>
                            <p className="text-white/40 text-sm">Preguntas marcadas como "todas correctas"</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-white/50" />
                    </button>
                </div>

                {/* Mensajes */}
                {error && (
                    <div className="mx-6 mt-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 text-sm">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="mx-6 mt-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 text-sm flex items-center gap-2">
                        <Check className="w-4 h-4" /> {success}
                    </div>
                )}

                {/* Lista de invalidaciones */}
                <div className="p-6 max-h-[400px] overflow-y-auto">
                    {loading ? (
                        <div className="text-center text-white/50 py-8">Cargando...</div>
                    ) : invalidaciones.length === 0 ? (
                        <div className="text-center text-white/30 py-8 border border-dashed border-white/10 rounded-xl">
                            No hay preguntas invalidadas actualmente
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {invalidaciones.map((inv, i) => (
                                <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 hover:border-amber-500/30 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-amber-500/10 rounded-lg flex items-center justify-center">
                                            <span className="text-amber-400 font-bold text-lg">{inv.numero_pregunta}</span>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-white font-semibold">Pregunta {inv.numero_pregunta}</span>
                                                <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full font-mono">{inv.sesion}</span>
                                                {inv.materia && (
                                                    <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded-full capitalize">{inv.materia}</span>
                                                )}
                                            </div>
                                            <p className="text-white/40 text-sm mt-1">{inv.motivo || 'Sin motivo especificado'}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => eliminarInvalidacion(inv)}
                                        className="p-2 text-rose-400 hover:bg-rose-500/20 rounded-lg transition-colors"
                                        title="Eliminar invalidación"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Formulario para agregar */}
                    {showForm && (
                        <div className="mt-4 p-4 bg-[#1a1d2d] rounded-xl border border-white/10">
                            <h3 className="text-white font-semibold mb-4">Nueva Invalidación</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-white/50 text-xs uppercase mb-1 block">Sesión</label>
                                    <select
                                        value={newInv.sesion}
                                        onChange={(e) => setNewInv({ ...newInv, sesion: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white"
                                    >
                                        <option value="S1">S1</option>
                                        <option value="S2">S2</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-white/50 text-xs uppercase mb-1 block">Número Pregunta</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="150"
                                        value={newInv.numero_pregunta}
                                        onChange={(e) => setNewInv({ ...newInv, numero_pregunta: parseInt(e.target.value) || 1 })}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white"
                                    />
                                </div>
                                <div>
                                    <label className="text-white/50 text-xs uppercase mb-1 block">Materia (opcional)</label>
                                    <select
                                        value={newInv.materia}
                                        onChange={(e) => setNewInv({ ...newInv, materia: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white"
                                    >
                                        <option value="">Cualquiera</option>
                                        <option value="matemáticas">Matemáticas</option>
                                        <option value="lectura crítica">Lectura Crítica</option>
                                        <option value="sociales y ciudadanas">Sociales</option>
                                        <option value="ciencias naturales">Ciencias</option>
                                        <option value="inglés">Inglés</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-white/50 text-xs uppercase mb-1 block">Motivo</label>
                                    <input
                                        type="text"
                                        value={newInv.motivo}
                                        onChange={(e) => setNewInv({ ...newInv, motivo: e.target.value })}
                                        placeholder="Ej: Error de transcripción"
                                        className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white placeholder-white/30"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2 mt-4">
                                <button
                                    onClick={agregarInvalidacion}
                                    disabled={loading}
                                    className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
                                >
                                    Guardar
                                </button>
                                <button
                                    onClick={() => setShowForm(false)}
                                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/10 bg-[#0a0c12] flex justify-between items-center">
                    <button
                        onClick={() => setShowForm(true)}
                        disabled={showForm}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-semibold flex items-center gap-2 transition-colors disabled:opacity-50"
                    >
                        <Plus className="w-4 h-4" /> Agregar Invalidación
                    </button>
                    <div className="flex gap-2">
                        <button
                            onClick={cargarInvalidaciones}
                            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg flex items-center gap-2 transition-colors"
                        >
                            <RefreshCw className="w-4 h-4" /> Recargar
                        </button>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/70 rounded-lg transition-colors"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>

                {/* Nota */}
                <div className="px-6 pb-4 bg-[#0a0c12]">
                    <p className="text-white/30 text-xs text-center">
                        ⚠️ Después de agregar/eliminar invalidaciones, debes reprocesar los datos (ejecutar procesar.py) para que los cambios surtan efecto.
                    </p>
                </div>
            </div>
        </div>
    );
}
