# Documentación del Sistema de Calificación ReportesSG

## Comparación con Metodología Oficial ICFES

### Fecha de Documentación: Enero 2026

---

## 1. Resumen Ejecutivo

Este documento describe el sistema de calificación implementado en ReportesSG y su comparación con la metodología oficial del ICFES según los Boletines Técnicos "Saber al Detalle" (Ediciones 1, 7, 8 y 12).

**Fidelidad Estimada General: 70-80%**

---

## 2. Lo que SÍ Implementamos (Fiel al ICFES)

### 2.1 Índice de Dificultad de Preguntas (p-value)
- **ICFES:** Calcula p = proporción de aciertos por pregunta
- **Nosotros:** ✅ Implementado en `calibrador.py`
- **Clasificación:**
  - MUY_FACIL: p > 0.75
  - FACIL: p = 0.55-0.75
  - MEDIA: p = 0.35-0.55
  - DIFICIL: p = 0.25-0.35
  - MUY_DIFICIL: p < 0.25

### 2.2 Pesos por Dificultad
- **ICFES:** Preguntas difíciles aportan más a la estimación de habilidad
- **Nosotros:** ✅ Implementado con pesos 1-3 según dificultad

### 2.3 Detección de Inconsistencia
- **ICFES:** El modelo IRT detecta patrones de respuesta inconsistentes
- **Nosotros:** ✅ Penalizamos fallar fáciles + acertar difíciles

### 2.4 Índice Global de Planteles (Top 80%)
- **ICFES:** Promedio ponderado del 80% superior de estudiantes
- **Nosotros:** ✅ Fórmula exacta: 3×Mat + 3×Lec + 3×Nat + 3×Soc + 1×Ing
- **Referencia:** Boletín 12

### 2.5 Clasificación de Planteles
- **ICFES:** Categorías A+, A, B, C, D
- **Nosotros:** ✅ Puntos de corte aproximados según históricos

### 2.6 Topes por Error
- **ICFES:** Puntajes altos muy difíciles de alcanzar con errores
- **Nosotros:** ✅ Topes deslizantes por número de errores

---

## 3. Lo que NO Implementamos (Limitaciones)

### 3.1 Modelo 3PL (Teoría de Respuesta al Ítem)
- **ICFES:** Usa modelo logístico de 3 parámetros:
  - a (discriminación): Qué tan bien diferencia la pregunta
  - b (dificultad): Nivel requerido para 50% probabilidad de acierto
  - c (adivinanza): Probabilidad de acertar al azar
- **Nosotros:** ❌ Solo usamos dificultad empírica (p-value)
- **Impacto:** Pérdida de precisión en estimación de habilidad

### 3.2 Estimación de θ (Habilidad Latente)
- **ICFES:** Calcula θ para cada estudiante usando MLE o EAP
- **Nosotros:** ❌ Usamos porcentaje ponderado
- **Impacto:** Puntajes menos precisos para casos extremos

### 3.3 Calibración con Banco de Ítems
- **ICFES:** Preguntas calibradas con miles de estudiantes históricos
- **Nosotros:** ❌ Calibramos solo con la población actual (~150)
- **Impacto:** Parámetros menos estables

### 3.4 Equiparación de Puntajes
- **ICFES:** Puntajes comparables entre diferentes fechas de aplicación
- **Nosotros:** ❌ No hay equiparación histórica
- **Impacto:** Puntajes no comparables entre simulacros

---

## 4. Fórmulas Implementadas

### 4.1 Puntaje Base por Área
```
puntaje_base = (Σ peso_i × correcto_i) / (Σ peso_i) × 100
```

### 4.2 Penalización por Inconsistencia
```
Si (fallo_cascaras > 0 AND acierto_dificiles > 0):
    Si acierto_dificiles > 0:
        penalizacion = fallo_cascaras × 3 (máx 25)
    Sino:
        penalizacion = fallo_cascaras × 1.5 (máx 15)
```

### 4.3 Costo de Errores Variable
```
costo_error = 2.0 si MUY_FACIL
            = 1.5 si FACIL
            = 1.0 si MEDIA
            = 0.5 si DIFICIL
            = 0.3 si MUY_DIFICIL
```

### 4.4 Tope Deslizante
```
tope = tope_1_error - (costo_errores - 1) × penalidad_area
```

### 4.5 Curva de Compresión
```
Si puntaje > 80 AND errores > 0:
    puntaje = 80 + (puntaje - 80) × 0.5
```

### 4.6 Puntaje Global
```
global = ((3×Mat + 3×Lec + 3×Soc + 3×Cie + 1×Ing) / 13) × 5
```

---

## 5. Topes por Área (Configuración Actual)

| Área | Tope 1 Error | Penalidad/Error |
|------|--------------|-----------------|
| Matemáticas | 86 | -3 |
| Lectura Crítica | 82 | -4 |
| Sociales | 83 | -3 |
| Ciencias Naturales | 82 | -3 |
| Inglés | 86 | -3 |

---

## 6. Archivos del Sistema

| Archivo | Función |
|---------|---------|
| `scripts/core/calibrador.py` | Calcula dificultad de preguntas |
| `scripts/core/procesar.py` | Calcula puntajes con lógica completa |
| `data/input/calibracion.json` | Parámetros de cada pregunta |
| `output/resultados_finales.json` | Puntajes calculados |
| `output/Reporte_Completo.xlsx` | Reporte Excel con análisis |

---

## 7. Recomendaciones para Mayor Fidelidad

Ver archivo: `MEJORAS_FUTURAS_ICFES.md`
