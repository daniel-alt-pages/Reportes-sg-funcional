'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, googleProvider } from '@/lib/firebase';
import { signInWithPopup } from 'firebase/auth';

export default function EstudianteLogin() {
    const router = useRouter();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError('');

        try {
            // 1. Login con Google
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;
            const email = user.email;

            if (!email) {
                throw new Error('No se pudo obtener el correo electrónico de Google.');
            }

            // 0. Revisar si es Administrador
            const { isAdmin } = await import('@/lib/admin-auth');
            if (isAdmin(email)) {
                router.replace('/admin');
                return;
            }

            // 2. Cargar índice ligero de autenticación
            const res = await fetch(`/data/auth_index.json?v=${new Date().getTime()}`);
            if (!res.ok) throw new Error('Error conectando con el sistema de autenticación.');

            const authIndex = await res.json();

            // 3. Buscar estudiante por correo en el índice (Búsqueda O(n) rápida en lista ligera)
            const target = email.toLowerCase();
            const entry = authIndex.find((item: any) => item.e.toLowerCase() === target);

            if (entry) {
                // ÉXITO: Guardar sesión y redirigir
                localStorage.setItem('student_id', entry.i);
                localStorage.setItem('student_name', entry.n);
                localStorage.setItem('student_email', email);
                // El dashboard cargará los datos completos después
                router.push('/estudiante/dashboard');
            } else {
                // ERROR: Correo no encontrado
                await auth.signOut(); // Cerrar sesión para que pueda intentar con otra cuenta
                setError(`El correo ${email} no está autorizado para ver resultados. Por favor usa tu correo institucional asignado.`);
            }

        } catch (err: any) {
            console.error("Login error:", err);
            // Manejo de errores específicos de Firebase
            if (err.code === 'auth/popup-closed-by-user') {
                setError('Inicio de sesión cancelado.');
            } else if (err.code === 'auth/configuration-not-found') {
                setError('Error de configuración. Contacta al administrador.');
            } else if (err.code === 'auth/popup-blocked') {
                setError('El navegador bloqueó la ventana emergente. Por favor permítela.');
            } else {
                setError(err.message || 'Ocurrió un error al iniciar sesión.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 relative overflow-hidden">

                    <div className="text-center mb-10">
                        <img
                            src="/logo_sg.svg"
                            alt="Logo Seamos Genios"
                            className="w-32 mx-auto mb-8"
                        />
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Consulta de Resultados</h1>
                        <p className="text-gray-500">Seamos Genios 2026</p>
                    </div>

                    <div className="space-y-6">
                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-sm flex items-start gap-2">
                                <span className="text-lg mt-0.5">⚠️</span>
                                <p>{error}</p>
                            </div>
                        )}

                        <button
                            onClick={handleGoogleLogin}
                            disabled={loading}
                            className="w-full py-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-all shadow-sm flex items-center justify-center gap-3 group"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                                    <span>Ingresar con Google</span>
                                </>
                            )}
                        </button>

                        <div className="text-center space-y-2">
                            <p className="text-gray-400 text-xs px-4">
                                Usa el correo institucional asignado para acceder a tus reportes.
                            </p>
                        </div>
                    </div>
                </div>

                <p className="text-center text-gray-400 text-xs mt-8">
                    © 2026 Seamos Genios Colombia
                </p>
            </div>
        </div>
    );
}
