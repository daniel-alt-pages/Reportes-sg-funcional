import json
from pathlib import Path
from statistics import mean, stdev

# Analizar SG11-08 para entender la formula real
BASE_DIR = Path(__file__).parent.parent
SIM_DIR_08 = BASE_DIR / "reportes-sg-next" / "public" / "data" / "simulations" / "SG11-08"

print("=" * 70)
print("ANALISIS DE FORMULA SG11-08")
print("=" * 70)

# Cargar estudiantes
with open(SIM_DIR_08 / "students.json", "r", encoding="utf-8") as f:
    data = json.load(f)

estudiantes = list(data.get('students', {}).values())
print(f"Estudiantes: {len(estudiantes)}")

# Recolectar datos por area
areas = {
    'matematicas': [],
    'lectura critica': [],
    'sociales y ciudadanas': [],
    'ciencias naturales': [],
    'ingles': [],
}

globales = []

for est in estudiantes:
    puntajes = est.get('puntajes', {})
    global_score = est.get('puntaje_global', 0)
    
    if global_score > 0:
        globales.append(global_score)
    
    for materia, p in puntajes.items():
        puntaje = p.get('puntaje', 0)
        correctas = p.get('correctas', 0)
        total = p.get('total_preguntas', 1)
        porcentaje = (correctas / total * 100) if total > 0 else 0
        
        materia_key = materia.lower()
        for key in areas.keys():
            if key in materia_key or materia_key in key:
                areas[key].append({
                    'puntaje': puntaje,
                    'porcentaje': porcentaje,
                    'correctas': correctas,
                    'total': total
                })
                break

# Estadisticas por area
print("\n" + "-" * 70)
print("ESTADISTICAS POR AREA (SG11-08 actual)")
print("-" * 70)
print(f"{'Area':<25} {'Count':>6} {'Mean':>8} {'Std':>8} {'Min':>6} {'Max':>6}")
print("-" * 70)

for area, datos in areas.items():
    if datos:
        puntajes = [d['puntaje'] for d in datos]
        count = len(puntajes)
        mean_val = mean(puntajes)
        std_val = stdev(puntajes) if len(puntajes) > 1 else 0
        min_val = min(puntajes)
        max_val = max(puntajes)
        print(f"{area:<25} {count:>6} {mean_val:>8.2f} {std_val:>8.2f} {min_val:>6} {max_val:>6}")

print("-" * 70)
if globales:
    print(f"{'GLOBAL':<25} {len(globales):>6} {mean(globales):>8.2f} {stdev(globales):>8.2f} {min(globales):>6} {max(globales):>6}")

# Analizar relacion porcentaje vs puntaje
print("\n" + "-" * 70)
print("RELACION PORCENTAJE -> PUNTAJE (Muestra de datos)")
print("-" * 70)
print(f"{'Area':<20} {'%':>8} {'Puntaje':>8} {'Ratio':>8}")
print("-" * 70)

for area, datos in areas.items():
    if datos:
        # Ordenar por porcentaje
        datos_ord = sorted(datos, key=lambda x: x['porcentaje'], reverse=True)
        # Mostrar los mejores 3 y algunos intermedios
        for d in datos_ord[:3]:
            ratio = d['puntaje'] / d['porcentaje'] if d['porcentaje'] > 0 else 0
            print(f"{area:<20} {d['porcentaje']:>8.1f} {d['puntaje']:>8} {ratio:>8.3f}")
        print()

# Intentar encontrar la formula
print("\n" + "-" * 70)
print("ANALISIS DE FORMULA")
print("-" * 70)

# Probar si es una escala lineal simple: puntaje = porcentaje * factor
for area, datos in areas.items():
    if datos:
        # Calcular factor promedio
        ratios = [d['puntaje'] / d['porcentaje'] for d in datos if d['porcentaje'] > 0]
        if ratios:
            factor_prom = mean(ratios)
            print(f"{area}: factor promedio = {factor_prom:.3f} (puntaje = % * {factor_prom:.3f})")
