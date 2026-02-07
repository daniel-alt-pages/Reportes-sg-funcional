// Configuración de colores para las materias
const COLORES_MATERIAS = {
    'LC': '#FF4D4D', // Lectura Crítica
    'MT': '#33CCFF', // Matemáticas
    'SC': '#FF8C00', // Ciencias Sociales
    'CN': '#33FF77', // Ciencias Naturales
    'IN': '#B366FF'  // Inglés
};

// Configuración común para todas las gráficas
const configuracionComun = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            position: 'bottom',
            labels: {
                font: {
                    family: 'Arial',
                    size: 13,
                    weight: 'bold'
                },
                padding: 20
            }
        },
        tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleFont: {
                family: 'Arial',
                size: 16,
                weight: 'bold'
            },
            bodyFont: {
                family: 'Arial',
                size: 15
            },
            padding: 15,
            displayColors: true,
            callbacks: {
                label: function (context) {
                    return ` ${context.raw}%`;
                }
            }
        }
    },
    scales: {
        y: {
            beginAtZero: true,
            max: 100,
            ticks: {
                font: {
                    size: 14,
                    weight: 'bold'
                },
                callback: value => value + '%'
            }
        },
        x: {
            ticks: {
                font: {
                    size: 13,
                    weight: 'bold'
                }
            }
        }
    }
};

// Función para inicializar la gráfica de Lectura Crítica (Barras)
function inicializarGraficoLecturaCritica(datos) {
    const canvas = document.getElementById('graficoLecturaCritica');
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Comprensión y análisis textual', 'Reflexión sobre el contenido', 'Comprensión e interpretación'],
            datasets: [{
                label: 'Porcentaje de aciertos',
                data: datos,
                backgroundColor: COLORES_MATERIAS.LC,
                borderColor: COLORES_MATERIAS.LC,
                borderWidth: 1
            }]
        },
        options: {
            ...configuracionComun,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        callback: value => value + '%'
                    }
                }
            }
        }
    });
}

// Función para inicializar la gráfica de Matemáticas (Radar)
function inicializarGraficoMatematicas(datos) {
    const canvas = document.getElementById('graficoMatematicas');
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    return new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['Álgebra y Cálculo', 'Estadística', 'Geometría'],
            datasets: [{
                label: 'Nivel de dominio',
                data: datos,
                backgroundColor: `${COLORES_MATERIAS.MT}40`,
                borderColor: COLORES_MATERIAS.MT,
                borderWidth: 2,
                pointBackgroundColor: COLORES_MATERIAS.MT
            }]
        },
        options: {
            ...configuracionComun,
            scales: {
                r: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        stepSize: 20
                    }
                }
            }
        }
    });
}

// Función para inicializar la gráfica de Ciencias Sociales (Líneas)
function inicializarGraficoSociales(datos) {
    const canvas = document.getElementById('graficoSociales');
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');

    // Crear gradiente para el área bajo la línea
    const gradientFill = ctx.createLinearGradient(0, 0, 0, 400);
    gradientFill.addColorStop(0, `${COLORES_MATERIAS.SC}80`);
    gradientFill.addColorStop(1, `${COLORES_MATERIAS.SC}10`);

    // Datos más detallados para ciencias sociales
    const labels = [
        'Análisis Histórico',
        'Interpretación Geográfica',
        'Pensamiento Crítico',
        'Competencias Ciudadanas',
        'Análisis Socioeconómico'
    ];

    // Asegurar que los datos sean números y estén en el rango correcto
    const datosNormalizados = datos.map(valor => Math.min(Math.max(valor, 0), 100));

    return new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Competencias Sociales',
                data: datosNormalizados,
                backgroundColor: gradientFill,
                borderColor: COLORES_MATERIAS.SC,
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: COLORES_MATERIAS.SC,
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 6,
                pointHoverRadius: 8,
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: COLORES_MATERIAS.SC,
                pointHoverBorderWidth: 3
            }]
        },
        options: {
            ...configuracionComun,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    grid: {
                        color: 'rgba(200, 200, 200, 0.2)',
                        drawBorder: false
                    },
                    ticks: {
                        callback: value => value + '%',
                        font: {
                            weight: 'bold'
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: {
                            weight: 'bold'
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        font: {
                            family: 'Arial',
                            size: 12,
                            weight: 'bold'
                        },
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(255, 140, 0, 0.9)',
                    titleFont: {
                        family: 'Arial',
                        size: 14,
                        weight: 'bold'
                    },
                    bodyFont: {
                        family: 'Arial',
                        size: 13
                    },
                    padding: 12,
                    callbacks: {
                        label: function (context) {
                            return ` Nivel de dominio: ${context.raw}%`;
                        }
                    }
                }
            }
        }
    });
}

// Función para inicializar la gráfica de Ciencias Naturales (Área)
function inicializarGraficoNaturales(datos) {
    const canvas = document.getElementById('graficoNaturales');
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');

    // Crear gradientes para el área
    const gradientFill = ctx.createLinearGradient(0, 0, 0, 400);
    gradientFill.addColorStop(0, `${COLORES_MATERIAS.CN}90`);
    gradientFill.addColorStop(0.5, `${COLORES_MATERIAS.CN}40`);
    gradientFill.addColorStop(1, `${COLORES_MATERIAS.CN}10`);

    // Datos más detallados para ciencias naturales
    const labels = [
        'Biología Molecular',
        'Física Aplicada',
        'Química Orgánica',
        'Medio Ambiente',
        'Método Científico'
    ];

    // Asegurar que los datos sean números y estén en el rango correcto
    const datosNormalizados = datos.map(valor => Math.min(Math.max(valor, 0), 100));

    return new Chart(ctx, {
        type: 'radar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Competencias Científicas',
                data: datosNormalizados,
                backgroundColor: gradientFill,
                borderColor: COLORES_MATERIAS.CN,
                borderWidth: 3,
                pointBackgroundColor: COLORES_MATERIAS.CN,
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7,
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: COLORES_MATERIAS.CN,
                pointHoverBorderWidth: 3
            }]
        },
        options: {
            ...configuracionComun,
            scales: {
                r: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        stepSize: 20,
                        callback: value => value + '%',
                        backdropColor: 'rgba(255, 255, 255, 0.8)',
                        font: {
                            weight: 'bold'
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)',
                        circular: true
                    },
                    angleLines: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    },
                    pointLabels: {
                        font: {
                            size: 12,
                            weight: 'bold'
                        },
                        padding: 10
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        font: {
                            family: 'Arial',
                            size: 12,
                            weight: 'bold'
                        },
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(51, 255, 119, 0.9)',
                    titleFont: {
                        family: 'Arial',
                        size: 14,
                        weight: 'bold'
                    },
                    bodyFont: {
                        family: 'Arial',
                        size: 13
                    },
                    padding: 12,
                    callbacks: {
                        label: function (context) {
                            return ` Dominio: ${context.raw}%`;
                        }
                    }
                }
            }
        }
    });
}

// Función para inicializar la gráfica de Inglés (Dona)
function inicializarGraficoIngles(datos) {
    const canvas = document.getElementById('graficoIngles');
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');

    // Datos más detallados para inglés
    const labels = [
        'Lexical & Grammar',
        'Listening & Speaking',
        'Reading Comprehension',
        'Writing Skills'
    ];

    // Asegurar que los datos sean números y estén en el rango correcto
    const datosNormalizados = datos.map(valor => Math.min(Math.max(valor, 0), 100));

    // Colores con gradientes
    const gradientes = labels.map((_, index) => {
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        const baseColor = COLORES_MATERIAS.IN;
        const opacity = 1 - (index * 0.15);
        gradient.addColorStop(0, `${baseColor}${Math.floor(opacity * 255).toString(16).padStart(2, '0')}`);
        gradient.addColorStop(1, `${baseColor}99`);
        return gradient;
    });

    return new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: datosNormalizados,
                backgroundColor: gradientes,
                borderColor: '#fff',
                borderWidth: 2,
                hoverOffset: 15,
                hoverBorderWidth: 3,
                hoverBorderColor: COLORES_MATERIAS.IN
            }]
        },
        options: {
            ...configuracionComun,
            cutout: '60%',
            rotation: -45,
            layout: {
                padding: {
                    left: 20,
                    right: 20,
                    top: 20,
                    bottom: 20
                }
            },
            animation: {
                animateRotate: true,
                animateScale: true,
                duration: 2000,
                easing: 'easeOutQuart'
            },
            plugins: {
                legend: {
                    position: 'right',
                    align: 'center',
                    labels: {
                        boxWidth: 15,
                        padding: 15,
                        font: {
                            family: 'Arial',
                            size: 11,
                            weight: 'bold'
                        },
                        generateLabels: function (chart) {
                            const data = chart.data;
                            if (data.labels.length && data.datasets.length) {
                                return data.labels.map((label, i) => {
                                    const value = data.datasets[0].data[i];
                                    return {
                                        text: `${label}: ${value}%`,
                                        fillStyle: data.datasets[0].backgroundColor[i],
                                        strokeStyle: data.datasets[0].borderColor,
                                        lineWidth: data.datasets[0].borderWidth,
                                        hidden: isNaN(data.datasets[0].data[i]) || chart.getDatasetMeta(0).data[i].hidden,
                                        index: i
                                    };
                                });
                            }
                            return [];
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(179, 102, 255, 0.9)',
                    titleFont: {
                        family: 'Arial',
                        size: 14,
                        weight: 'bold'
                    },
                    bodyFont: {
                        family: 'Arial',
                        size: 13
                    },
                    padding: 12,
                    callbacks: {
                        label: function (context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            return ` ${label}: ${value}%`;
                        }
                    }
                }
            }
        }
    });
}

// Función para actualizar los datos de las gráficas
function actualizarGraficas(datos) {
    if (!datos) return;

    // Función para convertir puntaje de 0-500 a porcentaje 0-100
    function puntajeAPorcentaje(puntaje) {
        // Si el puntaje ya está en formato de porcentaje (0-100), devolverlo tal como está
        if (puntaje <= 100) return puntaje;
        // Si está en formato ICFES (0-500), convertir a porcentaje
        return Math.min(100, Math.max(0, (puntaje / 500) * 100));
    }

    // Actualizar gráfica de Lectura Crítica usando puntaje reajustado
    const puntajeLC = datos.LC ? puntajeAPorcentaje(datos.LC.puntaje) : 0;
    const datosLC = [puntajeLC, puntajeLC, puntajeLC];
    inicializarGraficoLecturaCritica(datosLC);

    // Actualizar gráfica de Matemáticas usando puntaje reajustado
    const puntajeMT = datos.MT ? puntajeAPorcentaje(datos.MT.puntaje) : 0;
    const datosMT = [puntajeMT, puntajeMT, puntajeMT];
    inicializarGraficoMatematicas(datosMT);

    // Actualizar gráfica de Ciencias Sociales usando puntaje reajustado
    const puntajeSC = datos.SC ? puntajeAPorcentaje(datos.SC.puntaje) : 0;
    const datosSC = [puntajeSC, puntajeSC, puntajeSC, puntajeSC, puntajeSC];
    inicializarGraficoSociales(datosSC);

    // Actualizar gráfica de Ciencias Naturales usando puntaje reajustado
    const puntajeCN = datos.CN ? puntajeAPorcentaje(datos.CN.puntaje) : 0;
    const datosCN = [puntajeCN, puntajeCN, puntajeCN, puntajeCN, puntajeCN];
    inicializarGraficoNaturales(datosCN);

    // Actualizar gráfica de Inglés usando puntaje reajustado
    const puntajeIN = datos.IN ? puntajeAPorcentaje(datos.IN.puntaje) : 0;
    const datosIN = [puntajeIN, puntajeIN, puntajeIN, puntajeIN];
    inicializarGraficoIngles(datosIN);

    // Actualizar estadísticas con puntajes reajustados
    actualizarEstadisticas(datos);

    // Actualizar interpretaciones y niveles con puntajes reajustados
    actualizarInterpretaciones(datos);

    // Generar plan de estudio personalizado usando puntajes reajustados
    generarPlanEstudio({
        lecturaCritica: puntajeLC,
        matematicas: puntajeMT,
        cienciasNaturales: puntajeCN,
        cienciasSociales: puntajeSC,
        ingles: puntajeIN
    });
}

// Función para actualizar las estadísticas
function actualizarEstadisticas(datos) {
    const materias = {
        'LC': 'lectura crítica',
        'MT': 'matemáticas',
        'SC': 'sociales y ciudadanas',
        'CN': 'ciencias naturales',
        'IN': 'inglés'
    };

    // Función para convertir puntaje de 0-500 a porcentaje 0-100
    function puntajeAPorcentaje(puntaje) {
        // Si el puntaje ya está en formato de porcentaje (0-100), devolverlo tal como está
        if (puntaje <= 100) return puntaje;
        // Si está en formato ICFES (0-500), convertir a porcentaje
        return Math.min(100, Math.max(0, (puntaje / 500) * 100));
    }

    Object.entries(materias).forEach(([sigla, nombreCompleto]) => {
        const datosMateria = datos[sigla];
        if (datosMateria) {
            // Usar el puntaje reajustado en lugar de calcular correctas/total
            const promedio = puntajeAPorcentaje(datosMateria.puntaje);
            const percentil = calcularPercentil([promedio]);

            document.getElementById(`promedio${sigla}`).textContent = `${promedio.toFixed(1)}%`;
            document.getElementById(`percentil${sigla}`).textContent = `${percentil}°`;
        } else {
            document.getElementById(`promedio${sigla}`).textContent = '-';
            document.getElementById(`percentil${sigla}`).textContent = '-';
        }
    });
}

// Funciones auxiliares
function calcularPromedio(datos) {
    return datos.reduce((a, b) => a + b, 0) / datos.length;
}

function calcularPercentil(datos) {
    const promedio = calcularPromedio(datos);
    // Simulación de cálculo de percentil
    return Math.round((promedio / 100) * 99);
}

// Función para determinar el nivel según el puntaje
function determinarNivel(puntaje) {
    if (puntaje >= 85) return "Avanzado";
    if (puntaje >= 70) return "Satisfactorio";
    if (puntaje >= 55) return "Mínimo";
    return "Insuficiente";
}

// Función para generar interpretación personalizada
function generarInterpretacion(materia, puntaje, nivel) {
    const interpretaciones = {
        'LC': {
            'Avanzado': `¡Excelente! Tu desempeño en Lectura Crítica es sobresaliente (${puntaje.toFixed(1)}%). Demuestras una comprensión profunda de textos complejos y un pensamiento crítico desarrollado. Continúa fortaleciendo estas habilidades que son fundamentales para tu éxito académico.`,
            'Satisfactorio': `Buen desempeño en Lectura Crítica (${puntaje.toFixed(1)}%). Tienes una base sólida en comprensión textual. Para mejorar, enfócate en desarrollar el análisis crítico y la interpretación de textos más complejos.`,
            'Mínimo': `Tu rendimiento en Lectura Crítica (${puntaje.toFixed(1)}%) indica que tienes conocimientos básicos pero necesitas fortalecer tus habilidades. Dedica tiempo a la lectura diaria y practica la identificación de ideas principales.`,
            'Insuficiente': `Es necesario mejorar significativamente en Lectura Crítica (${puntaje.toFixed(1)}%). Te recomendamos trabajar intensivamente en comprensión lectora básica y buscar apoyo adicional para desarrollar estas competencias fundamentales.`
        },
        'MT': {
            'Avanzado': `¡Sobresaliente! Tu dominio en Matemáticas es excelente (${puntaje.toFixed(1)}%). Muestras habilidades avanzadas en razonamiento matemático. Considera profundizar en áreas específicas como cálculo avanzado o matemática aplicada.`,
            'Satisfactorio': `Buen nivel en Matemáticas (${puntaje.toFixed(1)}%). Tienes una base sólida en conceptos matemáticos. Para mejorar, practica problemas más complejos y fortalece áreas específicas como álgebra o geometría.`,
            'Mínimo': `Tu desempeño en Matemáticas (${puntaje.toFixed(1)}%) muestra conocimientos básicos. Necesitas reforzar conceptos fundamentales y practicar regularmente para mejorar tu razonamiento matemático.`,
            'Insuficiente': `Requieres mejorar considerablemente en Matemáticas (${puntaje.toFixed(1)}%). Es fundamental trabajar en conceptos básicos como operaciones, álgebra elemental y resolución de problemas. Busca apoyo académico adicional.`
        },
        'SC': {
            'Avanzado': `¡Excelente comprensión en Ciencias Sociales! (${puntaje.toFixed(1)}%). Demuestras un análisis crítico sobresaliente de fenómenos sociales, históricos y geográficos. Tu pensamiento crítico te permitirá abordar problemáticas complejas de la sociedad.`,
            'Satisfactorio': `Buen desempeño en Ciencias Sociales (${puntaje.toFixed(1)}%). Tienes una comprensión sólida de conceptos sociales e históricos. Para mejorar, profundiza en el análisis de problemas contemporáneos y competencias ciudadanas.`,
            'Mínimo': `Tu rendimiento en Ciencias Sociales (${puntaje.toFixed(1)}%) indica conocimientos básicos. Enfócate en estudiar procesos históricos clave y desarrollar tu capacidad de análisis de problemas sociales actuales.`,
            'Insuficiente': `Necesitas fortalecer significativamente tus conocimientos en Ciencias Sociales (${puntaje.toFixed(1)}%). Te recomendamos estudiar historia básica, geografía y conceptos fundamentales de educación cívica.`
        },
        'CN': {
            'Avanzado': `¡Sobresaliente en Ciencias Naturales! (${puntaje.toFixed(1)}%). Muestras un excelente dominio del método científico y comprensión de fenómenos naturales. Considera especializarte en áreas como investigación científica.`,
            'Satisfactorio': `Buen nivel en Ciencias Naturales (${puntaje.toFixed(1)}%). Tienes una base sólida en conceptos científicos. Para mejorar, practica más experimentos y profundiza en áreas específicas como biología molecular o física aplicada.`,
            'Mínimo': `Tu desempeño en Ciencias Naturales (${puntaje.toFixed(1)}%) muestra conocimientos básicos. Refuerza conceptos fundamentales de biología, química y física, y practica la aplicación del método científico.`,
            'Insuficiente': `Requieres mejorar considerablemente en Ciencias Naturales (${puntaje.toFixed(1)}%). Dedica tiempo a estudiar conceptos básicos de las ciencias y desarrolla habilidades de observación e hipótesis científicas.`
        },
        'IN': {
            'Avanzado': `¡Excelente nivel de Inglés! (${puntaje.toFixed(1)}%). Tu competencia comunicativa es sobresaliente. Considera certificaciones internacionales o aplicar estas habilidades en contextos académicos y profesionales avanzados.`,
            'Satisfactorio': `Buen desempeño en Inglés (${puntaje.toFixed(1)}%). Tienes una base comunicativa sólida. Para mejorar, enfócate en ampliar vocabulario y practicar conversaciones más complejas.`,
            'Mínimo': `Tu nivel de Inglés (${puntaje.toFixed(1)}%) es básico. Necesitas practicar más las cuatro habilidades: hablar, escuchar, leer y escribir. Dedica tiempo diario al idioma.`,
            'Insuficiente': `Es necesario mejorar significativamente tu nivel de Inglés (${puntaje.toFixed(1)}%). Te recomendamos comenzar con conceptos básicos de gramática y vocabulario fundamental, y practicar diariamente.`
        }
    };

    return interpretaciones[materia] && interpretaciones[materia][nivel]
        ? interpretaciones[materia][nivel]
        : 'Análisis no disponible para esta materia.';
}

// Función para generar recomendaciones personalizadas breves
function generarRecomendacionPersonal(materia, puntaje, nivel) {
    const recomendaciones = {
        'LC': {
            'Avanzado': `🌟 ¡Mantén tu excelencia! Enfócate en lectura de textos académicos especializados y análisis literario avanzado para consolidar tu nivel superior.`,
            'Satisfactorio': `📚 Para alcanzar la excelencia: lee diariamente textos variados, practica resúmenes analíticos y desarrolla tu vocabulario académico.`,
            'Mínimo': `📖 Prioriza la lectura diaria (30 min), identifica ideas principales y secundarias, y practica comprensión de textos cortos pero diversos.`,
            'Insuficiente': `📝 Inicia con textos simples, lee en voz alta, busca palabras desconocidas y practica comprensión básica con apoyo docente.`
        },
        'MT': {
            'Avanzado': `🔢 ¡Excelente dominio! Explora matemática aplicada, cálculo avanzado y participa en olimpiadas matemáticas para desafiarte más.`,
            'Satisfactorio': `➕ Fortalece tu base: practica problemas complejos, revisa álgebra y geometría, y resuelve ejercicios de aplicación real.`,
            'Mínimo': `📐 Consolida fundamentos: repasa operaciones básicas, practica álgebra elemental y resuelve problemas paso a paso.`,
            'Insuficiente': `🧮 Empieza desde lo básico: domina las cuatro operaciones, fracciones y ecuaciones simples con ejercicios diarios.`
        },
        'SC': {
            'Avanzado': `🏛️ ¡Pensamiento crítico excepcional! Analiza problemáticas actuales, estudia geopolítica y participa en debates ciudadanos.`,
            'Satisfactorio': `🌍 Profundiza tu conocimiento: estudia historia contemporánea, analiza noticias con pensamiento crítico y fortalece educación cívica.`,
            'Mínimo': `📰 Fundamentos sólidos: repasa historia básica de Colombia, comprende la Constitución y sigue actualidad nacional.`,
            'Insuficiente': `🏫 Bases esenciales: estudia historia básica, geografía colombiana y conceptos fundamentales de ciudadanía.`
        },
        'CN': {
            'Avanzado': `🔬 ¡Científico excepcional! Realiza experimentos avanzados, investiga temas científicos actuales y considera estudios especializados.`,
            'Satisfactorio': `⚗️ Expande tus habilidades: practica más experimentos, profundiza en biología molecular y aplica el método científico.`,
            'Mínimo': `🧪 Refuerza conceptos: repasa biología, química y física básica, realiza experimentos simples y comprende el método científico.`,
            'Insuficiente': `📊 Construye tu base: estudia conceptos básicos de ciencias, observa fenómenos naturales y practica hipótesis simples.`
        },
        'IN': {
            'Avanzado': `🗣️ ¡Outstanding! Busca certificaciones internacionales (TOEFL/IELTS), consume contenido académico en inglés y practica debates.`,
            'Satisfactorio': `📱 Level up your English: practica conversación, amplía vocabulario académico y consume contenido en inglés diariamente.`,
            'Mínimo': `📺 Práctica diaria: ve series con subtítulos, aprende vocabulario básico y practica gramática fundamental con apps.`,
            'Insuficiente': `🎧 Start from basics: aprende vocabulario esencial, practica gramática básica y escucha inglés simple 15 min diarios.`
        }
    };

    return recomendaciones[materia] && recomendaciones[materia][nivel]
        ? recomendaciones[materia][nivel]
        : 'Recomendación personalizada en desarrollo para esta materia.';
}

// Función para actualizar interpretaciones
function actualizarInterpretaciones(datos) {
    const materias = {
        'LC': 'lectura crítica',
        'MT': 'matemáticas',
        'SC': 'sociales y ciudadanas',
        'CN': 'ciencias naturales',
        'IN': 'inglés'
    };

    // Función para convertir puntaje de 0-500 a porcentaje 0-100
    function puntajeAPorcentaje(puntaje) {
        // Si el puntaje ya está en formato de porcentaje (0-100), devolverlo tal como está
        if (puntaje <= 100) return puntaje;
        // Si está en formato ICFES (0-500), convertir a porcentaje
        return Math.min(100, Math.max(0, (puntaje / 500) * 100));
    }

    Object.entries(materias).forEach(([sigla, nombreCompleto]) => {
        const datosMateria = datos[sigla];
        if (datosMateria) {
            // Usar el puntaje reajustado en lugar de calcular correctas/total
            const promedio = puntajeAPorcentaje(datosMateria.puntaje);
            const nivel = determinarNivel(promedio);
            const interpretacion = generarInterpretacion(sigla, promedio, nivel);
            const recomendacion = generarRecomendacionPersonal(sigla, promedio, nivel);

            // Actualizar nivel
            const elementoNivel = document.getElementById(`nivel${sigla}`);
            if (elementoNivel) {
                elementoNivel.textContent = nivel;
                elementoNivel.className = `stat-value nivel-${nivel.toLowerCase()}`;
            }

            // Actualizar interpretación
            const elementoInterpretacion = document.getElementById(`interpretacion${sigla}`);
            if (elementoInterpretacion) {
                elementoInterpretacion.innerHTML = `<p>${interpretacion}</p>`;
            }

            // Actualizar recomendación personalizada
            const elementoRecomendacion = document.getElementById(`recomendacion${sigla}`);
            if (elementoRecomendacion) {
                elementoRecomendacion.innerHTML = `<p>${recomendacion}</p>`;
            }
        }
    });
}

// Función para animar números
function animarNumero(elemento, inicio, fin, duracion = 1000) {
    const rango = fin - inicio;
    const incremento = rango / (duracion / 16);
    let actual = inicio;

    elemento.classList.add('score-update');

    const actualizar = () => {
        actual += incremento;
        if ((incremento > 0 && actual >= fin) || (incremento < 0 && actual <= fin)) {
            elemento.textContent = fin.toFixed(1) + '%';
            setTimeout(() => elemento.classList.remove('score-update'), 500);
            return;
        }
        elemento.textContent = actual.toFixed(1) + '%';
        requestAnimationFrame(actualizar);
    };

    requestAnimationFrame(actualizar);
}

// Inicializar las gráficas cuando el documento esté listo
document.addEventListener('DOMContentLoaded', () => {
    actualizarGraficas({});
}); 