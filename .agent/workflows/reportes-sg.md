---
description: Sistema completo de reportes educativos - Arquitectura, flujos de datos y troubleshooting
---

# 🎓 ReportesSG - Skill de Documentación

> **Propósito**: Este skill documenta TODO el sistema de reportes educativos. Si algo se rompe, este archivo contiene la información necesaria para reconstruirlo.

---

## 📂 ESTRUCTURA DE CARPETAS

```
ReportesSG-main/
│
├── 📁 _entrada/                    # ★ ARCHIVOS DE ENTRADA
│   ├── SG11-08/                    # Carpeta por simulacro
│   │   ├── seccion1.xlsx           # Excel de Google Forms (Sesión 1)
│   │   └── seccion2.xlsx           # Excel de Google Forms (Sesión 2)
│   └── SG11-09/                    # Simulacros futuros
│
├── 📁 _procesamiento/              # ★ ARCHIVOS TEMPORALES
│   ├── temp/                       # JSONs generados durante proceso
│   ├── resultados_finales.json     # Resultado combinado de S1+S2
│   └── estadisticas_grupo.json     # Estadísticas grupales
│
├── 📁 _salida/                     # ★ REPORTES GENERADOS
│   └── SG11-08/
│       └── reportes/               # Excel y PDF finales
│
├── 📁 scripts/                     # ★ SCRIPTS DE PYTHON
│   ├── migracion/
│   │   └── migrate_students.py     # Unifica JSONs individuales
│   ├── analisis/
│   │   ├── calculate_question_stats.py
│   │   └── ranking_analysis/
│   └── utilidades/
│
├── 📁 reportes-sg-next/            # ★ APLICACIÓN WEB (Next.js)
│   ├── public/data/
│   │   ├── current_simulation.json # Config del simulacro activo
│   │   └── simulations/
│   │       └── SG11-08/
│   │           ├── manifest.json   # Metadatos del simulacro
│   │           ├── students.json   # ★ TODOS los estudiantes unificados
│   │           ├── statistics.json
│   │           └── ranking.json
│   └── src/
│       ├── lib/simulationLoader.ts # Carga datos del simulacro
│       └── types/simulation.ts     # Interfaces TypeScript
│
├── 📁 .agent/workflows/            # Skills del agente
│
├── app.py                          # Servidor Flask (procesamiento)
└── assets/                         # Logos, iconos, QR codes
```

---

## 🔄 FLUJO DE PROCESAMIENTO DE DATOS

### Paso 1: Entrada de Datos

**Archivo**: Excel exportado de Google Forms
**Ubicación**: `_entrada/[SIMULACRO]/seccion1.xlsx` y `seccion2.xlsx`

### Paso 2: Procesamiento con Flask

**Comando**:

```pwsh
cd c:\Users\Daniel\Downloads\ReportesSG-main\ReportesSG-main
python app.py
```

**Resultado**: Genera JSONs en `_procesamiento/temp/` y combina en `_procesamiento/resultados_finales.json`

### Paso 3: Migración a Next.js

**Comando**:

```pwsh
python scripts/migracion/migrate_students.py
```

**Resultado**: Crea `reportes-sg-next/public/data/simulations/[SIMULACRO]/students.json`

### Paso 4: Actualizar Configuración

**Archivo**: `reportes-sg-next/public/data/current_simulation.json`

```json
{
  "active": "SG11-09",
  "available": ["SG11-08", "SG11-09"]
}
```

---

## 📊 ESTRUCTURA DE ARCHIVOS JSON

### students.json (Archivo Unificado)

```json
{
  "version": "1.0.0",
  "simulationId": "SG11-08",
  "students": {
    "1030280214": {
      "informacion_personal": {
        "nombres": "...",
        "apellidos": "...",
        "numero_identificacion": "1030280214",
        "telefono": "...",
        "municipio": "..."
      },
      "puntajes": {
        "matemáticas": { "correctas": 15, "total_preguntas": 25, "puntaje": 65 },
        "lectura crítica": { ... }
      },
      "respuestas_detalladas": {
        "matemáticas": [
          { "numero": 1, "respuesta_estudiante": "C", "respuesta_correcta": "C", "es_correcta": true }
        ]
      },
      "puntaje_global": 320
    }
  },
  "index": ["1030280214", "1066605450", ...]
}
```

### manifest.json

```json
{
  "id": "SG11-08",
  "name": "Simulacro SG11 - 08",
  "date": "2026-01-15",
  "version": "1.0.0",
  "totalStudents": 151,
  "sessions": ["S1", "S2"]
}
```

### current_simulation.json

```json
{
  "active": "SG11-08",
  "available": ["SG11-08"]
}
```

---

## ⚙️ CONFIGURACIÓN DE RUTAS EN app.py

```python
# Líneas 13-19 de app.py
app.config['DATOS_FOLDER'] = '_procesamiento/temp'      # Archivos temp
app.config['RESULTADOS_FOLDER'] = '_procesamiento/temp' # Archivos temp
app.config['CARGAR_FOLDER'] = '_procesamiento'          # resultados_finales.json
app.config['SALIDA_FOLDER'] = '_salida'                 # Reportes Excel/PDF
app.config['ASSETS_FOLDER'] = 'assets'                  # Logos, iconos
```

---

## 🚨 TROUBLESHOOTING

### Error: "No se encontró resultados_finales.json"

**Causa**: El archivo no existe en `_procesamiento/`
**Solución**:

```pwsh
# Verificar que existe
Test-Path "_procesamiento/resultados_finales.json"
# Si no existe, procesar desde app.py o copiar desde backup
```

### Error: "Failed to load students for simulation"

**Causa**: Falta `students.json` en la carpeta del simulacro
**Solución**:

```pwsh
# Ejecutar migración
python scripts/migracion/migrate_students.py
```

### Error de TypeScript en simulationLoader.ts

**Causa**: Tipos no exportados correctamente
**Solución**: Verificar que `src/types/simulation.ts` exporta todos los interfaces

### Build de Next.js falla

**Comando diagnóstico**:

```pwsh
cd reportes-sg-next
npx tsc --noEmit
```

---

## 📋 COMANDOS ÚTILES

### Iniciar servidor Flask

```pwsh
cd c:\Users\Daniel\Downloads\ReportesSG-main\ReportesSG-main
python app.py
# Abre automáticamente http://127.0.0.1:5000
```

### Iniciar servidor Next.js

```pwsh
cd reportes-sg-next
npm run dev
# Abre http://localhost:3000
```

### Verificar TypeScript

```pwsh
cd reportes-sg-next
npx tsc --noEmit
```

### Ejecutar migración de estudiantes

```pwsh
python scripts/migracion/migrate_students.py
```

### Commit y push cambios

```pwsh
git add .
git commit -m "Descripción del cambio"
git push origin main
```

---

## 🔗 ARCHIVOS CLAVE (Rutas Absolutas)

| Archivo | Ruta |
|---------|------|
| App Flask | `c:\Users\Daniel\Downloads\ReportesSG-main\ReportesSG-main\app.py` |
| Migration Script | `c:\Users\Daniel\Downloads\ReportesSG-main\ReportesSG-main\scripts\migracion\migrate_students.py` |
| Students JSON | `c:\Users\Daniel\Downloads\ReportesSG-main\ReportesSG-main\reportes-sg-next\public\data\simulations\SG11-08\students.json` |
| Simulation Loader | `c:\Users\Daniel\Downloads\ReportesSG-main\ReportesSG-main\reportes-sg-next\src\lib\simulationLoader.ts` |
| Simulation Types | `c:\Users\Daniel\Downloads\ReportesSG-main\ReportesSG-main\reportes-sg-next\src\types\simulation.ts` |
| Current Simulation | `c:\Users\Daniel\Downloads\ReportesSG-main\ReportesSG-main\reportes-sg-next\public\data\current_simulation.json` |

---

## 🆕 AGREGAR NUEVO SIMULACRO (SG11-09)

1. **Crear carpeta de entrada**:

   ```pwsh
   New-Item -ItemType Directory -Path "_entrada/SG11-09"
   ```

2. **Colocar Excel en la carpeta**:
   - `_entrada/SG11-09/seccion1.xlsx`
   - `_entrada/SG11-09/seccion2.xlsx`

3. **Procesar con Flask**: Abrir `http://127.0.0.1:5000` y subir archivos

4. **Crear carpeta de simulacro en Next.js**:

   ```pwsh
   New-Item -ItemType Directory -Path "reportes-sg-next/public/data/simulations/SG11-09"
   ```

5. **Editar migrate_students.py** (cambiar `SG11-08` por `SG11-09`):

   ```python
   OUTPUT_DIR = BASE_DIR / "simulations" / "SG11-09"
   ```

6. **Ejecutar migración**:

   ```pwsh
   python scripts/migracion/migrate_students.py
   ```

7. **Crear manifest.json**:

   ```json
   {
     "id": "SG11-09",
     "name": "Simulacro SG11 - 09",
     "date": "2026-02-XX",
     "version": "1.0.0",
     "totalStudents": XXX,
     "sessions": ["S1", "S2"]
   }
   ```

8. **Actualizar current_simulation.json**:

   ```json
   {
     "active": "SG11-09",
     "available": ["SG11-08", "SG11-09"]
   }
   ```

---

## 📈 FÓRMULA DE CÁLCULO DE PUNTAJES

### Puntaje por Materia (Curva Humanizada)

```python
def calcular_puntaje_materia_icfes(porcentaje):
    if porcentaje >= 100:
        return 100.0
    elif porcentaje >= 96:
        return 80 + ((porcentaje - 96) / 3.99) * 6
    elif porcentaje >= 75:
        return 65 + ((porcentaje - 75) / 20) * 20
    elif porcentaje >= 50:
        return 45 + ((porcentaje - 50) / 24) * 19
    elif porcentaje >= 25:
        return 30 + ((porcentaje - 25) / 24) * 14
    else:
        return (porcentaje / 25) * 29
```

### Puntaje Global

```python
PESOS = {
    'matemáticas': 3,
    'lectura crítica': 3,
    'sociales y ciudadanas': 3,
    'ciencias naturales': 3,
    'inglés': 1
}
TOTAL_PESOS = 13

suma_ponderada = sum(puntaje * PESOS[materia] for materia, puntaje in puntajes.items())
promedio_ponderado = suma_ponderada / TOTAL_PESOS
puntaje_global = round(promedio_ponderado * 5)
```
