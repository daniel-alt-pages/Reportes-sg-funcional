import json
from collections import defaultdict

# Cargar calibración
with open('data/input/calibracion.json', 'r', encoding='utf-8') as f:
    calibracion = json.load(f)

# Contar preguntas por materia y sesión
conteo = defaultdict(lambda: {'S1': 0, 'S2': 0})

for key, data in calibracion.items():
    materia = data['materia']
    sesion = data['sesion']
    conteo[materia][sesion] += 1

print("=" * 60)
print("CONTEO DE PREGUNTAS POR MATERIA Y SESIÓN (calibracion.json)")
print("=" * 60)
for materia, sesiones in sorted(conteo.items()):
    s1 = sesiones['S1']
    s2 = sesiones['S2']
    total = s1 + s2
    print(f"{materia}:")
    print(f"  S1: {s1} preguntas")
    print(f"  S2: {s2} preguntas")
    print(f"  TOTAL: {total} preguntas")
    print()
