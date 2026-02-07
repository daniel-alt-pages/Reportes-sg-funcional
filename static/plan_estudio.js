function generarPlanEstudio(datos) {
    const planContainer = document.getElementById('planEstudioContainer');
    if (!planContainer) return;

    // Limpiar contenedor
    planContainer.innerHTML = '';

    // Obtener las hojas
    const hojaResumen = document.getElementById('documento_analisis');
    const hoja1 = document.getElementById('documento_plan_estudio_1');
    const hoja2 = document.getElementById('documento_plan_estudio_2');

    // Determinar áreas de refuerzo prioritarias
    const materias = [
        { nombre: 'Lectura Crítica', puntaje: datos.lecturaCritica || 0, componentes: [
            'Comprensión y análisis textual',
            'Reflexión sobre el contenido del texto',
            'Comprensión e interpretación textual'
        ]},
        { nombre: 'Matemáticas', puntaje: datos.matematicas || 0, componentes: [
            'Álgebra y Cálculo',
            'Estadística',
            'Geometría'
        ]},
        { nombre: 'Ciencias Naturales', puntaje: datos.cienciasNaturales || 0, componentes: [
            'Comprensión de procesos biológicos',
            'Análisis de propiedades físicas y químicas',
            'Evaluación de interacciones ambientales',
            'Aplicación de principios científicos',
            'Interpretación de datos experimentales'
        ]},
        { nombre: 'Ciencias Sociales', puntaje: datos.cienciasSociales || 0, componentes: [
            'Análisis de procesos históricos',
            'Interpretación de fuentes históricas',
            'Comprensión de dinámicas sociales y económicas',
            'Análisis de conflictos y relaciones de poder',
            'Evaluación de impactos culturales'
        ]},
        { nombre: 'Inglés', puntaje: datos.ingles || 0, componentes: [
            'Lexical',
            'Conversación',
            'Gramatical',
            'Lectura'
        ]}
    ];

    // Ordenar materias por prioridad (menor puntaje = mayor prioridad)
    materias.sort((a, b) => a.puntaje - b.puntaje);

    if (hojaResumen && hoja1 && hoja2) {
        // Configurar hoja de resumen
        const contenidoResumen = hojaResumen.querySelector('.contenido-adicional');
        if (contenidoResumen) {
            contenidoResumen.innerHTML = `
                <div class="plan-header">
                    <h2>Plan de Estudio Personalizado</h2>
                    <p>Plan Intensivo de Refuerzo - 15 Días</p>
                </div>
                <div class="materia-container">
                    <div class="materia-header">
                        Diagnóstico y Prioridades
                    </div>
                    <div class="materia-content">
                        <div class="area-stats">
                            ${materias.map(materia => `
                                <div class="area-stat-item">
                                    <div class="area-name">${materia.nombre}</div>
                                    <div>Puntaje: ${Math.round(materia.puntaje)}/100</div>
                                    <div>Prioridad: ${materia.puntaje < 45 ? 'Alta' : materia.puntaje < 65 ? 'Media' : 'Baja'}</div>
                                    <div style="font-size: 0.9em; color: #666; margin-top: 5px;">
                                        Componentes a reforzar: ${
                                            materia.puntaje < 65 
                                            ? materia.componentes.slice(0, 2).join(', ')
                                            : 'Mantener nivel actual'
                                        }
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>

                <div class="progreso-grafica">
                    <h3 class="progreso-titulo">Potencial de Progreso por Área</h3>
                    <div class="progreso-container">
                        ${materias.map(materia => {
                            const potencial = Math.round(100 - (materia.puntaje));
                            return `
                                <div class="progreso-barra">
                                    <div class="progreso-barra-label">${materia.nombre}</div>
                                    <div class="progreso-barra-outer">
                                        <div class="progreso-barra-inner" style="width: ${potencial}%"></div>
                                    </div>
                                    <div class="progreso-barra-valor">${potencial}%</div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                    <p class="progreso-nota">* El potencial de progreso se basa en el diagnóstico inicial y representa el margen de mejora estimado para cada área.</p>
                </div>

                <div class="recomendacion-ia">
                    Este plan se enfoca en reforzar las áreas con menor desempeño. 
                    Prioridad principal: ${materias[0].nombre} y ${materias[1].nombre}.
                    Dedicación diaria recomendada: ${Math.max(2, Math.min(4, Math.round((100 - materias[0].puntaje) / 20)))} horas.
                </div>
            `;
        }

        // Configurar primera semana
        const contenido1 = hoja1.querySelector('.contenido-adicional');
        if (contenido1) {
            contenido1.innerHTML = generarPlanSemana1(materias);
        }

        // Configurar segunda semana
        const contenido2 = hoja2.querySelector('.contenido-adicional');
        if (contenido2) {
            contenido2.innerHTML = generarPlanSemana2(materias);
        }

        // Actualizar los enlaces de recursos después de generar el contenido
        if (typeof window.actualizarEnlacesRecursos === 'function') {
            window.actualizarEnlacesRecursos();
        }
    }

    // Actualizar la gráfica de progreso
    actualizarGraficaProgreso(datos);
}

function generarPlanSemana1(materias) {
    const prioridad1 = materias[0];
    const prioridad2 = materias[1];
    
    return `
        <div class="plan-header">
            <h2>Plan de Refuerzo - Días 1-7</h2>
            <p>Enfoque en ${prioridad1.nombre} - ${prioridad2.nombre}</p>
        </div>
        <div class="materia-container">
            <div class="materia-header">Días 1-4: Refuerzo Intensivo</div>
            <div class="materia-content">
                <div class="semana-item">
                    <div class="semana-titulo">Días 1-2: ${prioridad1.nombre}</div>
                    ${prioridad1.componentes.map(comp => `
                        <div class="tema-refuerzo">• ${comp} (1h)</div>
                    `).join('')}
                    <div class="recursos">Recursos: Material específico de ${prioridad1.nombre.toLowerCase()}</div>
                </div>
                <div class="semana-item">
                    <div class="semana-titulo">Días 3-4: ${prioridad2.nombre}</div>
                    ${prioridad2.componentes.map(comp => `
                        <div class="tema-refuerzo">• ${comp} (1h)</div>
                    `).join('')}
                    <div class="recursos">Recursos: Material específico de ${prioridad2.nombre.toLowerCase()}</div>
                </div>
            </div>
        </div>
        <div class="materia-container">
            <div class="materia-header">Días 5-7: Integración de Conocimientos</div>
            <div class="materia-content">
                <div class="semana-item">
                    <div class="semana-titulo">Día 5: Práctica Integrada</div>
                    <div class="tema-refuerzo">• Ejercicios combinados de ${prioridad1.nombre} (1.5h)</div>
                    <div class="tema-refuerzo">• Ejercicios combinados de ${prioridad2.nombre} (1.5h)</div>
                    <div class="recursos">Recursos: Ejercicios de aplicación práctica</div>
                </div>
                <div class="semana-item">
                    <div class="semana-titulo">Días 6-7: Evaluación y Ajuste</div>
                    <div class="tema-refuerzo">• Simulacro específico de ${prioridad1.nombre} (2h)</div>
                    <div class="tema-refuerzo">• Simulacro específico de ${prioridad2.nombre} (2h)</div>
                    <div class="tema-refuerzo">• Revisión y corrección (1h)</div>
                    <div class="recursos">Recursos: Pruebas de práctica específicas</div>
                </div>
            </div>
        </div>
    `;
}

function generarPlanSemana2(materias) {
    const prioridad3 = materias[2];
    const prioridad4 = materias[3];
    const prioridad5 = materias[4];

    return `
        <div class="plan-header">
            <h2>Plan de Refuerzo - Días 8-15</h2>
            <p>Integración y Práctica General</p>
        </div>
        <div class="materia-container">
            <div class="materia-header">Días 8-11: Refuerzo Complementario</div>
            <div class="materia-content">
                <div class="semana-item">
                    <div class="semana-titulo">Días 8-9: ${prioridad3.nombre}</div>
                    ${prioridad3.componentes.slice(0, 3).map(comp => `
                        <div class="tema-refuerzo">• ${comp} (1h)</div>
                    `).join('')}
                    <div class="recursos">Recursos: <span class="materia-recursos" data-materia="${prioridad3.nombre}">Material específico y ejercicios prácticos</span></div>
                </div>
                <div class="semana-item">
                    <div class="semana-titulo">Días 10-11: ${prioridad4.nombre} - ${prioridad5.nombre}</div>
                    <div class="tema-refuerzo">• Componentes clave de ${prioridad4.nombre} (2h)</div>
                    <div class="tema-refuerzo">• Componentes clave de ${prioridad5.nombre} (2h)</div>
                    <div class="recursos">
                        Recursos: 
                        <span class="materia-recursos" data-materia="${prioridad4.nombre}">Material de ${prioridad4.nombre}</span>,
                        <span class="materia-recursos" data-materia="${prioridad5.nombre}">Material de ${prioridad5.nombre}</span>
                    </div>
                </div>
            </div>
        </div>
        <div class="materia-container">
            <div class="materia-header">Días 12-15: Preparación Final</div>
            <div class="materia-content">
                <div class="semana-item">
                    <div class="semana-titulo">Días 12-13: Integración Final</div>
                    <div class="tema-refuerzo">• Repaso general de áreas prioritarias (3h)</div>
                    <div class="tema-refuerzo">• Práctica integrada de todas las materias (2h)</div>
                    <div class="recursos">
                        Recursos: 
                        <span class="materia-recursos" data-materia="${prioridad3.nombre}">Material de ${prioridad3.nombre}</span>,
                        <span class="materia-recursos" data-materia="${prioridad4.nombre}">Material de ${prioridad4.nombre}</span>,
                        <span class="materia-recursos" data-materia="${prioridad5.nombre}">Material de ${prioridad5.nombre}</span>
                    </div>
                </div>
                <div class="semana-item">
                    <div class="semana-titulo">Días 14-15: Evaluación Final</div>
                    <div class="tema-refuerzo">• Simulacro completo (4h)</div>
                    <div class="tema-refuerzo">• Análisis de resultados (2h)</div>
                    <div class="tema-refuerzo">• Plan de mejora continua (1h)</div>
                    <div class="recursos">
                        Recursos: 
                        <span class="materia-recursos" data-materia="lectura">Material de Lectura</span>,
                        <span class="materia-recursos" data-materia="matematicas">Material de Matemáticas</span>
                    </div>
                </div>
            </div>
        </div>
        <div class="recomendacion-ia">
            Mantén un registro de tus avances y ajusta el tiempo según tu progreso.
            Enfócate especialmente en los componentes donde muestras mayor dificultad.
        </div>
    `;
}

function actualizarGraficaProgreso(datos) {
    const calcularPotencial = (puntaje) => {
        return Math.round(100 - (puntaje));
    };

    const areas = [
        { nombre: 'Ciencias Naturales', valor: datos.cienciasNaturales || 0, color: '#33FF77' },
        { nombre: 'Matemáticas', valor: datos.matematicas || 0, color: '#33CCFF' },
        { nombre: 'Ciencias Sociales', valor: datos.cienciasSociales || 0, color: '#FF8C00' },
        { nombre: 'Inglés', valor: datos.ingles || 0, color: '#B366FF' },
        { nombre: 'Lectura Crítica', valor: datos.lecturaCritica || 0, color: '#FF4D4D' }
    ].sort((a, b) => calcularPotencial(b.valor) - calcularPotencial(a.valor));

    // Crear el contenedor de la gráfica
    const container = document.querySelector('.progreso-container');
    if (!container) return;

    // Limpiar el contenedor
    container.innerHTML = '';

    // Crear el contenedor de las barras
    const barsContainer = document.createElement('div');
    barsContainer.className = 'barras-container';
    container.appendChild(barsContainer);

    // Crear las barras para cada área
    areas.forEach((area, index) => {
        const potencial = calcularPotencial(area.valor);
        
        // Crear contenedor de la barra
        const barWrapper = document.createElement('div');
        barWrapper.className = 'barra-wrapper';
        
        // Crear etiqueta de la materia
        const barLabel = document.createElement('div');
        barLabel.className = 'barra-label';
        barLabel.textContent = area.nombre;
        
        // Crear contenedor de la barra horizontal
        const barContainer = document.createElement('div');
        barContainer.className = 'barra-horizontal-container';
        
        // Crear la barra de fondo
        const barBackground = document.createElement('div');
        barBackground.className = 'barra-background';
        barBackground.style.borderColor = area.color;
        
        // Crear la barra de progreso
        const barProgress = document.createElement('div');
        barProgress.className = 'barra-progress';
        barProgress.style.width = '0%';
        barProgress.style.backgroundColor = area.color;
        
        // Crear el valor del potencial
        const barValue = document.createElement('div');
        barValue.className = 'barra-value';
        barValue.textContent = `${potencial}%`;
        barValue.style.color = area.color;
        barValue.style.borderColor = area.color;
        
        // Ensamblar la barra
        barBackground.appendChild(barProgress);
        barContainer.appendChild(barBackground);
        barContainer.appendChild(barValue);
        
        barWrapper.appendChild(barLabel);
        barWrapper.appendChild(barContainer);
        
        // Agregar animación con delay
        setTimeout(() => {
            barProgress.style.width = `${potencial}%`;
        }, index * 200);
        
        barsContainer.appendChild(barWrapper);
    });
} 