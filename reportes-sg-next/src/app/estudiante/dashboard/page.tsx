'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getAllStudents, getStudentResults, getStudentSimulations, getAppConfig } from '@/lib/firestoreService';

interface Puntaje {
    puntaje: number;
    correctas: number;
    total_preguntas: number;
}

interface Estudiante {
    informacion_personal: {
        nombres: string;
        apellidos: string;
        numero_identificacion: string;
        institucion: string;
    };
    puntaje_global: number;
    puntajes: Record<string, Puntaje>;
    sesiones?: string[];
    secciones_completadas?: string[];
}

const materias = [
    { key: 'lectura crítica', label: 'Lectura Crítica', color: '#ec4899', bg: 'bg-pink-50', text: 'text-pink-600', border: 'border-pink-200' },
    { key: 'matemáticas', label: 'Matemáticas', color: '#3b82f6', bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
    { key: 'sociales y ciudadanas', label: 'Ciencias Sociales', color: '#f59e0b', bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
    { key: 'ciencias naturales', label: 'Ciencias Naturales', color: '#10b981', bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' },
    { key: 'inglés', label: 'Inglés', color: '#8b5cf6', bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' },
];

export default function StudentDashboard() {
    const router = useRouter();
    const [estudiante, setEstudiante] = useState<Estudiante | null>(null);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');
    const [debugLog, setDebugLog] = useState<string[]>([]);
    const addLog = (msg: string) => setDebugLog(prev => [...prev, `${new Date().toLocaleTimeString()} ${msg}`]);

    const [rankingInfo, setRankingInfo] = useState({ puesto: 0, total: 0, top5: [] as any[] });
    const [allStudents, setAllStudents] = useState<any[]>([]);
    const [rankingModal, setRankingModal] = useState<{ title: string, students: any[], color: string, subjectKey: string } | null>(null);
    const [welcomeModal, setWelcomeModal] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Selector de simulacro
    const [simulacroActual, setSimulacroActual] = useState<string | null>(null);
    const [simulacrosDelEstudiante, setSimulacrosDelEstudiante] = useState<string[]>([]);
    const [showSimulacroModal, setShowSimulacroModal] = useState(false);

    const loadData = useCallback(async (simId?: string) => {
        if (typeof window === 'undefined') return;

        const id = localStorage.getItem('student_id');
        const currentSim = simId || simulacroActual;

        if (!id) {
            console.warn("No student_id");
            setErrorMsg("Sesión expirada.");
            setLoading(false);
            return;
        }

        setLoading(true);
        setErrorMsg('');

        // 1. Cargar Ranking del Simulacro Actual (Firestore)
        const fetchRanking = async () => {
            try {
                addLog('⏳ getAllStudents...');
                const studentsArray = await getAllStudents(currentSim || undefined);
                addLog(`✅ getAllStudents: ${studentsArray.length} estudiantes`);

                if (studentsArray.length === 0) {
                    addLog('⚠️ No students found');
                    return;
                }

                const sorted = [...studentsArray].sort((a: any, b: any) =>
                    (Number(b.puntaje_global) || 0) - (Number(a.puntaje_global) || 0)
                );

                setAllStudents(studentsArray);

                const myIndex = sorted.findIndex((e: any) => String(e.informacion_personal.numero_identificacion).trim() === String(id).trim());

                setRankingInfo({
                    puesto: myIndex >= 0 ? myIndex + 1 : 0,
                    total: sorted.length,
                    top5: sorted.slice(0, 5)
                });
            } catch (e: any) {
                addLog(`❌ Ranking error: ${e.message}`);
                console.error("Error loading ranking", e);
            }
        };

        // 2. Cargar Datos Estudiante (Firestore)
        const fetchEstudiante = async () => {
            // Try to load from cache first for instant display
            const cachedData = localStorage.getItem('student_data');
            if (cachedData) {
                try {
                    const parsed = JSON.parse(cachedData);
                    if (String(parsed.informacion_personal.numero_identificacion).trim() === String(id).trim()) {
                        setEstudiante(parsed);
                    }
                } catch (e) {
                    console.error("Error parsing cached student data", e);
                    localStorage.removeItem('student_data');
                }
            }

            try {
                const targetId = String(id).trim();
                addLog(`⏳ getStudentResults(${targetId}, ${currentSim})...`);
                const found = await getStudentResults(targetId, currentSim || undefined);

                if (found) {
                    addLog('✅ Student data loaded');
                    setEstudiante(found as any);
                    try { localStorage.setItem('student_data', JSON.stringify(found)); } catch (e) { }
                } else {
                    addLog('⚠️ No results found for student');
                    if (!estudiante) {
                        throw new Error(`No tienes resultados para el simulacro ${currentSim}. Prueba cambiando de simulacro.`);
                    }
                }
            } catch (err: any) {
                addLog(`❌ Student error: ${err.message}`);
                console.error(err);
                setErrorMsg(err.message || "Error cargando información.");
            }
        };

        await Promise.all([fetchEstudiante(), fetchRanking()]);
        setLoading(false);

    }, [simulacroActual]); // Reload when simulation changes

    // Detectar simulacros disponibles para el estudiante al cargar (Firestore)
    useEffect(() => {
        const detectarSimulacros = async () => {
            const id = localStorage.getItem('student_id');
            if (!id) return;

            addLog('⏳ getStudentSimulations...');
            const simulacrosConDatos = await getStudentSimulations(id);
            addLog(`✅ Simulations: ${simulacrosConDatos.join(', ') || 'none'}`);

            setSimulacrosDelEstudiante(simulacrosConDatos);

            // Si tiene múltiples simulacros y no ha seleccionado uno, mostrar el selector
            if (simulacrosConDatos.length > 1 && !sessionStorage.getItem('simulacro_selected')) {
                setShowSimulacroModal(true);
                setSimulacroActual(simulacrosConDatos[simulacrosConDatos.length - 1]);
            } else {
                const saved = sessionStorage.getItem('simulacro_selected');
                const config = await getAppConfig();
                const finalSim = saved || (simulacrosConDatos.length > 0 ? simulacrosConDatos[simulacrosConDatos.length - 1] : config.activeSimulation);

                setSimulacroActual(finalSim);

                if (!sessionStorage.getItem('welcome_shown')) {
                    setTimeout(() => setWelcomeModal(true), 1500);
                    sessionStorage.setItem('welcome_shown', 'true');
                }
            }
        };

        detectarSimulacros();
    }, []);

    useEffect(() => {
        if (simulacroActual) {
            loadData();
        }
    }, [loadData, simulacroActual]);

    // Handler para seleccionar simulacro desde el modal
    const handleSelectSimulacro = (sim: string) => {
        sessionStorage.setItem('simulacro_selected', sim);
        setSimulacroActual(sim);
        setShowSimulacroModal(false);

        // Mostrar bienvenida tras seleccionar el simulacro
        if (!sessionStorage.getItem('welcome_shown')) {
            setTimeout(() => setWelcomeModal(true), 1000);
            sessionStorage.setItem('welcome_shown', 'true');
        }
    };

    // Handler para cambiar de simulacro
    const handleSimulacroChange = (newSim: string) => {
        sessionStorage.setItem('simulacro_selected', newSim);
        setSimulacroActual(newSim);
    };

    const handleLogout = () => {
        localStorage.removeItem('student_id');
        localStorage.removeItem('student_name');
        sessionStorage.removeItem('simulacro_selected');
        router.replace('/estudiante');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center flex-col gap-4">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-500 font-medium animate-pulse">Cargando resultados...</p>
                {debugLog.length > 0 && (
                    <div className="mt-4 bg-slate-900 text-green-400 p-4 rounded-lg font-mono text-xs max-w-lg w-full mx-4 max-h-60 overflow-y-auto">
                        <p className="text-slate-500 mb-2">🔧 Debug Log:</p>
                        {debugLog.map((log, i) => <p key={i}>{log}</p>)}
                    </div>
                )}
            </div>
        );
    }

    if (errorMsg) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md text-center border border-red-100">
                    <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">⚠️</div>
                    <h2 className="text-xl font-bold text-slate-800 mb-2">Error de Acceso</h2>
                    <p className="text-slate-500 mb-6">{errorMsg}</p>
                    <button onClick={handleLogout} className="w-full py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition-colors">
                        Volver al Inicio
                    </button>
                </div>
            </div>
        );
    }

    if (!estudiante) return null;

    const totalCorrectas = Object.values(estudiante.puntajes).reduce((acc, p) => acc + (p.correctas || 0), 0);
    const totalPreguntas = Object.values(estudiante.puntajes).reduce((acc, p) => acc + (p.total_preguntas || 0), 0);
    const porcentajeGlobal = totalPreguntas > 0 ? Math.round((totalCorrectas / totalPreguntas) * 100) : 0;

    const getNivel = (puntaje: number) => {
        if (puntaje >= 400) return {
            text: 'SUPERIOR',
            color: 'bg-emerald-500',
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" /></svg>,
            bgSoft: 'bg-emerald-50',
            textCol: 'text-emerald-700'
        };
        if (puntaje >= 325) return {
            text: 'ALTO',
            color: 'bg-blue-500',
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" /></svg>,
            bgSoft: 'bg-blue-50',
            textCol: 'text-blue-700'
        };
        if (puntaje >= 250) return {
            text: 'MEDIO',
            color: 'bg-amber-500',
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" /></svg>,
            bgSoft: 'bg-amber-50',
            textCol: 'text-amber-700'
        };
        return {
            text: 'EN DESARROLLO',
            color: 'bg-red-500',
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" /></svg>,
            bgSoft: 'bg-red-50',
            textCol: 'text-red-700'
        };
    };
    const nivel = getNivel(estudiante.puntaje_global);

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans relative">

            {/* 🎯 MODAL: Selector de Simulacro (Pantalla Completa) */}
            {showSimulacroModal && simulacrosDelEstudiante.length > 1 && (
                <div className="fixed inset-0 z-[100] bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
                    {/* Decorative elements */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <div className="absolute top-20 left-20 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl animate-pulse"></div>
                        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-500/10 rounded-full blur-3xl"></div>
                    </div>

                    <div className="relative z-10 max-w-2xl w-full text-center space-y-8">
                        {/* Logo */}
                        <div className="flex justify-center">
                            <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center text-4xl font-black text-white shadow-2xl shadow-purple-500/30 animate-bounce">
                                SG
                            </div>
                        </div>

                        {/* Title */}
                        <div>
                            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-3">
                                ¡Hola de nuevo! 👋
                            </h1>
                            <p className="text-xl text-purple-200/80">
                                Has participado en <span className="font-bold text-white">{simulacrosDelEstudiante.length} simulacros</span>
                            </p>
                        </div>

                        {/* Question */}
                        <p className="text-2xl text-white/90 font-medium">
                            ¿Cuál deseas consultar?
                        </p>

                        {/* Simulation Options */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-xl mx-auto">
                            {simulacrosDelEstudiante.map((sim, index) => (
                                <button
                                    key={sim}
                                    onClick={() => handleSelectSimulacro(sim)}
                                    className={`group relative p-8 rounded-3xl border-2 transition-all duration-300 transform hover:scale-105 active:scale-95 
                                        ${index === simulacrosDelEstudiante.length - 1
                                            ? 'bg-gradient-to-br from-indigo-500 to-purple-600 border-indigo-400 shadow-xl shadow-indigo-500/30 hover:shadow-2xl hover:shadow-indigo-500/40'
                                            : 'bg-white/10 border-white/20 hover:bg-white/20 hover:border-white/40'
                                        }`}
                                >
                                    {/* Badge for latest */}
                                    {index === simulacrosDelEstudiante.length - 1 && (
                                        <span className="absolute -top-3 -right-3 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                                            ⭐ Más reciente
                                        </span>
                                    )}

                                    <div className="text-3xl font-black text-white mb-2">
                                        {sim}
                                    </div>
                                    <div className="text-sm text-white/70">
                                        {sim === 'SG11-08' ? 'Enero 2026' : 'Febrero 2026'}
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Note */}
                        <p className="text-sm text-purple-300/60">
                            Podrás cambiar de simulacro en cualquier momento desde el menú superior
                        </p>
                    </div>
                </div>
            )}

            {/* Watermark responsive and overlay */}
            <img
                src="/fondo_16_9.svg"
                alt=""
                className="fixed inset-0 z-[30] w-full h-full object-cover opacity-30 pointer-events-none select-none"
                draggable="false"
            />
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200/60">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:h-20 flex flex-row justify-between items-center gap-4">

                    {/* User Info & Logo */}
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white text-lg font-bold shadow-lg shadow-indigo-500/30 shrink-0">
                            SG
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-800 tracking-tight truncate student-name">
                                {estudiante.informacion_personal.nombres.split(' ')[0].toUpperCase()} {estudiante.informacion_personal.apellidos.split(' ')[0].toUpperCase()}
                            </h1>
                            <p className="text-xs md:text-sm font-semibold text-slate-400 uppercase tracking-widest truncate">{estudiante.informacion_personal.numero_identificacion}</p>
                        </div>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex gap-3 items-center">
                        {/* Selector de Simulacro - Solo si tiene múltiples */}
                        {simulacrosDelEstudiante.length > 1 && simulacroActual && (
                            <div className="relative group">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-300"></div>
                                <div className="relative flex items-center gap-3 bg-white/90 backdrop-blur-sm border border-indigo-200/50 rounded-xl px-4 py-2.5 shadow-lg shadow-indigo-500/10">
                                    <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-md">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Simulacro</span>
                                        <div className="relative">
                                            <select
                                                value={simulacroActual}
                                                onChange={(e) => handleSimulacroChange(e.target.value)}
                                                className="appearance-none bg-transparent text-slate-800 font-bold text-sm pr-6 cursor-pointer focus:outline-none hover:text-indigo-600 transition-colors"
                                            >
                                                {simulacrosDelEstudiante.map(sim => (
                                                    <option key={sim} value={sim} className="bg-white text-slate-800 font-medium">
                                                        {sim}
                                                    </option>
                                                ))}
                                            </select>
                                            <svg className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex bg-slate-100 p-1 rounded-2xl">
                            <button
                                onClick={() => router.push('/estudiante/estadisticas')}
                                className="px-6 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 text-slate-600 hover:bg-white hover:shadow-sm hover:text-indigo-600"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                                <span>Métricas</span>
                            </button>
                            <button
                                onClick={() => router.push('/estudiante/analisis')}
                                className="px-6 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 text-slate-600 hover:bg-white hover:shadow-sm hover:text-indigo-600"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                                <span>Respuestas</span>
                            </button>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="w-12 h-12 flex items-center justify-center bg-red-50 hover:bg-red-100 text-red-600 rounded-2xl transition-colors hover:scale-105 active:scale-95 shrink-0"
                            title="Cerrar Sesión"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                        </button>
                    </div>

                    {/* Mobile Hamburger Button */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="md:hidden w-11 h-11 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
                        aria-label="Menú"
                    >
                        {mobileMenuOpen ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        )}
                    </button>
                </div>

                {/* Mobile Menu Dropdown */}
                {mobileMenuOpen && (
                    <div className="md:hidden bg-white/95 backdrop-blur-md border-t border-slate-200/60 animate-in slide-in-from-top duration-200">
                        <div className="max-w-7xl mx-auto px-4 py-4 space-y-3">

                            {/* Selector de Simulacro - Móvil */}
                            {simulacrosDelEstudiante.length > 1 && simulacroActual && (
                                <div className="p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100">
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">Simulacro</p>
                                    <div className="flex gap-2">
                                        {simulacrosDelEstudiante.map(sim => (
                                            <button
                                                key={sim}
                                                onClick={() => {
                                                    handleSimulacroChange(sim);
                                                    setMobileMenuOpen(false);
                                                }}
                                                className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-bold transition-all ${simulacroActual === sim
                                                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30'
                                                    : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-300'
                                                    }`}
                                            >
                                                {sim}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Navigation Links */}
                            <button
                                onClick={() => {
                                    router.push('/estudiante/estadisticas');
                                    setMobileMenuOpen(false);
                                }}
                                className="w-full flex items-center gap-4 p-4 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-colors group"
                            >
                                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                </div>
                                <div className="flex-1 text-left">
                                    <p className="font-bold text-slate-800 text-base">Métricas</p>
                                    <p className="text-xs text-slate-500">Estadísticas detalladas</p>
                                </div>
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>

                            <button
                                onClick={() => {
                                    router.push('/estudiante/analisis');
                                    setMobileMenuOpen(false);
                                }}
                                className="w-full flex items-center gap-4 p-4 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-colors group"
                            >
                                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                    </svg>
                                </div>
                                <div className="flex-1 text-left">
                                    <p className="font-bold text-slate-800 text-base">Respuestas</p>
                                    <p className="text-xs text-slate-500">Análisis pregunta a pregunta</p>
                                </div>
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>

                            <button
                                onClick={() => {
                                    router.push('/estudiante/ranking');
                                    setMobileMenuOpen(false);
                                }}
                                className="w-full flex items-center gap-4 p-4 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-colors group"
                            >
                                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                    </svg>
                                </div>
                                <div className="flex-1 text-left">
                                    <p className="font-bold text-slate-800 text-base">Ranking</p>
                                    <p className="text-xs text-slate-500">Tu posición vs otros</p>
                                </div>
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>

                            {/* Logout Button - Móvil */}
                            <button
                                onClick={() => {
                                    handleLogout();
                                    setMobileMenuOpen(false);
                                }}
                                className="w-full flex items-center gap-4 p-4 bg-red-50 hover:bg-red-100 rounded-2xl transition-colors group border border-red-100"
                            >
                                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center text-red-600 group-hover:scale-110 transition-transform">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                    </svg>
                                </div>
                                <div className="flex-1 text-left">
                                    <p className="font-bold text-red-700 text-base">Cerrar Sesión</p>
                                    <p className="text-xs text-red-500">Salir de tu cuenta</p>
                                </div>
                            </button>
                        </div>
                    </div>
                )}
            </header>

            <main className="max-w-7xl mx-auto px-6 py-10 space-y-10">

                {/* ⚠️ ALERTA: Sesiones Incompletas */}
                {(() => {
                    const sesiones = estudiante.secciones_completadas || estudiante.sesiones || [];
                    const tieneS1 = sesiones.includes('S1');
                    const tieneS2 = sesiones.includes('S2');
                    const sesionesIncompletas = !tieneS1 || !tieneS2;

                    if (sesionesIncompletas) {
                        return (
                            <div className="bg-gradient-to-r from-red-500/10 via-orange-500/10 to-red-500/10 border-2 border-red-500/30 rounded-3xl p-6 md:p-8 relative overflow-hidden animate-pulse-slow">
                                {/* Decorative elements */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl"></div>
                                <div className="absolute bottom-0 left-0 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl"></div>

                                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
                                    {/* Icon */}
                                    <div className="w-16 h-16 md:w-20 md:h-20 bg-red-500/20 rounded-2xl flex items-center justify-center text-4xl md:text-5xl flex-shrink-0 border border-red-500/30">
                                        ⚠️
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 space-y-3">
                                        <h3 className="text-xl md:text-2xl font-black text-red-600 tracking-tight">
                                            ¡Atención! Sesiones Incompletas
                                        </h3>
                                        <p className="text-slate-600 font-medium leading-relaxed">
                                            <strong className="text-red-600">Es tu responsabilidad</strong> completar las <strong>dos sesiones obligatorias</strong> del simulacro.
                                            {!tieneS1 && !tieneS2 && (
                                                <span className="block mt-2 text-red-500 font-bold">
                                                    ❌ No completaste ninguna sesión (S1 ni S2)
                                                </span>
                                            )}
                                            {!tieneS1 && tieneS2 && (
                                                <span className="block mt-2 text-orange-500 font-bold">
                                                    ❌ Falta la Sesión 1 (S1) - Matemáticas, Sociales y Ciencias
                                                </span>
                                            )}
                                            {tieneS1 && !tieneS2 && (
                                                <span className="block mt-2 text-orange-500 font-bold">
                                                    ❌ Falta la Sesión 2 (S2) - Lectura Crítica, Inglés y más
                                                </span>
                                            )}
                                        </p>
                                        <div className="flex flex-wrap gap-3 pt-2">
                                            <div className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 ${tieneS1 ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-300'}`}>
                                                {tieneS1 ? '✓' : '✗'} Sesión 1
                                            </div>
                                            <div className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 ${tieneS2 ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-300'}`}>
                                                {tieneS2 ? '✓' : '✗'} Sesión 2
                                            </div>
                                        </div>
                                    </div>

                                    {/* Impact indicator */}
                                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-red-200 text-center min-w-[140px]">
                                        <p className="text-[10px] uppercase tracking-widest text-red-500 font-bold mb-1">Puntaje Actual</p>
                                        <p className="text-3xl font-black text-red-600">0</p>
                                        <p className="text-[10px] text-slate-500 font-medium mt-1">Penalización aplicada</p>
                                    </div>
                                </div>

                                {/* Footer message */}
                                <div className="mt-6 pt-4 border-t border-red-200/50 text-center">
                                    <p className="text-sm text-slate-500 font-medium">
                                        📢 Comunícate con tu institución si crees que esto es un error.
                                        <span className="block text-xs mt-1 text-slate-400">Los resultados mostrados NO son válidos hasta completar ambas sesiones.</span>
                                    </p>
                                </div>
                            </div>
                        );
                    }
                    return null;
                })()}

                {/* Dashboard Grid System v2 - More Robust */}
                <div className="flex flex-col gap-6">

                    {/* Top Row: Global Score (Big) + Key Stats (Right) */}
                    <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* Tarjeta Principal Puntaje Global */}
                        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-[2rem] p-6 sm:p-8 relative overflow-hidden group shadow-2xl flex flex-col justify-between min-h-[320px] transition-all hover:shadow-indigo-500/20">
                            {/* Blob decorativo animado */}
                            <div className="absolute -top-10 -right-10 w-64 h-64 bg-indigo-500/30 rounded-full blur-[80px] pointer-events-none group-hover:bg-indigo-400/40 transition-colors duration-500"></div>
                            <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-500/10 rounded-full blur-[60px] pointer-events-none"></div>

                            {/* Contenido Superior */}
                            <div className="relative z-10">
                                <div className="flex items-center gap-2 mb-4 opacity-80">
                                    <span className="w-1 h-4 bg-indigo-400 rounded-full"></span>
                                    <p className="text-sm font-bold uppercase tracking-widest text-indigo-200">Puntaje Global</p>
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <h2 className="text-7xl sm:text-8xl md:text-9xl font-black text-white tracking-tighter leading-none score-number">
                                        {estudiante.puntaje_global}
                                    </h2>
                                </div>
                                <p className="text-indigo-300 font-medium mt-1 text-lg md:text-xl">de 500 posibles</p>
                            </div>

                            {/* Contenido Inferior (Nivel) - Separado visualmente */}
                            <div className="relative z-10 mt-8">
                                <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 hover:bg-white/15 transition-colors">
                                    <span className="text-2xl shadow-sm filter drop-shadow-lg">{nivel.icon}</span>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] uppercase tracking-wider text-indigo-200 font-bold leading-tight">Nivel de Desempeño</span>
                                        <span className={`text-sm font-black tracking-wide ${nivel.color.replace('bg-', 'text-').replace('-500', '-300')}`}>
                                            {nivel.text}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Key Stats Cards + Position Card */}
                        <div className="lg:col-span-2 flex flex-col gap-6 h-full">

                            {/* Grid de Stats (Aciertos + Efectividad) */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {/* Stat Card 1: Aciertos */}
                                <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <span className="text-emerald-600 font-bold bg-emerald-50 px-3 py-1 rounded-lg text-xs">+2.5% vs promedio</span>
                                    </div>
                                    <div>
                                        <p className="text-slate-400 text-xs md:text-sm font-bold uppercase tracking-wider mb-1">Aciertos Totales</p>
                                        <p className="text-4xl md:text-5xl font-black text-slate-800 tracking-tight">{totalCorrectas} <span className="text-lg md:text-xl text-slate-400 font-medium">/ {totalPreguntas}</span></p>
                                    </div>
                                </div>

                                {/* Stat Card 2: Efectividad */}
                                <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow group relative flex flex-col justify-between">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                            </svg>
                                        </div>
                                        <span className="text-blue-600 font-bold bg-blue-50 px-3 py-1 rounded-lg text-xs flex items-center gap-2 cursor-help" title="Porcentaje de respuestas correctas">
                                            Efectividad <span className="opacity-50">?</span>
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-slate-400 text-xs md:text-sm font-bold uppercase tracking-wider mb-1">Porcentaje</p>
                                        <p className="text-4xl md:text-5xl font-black text-slate-800 tracking-tight">{porcentajeGlobal}%</p>
                                    </div>
                                    {/* Mobile Tooltip Hint */}
                                    <div className="absolute top-2 right-2 md:hidden opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-[10px] p-2 rounded shadow-lg z-20 pointer-events-none">
                                        % de respuestas correctas
                                    </div>
                                </div>
                            </div>

                            {/* My Position Card (Moved here) */}
                            <div
                                onClick={() => router.push('/estudiante/ranking')}
                                className="bg-gradient-to-br from-purple-50 to-white rounded-[2rem] p-6 sm:px-8 border border-purple-100 shadow-sm hover:shadow-md transition-all cursor-pointer group hover:-translate-y-1 flex flex-row items-center justify-between min-h-[140px]"
                            >
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 bg-white rounded-xl text-purple-600 shadow-sm border border-purple-50 group-hover:scale-110 transition-transform">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                                        </div>
                                        <p className="text-purple-800/60 text-xs font-bold uppercase tracking-widest">Tu Posición Global</p>
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-5xl font-black text-purple-900 tracking-tighter">
                                            #{rankingInfo.puesto}
                                        </span>
                                        <span className="text-sm font-bold text-purple-400">
                                            / {rankingInfo.total} Geniesitos
                                        </span>
                                    </div>
                                </div>
                                <div className="hidden sm:flex items-center gap-2 text-purple-600 font-bold bg-white px-4 py-2 rounded-full text-xs shadow-sm border border-purple-50 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                                    Ver Ranking <span className="text-lg leading-none">&rarr;</span>
                                </div>
                            </div>
                        </div>
                    </section>


                </div>

                {/* Materias Grid */}
                <section>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <span className="w-2 h-6 bg-indigo-600 rounded-full"></span>
                            Resultados por Área
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {materias.map((materia) => {
                            const data = estudiante.puntajes[materia.key] || { puntaje: 0, correctas: 0, total_preguntas: 0 };
                            const porc = data.total_preguntas > 0 ? Math.round((data.correctas / data.total_preguntas) * 100) : 0;

                            return (
                                <div
                                    key={materia.key}
                                    onClick={() => router.push(`/estudiante/analisis?materia=${encodeURIComponent(materia.key)}`)}
                                    className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group overflow-hidden cursor-pointer"
                                >
                                    <div className={`h-2 w-full ${materia.bg.replace('bg-', 'bg-gradient-to-r from-')}-400 to-${materia.bg.replace('bg-', '')}-600`}></div>
                                    <div className="p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${materia.bg} ${materia.text}`}>
                                                    {materia.key === 'matemáticas' && <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>}
                                                    {materia.key === 'lectura crítica' && <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}
                                                    {materia.key === 'sociales y ciudadanas' && <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                                                    {materia.key === 'ciencias naturales' && <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>}
                                                    {materia.key === 'inglés' && <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-slate-800 leading-tight group-hover:text-indigo-600 transition-colors md:text-lg">{materia.label}</h3>
                                                    <p className="text-xs text-slate-400 font-medium">Clic para ver detalles &rarr;</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className={`text-2xl md:text-3xl font-black ${materia.text}`}>
                                                    {data.puntaje}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-wide">
                                                <span>Progreso</span>
                                                <span>{porc}%</span>
                                            </div>
                                            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-1000 ease-out group-hover:scale-105 origin-left`}
                                                    style={{ width: `${porc}%`, backgroundColor: materia.color }}
                                                ></div>
                                            </div>
                                            <div className="flex justify-between items-center text-xs pt-2">
                                                <span className="px-2 py-1 rounded bg-slate-50 text-slate-600 font-medium border border-slate-100">
                                                    {data.correctas} / {data.total_preguntas} Aciertos
                                                </span>
                                            </div>

                                            {/* Sección de Superados */}
                                            {allStudents.length > 0 && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        const currentScore = data.puntaje;
                                                        const outperformed = allStudents.filter(s => {
                                                            const sScore = s.puntajes?.[materia.key]?.puntaje || 0;
                                                            return sScore < currentScore;
                                                        }).sort((a, b) => (b.puntajes[materia.key]?.puntaje || 0) - (a.puntajes[materia.key]?.puntaje || 0));

                                                        setRankingModal({
                                                            title: materia.label,
                                                            students: outperformed,
                                                            color: materia.text,
                                                            subjectKey: materia.key
                                                        });
                                                    }}
                                                    className={`mt-4 w-full py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 group/btn hover:scale-[1.02] active:scale-[0.98] ${materia.bg} border ${materia.border}`}
                                                >
                                                    <span className={`text-[10px] font-bold uppercase tracking-wider ${materia.text} opacity-80`}>
                                                        Superaste a
                                                    </span>
                                                    <div className={`flex items-center gap-1 bg-white px-2 py-0.5 rounded-md shadow-sm border ${materia.border}`}>
                                                        <span className={`text-xs font-black ${materia.text}`}>
                                                            {allStudents.filter(s => (s.puntajes?.[materia.key]?.puntaje || 0) < data.puntaje).length}
                                                        </span>
                                                    </div>
                                                    <span className={`text-[10px] font-bold ${materia.text} opacity-80`}>
                                                        Geniesitos
                                                    </span>
                                                    <svg xmlns="http://www.w3.org/2000/svg" className={`w-3 h-3 ${materia.text} opacity-60 group-hover/btn:translate-x-0.5 transition-transform`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {/* Tarjeta Logo Decorativa (Relleno del Grid) */}
                        <div className="hidden lg:flex bg-white rounded-2xl border border-slate-100 shadow-sm items-center justify-center overflow-hidden">
                            <img
                                src="/seamsogenios_logo_hr.svg"
                                alt="Seamos Genios"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>

                    {/* Validation for Modal to avoid hydration issues */}
                    {rankingModal && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setRankingModal(null)}></div>
                            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col relative z-10 overflow-hidden animate-in fade-in zoom-in duration-200">
                                <div className={`p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50`}>
                                    <div>
                                        <h3 className={`text-xl font-bold ${rankingModal.color}`}>
                                            {rankingModal.title}
                                        </h3>
                                        <p className="text-slate-500 text-sm font-medium">
                                            Superaste a {rankingModal.students.length} Geniesitos
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setRankingModal(null)}
                                        className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>
                                <div className="overflow-y-auto p-4 space-y-2">
                                    {rankingModal.students.length > 0 ? (
                                        rankingModal.students.map((st, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${rankingModal.color.replace('text-', 'bg-').replace('600', '500')}`}>
                                                        {idx + 1}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-slate-700 font-bold text-sm uppercase">
                                                            {st.informacion_personal.nombres.split(' ')[0]} {st.informacion_personal.apellidos.split(' ')[0]}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                                                            {st.informacion_personal.institucion}
                                                        </span>
                                                    </div>
                                                </div>
                                                <span className={`text-lg font-black ${rankingModal.color}`}>
                                                    {st.puntajes[rankingModal.subjectKey]?.puntaje || 0}
                                                </span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-10 text-slate-400">
                                            <p>No hay datos disponibles.</p>
                                        </div>
                                    )}
                                </div>
                                <div className="p-4 border-t border-slate-100 bg-slate-50 text-center text-xs text-slate-400">
                                    Seamos Genios Colombia
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Welcome / Performance Modal */}
                    {welcomeModal && estudiante && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
                            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setWelcomeModal(false)}></div>
                            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md relative z-10 overflow-hidden text-center p-8 sm:p-10 transform transition-all scale-100">
                                {estudiante.puntaje_global >= 320 ? (
                                    <>
                                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-600"></div>
                                        <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/20 text-5xl animate-bounce">
                                            🏆
                                        </div>
                                        <h3 className="text-3xl font-black text-slate-800 mb-3 tracking-tight">
                                            ¡Increíble, {estudiante.informacion_personal.nombres.split(' ')[0].toUpperCase()}!
                                        </h3>
                                        <p className="text-slate-500 font-medium mb-8 leading-relaxed">
                                            Tu puntaje de <strong className="text-emerald-600 text-xl">{estudiante.puntaje_global}</strong> es sobresaliente. Estás demostrando que con esfuerzo todo es posible. ¡Sigue brillando!
                                        </p>
                                        <button
                                            onClick={() => setWelcomeModal(false)}
                                            className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-emerald-600/30 hover:bg-emerald-700 hover:scale-[1.02] active:scale-[0.98] transition-all"
                                        >
                                            ¡Gracias, vamos por más!
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-400 via-indigo-500 to-blue-600"></div>
                                        <div className="w-24 h-24 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/20 text-5xl animate-pulse">
                                            🚀
                                        </div>
                                        <h3 className="text-3xl font-black text-slate-800 mb-3 tracking-tight">
                                            ¡Tú puedes, {estudiante.informacion_personal.nombres.split(' ')[0].toUpperCase()}!
                                        </h3>
                                        <p className="text-slate-500 font-medium mb-8 leading-relaxed">
                                            Obtuviste <strong className="text-blue-600 text-xl">{estudiante.puntaje_global}</strong> puntos. Es un buen comienzo, pero sabemos que tu potencial es infinito. ¡Revisa tus fallos y vuelve más fuerte!
                                        </p>
                                        <button
                                            onClick={() => setWelcomeModal(false)}
                                            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-blue-600/30 hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] transition-all"
                                        >
                                            ¡Voy a mejorar!
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    )}


                </section >

                {/* Footer */}
                < footer className="text-center py-8 border-t border-slate-200" >
                    <p className="text-slate-400 text-sm font-medium">
                        © 2026 Seamos Genios Colombia &bull; Plataforma de Resultados Inteligentes
                    </p>
                </footer >
            </main >
        </div >
    );
}
