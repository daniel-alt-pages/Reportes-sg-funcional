/**
 * Simulation Data Loader
 * 
 * Provides functions to load student data from the new unified structure.
 * Supports multiple simulations with versioning.
 */

import type { Estudiante, EstadisticasGrupo } from '@/types';
import type { SimulationManifest, SimulationStudentsFile, CurrentSimulation } from '@/types/simulation';

// Cache for loaded data to avoid redundant fetches
const cache: {
    currentSimulation?: CurrentSimulation;
    manifests: Record<string, SimulationManifest>;
    students: Record<string, SimulationStudentsFile>;
    statistics: Record<string, EstadisticasGrupo>;
} = {
    manifests: {},
    students: {},
    statistics: {}
};

/**
 * Get the currently active simulation configuration.
 */
export async function getCurrentSimulation(): Promise<CurrentSimulation> {
    if (cache.currentSimulation) {
        return cache.currentSimulation;
    }

    const res = await fetch('/data/current_simulation.json');
    if (!res.ok) {
        throw new Error('Failed to load current simulation config');
    }

    const data = await res.json();
    cache.currentSimulation = data;
    return data;
}

/**
 * Get the manifest for a specific simulation.
 */
export async function getSimulationManifest(simId: string): Promise<SimulationManifest> {
    if (cache.manifests[simId]) {
        return cache.manifests[simId];
    }

    const res = await fetch(`/data/simulations/${simId}/manifest.json`);
    if (!res.ok) {
        throw new Error(`Failed to load manifest for simulation: ${simId}`);
    }

    const data = await res.json();
    cache.manifests[simId] = data;
    return data;
}

/**
 * Load all students for a simulation.
 * Returns an array of students for compatibility with existing code.
 */
export async function loadStudents(simId?: string): Promise<Estudiante[]> {
    const currentSim = simId || (await getCurrentSimulation()).active;

    if (cache.students[currentSim]) {
        const data = cache.students[currentSim];
        return data.index.map(id => data.students[id]);
    }

    const res = await fetch(`/data/simulations/${currentSim}/students.json`);
    if (!res.ok) {
        throw new Error(`Failed to load students for simulation: ${currentSim}`);
    }

    const data: SimulationStudentsFile = await res.json();
    cache.students[currentSim] = data;

    // Convert to array for compatibility
    return data.index.map(id => data.students[id]);
}

/**
 * Get a single student by ID.
 * More efficient than loading all students when only one is needed.
 */
export async function getStudentById(studentId: string, simId?: string): Promise<Estudiante | null> {
    const students = await loadStudents(simId);
    return students.find(s => s.informacion_personal.numero_identificacion === studentId) ?? null;
}

/**
 * Load group statistics for a simulation.
 */
export async function loadStatistics(simId?: string): Promise<EstadisticasGrupo> {
    const currentSim = simId || (await getCurrentSimulation()).active;

    if (cache.statistics[currentSim]) {
        return cache.statistics[currentSim];
    }

    const res = await fetch(`/data/simulations/${currentSim}/statistics.json`);
    if (!res.ok) {
        throw new Error(`Failed to load statistics for simulation: ${currentSim}`);
    }

    const data = await res.json();
    cache.statistics[currentSim] = data;
    return data;
}

/**
 * List all available simulations.
 */
export async function listAvailableSimulations(): Promise<string[]> {
    const config = await getCurrentSimulation();
    return config.available;
}

/**
 * Clear the cache (useful for development or when switching simulations).
 */
export function clearCache(): void {
    cache.currentSimulation = undefined;
    cache.manifests = {};
    cache.students = {};
    cache.statistics = {};
}
