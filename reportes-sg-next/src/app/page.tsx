'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MaintenancePage() {
  const router = useRouter();

  // Redirigir admin directamente
  useEffect(() => {
    const path = window.location.pathname;
    if (path.includes('/admin')) {
      router.replace('/admin');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="text-center max-w-lg">
        {/* Logo */}
        <div className="w-24 h-24 mx-auto mb-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-purple-500/30">
          <span className="text-4xl">🛠️</span>
        </div>

        {/* Título */}
        <h1 className="text-4xl font-black text-white mb-4">
          Mantenimiento
        </h1>

        {/* Mensaje */}
        <p className="text-xl text-white/70 mb-8 leading-relaxed">
          Estamos realizando mejoras en la plataforma.
          <br />
          <span className="text-purple-400 font-semibold">Volveremos en breve.</span>
        </p>

        {/* Animación de carga */}
        <div className="flex justify-center gap-2 mb-8">
          <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-3 h-3 bg-purple-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>

        {/* Info */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
          <p className="text-white/50 text-sm mb-2">
            Tiempo estimado: <span className="text-amber-400 font-bold">15 minutos</span>
          </p>
          <p className="text-white/30 text-xs">
            Seamos Genios © 2026
          </p>
        </div>
      </div>
    </div>
  );
}
