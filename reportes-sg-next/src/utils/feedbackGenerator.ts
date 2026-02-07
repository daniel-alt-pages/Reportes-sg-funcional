
// Definición exacta de rangos basada en Flask/Informe.html
interface NivelEstadistico {
    p25: number;
    p50: number;
    p75: number;
    tope: number;
}

export const NIVELES_ESTADISTICOS: Record<string, NivelEstadistico> = {
    'lectura crítica': { p25: 35, p50: 50, p75: 65, tope: 100 },
    'matemáticas': { p25: 35, p50: 50, p75: 70, tope: 100 },
    'ciencias sociales': { p25: 40, p50: 55, p75: 70, tope: 100 },
    'sociales y ciudadanas': { p25: 40, p50: 55, p75: 70, tope: 100 },
    'ciencias naturales': { p25: 40, p50: 55, p75: 70, tope: 100 },
    'inglés': { p25: 57, p50: 70, p75: 85, tope: 100 }
};

interface AnalisisEstadistico {
    nivel: number;
    etiqueta: string;
    distancia_siguiente_nivel: number; // Puntos faltantes
    performance_relativo: number; // 0-100% dentro del nivel
    color: string;
    bg: string;
}

export const ANALIZAR_DESEMPENO = (materia: string, puntaje: number): AnalisisEstadistico => {
    // Normalizar la llave
    let key = materia.toLowerCase();
    if (key.includes('sociales')) key = 'ciencias sociales';
    else if (key.includes('naturales')) key = 'ciencias naturales';
    else if (key.includes('lectura')) key = 'lectura crítica';
    else if (key.includes('matem')) key = 'matemáticas';
    else if (key.includes('ingl')) key = 'inglés';

    // Si no encuentra la llave exacta, usa por defecto Matemáticas (seguro intermedio)
    const rangos = NIVELES_ESTADISTICOS[key] || { p25: 35, p50: 50, p75: 70, tope: 100 };

    let nivel = 0;
    let etiqueta = '';
    let color = '';
    let bg = '';
    let limite_inferior = 0;
    let limite_superior = 0;

    if (puntaje <= rangos.p25) {
        nivel = 1;
        etiqueta = 'Desempeño Bajo';
        color = 'text-red-400';
        bg = 'bg-red-500';
        limite_inferior = 0;
        limite_superior = rangos.p25;
    } else if (puntaje <= rangos.p50) {
        nivel = 2;
        etiqueta = 'Desempeño Medio';
        color = 'text-yellow-400';
        bg = 'bg-yellow-500';
        limite_inferior = rangos.p25 + 1;
        limite_superior = rangos.p50;
    } else if (puntaje <= rangos.p75) {
        nivel = 3;
        etiqueta = 'Desempeño Alto';
        color = 'text-blue-400';
        bg = 'bg-blue-500';
        limite_inferior = rangos.p50 + 1;
        limite_superior = rangos.p75;
    } else {
        nivel = 4;
        etiqueta = 'Desempeño Superior';
        color = 'text-emerald-400';
        bg = 'bg-emerald-500';
        limite_inferior = rangos.p75 + 1;
        limite_superior = rangos.tope;
    }

    // Calcular métrica de precisión (Progreso dentro del nivel actual)
    const rango_tamano = limite_superior - limite_inferior;
    const posicion_en_rango = puntaje - limite_inferior;

    let performance_relativo = 0;

    if (nivel === 4) {
        // En nivel superior, si ya pasó el umbral, mostrar lleno o relativo al 100 absoluto si se desea
        // Opción A: Barra llena porque ya "ganó" el nivel máximo.
        performance_relativo = 100;
    } else {
        // Niveles 1, 2, 3: calcular porcentaje recorrido en el escalón actual
        performance_relativo = rango_tamano > 0
            ? Math.round((posicion_en_rango / rango_tamano) * 100)
            : 100;
    }

    // Clamp entre 0 y 100 por seguridad
    performance_relativo = Math.min(100, Math.max(0, performance_relativo));

    // Distancia al siguiente nivel
    const distancia = nivel < 4 ? (limite_superior + 1) - puntaje : 0;

    return {
        nivel,
        etiqueta,
        distancia_siguiente_nivel: distancia,
        performance_relativo,
        color,
        bg
    };
};

export const CALCULAR_CONSISTENCIA = (respuestas: any[]) => {
    if (!respuestas || respuestas.length === 0) return { racha_max: 0, tasa_error: 0 };

    let racha_actual = 0;
    let racha_max = 0;
    let errores = 0;

    respuestas.forEach(r => {
        if (r.es_correcta) {
            racha_actual++;
            if (racha_actual > racha_max) racha_max = racha_actual;
        } else {
            racha_actual = 0;
            errores++;
        }
    });

    return {
        racha_max,
        tasa_error: Math.round((errores / respuestas.length) * 100)
    };
};
