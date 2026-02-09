/**
 * Firestore Service — Capa de datos unificada
 * 
 * Reemplaza TODOS los fetch() a archivos JSON estáticos.
 * Fuente de verdad única para toda la app.
 */

import { db } from './firebase';
import {
    doc,
    getDoc,
    getDocs,
    collection,
    query,
    where,
    DocumentData,
    QueryDocumentSnapshot,
} from 'firebase/firestore';
import type { Estudiante, EstadisticasGrupo } from '@/types';

// ========================================
// Types
// ========================================

export interface AppConfig {
    activeSimulation: string;
    availableSimulations: string[];
}

export interface StudentProfile {
    id: string;
    email: string;
    nombre: string;
    apellidos: string;
    institucion?: string;
}

export interface SimulationManifest {
    id: string;
    name: string;
    date: string;
    totalStudents: number;
}

export interface InvalidacionItem {
    simulacro: string;
    sesion: string;
    numero_pregunta: number;
    materia: string;
    motivo?: string;
}

// ========================================
// Persistent Cache (localStorage + in-memory)
// ========================================

const CACHE_VERSION = 'sg_v2';
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 horas

interface CacheEntry<T> {
    data: T;
    timestamp: number;
}

/** Guardar en localStorage con TTL */
function persistSet<T>(key: string, data: T): void {
    try {
        const entry: CacheEntry<T> = { data, timestamp: Date.now() };
        localStorage.setItem(`${CACHE_VERSION}_${key}`, JSON.stringify(entry));
    } catch (err) {
        // localStorage full o no disponible — silently skip
        console.warn('[Cache] localStorage write failed:', err);
    }
}

/** Leer de localStorage, null si expirado o no existe */
function persistGet<T>(key: string): T | null {
    try {
        const raw = localStorage.getItem(`${CACHE_VERSION}_${key}`);
        if (!raw) return null;
        const entry: CacheEntry<T> = JSON.parse(raw);
        if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
            localStorage.removeItem(`${CACHE_VERSION}_${key}`);
            return null; // Expirado
        }
        return entry.data;
    } catch {
        return null;
    }
}

/** Limpiar todo el caché persistente */
function persistClear(): void {
    try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith(CACHE_VERSION)) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(k => localStorage.removeItem(k));
    } catch {
        // Ignore
    }
}

// In-memory cache (fastest, lost on refresh)
const cache: {
    appConfig?: AppConfig;
    studentProfiles: Map<string, StudentProfile>;
    studentResults: Map<string, Estudiante>;
    allStudents: Map<string, Estudiante[]>;
    statistics: Map<string, EstadisticasGrupo>;
    invalidaciones: Map<string, InvalidacionItem[]>;
    rankings: Map<string, DocumentData>;
    manifests: Map<string, SimulationManifest>;
} = {
    studentProfiles: new Map(),
    studentResults: new Map(),
    allStudents: new Map(),
    statistics: new Map(),
    invalidaciones: new Map(),
    rankings: new Map(),
    manifests: new Map(),
};

// ========================================
// App Config
// ========================================

/**
 * Get app configuration (active simulation, available list)
 * Replaces: fetch('/data/current_simulation.json')
 */
export async function getAppConfig(): Promise<AppConfig> {
    if (cache.appConfig) return cache.appConfig;

    // Check localStorage
    const persisted = persistGet<AppConfig>('appConfig');
    if (persisted) {
        cache.appConfig = persisted;
        return persisted;
    }

    try {
        const docRef = doc(db, 'config', 'app');
        const snap = await getDoc(docRef);

        if (snap.exists()) {
            const data = snap.data();
            const config: AppConfig = {
                activeSimulation: data.activeSimulation,
                availableSimulations: data.availableSimulations || [],
            };
            cache.appConfig = config;
            persistSet('appConfig', config);
            return config;
        }
    } catch (err) {
        console.warn('[Firestore] Could not read config/app, falling back to static JSON:', err);
    }

    // Fallback: read from static JSON file
    try {
        const res = await fetch('/data/current_simulation.json');
        const data = await res.json();
        const config: AppConfig = {
            activeSimulation: data.active,
            availableSimulations: data.available || [],
        };
        cache.appConfig = config;
        persistSet('appConfig', config);
        return config;
    } catch (fetchErr) {
        const config: AppConfig = {
            activeSimulation: 'SG11-09',
            availableSimulations: ['SG11-08', 'SG11-09'],
        };
        cache.appConfig = config;
        return config;
    }
}

// ========================================
// Student Auth / Profile
// ========================================

/**
 * Find student by email for authentication.
 * Replaces: fetch('/data/auth_index.json') + allowedEmails.ts
 */
export async function getStudentByEmail(email: string): Promise<StudentProfile | null> {
    // Debug alias map — permite login con correos de prueba
    const DEBUG_EMAIL_ALIASES: Record<string, string> = {
        'agenteno11sg@gmail.com': 'mendietafonscar.sg.est@gmail.com', // Rosa Mendieta Fonseca
    };

    let normalizedEmail = email.toLowerCase().trim();
    if (DEBUG_EMAIL_ALIASES[normalizedEmail]) {
        console.warn(`[DEBUG] Email alias: ${normalizedEmail} → ${DEBUG_EMAIL_ALIASES[normalizedEmail]}`);
        normalizedEmail = DEBUG_EMAIL_ALIASES[normalizedEmail];
    }

    // Check cache
    if (cache.studentProfiles.has(normalizedEmail)) {
        return cache.studentProfiles.get(normalizedEmail)!;
    }

    // 1. Try Firestore first
    try {
        const studentsRef = collection(db, 'students');
        const q = query(studentsRef, where('email', '==', normalizedEmail));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
            const docSnap = snapshot.docs[0];
            const data = docSnap.data();
            const profile: StudentProfile = {
                id: docSnap.id,
                email: data.email,
                nombre: data.nombre,
                apellidos: data.apellidos,
                institucion: data.institucion,
            };
            cache.studentProfiles.set(normalizedEmail, profile);
            return profile;
        }
    } catch (err) {
        console.warn('[Firestore] Error querying students, falling back to static:', err);
    }

    // 2. Fallback: auth_index.json estático
    console.warn('[Firestore] Student not found in Firestore, trying auth_index.json...');
    try {
        const res = await fetch('/data/auth_index.json');
        const authIndex: Array<{ e: string; i: string; n: string }> = await res.json();
        const match = authIndex.find(entry => entry.e.toLowerCase() === normalizedEmail);

        if (match) {
            // Parse name from format "INST - NOMBRE COMPLETO"
            const nameParts = match.n.includes(' - ') ? match.n.split(' - ')[1] : match.n;
            const words = nameParts.trim().split(' ');
            const nombre = words.slice(0, Math.ceil(words.length / 2)).join(' ');
            const apellidos = words.slice(Math.ceil(words.length / 2)).join(' ');

            const profile: StudentProfile = {
                id: match.i,
                email: match.e,
                nombre,
                apellidos,
                institucion: match.n.includes(' - ') ? match.n.split(' - ')[0] : undefined,
            };
            cache.studentProfiles.set(normalizedEmail, profile);
            return profile;
        }
    } catch (fetchErr) {
        console.error('[Firestore] auth_index.json fallback also failed:', fetchErr);
    }

    return null;
}

// ========================================
// Student Results
// ========================================

/**
 * Get results for a specific student in a simulation.
 * Replaces: fetch(`/data/simulations/${sim}/estudiantes/${id}.json`)
 */
export async function getStudentResults(
    studentId: string,
    simId?: string
): Promise<Estudiante | null> {
    const config = await getAppConfig();
    const currentSim = simId || config.activeSimulation;
    const cacheKey = `results_${studentId}_${currentSim}`;

    if (cache.studentResults.has(cacheKey)) {
        return cache.studentResults.get(cacheKey)!;
    }

    // Check localStorage
    const persisted = persistGet<Estudiante>(cacheKey);
    if (persisted) {
        cache.studentResults.set(cacheKey, persisted);
        return persisted;
    }

    // 1. Try Firestore
    try {
        const docRef = doc(db, 'students', studentId, 'results', currentSim);
        const snap = await getDoc(docRef);

        if (snap.exists()) {
            const data = snap.data() as Estudiante;
            cache.studentResults.set(cacheKey, data);
            persistSet(cacheKey, data);
            return data;
        }
    } catch (err) {
        console.warn('[Firestore] Error reading student results, falling back to static:', err);
    }

    // 2. Fallback: static JSON
    try {
        const res = await fetch(`/data/simulations/${currentSim}/estudiantes/${studentId}.json`);
        if (res.ok) {
            const data = await res.json() as Estudiante;
            cache.studentResults.set(cacheKey, data);
            persistSet(cacheKey, data);
            return data;
        }
    } catch (fetchErr) {
        console.warn('[Firestore] Static JSON fallback also failed:', fetchErr);
    }

    return null;
}

// ========================================
// All Students (Admin)
// ========================================

/**
 * Get all students for a simulation (admin only).
 * Replaces: fetch(`/data/simulations/${sim}/students.json`)
 */
export async function getAllStudents(simId?: string): Promise<Estudiante[]> {
    const config = await getAppConfig();
    const currentSim = simId || config.activeSimulation;
    const persistKey = `allStudents_${currentSim}`;

    if (cache.allStudents.has(currentSim)) {
        return cache.allStudents.get(currentSim)!;
    }

    // Check localStorage
    const persisted = persistGet<Estudiante[]>(persistKey);
    if (persisted) {
        cache.allStudents.set(currentSim, persisted);
        return persisted;
    }

    // Read from admin_students collection (chunked docs for large datasets)
    const chunksRef = collection(db, 'admin_students', currentSim, 'chunks');
    const snapshot = await getDocs(chunksRef);

    const students: Estudiante[] = [];
    snapshot.forEach((docSnap: QueryDocumentSnapshot) => {
        const data = docSnap.data();
        if (data.estudiantes && Array.isArray(data.estudiantes)) {
            students.push(...data.estudiantes);
        }
    });

    // Fallback: static JSON if Firestore returned nothing
    if (students.length === 0) {
        try {
            const res = await fetch(`/data/simulations/${currentSim}/students.json`);
            if (res.ok) {
                const data = await res.json();
                let arr: Estudiante[] = [];
                if (data.estudiantes && Array.isArray(data.estudiantes)) arr = data.estudiantes;
                else if (data.students && typeof data.students === 'object') arr = Object.values(data.students);
                if (arr.length > 0) {
                    cache.allStudents.set(currentSim, arr);
                    persistSet(persistKey, arr);
                    return arr;
                }
            }
        } catch {
            // Ignore fallback errors
        }
    }

    cache.allStudents.set(currentSim, students);
    persistSet(persistKey, students);
    return students;
}

// ========================================
// Statistics
// ========================================

/**
 * Get group statistics for a simulation.
 * Replaces: fetch(`/data/simulations/${sim}/estadisticas_grupo.json`)
 */
export async function getStatistics(simId?: string): Promise<EstadisticasGrupo> {
    const config = await getAppConfig();
    const currentSim = simId || config.activeSimulation;
    const persistKey = `stats_${currentSim}`;

    if (cache.statistics.has(currentSim)) {
        return cache.statistics.get(currentSim)!;
    }

    // Check localStorage
    const persisted = persistGet<EstadisticasGrupo>(persistKey);
    if (persisted) {
        cache.statistics.set(currentSim, persisted);
        return persisted;
    }

    // 1. Try Firestore
    try {
        const docRef = doc(db, 'simulations', currentSim, 'data', 'estadisticas');
        const snap = await getDoc(docRef);

        if (snap.exists()) {
            const data = snap.data() as EstadisticasGrupo;
            cache.statistics.set(currentSim, data);
            persistSet(persistKey, data);
            return data;
        }
    } catch (err) {
        console.warn('[Firestore] Error reading statistics, falling back to static:', err);
    }

    // 2. Fallback: static JSON
    try {
        const res = await fetch(`/data/simulations/${currentSim}/estadisticas_grupo.json`);
        if (res.ok) {
            const data = await res.json() as EstadisticasGrupo;
            cache.statistics.set(currentSim, data);
            persistSet(persistKey, data);
            return data;
        }
    } catch (fetchErr) {
        console.warn('[Firestore] Static JSON fallback also failed:', fetchErr);
    }

    throw new Error(`Statistics not found for simulation: ${currentSim}`);
}

// ========================================
// Invalidaciones
// ========================================

/**
 * Get invalidated questions for a simulation.
 * Replaces: fetch('/data/invalidaciones.json')
 */
export async function getInvalidaciones(simId?: string): Promise<InvalidacionItem[]> {
    const config = await getAppConfig();
    const currentSim = simId || config.activeSimulation;

    if (cache.invalidaciones.has(currentSim)) {
        return cache.invalidaciones.get(currentSim)!;
    }

    const docRef = doc(db, 'simulations', currentSim, 'data', 'invalidaciones');
    const snap = await getDoc(docRef);

    if (!snap.exists()) {
        cache.invalidaciones.set(currentSim, []);
        return [];
    }

    const data = snap.data();
    const items = (data.items || []) as InvalidacionItem[];
    cache.invalidaciones.set(currentSim, items);
    return items;
}

// ========================================
// Simulation Manifest
// ========================================

/**
 * Get manifest for a simulation.
 * Replaces: fetch(`/data/simulations/${sim}/manifest.json`)
 */
export async function getSimulationManifest(simId: string): Promise<SimulationManifest> {
    if (cache.manifests.has(simId)) {
        return cache.manifests.get(simId)!;
    }

    const docRef = doc(db, 'simulations', simId);
    const snap = await getDoc(docRef);

    if (!snap.exists()) {
        throw new Error(`Manifest not found for simulation: ${simId}`);
    }

    const data = snap.data();
    const manifest: SimulationManifest = {
        id: simId,
        name: data.name,
        date: data.date,
        totalStudents: data.totalStudents,
    };

    cache.manifests.set(simId, manifest);
    return manifest;
}

// ========================================
// Rankings
// ========================================

/**
 * Get ranking for a simulation.
 * Replaces: fetch(`/data/ranking_index.json`)
 */
export async function getRanking(simId?: string): Promise<Estudiante[]> {
    const config = await getAppConfig();
    const currentSim = simId || config.activeSimulation;

    // Rankings use the same data as allStudents, just sorted
    const students = await getAllStudents(currentSim);

    // Sort by global score descending
    return [...students].sort((a, b) => (b.puntaje_global || 0) - (a.puntaje_global || 0));
}

// ========================================
// Available Simulations
// ========================================

/**
 * List all available simulations.
 */
export async function listAvailableSimulations(): Promise<string[]> {
    const config = await getAppConfig();
    return config.availableSimulations;
}

// ========================================
// Detect simulations for a student
// ========================================

/**
 * Detect which simulations a student has results in.
 * Replaces: HEAD requests to individual student JSON files
 */
export async function getStudentSimulations(studentId: string): Promise<string[]> {
    const config = await getAppConfig();
    const available: string[] = [];

    for (const simId of config.availableSimulations) {
        // 1. Try Firestore
        try {
            const docRef = doc(db, 'students', studentId, 'results', simId);
            const snap = await getDoc(docRef);
            if (snap.exists()) {
                available.push(simId);
                continue;
            }
        } catch (err) {
            console.warn(`[Firestore] Error checking sim ${simId} for ${studentId}:`, err);
        }

        // 2. Fallback: static JSON
        try {
            const res = await fetch(`/data/simulations/${simId}/estudiantes/${studentId}.json`, { method: 'HEAD' });
            if (res.ok) {
                available.push(simId);
            }
        } catch {
            // Not found, skip
        }
    }

    return available;
}

// ========================================
// Cache Management
// ========================================

/**
 * Clear all cached data (for switching simulations or dev).
 */
export function clearCache(): void {
    // Clear in-memory
    cache.appConfig = undefined;
    cache.studentProfiles.clear();
    cache.studentResults.clear();
    cache.allStudents.clear();
    cache.statistics.clear();
    cache.invalidaciones.clear();
    cache.rankings.clear();
    cache.manifests.clear();
    // Clear localStorage persistent cache
    persistClear();
}
