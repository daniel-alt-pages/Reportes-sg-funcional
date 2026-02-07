/**
 * Simulation types for versioned data structure
 */

import type { Estudiante } from './index';

export interface SimulationManifest {
    id: string;
    name: string;
    date: string;
    version: string;
    totalStudents: number;
    sessions: string[];
    generatedAt: string;
}

export interface SimulationStudentsFile {
    version: string;
    simulationId: string;
    students: Record<string, Estudiante>;
    index: string[];
}

export interface CurrentSimulation {
    active: string;
    available: string[];
}
