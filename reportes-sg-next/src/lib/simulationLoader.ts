/**
 * Simulation Data Loader (Firestore-backed)
 * 
 * Unified data access layer. Uses firestoreService.ts as the single source of truth.
 * Maintains backwards-compatible API for existing components.
 */

import type { Estudiante, EstadisticasGrupo } from '@/types';
import type { SimulationManifest, CurrentSimulation } from '@/types/simulation';
import {
    getAppConfig,
    getAllStudents,
    getStudentResults,
    getStatistics,
    getSimulationManifest as fsGetManifest,
    listAvailableSimulations as fsListSims,
    clearCache as fsClearCache,
    getStudentSimulations,
} from './firestoreService';

// ========================================
// Backwards-compatible API
// ========================================

/**
 * Get the currently active simulation configuration.
 */
export async function getCurrentSimulation(): Promise<CurrentSimulation> {
    const config = await getAppConfig();
    return {
        active: config.activeSimulation,
        available: config.availableSimulations,
    };
}

/**
 * Get the manifest for a specific simulation.
 */
export async function getSimulationManifest(simId: string): Promise<SimulationManifest> {
    const manifest = await fsGetManifest(simId);
    return {
        id: manifest.id,
        name: manifest.name,
        date: manifest.date,
        version: '1.0.0',
        totalStudents: manifest.totalStudents,
        sessions: ['S1', 'S2'],
        generatedAt: '',
    };
}

/**
 * Load all students for a simulation.
 * Returns an array of students for compatibility with existing code.
 */
export async function loadStudents(simId?: string): Promise<Estudiante[]> {
    const config = await getAppConfig();
    const currentSim = simId || config.activeSimulation;
    return await getAllStudents(currentSim);
}

/**
 * Get a single student by ID.
 */
export async function getStudentById(studentId: string, simId?: string): Promise<Estudiante | null> {
    const config = await getAppConfig();
    const currentSim = simId || config.activeSimulation;
    return await getStudentResults(studentId, currentSim);
}

/**
 * Load group statistics for a simulation.
 */
export async function loadStatistics(simId?: string): Promise<EstadisticasGrupo> {
    return await getStatistics(simId);
}

/**
 * List all available simulations.
 */
export async function listAvailableSimulations(): Promise<string[]> {
    return await fsListSims();
}

/**
 * Detect which simulations a student participated in.
 */
export async function detectStudentSimulations(studentId: string): Promise<string[]> {
    return await getStudentSimulations(studentId);
}

/**
 * Clear the cache (useful for development or when switching simulations).
 */
export function clearCache(): void {
    fsClearCache();
}
