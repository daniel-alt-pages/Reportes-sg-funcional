# Mejoras Futuras para Mayor Fidelidad con ICFES

## Prioridad Alta (Mayor Impacto)

### 1. Implementar Índice de Discriminación (a)

**Qué es:** Mide qué tan bien una pregunta diferencia entre estudiantes buenos y malos.

**Cómo calcularlo:**

```python
# Método del 27% (clásico)
top_27 = estudiantes ordenados por puntaje total, primeros 27%
bottom_27 = estudiantes ordenados por puntaje total, últimos 27%

D = (aciertos_top_27 / n_top) - (aciertos_bottom_27 / n_bottom)

# D > 0.40: Excelente discriminación
# D = 0.30-0.40: Buena
# D = 0.20-0.30: Aceptable
# D < 0.20: Revisar pregunta
```

**Uso:** Preguntas con alta discriminación deberían valer más.

**Esfuerzo:** Medio (2-3 horas)

---

### 2. Implementar Modelo IRT Simplificado (Rasch/1PL)

**Qué es:** Modelo más simple que el 3PL del ICFES, pero mucho más preciso que porcentajes.

**Fórmula:**

```
P(correcta) = exp(θ - b) / (1 + exp(θ - b))

donde:
- θ = habilidad del estudiante
- b = dificultad de la pregunta
```

**Librerías Python:**

- `girth` - Item Response Theory en Python
- `py-irt` - Modelo IRT bayesiano

**Ejemplo de implementación:**

```python
from girth import rasch_mml

# matriz de respuestas (estudiantes × preguntas)
respuestas = np.array([...])  # 1 = correcto, 0 = incorrecto

# Estimar parámetros
estimaciones = rasch_mml(respuestas)
dificultades = estimaciones['Difficulty']
habilidades = estimaciones['Ability']
```

**Esfuerzo:** Alto (1-2 días)

---

### 3. Equiparación de Puntajes entre Simulacros

**Qué es:** Hacer que puntajes de diferentes fechas sean comparables.

**Cómo hacerlo:**

1. Incluir "preguntas ancla" que se repitan en cada simulacro
2. Usar las anclas para ajustar la escala

**Fórmula de equiparación lineal:**

```
puntaje_equiparado = A × puntaje_original + B

donde A y B se calculan con las anclas
```

**Esfuerzo:** Medio (requiere planificación de exámenes)

---

## Prioridad Media

### 4. Parámetro de Adivinanza (c)

**Qué es:** Probabilidad de acertar al azar (típicamente 0.20-0.25 para 4 opciones).

**Implementación:**

```python
# Modelo 3PL
P(correcta) = c + (1 - c) × exp(a(θ - b)) / (1 + exp(a(θ - b)))

# Aproximación simple: si el estudiante tiene puntaje muy bajo
# pero acierta, probablemente adivinó
if puntaje_estudiante < 30 and acierto:
    weight = 0.5  # Cuenta menos
```

**Esfuerzo:** Medio

---

### 5. Análisis de Distractores

**Qué es:** Evaluar la calidad de las opciones incorrectas.

**Métricas:**

- Cada distractor debe ser elegido por al menos 5% de estudiantes
- Distractores muy populares pueden indicar pregunta confusa
- Distractor nunca elegido = opción inútil

**Reporte a generar:**

```
Pregunta 15: Matemáticas
- A: 45% (CORRECTA) ✓
- B: 30% ← Distractor efectivo
- C: 20% ← Distractor efectivo
- D: 5%  ← Distractor débil
```

**Esfuerzo:** Bajo (1-2 horas)

---

### 6. Función de Información del Test

**Qué es:** Mide en qué rango de habilidad el examen es más preciso.

**Uso:** Identificar si el examen es muy fácil/difícil para tu población.

**Esfuerzo:** Alto (requiere IRT)

---

## Prioridad Baja (Nice to Have)

### 7. Detección de Copiado

Comparar patrones de respuestas incorrectas entre estudiantes cercanos.

### 8. Análisis de Tiempo de Respuesta

Si tienes datos de timestamps, penalizar respuestas demasiado rápidas.

### 9. Adaptive Testing (CAT)

Simular examen adaptativo donde la dificultad cambia según respuestas.

---

## Recursos Necesarios

| Mejora | Librería | Datos Requeridos |
|--------|----------|------------------|
| Discriminación | NumPy | Respuestas actuales |
| IRT (Rasch) | `girth` | Respuestas actuales |
| Equiparación | Custom | Preguntas ancla |
| Adivinanza | Custom | Ninguno extra |
| Distractores | Pandas | Respuestas detalladas |

---

## Plan de Implementación Sugerido

### Fase 1 (Corto Plazo - 1 semana)

1. ✅ Índice de dificultad - HECHO
2. ✅ Costo variable de errores - HECHO
3. ✅ Penalización inconsistencia - HECHO
4. [ ] Índice de discriminación
5. [ ] Análisis de distractores

### Fase 2 (Mediano Plazo - 1 mes)

6. [ ] Modelo Rasch (1PL)
2. [ ] Parámetro de adivinanza

### Fase 3 (Largo Plazo)

8. [ ] Sistema de equiparación con anclas
2. [ ] Modelo 3PL completo
