// Tipos para el sistema de reportes ICFES

export interface InformacionPersonal {
  nombres: string;
  apellidos: string;
  tipo_identificacion: string;
  numero_identificacion: string;
  telefono: string;
  municipio: string;
}

export interface PuntajeMateria {
  correctas: number;
  total_preguntas: number;
  puntaje: number;
}

export interface RespuestaDetallada {
  numero: number;
  respuesta_estudiante: string;
  respuesta_correcta: string;
  es_correcta: boolean;
}

export interface Estudiante {
  informacion_personal: InformacionPersonal & {
    correo_electronico?: string;
    institucion?: string;
  };
  tipo: string;
  puntajes: {
    [materia: string]: PuntajeMateria;
  };
  respuestas_detalladas?: {
    [materia: string]: RespuestaDetallada[];
  };
  score_reportado?: number;
  score_real?: number;
  puntaje_global: number;
  fecha?: string;
  secciones_completadas?: string[];
  sesiones?: string[];
  s1_aciertos?: number;
  s1_total?: number;
  s2_aciertos?: number;
  s2_total?: number;
}

export interface ResultadosFinales {
  estudiantes: Estudiante[];
}

export interface DistribucionRespuestas {
  A: number;
  B: number;
  C: number;
  D: number;
  E?: number;
  F?: number;
  G?: number;
  H?: number;
  NR: number;
}

export interface EstadisticaPregunta {
  numero: number;
  respuesta_correcta: string;
  distribucion: DistribucionRespuestas;
  porcentaje_acierto: number;
  total_evaluados: number;
}

export interface EstadisticasMateria {
  [pregunta: string]: EstadisticaPregunta;
}

export interface MetadataEstadisticas {
  total_evaluados: number;
  fecha_generacion: string;
}

export interface EstadisticasGrupo {
  metadata: MetadataEstadisticas;
  materias: {
    [materia: string]: EstadisticasMateria;
  };
}

// Constantes
export const MATERIAS_NOMBRES: { [key: string]: string } = {
  'lectura crítica': 'Lectura Crítica',
  'matemáticas': 'Matemáticas',
  'sociales y ciudadanas': 'Ciencias Sociales',
  'ciencias naturales': 'Ciencias Naturales',
  'inglés': 'Inglés'
};

export const COLORES_MATERIAS: { [key: string]: string } = {
  'lectura crítica': '#FF4D4D',
  'matemáticas': '#33CCFF',
  'sociales y ciudadanas': '#FF8C00',
  'ciencias naturales': '#33FF77',
  'inglés': '#B366FF'
};

export interface DashboardStats {
    promedio: number;
    maximo: number;
    minimo: number;
    niveles: { superior: number; alto: number; medio: number; bajo: number };
    distribucion: Record<string, number>;
    promediosPorMateria: Array<{
        nombre: string;
        promedio: number;
        correctas: number;
        estudiantes: number;
    }>;
    top5: Estudiante[];
    enRiesgo: Estudiante[];
    conAmbas: number;
    total: number;
}


export interface InstitucionData {
    estudiantes: Estudiante[];
    promedio: number;
    niveles: {
        superior: number;
        alto: number;
        medio: number;
        bajo: number;
    };
}

