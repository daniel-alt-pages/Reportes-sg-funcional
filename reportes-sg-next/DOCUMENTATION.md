# 📘 Documentación Técnica - Sistema de Reportes Seamos Genios

## 1. Descripción General

El **Sistema de Reportes Seamos Genios** es una plataforma integral de alto rendimiento para el análisis, gestión y visualización de resultados de simulacros ICFES Saber 11. El sistema combina un panel administrativo moderno y visualmente impactante (Next.js) con un robusto motor de procesamiento de datos y generación de informes (Python/Flask).

## 2. Arquitectura del Sistema

El sistema utiliza una arquitectura híbrida desacoplada:

- **Frontend (Panel Administrativo)**:
  - **Tecnología**: Next.js 13+ (App Router), React, TypeScript.
  - **Estilos**: Tailwind CSS, Shadcn UI, efectos Glassmorphism.
  - **Visualización**: WebGL para fondos animados (`LiquidEther`), Gráficos CSS puros.
  - **Responsabilidad**: Interfaz de usuario, dashboard interactivo, filtros, tablas de datos y configuración de exportaciones.

- **Backend (Motor de Reportes)**:
  - **Tecnología**: Python 3, Flask.
  - **Librerías Clave**: `pandas` (procesamiento de datos), `weasyprint` (generación PDF), `jinja2` (templating).
  - **Responsabilidad**: Procesamiento pesado de Excel/CSV, cálculos estadísticos complejos, generación de PDFs fieles al diseño impreso.

- **Comunicación de Datos**:
  - El frontend consume los datos procesados a través de archivos JSON estáticos generados por el backend (principalmente `resultados_finales.json`), servidos vía API Routes de Next.js (`/api/estudiantes`).

## 3. Guía de Instalación y Ejecución

Para operar el sistema completo, se deben ejecutar dos servicios simultáneamente:

### Servicio 1: Frontend (Next.js)

```bash
cd reportes-sg-next
npm install
npm run dev
# Acceso: http://localhost:3000/admin
```

### Servicio 2: Backend (Flask)

```bash
cd ReportesSG-main
pip install -r requirements.txt
python app.py
# Acceso: http://127.0.0.1:5000 (API y Generador PDF)
```

## 4. Funcionalidades del Panel Administrativo

### 📊 Dashboard de Estadísticas

Vista inicial diseñada para ofrecer inteligencia de negocios inmediata:

- **Métricas KPI**: Tarjetas con estilo "Glass" que muestran Total Estudiantes, Promedio Global, Máximos, y distribución porcentual por niveles de desempeño.
- **Histograma Interactivo**: Visualización de la curva de distribución de puntajes.
- **Promedios por Materia**: Indicadores visuales circulares con colores temáticos (Matemáticas=Violeta, Lectura=Ámbar, etc.).
- **Alertas Tempranas**: Sección "Requieren Atención" que identifica automáticamente estudiantes con bajo rendimiento.

### 👥 Tabla de Estudiantes (Diseño Profesional)

Interfaz de lista optimizada para la legibilidad y densidad de información:

- **Diseño Asertivo**:
  - **Identidad**: Avatares con iniciales y gradientes, nombres destacados, metadatos (ID/Email) en jerarquía secundaria.
  - **Datos Tabulares**: Uso de fuentes monoespaciadas (`tabular-nums`) para cifras, facilitando la comparación vertical.
  - **Badges**: Indicadores visuales de nivel y estado.
- **Interacción**: Ordenamiento por columnas, búsqueda en tiempo real y clic para ver detalle.

### 📥 Exportación Avanzada

Sistema de generación de reportes bajo demanda:

- **Formatos**: Soporte nativo para **Excel (.xlsx)** y **CSV**.
- **Filtros de Exportación**:
  - **Alcance**: Filtrar por Institución específica o Departamento.
  - **Nivel**: Exportar solo estudiantes de cierto nivel (ej. "Superior").
  - **Integridad**: Opción para excluir estudiantes con sesiones incompletas.

### 🏫 Vistas Agrupadas

- **Por Institución**: Desglose del rendimiento promedio y distribución de niveles por colegio. Incluye descarga de CSV individual por institución.
- **Por Departamento**: Análisis demográfico geográfico.

## 5. Componentes Visuales y UX

### LiquidEther (Fondo Inmersivo)

El sistema implementa un fondo animado fluido (`LiquidEther`) que utiliza shaders WebGL para crear una experiencia visual premium y moderna.

- **Configuración**: Control de viscosidad, colores y fuerza del mouse en `src/app/admin/page.tsx`.

### Sistema de Diseño (Glass UI)

Se utiliza una estética de "cristal esmerilado" sobre el fondo animado:

- Paneles con `bg-white/5` y `backdrop-blur-lg`.
- Bordes sutiles `border-white/10`.
- Textos con alto contraste y jerarquía tipográfica clara.

## 6. Lógica de Procesamiento (`procesar.py`)

El corazón del análisis de datos reside en los scripts de Python:

1. **Ingesta**: Lee archivos CSV/Excel de Sesión 1 y Sesión 2 desde la carpeta `entrada/`.
2. **Unificación Inteligente**:
    - Cruza registros de S1 y S2 utilizando una estrategia de coincidencia múltiple (Documento, Correo Electrónico, Nombre Normalizado).
    - Esto resuelve problemas de estudiantes que escriben mal su documento en una de las sesiones.
3. **Cálculo de Puntajes**:
    - Aplica la escala oficial del ICFES (0-100 por materia).
    - Calcula el **Puntaje Global** (0-500) usando las ponderaciones estándar es (Mat 3, Lec 3, Soc 3, Cie 3, Ing 1).
    - Determina el **Nivel de Desempeño** (Superior, Alto, Medio, Bajo).
4. **Generación de Salida**:
    - Escribe `resultados_finales.json` con la estructura unificada para el frontend.
    - Genera `estadisticas_grupo.json` para los gráficos globales.

## 7. Estructura de Archivos Clave

```
reportes-sg-next/
├── src/
│   ├── app/
│   │   ├── admin/
│   │   │   └── page.tsx       # Lógica principal del Panel (Dashboard, Tablas, Modales)
│   │   ├── api/
│   │   │   └── estudiantes/   # Endpoint que sirve el JSON procesado
│   ├── components/
│   │   └── LiquidEther.jsx    # Componente de fondo animado
│   └── types/                 # Definiciones TypeScript (Estudiante, Resultados)
├── public/                    # Assets estáticos
└── DOCUMENTATION.md           # Este archivo
```

---
*Sistema desarrollado para Seamos Genios - 2026*
