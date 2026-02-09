import json

# Buscar el script procesar.py original que usó para SG11-08
# Revisando resultados_finales.json para analizar la fórmula

with open('temp_repo/src/data/resultados_finales.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

estudiantes = data.get('estudiantes', [])

print("ANALISIS DE FORMULA DE PUNTAJE SG11-08")
print("=" * 60)
print("\nMuestra de 10 estudiantes para analizar la relacion:")
print("-" * 60)
print(f"{'Materia':<20} {'Corr/Tot':<10} {'%':>8} {'Puntaje':>8} {'Diff':>8}")
print("-" * 60)

# Analizar los primeros estudiantes
for est in estudiantes[:5]:
    puntajes = est.get('puntajes', {})
    nombre = est.get('informacion_personal', {}).get('nombre_completo', 'N/A')[:30]
    print(f"\n{nombre}")
    
    for materia, p in puntajes.items():
        correctas = p.get('correctas', 0)
        total = p.get('total_preguntas', 1)
        puntaje = p.get('puntaje', 0)
        porc = (correctas / total * 100) if total else 0
        diff = puntaje - porc
        print(f"  {materia:<20} {correctas}/{total:<5} {porc:>8.1f}% {puntaje:>8} {diff:>+8.1f}")

# Calcular estadisticas de diferencia
print("\n" + "=" * 60)
print("ESTADISTICAS DE DIFERENCIA (puntaje - porcentaje)")
print("=" * 60)

diffs = []
for est in estudiantes:
    for materia, p in est.get('puntajes', {}).items():
        correctas = p.get('correctas', 0)
        total = p.get('total_preguntas', 1)
        if total > 0:
            porc = (correctas / total) * 100
            puntaje = p.get('puntaje', 0)
            diffs.append({
                'materia': materia,
                'porc': porc,
                'puntaje': puntaje,
                'diff': puntaje - porc
            })

# Agrupar por rangos de porcentaje
rangos = {
    '0-20%': [],
    '20-40%': [],
    '40-60%': [],
    '60-80%': [],
    '80-100%': []
}

for d in diffs:
    porc = d['porc']
    if porc < 20:
        rangos['0-20%'].append(d)
    elif porc < 40:
        rangos['20-40%'].append(d)
    elif porc < 60:
        rangos['40-60%'].append(d)
    elif porc < 80:
        rangos['60-80%'].append(d)
    else:
        rangos['80-100%'].append(d)

print(f"\n{'Rango %':<12} {'#':<6} {'Diff Prom':>10} {'Diff Min':>10} {'Diff Max':>10}")
print("-" * 50)
for rango, datos in rangos.items():
    if datos:
        diff_prom = sum(d['diff'] for d in datos) / len(datos)
        diff_min = min(d['diff'] for d in datos)
        diff_max = max(d['diff'] for d in datos)
        print(f"{rango:<12} {len(datos):<6} {diff_prom:>+10.1f} {diff_min:>+10.1f} {diff_max:>+10.1f}")

# Ver ejemplos especificos en el rango 80-100%
print("\n" + "=" * 60)
print("DETALLE RANGO 80-100% (primeras 20 muestras)")
print("=" * 60)
print(f"{'Materia':<20} {'%':>8} {'Puntaje':>8} {'Diff':>8}")
print("-" * 50)
for d in rangos['80-100%'][:20]:
    print(f"{d['materia']:<20} {d['porc']:>8.1f} {d['puntaje']:>8} {d['diff']:>+8.1f}")
