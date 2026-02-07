# Roadmap de Modelos Estadísticos - ReportesSG

## Última Actualización: Enero 2026

---

## Estado Actual de Datos

### Métricas Actuales (Simulacro 1)

| Métrica | Valor |
|---------|-------|
| **Estudiantes** | 149 |
| **Preguntas calibradas** | 254 |
| **Respuestas registradas** | 37,324 |
| **Instituciones** | 3 |
| **Matriz de datos** | 149 × 254 = 37,846 celdas |

### Distribución por Área

| Área | Respuestas | Preguntas |
|------|------------|-----------|
| Matemáticas | 7,350 | 50 |
| Lectura Crítica | 6,068 | 41 |
| Sociales | 7,350 | 50 |
| Ciencias | 8,526 | 58 |
| Inglés | 8,030 | 55 |

### Distribución de Dificultad (Calibración Actual)

| Clasificación | Cantidad | Porcentaje |
|---------------|----------|------------|
| MUY_FACIL | 173 | 68% |
| FACIL | 72 | 28% |
| MEDIA | 7 | 3% |
| DIFICIL | 2 | 1% |

---

## Modelos por Fase de Implementación

### FASE 1: Implementables Ahora (149 estudiantes)

| Modelo | Prioridad | Esfuerzo | Librería |
|--------|-----------|----------|----------|
| Índice de Discriminación | ALTA | 2-3 horas | NumPy |
| Análisis de Distractores | ALTA | 2-3 horas | Pandas |
| Correlación entre Áreas | MEDIA | 1 hora | NumPy/SciPy |
| Modelo Rasch (1PL) básico | MEDIA | 1 día | girth |

### FASE 2: Con 300-500 estudiantes (2-3 simulacros)

| Modelo | Prioridad | Esfuerzo | Librería |
|--------|-----------|----------|----------|
| Modelo Rasch estable | ALTA | 2 días | girth |
| Equiparación lineal | ALTA | 1 día | Custom |
| Detección de copiado | BAJA | 1 día | Custom |
| Banco de preguntas ancla | MEDIA | Continuo | - |

### FASE 3: Con 1000+ estudiantes (5-6 simulacros)

| Modelo | Prioridad | Esfuerzo | Librería |
|--------|-----------|----------|----------|
| Modelo 2PL (IRT) | ALTA | 3 días | girth/pyirt |
| Equiparación equipercentil | MEDIA | 2 días | Custom |
| Análisis DIF | MEDIA | 2 días | girth |

### FASE 4: Con 5000+ estudiantes

| Modelo | Prioridad | Esfuerzo | Librería |
|--------|-----------|----------|----------|
| Modelo 3PL completo | ALTA | 1 semana | girth |
| Testing adaptativo (CAT) | BAJA | 2 semanas | Custom |
| Banco de ítems normalizado | ALTA | Continuo | - |

---

## Detalles de Implementación

### 1. Índice de Discriminación

**Método:** Top/Bottom 27%

```python
def calcular_discriminacion(respuestas_df, columna_pregunta, columna_total):
    n = len(respuestas_df)
    n_grupo = int(n * 0.27)
    
    df_sorted = respuestas_df.sort_values(columna_total, ascending=False)
    top = df_sorted.head(n_grupo)[columna_pregunta].mean()
    bottom = df_sorted.tail(n_grupo)[columna_pregunta].mean()
    
    return top - bottom  # D index, ideal > 0.30
```

**Interpretación:**

- D > 0.40: Excelente
- D = 0.30-0.40: Buena
- D = 0.20-0.30: Revisar
- D < 0.20: Descartar pregunta

---

### 2. Análisis de Distractores

**Objetivo:** Ver si las opciones incorrectas son efectivas.

**Formato de reporte:**

```
Pregunta 15 (Matemáticas) - Dificultad: 0.65
- A: 45% ✓ CORRECTA
- B: 30% ← Distractor efectivo
- C: 20% ← Distractor efectivo  
- D: 5%  ← Distractor débil (revisar)
```

**Regla:** Cada distractor debe ser elegido por ≥5% de estudiantes.

---

### 3. Modelo Rasch (1PL)

**Librería:** `girth`

```bash
pip install girth
```

```python
from girth import rasch_mml

# Crear matriz binaria (estudiantes × preguntas)
respuestas_matrix = np.array([...])  # 1=correcto, 0=incorrecto

# Estimar parámetros
resultados = rasch_mml(respuestas_matrix)
dificultades = resultados['Difficulty']  # b parameter
habilidades = resultados['Ability']       # θ (theta)
```

**Requisitos mínimos:**

- 100 estudiantes (mínimo absoluto)
- 200+ estudiantes (recomendado)
- 500+ estudiantes (óptimo)

---

### 4. Equiparación con Preguntas Ancla

**Requisitos:**

- 15-20 preguntas "ancla" que se repitan en cada simulacro
- Misma dificultad y formato

**Fórmula lineal:**

```
puntaje_equiparado = A × puntaje_original + B

donde:
A = σ_ancla_new / σ_ancla_old
B = μ_ancla_new - A × μ_ancla_old
```

---

## Datos a Acumular

### Por Cada Simulacro

- [ ] Matriz de respuestas completa (estudiantes × preguntas)
- [ ] Identificadores únicos de estudiantes (para tracking)
- [ ] Fecha del simulacro
- [ ] Versión del examen
- [ ] Preguntas ancla marcadas

### Para Tracking de Estudiantes

- [ ] ID único persistente
- [ ] Historial de puntajes por simulacro
- [ ] Progreso en cada área

---

## Archivos Necesarios para Crear

| Archivo | Función | Estado |
|---------|---------|--------|
| `scripts/core/discriminacion.py` | Cálculo de índice D | PENDIENTE |
| `scripts/core/distractores.py` | Análisis de opciones | PENDIENTE |
| `scripts/core/irt_rasch.py` | Modelo Rasch | PENDIENTE |
| `scripts/core/equiparacion.py` | Equiparación entre simulacros | PENDIENTE |
| `data/historico/` | Carpeta para datos acumulados | PENDIENTE |
| `data/anclas.json` | Preguntas ancla por versión | PENDIENTE |

---

## Notas Importantes

1. **No eliminar datos antiguos** - Necesitamos acumular para mejores modelos
2. **Mantener formato consistente** - Estructura JSON debe ser estable
3. **Identificar preguntas ancla** - Decidir cuáles se repiten entre simulacros
4. **Guardar matriz binaria** - Facilita cálculos IRT posteriores

---

## Próximos Pasos Inmediatos

1. [ ] Arreglar rutas y código modificado
2. [ ] Verificar que todo funciona correctamente
3. [ ] Implementar Índice de Discriminación (Fase 1)
4. [ ] Implementar Análisis de Distractores (Fase 1)
