'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, googleProvider } from '@/lib/firebase';
import { signInWithPopup, browserLocalPersistence, setPersistence } from 'firebase/auth';
import BrowserHelpModal from '@/components/BrowserHelpModal';
import { getStudentByEmail } from '@/lib/firestoreService';

export default function EstudianteLogin() {
    const router = useRouter();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);
    const [showBrowserHelp, setShowBrowserHelp] = useState(false);
    const [isBrowserError, setIsBrowserError] = useState(false);

    // Inicializar Firebase Auth con persistencia local para evitar problemas de sessionStorage
    useEffect(() => {
        const initAuth = async () => {
            try {
                await setPersistence(auth, browserLocalPersistence);
            } catch (e) {
                console.warn('Could not set persistence:', e);
            }
            setIsInitialized(true);
        };
        initAuth();
    }, []);

    const handleGoogleLogin = async () => {
        if (!isInitialized) return;

        setLoading(true);
        setError('');
        setIsBrowserError(false);

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

            // 2. Buscar estudiante en Firestore (reemplaza auth_index.json)
            const student = await getStudentByEmail(email);

            if (student) {
                // ÉXITO: Guardar sesión y redirigir
                localStorage.setItem('student_id', student.id);
                localStorage.setItem('student_name', `${student.nombre} ${student.apellidos}`);
                localStorage.setItem('student_email', email);
                router.push('/estudiante/dashboard');
            } else {
                // ERROR: Correo no encontrado
                await auth.signOut();
                setError(`El correo ${email} no está autorizado para ver resultados. Por favor usa tu correo institucional asignado.`);
            }

        } catch (err: any) {
            console.error("Login error:", err);
            const errorMessage = err.message || '';

            if (err.code === 'auth/popup-closed-by-user') {
                setError('Inicio de sesión cancelado.');
            } else if (err.code === 'auth/configuration-not-found') {
                setError('Error de configuración. Contacta al administrador.');
            } else if (err.code === 'auth/popup-blocked') {
                setError('El navegador bloqueó la ventana emergente. Por favor permítela.');
            } else if (
                errorMessage.includes('missing initial state') ||
                errorMessage.includes('sessionStorage is inaccessible') ||
                errorMessage.includes('storage-partitioned')
            ) {
                setIsBrowserError(true);
                setShowBrowserHelp(true);
                setError('Tu navegador está bloqueando el inicio de sesión.');
            } else if (err.code === 'auth/network-request-failed') {
                setError('Error de conexión. Verifica tu internet e inténtalo de nuevo.');
            } else {
                setError(err.message || 'Ocurrió un error al iniciar sesión.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleRetryFromModal = () => {
        setShowBrowserHelp(false);
        handleGoogleLogin();
    };

    return (
        <>
            <BrowserHelpModal
                isOpen={showBrowserHelp}
                onClose={() => setShowBrowserHelp(false)}
                onRetry={handleRetryFromModal}
            />

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
                                <div className={`rounded-lg px-4 py-3 text-sm ${isBrowserError ? 'bg-amber-50 border border-amber-200 text-amber-800' : 'bg-red-50 border border-red-200 text-red-700'}`}>
                                    <div className="flex items-start gap-2">
                                        <span className="text-lg mt-0.5">{isBrowserError ? '🔒' : '⚠️'}</span>
                                        <div className="flex-1">
                                            <p className="whitespace-pre-line">{error}</p>
                                            {isBrowserError && (
                                                <button
                                                    onClick={() => setShowBrowserHelp(true)}
                                                    className="mt-3 w-full py-2 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    Ver cómo solucionarlo
                                                </button>
                                            )}
                                        </div>
                                    </div>
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
        </>
    );
}
