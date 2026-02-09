'use client';

import { useEffect } from 'react';

interface ErrorProps {
    error: Error & { digest?: string };
    reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
    useEffect(() => {
        console.error('Page Error:', error);
    }, [error]);

    const getErrorMessage = () => {
        const msg = error.message || '';

        if (
            msg.includes('missing initial state') ||
            msg.includes('sessionStorage is inaccessible') ||
            msg.includes('storage-partitioned')
        ) {
            return {
                title: 'Error de Navegador',
                description: 'Tu navegador está bloqueando algunas funciones necesarias.',
                solutions: [
                    'Desactiva el modo incógnito o privado',
                    'Permite cookies de terceros en la configuración',
                    'Usa Chrome, Edge o Firefox estándar',
                    'Desactiva extensiones de bloqueo de anuncios temporalmente'
                ]
            };
        }

        return {
            title: 'Error al Cargar',
            description: 'Ocurrió un error al cargar esta página.',
            solutions: [
                'Recarga la página',
                'Verifica tu conexión a internet',
                'Intenta con otro navegador'
            ]
        };
    };

    const errorInfo = getErrorMessage();

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
                    <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h1 className="text-xl font-bold text-gray-900 mb-2">{errorInfo.title}</h1>
                        <p className="text-gray-500 text-sm">{errorInfo.description}</p>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                        <p className="text-blue-800 font-medium text-sm mb-2">💡 Soluciones sugeridas:</p>
                        <ul className="text-blue-700 text-sm space-y-1">
                            {errorInfo.solutions.map((solution, index) => (
                                <li key={index}>• {solution}</li>
                            ))}
                        </ul>
                    </div>

                    <div className="space-y-3">
                        <button
                            onClick={reset}
                            className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-all"
                        >
                            Intentar de nuevo
                        </button>
                        <button
                            onClick={() => window.location.href = '/estudiante'}
                            className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-all"
                        >
                            Volver al inicio
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
