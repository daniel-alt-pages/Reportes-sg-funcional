// Definición de enlaces a recursos por materia
const RECURSOS = {
    'lectura': 'https://drive.google.com/drive/folders/17ii11xMj1cxRqHhpfmCvu7_7S_6KNxDr?usp=sharing',
    'matematicas': 'https://drive.google.com/drive/folders/1l_5Fyh7DcUe24VehrNB-F8KnMxI7SEyJ?usp=sharing',
    'ingles': 'https://drive.google.com/drive/folders/1TYJUJ8MtzDThVaJWhh7EHEiWUxUCrqrF?usp=sharing',
    'sociales': 'https://drive.google.com/drive/folders/1xZYYcrOlR15qGrzechzQkcMqNutjTW7X?usp=sharing',
    'naturales': 'https://drive.google.com/drive/folders/1IrFpbUte-uOb0QXmpWuBG-W9uo70rs5W?usp=sharing'
};

// Mapeo de nombres de materias para manejar diferentes variaciones
const MAPEO_MATERIAS = {
    'lectura crítica': 'lectura',
    'matemáticas': 'matematicas',
    'ciencias naturales': 'naturales',
    'ciencias sociales': 'sociales',
    'inglés': 'ingles',
    'sociales y ciudadanas': 'sociales',
    'naturales y exactas': 'naturales',
    'comprensión lectora': 'lectura',
    'reading': 'ingles',
    'grammar': 'ingles',
    'vocabulary': 'ingles'
};

// Función para obtener el enlace de recursos de una materia
function obtenerEnlaceRecursos(materia) {
    const materiaLowerCase = materia.toLowerCase();
    const materiaMapeada = MAPEO_MATERIAS[materiaLowerCase] || materiaLowerCase;
    return RECURSOS[materiaMapeada] || '#';
}

// Función para encontrar la materia más relevante en un texto
function encontrarMateriaPrioritaria(texto) {
    const textoLower = texto.toLowerCase();
    let materiasPrioritarias = [];
    let prioridadMaxima = 0;

    // Buscar todas las materias mencionadas y asignar prioridades
    Object.entries(MAPEO_MATERIAS).forEach(([nombreCompleto, nombreCorto]) => {
        if (textoLower.includes(nombreCompleto.toLowerCase()) || 
            textoLower.includes(nombreCorto.toLowerCase())) {
            let prioridad = 1;
            
            // Aumentar prioridad basado en el contexto
            if (textoLower.includes('ejercicios combinados de ' + nombreCompleto.toLowerCase()) ||
                textoLower.includes('simulacro específico de ' + nombreCompleto.toLowerCase())) {
                prioridad += 2;
            }
            
            // Si es la primera materia mencionada, darle más prioridad
            const posicion = textoLower.indexOf(nombreCompleto.toLowerCase());
            if (posicion !== -1 && posicion < 30) {
                prioridad += 1;
            }

            if (prioridad >= prioridadMaxima) {
                if (prioridad > prioridadMaxima) {
                    materiasPrioritarias = [];
                }
                prioridadMaxima = prioridad;
                materiasPrioritarias.push({
                    nombreCompleto,
                    nombreCorto,
                    prioridad
                });
            }
        }
    });

    // Si no se encontró ninguna materia específica, buscar palabras clave generales
    if (materiasPrioritarias.length === 0) {
        if (textoLower.includes('reading') || textoLower.includes('grammar') || 
            textoLower.includes('vocabulary') || textoLower.includes('speaking')) {
            return { nombreCompleto: 'Inglés', nombreCorto: 'ingles' };
        }
        if (textoLower.includes('lectura') || textoLower.includes('comprensión')) {
            return { nombreCompleto: 'Lectura Crítica', nombreCorto: 'lectura' };
        }
        // Agregar más casos generales si es necesario
    }

    // Retornar la materia más prioritaria
    return materiasPrioritarias.length > 0 ? materiasPrioritarias[0] : null;
}

// Función para actualizar los enlaces de recursos en el plan de estudio
function actualizarEnlacesRecursos() {
    // Obtener todos los elementos con la clase 'recursos'
    const elementosRecursos = document.querySelectorAll('.recursos');
    
    elementosRecursos.forEach(elemento => {
        // Obtener el texto actual del elemento
        const textoActual = elemento.textContent;
        
        // Encontrar la materia más relevante
        const materiaPrioritaria = encontrarMateriaPrioritaria(textoActual);
        
        if (materiaPrioritaria) {
            const enlace = RECURSOS[materiaPrioritaria.nombreCorto];
            if (enlace) {
                // Crear el enlace usando el nombre completo de la materia
                elemento.innerHTML = `Recursos: <a href="${enlace}" target="_blank" class="recurso-link">Material específico de ${materiaPrioritaria.nombreCompleto}</a>`;
            }
        }
    });
}

// Agregar la función al objeto window para que esté disponible globalmente
window.actualizarEnlacesRecursos = actualizarEnlacesRecursos; 