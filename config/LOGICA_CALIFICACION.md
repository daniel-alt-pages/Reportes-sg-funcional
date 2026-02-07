# Documentación del Algoritmo de Calificación y Asignación de Puntajes

Esta documentación detalla la lógica utilizada para evaluar las pruebas y asignar los puntajes a los estudiantes, tanto por área individual como para el puntaje global. La lógica está basada en una curva no lineal similar a la utilizada por el ICFES, implementada en el sistema de procesamiento de datos.

## 1. Calificación por Área (0 - 100)

El puntaje de cada área (Matemáticas, Lectura Crítica, etc.) se calcula en función del porcentaje de respuestas correctas, aplicando una curva de desempeño no lineal. Esto significa que el puntaje no es directamente proporcional al número de preguntas correctas en todos los rangos, sino que premia el desempeño superior y penaliza el inferior según tramos específicos.

### Proceso de Cálculo

1. **Conteo de Aciertos**: Se valida cada respuesta del estudiante contra la clave de respuestas oficial. Se cuenta el número total de aciertos (`correctCount`).
2. **Cálculo del Porcentaje**: Se determina el porcentaje de aciertos sobre el total de preguntas del área:
    \[
    \text{Porcentaje} = \left( \frac{\text{Respuestas Correctas}}{\text{Total de Preguntas}} \right) \times 100
    \]
3. **Aplicación de la Curva (Función de Puntaje)**:
    Dependiendo del porcentaje de aciertos, se utiliza una fórmula específica para calcular el "Puntaje Base" (0-100).

    | Rango de Porcentaje de Aciertos | Fórmula de Cálculo del Puntaje | Descripción del Rango |
    | :--- | :--- | :--- |
    | **100%** | `100` | Puntaje máximo perfecto. |
    | **96% - 99%** | $80 + \frac{(\text{Porcentaje} - 96)}{4} \times 6$ | Rango Superior Alto. |
    | **88% - 95%** | $70 + \frac{(\text{Porcentaje} - 88)}{8} \times 10$ | Rango Alto. |
    | **76% - 87%** | $55 + \frac{(\text{Porcentaje} - 76)}{12} \times 15$ | Rango Medio Alto. |
    | **60% - 75%** | $35 + \frac{(\text{Porcentaje} - 60)}{16} \times 20$ | Rango Medio. |
    | **40% - 59%** | $15 + \frac{(\text{Porcentaje} - 40)}{20} \times 20$ | Rango Bajo. |
    | **0% - 39%** | $\frac{\text{Porcentaje}}{40} \times 15$ | Rango Insuficiente. |

    *El resultado final se redondea al número entero más cercano.*

## 2. Calificación Global (0 - 500)

El Puntaje Global es una representación del desempeño general del estudiante, calculado mediante un promedio ponderado de los puntajes obtenidos en cada área.

### Pesos por Área

Cada materia tiene un peso específico en el cálculo global, favoreciendo las áreas núcleo sobre el inglés en este modelo específico:

* **Matemáticas**: Ponderación **3**
* **Lectura Crítica**: Ponderación **3**
* **Sociales y Ciudadanas**: Ponderación **3**
* **Ciencias Naturales**: Ponderación **3**
* **Inglés**: Ponderación **1**

Total de pesos: $3 + 3 + 3 + 3 + 1 = 13$

### Fórmula del Puntaje Global

1. **Suma Ponderada**: Se multiplican los puntajes de cada área por su peso y se suman.
    \[
    \text{Suma Ponderada} = \sum (\text{Puntaje Área} \times \text{Peso Área})
    \]
2. **Promedio Ponderado**: Se divide la suma ponderada por el peso total (13).
    \[
    \text{Promedio} = \frac{\text{Suma Ponderada}}{13}
    \]
3. **Escalamiento a 500**: Dado que el promedio está en escala de 0-100, se multiplica por 5 para obtener el puntaje global en escala 0-500.
    \[
    \text{Global Score} = \text{Promedio} \times 5
    \]

    *El resultado final también se redondea al entero más cercano.*

## 4. Análisis Profundo de los Topes y "El Salto al Vacío"

Este sistema de calificación no es lineal. Su característica más distintiva y frecuentemente consultada es que **no permite puntajes "casi perfectos"**. O se obtiene la perfección absoluta (100), o el puntaje cae significativamente a un máximo matemático de 86. A este fenómeno le llamamos **"El Salto al Vacío"**.

### 4.1 El Principio de la Excelencia Exclusiva

El algoritmo define dos estados para el tope de la tabla:

1. **Perfección (100% aciertos)**: Se asigna manualmente el puntaje de **100**.
2. **Imperfección (<100% aciertos)**: Se utiliza estrictamente una fórmula matemática que tiene un techo duro.

### 4.2 Demostración Matemática del Tope de 86

Si un estudiante no tiene el 100% de aciertos, cae inmediatamente en la fórmula del rango superior (96% - 99.9%). Analicemos por qué es imposible sacar más de 86.

La fórmula es:
\[ Puntaje = 80 + \frac{(\text{Porcentaje} - 96)}{4} \times 6 \]

Supongamos un caso hipótético extremo donde un estudiante tiene **99.99%** de aciertos (virtualmente perfecto, pero no 100).
\[ 80 + \frac{(99.99 - 96)}{4} \times 6 \]
\[ 80 + \frac{3.99}{4} \times 6 \]
\[ 80 + 0.9975 \times 6 \]
\[ 80 + 5.985 = \mathbf{85.985} \]

Al redondear el resultado, obtenemos **86**.
**Conclusión Matemática**: Es imposible que la fórmula genere un número mayor a 86. Por lo tanto, los puntajes **87, 88, 89... hasta 99 NO EXISTEN** en este modelo para áreas individuales.

### 4.3 Sensibilidad según el Número de Preguntas

La severidad de la caída desde 100 depende de cuántas preguntas tenga la prueba. Dado que no se pueden tener "medios errores", el porcentaje real de un estudiante baja por escalones discretos.

**Tabla de Impacto del Primer Error:**

| Total de Preguntas | Valor de 1 Pregunta | % Máximo con 1 Error | Puntaje Resultante | Caída desde 100 |
| :--- | :--- | :--- | :--- | :--- |
| **100 Preguntas** | 1% | 99% | **84.5 (85)** | -15 Puntos |
| **50 Preguntas** | 2% | 98% | **83** | -17 Puntos |
| **25 Preguntas** | 4% | 96% | **80** | -20 Puntos |
| **20 Preguntas** | 5% | 95% | **79** (Cae de rango) | -21 Puntos |
| **10 Preguntas** | 10% | 90% | **72.5 (73)** | -27 Puntos |

**Interpretación**:
Incluso en un examen largo de 100 preguntas, fallar una sola respuesta provoca una caída inmediata de 15 puntos en la calificación del área. En exámenes más cortos (como los simulacros habituales de 20-30 preguntas), el "castigo" por el primer error es aún más severo, costando alrededor de 20 puntos.

### 4.4 Resumen de Zonas de Puntaje

Debido a estas reglas, el universo de puntajes posibles se divide en islas:

1. **La Cima (100)**: Reservado exclusivamente para 0 errores.
2. **La Zona Muerta (87 - 99)**: Matemáticamente imposible de alcanzar.
3. **La Excelencia Terrenal (80 - 86)**: Para estudiantes con muy pocos errores.
4. **Distribución Estándar (0 - 79)**: Donde se ubica la gran mayoría de los estudiantes.

## 5. Ejemplo de Cálculo

Supongamos un estudiante con los siguientes resultados:

| Área | Respuestas Correctas / Total | Porcentaje | Puntaje del Área (Calculado) | Peso | Contribución Ponderada |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Matemáticas** | 20 / 25 | 80% | $55 + \frac{(80-76)}{12} \times 15 = 60$ | 3 | $60 \times 3 = 180$ |
| **Inglés** | 25 / 30 | 83.3% | $55 + \frac{(83.3-76)}{12} \times 15 \approx 64$ | 1 | $64 \times 1 = 64$ |
| **...Otras** | ... | ... | (digamos 60 en todas) | 3 c/u | $60 \times 3 = 180$ (x3) |

**Cálculo Global Simplificado (si tuviera 60 en todo excepto inglés 64):**

* Suma Ponderada = $(60 \times 3) + (60 \times 3) + (60 \times 3) + (60 \times 3) + (64 \times 1)$
* Suma Ponderada = $180 + 180 + 180 + 180 + 64 = 784$
* Promedio = $784 / 13 \approx 60.3$
* **Puntaje Global** = $60.3 \times 5 \approx 302$

***

**Nota Técnica:**
Esta lógica se encuentra implementada en los scripts de procesamiento del sistema (ej. `scripts/update-student-scores.js`), asegurando que cualquier actualización en las respuestas de los estudiantes recalcule automáticamente tanto los puntajes parciales como el global bajo estos mismos criterios.
