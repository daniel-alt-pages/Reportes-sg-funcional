'use client';
import { useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, writeBatch, doc } from 'firebase/firestore';

export default function FirestoreMigration() {
    const [status, setStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
    const [progress, setProgress] = useState(0);
    const [log, setLog] = useState<string[]>([]);

    const migrateData = async () => {
        if (!confirm("¿Estás seguro de migrar los datos a Firestore? Esto sobrescribirá los registros existentes.")) return;

        setStatus('running');
        setLog([]);

        try {
            // 1. Cargar JSON
            const res = await fetch('/data/resultados_finales.json');
            if (!res.ok) throw new Error("No se pudo cargar resultados_finales.json");
            const data = await res.json();
            const estudiantes = data.estudiantes || [];

            setLog(prev => [...prev, `Cargados ${estudiantes.length} estudiantes del JSON`]);

            // 2. Procesar en lotes (Batches de 500 max limitados por Firestore)
            const BATCH_SIZE = 400; // Margen de seguridad
            const total = estudiantes.length;
            let processed = 0;

            for (let i = 0; i < total; i += BATCH_SIZE) {
                const batch = writeBatch(db);
                const chunk = estudiantes.slice(i, i + BATCH_SIZE);

                chunk.forEach((est: any) => {
                    const id = String(est.informacion_personal.numero_identificacion).trim();
                    if (!id) return;

                    const ref = doc(db, 'estudiantes', id);
                    batch.set(ref, est);
                });

                await batch.commit();
                processed += chunk.length;
                setProgress(Math.round((processed / total) * 100));
                setLog(prev => [...prev, `Lote procesado: ${processed}/${total}`]);
            }

            setStatus('success');
            setLog(prev => [...prev, " Migración completada exitosamente."]);

        } catch (e: any) {
            console.error(e);
            setStatus('error');
            setLog(prev => [...prev, ` ERROR: ${e.message}`]);
        }
    };

    return (
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 mt-8">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                🔥 Migración a Firestore
            </h3>
            <p className="text-white/60 text-sm mb-4">
                Sube los datos del archivo JSON local a la base de datos en la nube de Firestore.
                Esto permite consultas en tiempo real y reduce la descarga de archivos.
            </p>

            {status === 'idle' && (
                <button
                    onClick={migrateData}
                    className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg font-bold transition-all shadow-lg shadow-orange-500/20"
                >
                    Iniciar Migración
                </button>
            )}

            {status === 'running' && (
                <div className="space-y-2">
                    <div className="w-full bg-white/10 rounded-full h-4 overflow-hidden">
                        <div
                            className="bg-orange-500 h-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                    <p className="text-right text-orange-400 font-mono text-sm">{progress}%</p>
                </div>
            )}

            {log.length > 0 && (
                <div className="mt-4 bg-black/30 rounded-lg p-3 max-h-40 overflow-y-auto font-mono text-xs text-white/50">
                    {log.map((l, i) => <div key={i}>{l}</div>)}
                </div>
            )}
        </div>
    );
}
