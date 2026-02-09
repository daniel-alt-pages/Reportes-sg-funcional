'use client';

import { useState } from 'react';

interface BrowserHelpModalProps {
    isOpen: boolean;
    onClose: () => void;
    onRetry: () => void;
}

type BrowserType = 'chrome' | 'safari' | 'firefox' | 'edge' | 'brave';

const browserSteps: Record<BrowserType, { name: string; icon: string; steps: string[] }> = {
    chrome: {
        name: 'Google Chrome',
        icon: '🌐',
        steps: [
            'Haz clic en el ícono de candado 🔒 en la barra de direcciones',
            'Selecciona "Configuración del sitio"',
            'Busca "Cookies" y selecciona "Permitir"',
            'Recarga la página y vuelve a intentar'
        ]
    },
    safari: {
        name: 'Safari',
        icon: '🧭',
        steps: [
            'Ve a Safari > Preferencias (o Configuración)',
            'Haz clic en la pestaña "Privacidad"',
            'Desmarca "Prevenir seguimiento entre sitios"',
            'Cierra Preferencias, recarga la página e intenta de nuevo'
        ]
    },
    firefox: {
        name: 'Firefox',
        icon: '🦊',
        steps: [
            'Haz clic en el escudo de protección 🛡️ junto a la URL',
            'Desactiva "Protección mejorada contra rastreo" para este sitio',
            'Recarga la página y vuelve a intentar'
        ]
    },
    edge: {
        name: 'Microsoft Edge',
        icon: '🔷',
        steps: [
            'Haz clic en el candado 🔒 en la barra de direcciones',
            'Selecciona "Permisos del sitio"',
            'Activa "Cookies y datos del sitio"',
            'Recarga la página y vuelve a intentar'
        ]
    },
    brave: {
        name: 'Brave',
        icon: '🦁',
        steps: [
            'Haz clic en el escudo de Brave 🛡️ junto a la URL',
            'Desactiva "Escudos activos" para este sitio',
            'Recarga la página y vuelve a intentar'
        ]
    }
};

export default function BrowserHelpModal({ isOpen, onClose, onRetry }: BrowserHelpModalProps) {
    const [selectedBrowser, setSelectedBrowser] = useState<BrowserType | null>(null);
    const [currentStep, setCurrentStep] = useState(0);

    if (!isOpen) return null;

    const handleBrowserSelect = (browser: BrowserType) => {
        setSelectedBrowser(browser);
        setCurrentStep(0);
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        } else {
            setSelectedBrowser(null);
        }
    };

    const handleNext = () => {
        if (selectedBrowser && currentStep < browserSteps[selectedBrowser].steps.length - 1) {
            setCurrentStep(currentStep + 1);
        }
    };

    const isLastStep = selectedBrowser && currentStep === browserSteps[selectedBrowser].steps.length - 1;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header con gradiente */}
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-5 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {selectedBrowser && (
                                <button
                                    onClick={handleBack}
                                    className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                            )}
                            <div>
                                <h2 className="text-xl font-bold">
                                    {selectedBrowser ? browserSteps[selectedBrowser].name : '¿Necesitas ayuda?'}
                                </h2>
                                <p className="text-purple-100 text-sm">
                                    {selectedBrowser
                                        ? `Paso ${currentStep + 1} de ${browserSteps[selectedBrowser].steps.length}`
                                        : 'Selecciona tu navegador'
                                    }
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    {!selectedBrowser ? (
                        <>
                            {/* Explicación del problema */}
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                                <div className="flex gap-3">
                                    <span className="text-2xl">🔒</span>
                                    <div>
                                        <p className="text-amber-800 font-medium">Tu navegador bloqueó el inicio de sesión</p>
                                        <p className="text-amber-700 text-sm mt-1">
                                            Esto ocurre por configuraciones de privacidad. Selecciona tu navegador para ver cómo solucionarlo.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Browser selection grid */}
                            <div className="grid grid-cols-2 gap-3">
                                {(Object.keys(browserSteps) as BrowserType[]).map((browser) => (
                                    <button
                                        key={browser}
                                        onClick={() => handleBrowserSelect(browser)}
                                        className="flex items-center gap-3 p-4 bg-gray-50 hover:bg-purple-50 border border-gray-200 hover:border-purple-300 rounded-xl transition-all group"
                                    >
                                        <span className="text-2xl">{browserSteps[browser].icon}</span>
                                        <span className="font-medium text-gray-700 group-hover:text-purple-700">
                                            {browserSteps[browser].name}
                                        </span>
                                    </button>
                                ))}
                            </div>

                            {/* Opción modo incógnito */}
                            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                                <div className="flex gap-3">
                                    <span className="text-xl">🕵️</span>
                                    <div>
                                        <p className="text-blue-800 font-medium text-sm">¿Estás en modo incógnito?</p>
                                        <p className="text-blue-700 text-xs mt-1">
                                            El modo privado/incógnito puede causar este error. Intenta abrir esta página en una ventana normal.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Step indicator */}
                            <div className="flex gap-2 mb-6">
                                {browserSteps[selectedBrowser].steps.map((_, index) => (
                                    <div
                                        key={index}
                                        className={`h-2 flex-1 rounded-full transition-colors ${index <= currentStep ? 'bg-purple-500' : 'bg-gray-200'
                                            }`}
                                    />
                                ))}
                            </div>

                            {/* Current step */}
                            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 mb-6 min-h-[120px] flex items-center">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                                        {currentStep + 1}
                                    </div>
                                    <p className="text-gray-800 text-lg leading-relaxed">
                                        {browserSteps[selectedBrowser].steps[currentStep]}
                                    </p>
                                </div>
                            </div>

                            {/* Navigation buttons */}
                            <div className="flex gap-3">
                                {currentStep > 0 && (
                                    <button
                                        onClick={handleBack}
                                        className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors"
                                    >
                                        ← Anterior
                                    </button>
                                )}
                                {!isLastStep ? (
                                    <button
                                        onClick={handleNext}
                                        className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl transition-colors"
                                    >
                                        Siguiente →
                                    </button>
                                ) : (
                                    <button
                                        onClick={onRetry}
                                        className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        Reintentar inicio de sesión
                                    </button>
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                        <p className="text-gray-500 text-xs">
                            ¿Sigue sin funcionar? Escríbenos a <span className="text-purple-600">soporte@seamosgenios.com</span>
                        </p>
                        <button
                            onClick={onClose}
                            className="text-sm text-gray-500 hover:text-gray-700"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
