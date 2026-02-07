# Sistema de Reportes ICFES - Simulacro Saber 11

## Estructura del Proyecto

```
ReportesSG-main/
├── entrada/                 # Archivos de entrada
│   ├── respuestas/          # CSV/XLSX de respuestas de estudiantes
│   └── claves/              # CSV/XLSX con claves correctas
├── salida/                  # Reportes generados
│   ├── Reporte_Completo.xlsx
│   └── resultados_finales.json
├── EXCEL/                   # Datos originales (también se buscan aquí)
│   ├── RESPUESTAS/
│   └── CLAVES/
├── cargar/                  # Datos para la app web
├── scripts/                 # Scripts de procesamiento
│   └── procesar.py          # Script principal
├── static/                  # Archivos estáticos (CSS, JS)
├── templates/               # Templates HTML
├── app.py                   # Aplicación web Flask
└── README.md
```

## Uso Rápido

### 1. Procesar datos

```bash
python scripts/procesar.py
```

### 2. Ejecutar aplicación web

```bash
python app.py
```

Luego abre: <http://127.0.0.1:5000>

## Flujo de Trabajo

1. **Coloca archivos** en `entrada/respuestas/` y `entrada/claves/`
   - O usa los archivos en `EXCEL/RESPUESTAS/` y `EXCEL/CLAVES/`

2. **Ejecuta el procesador**:

   ```bash
   python scripts/procesar.py
   ```

3. **Los resultados se generan en `salida/`**:
   - `resultados_finales.json` - Datos procesados
   - `Reporte_Completo.xlsx` - Reporte Excel con hojas por institución

4. **Copia datos a la app** (si usas la app web):

   ```bash
   copy salida\resultados_finales.json cargar\
   ```

## Formatos Soportados

- ✅ CSV (cualquier encoding: UTF-8, Latin-1, etc.)
- ✅ XLSX (Excel)

## Reportes Generados

| Hoja | Contenido |
|------|-----------|
| Resumen Ejecutivo | Estadísticas generales |
| Todos los Estudiantes | Lista completa ordenada por puntaje |
| Por Institución | Una hoja por cada institución |
