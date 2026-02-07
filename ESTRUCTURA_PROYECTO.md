# 📁 Estructura del Proyecto ReportesSG

Este documento describe la organización de carpetas del proyecto.

## 📂 Estructura de Directorios

```
ReportesSG-main/
│
├── 📄 app.py                          # Servidor Flask principal
│
├── 📂 config/                         # Configuración y documentación
│   ├── .env                           # Variables de entorno
│   ├── LOGICA_CALIFICACION.md         # Documentación de fórmulas
│   ├── NIVELES_DESEMPENO_OFICIAL.md   # Niveles de desempeño ICFES
│   └── README.md                      # Documentación original
│
├── 📂 assets/                         # Recursos visuales
│   ├── icons/                         # Iconos de la aplicación
│   │   ├── icon.svg
│   │   └── icon_pestaña.svg
│   ├── watermarks/                    # Marcas de agua
│   │   └── marca_de_agua.svg
│   └── qr_codes/                      # Códigos QR de pago
│       ├── qr1.svg
│       └── qr2.svg
│
├── 📂 static/                         # CSS y JS del frontend
│   ├── estilos.css
│   ├── graficas.css / .js
│   └── plan_estudio.css / .js
│
├── 📂 templates/                      # Plantillas HTML (Jinja2)
│   └── Informe.html
│
├── 📂 scripts/                        # Scripts de procesamiento
│   ├── core/                          # Lógica principal
│   │   └── procesar.py                # Procesador unificado CSV/XLSX
│   └── ranking_analysis/              # Análisis de rankings nacionales
│       ├── download_rankings.py       # Descarga PDFs de Milton Ochoa
│       ├── extract_scores.py          # Extrae datos de PDFs a CSV
│       ├── analyze_scores.py          # Análisis estadístico
│       └── find_top_performers.py     # Encuentra récords nacionales
│
├── 📂 data/                           # Datos de entrada
│   ├── input/                         # Archivos de entrada
│   │   ├── claves/                    # Claves de respuestas correctas
│   │   ├── respuestas/                # Respuestas de estudiantes
│   │   └── invalidaciones.json        # Preguntas anuladas
│   ├── rankings_2025/                 # PDFs de ranking departamental
│   └── analysis_results/              # Resultados de análisis
│       ├── rankings_2025_consolidated.csv
│       ├── score_analysis_report.json
│       └── top_performers.txt
│
├── 📂 output/                         # Datos de salida
│   ├── reports/                       # Reportes Excel generados
│   └── temp/                          # Archivos temporales
│
├── 📂 cache/                          # Datos en caché/procesados
│   ├── resultados_finales.json        # Resultados consolidados
│   └── estadisticas_grupo.json        # Estadísticas grupales
│
└── 📂 .venv/                          # Entorno virtual Python
```

## 🚀 Comandos Útiles

### Ejecutar el servidor Flask

```bash
python app.py
```

### Procesar simulacro

```bash
python scripts/core/procesar.py
```

### Analizar rankings nacionales

```bash
python scripts/ranking_analysis/download_rankings.py  # Descargar PDFs
python scripts/ranking_analysis/extract_scores.py     # Extraer a CSV
python scripts/ranking_analysis/analyze_scores.py     # Generar estadísticas
```

## 📝 Notas

- Los archivos de entrada deben colocarse en `data/input/`
- Los reportes generados se guardan en `output/reports/`
- Los resultados del servidor Flask se almacenan en `cache/`
