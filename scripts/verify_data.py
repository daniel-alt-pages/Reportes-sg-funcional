import json

# Verificar los datos
with open('reportes-sg-next/public/data/simulations/SG11-09/students.json', 'r', encoding='utf-8') as f:
    d = json.load(f)

idx = d['index'][:10]
print('TOP 10 ESTUDIANTES:')
print('=' * 100)
for i, id in enumerate(idx):
    est = d['students'][id]
    nombre = est['informacion_personal']['nombre_completo']
    global_score = est['puntaje_global']
    s1_aciertos = est['s1_aciertos']
    s1_total = est['s1_total']
    s2_aciertos = est['s2_aciertos']
    s2_total = est['s2_total']
    nivel = est.get('nivel_desempeno', 'N/A')
    
    print(f"{i+1:2}. {nombre:40} | Global: {global_score:3} | S1: {s1_aciertos:3}/{s1_total:3} | S2: {s2_aciertos:3}/{s2_total:3} | {nivel}")

print()
print('VERIFICACIÓN DE ALGUNOS ESTUDIANTES:')
print('=' * 100)

# Verificar algunos con puntajes variados
for id in [idx[0], idx[len(idx)//2], idx[-1]]:  # Primer, medio y último
    est = d['students'][id]
    print(f"\nID: {id}")
    print(f"  Nombre: {est['informacion_personal']['nombre_completo']}")
    print(f"  Global: {est['puntaje_global']}")
    print(f"  S1: {est['s1_aciertos']}/{est['s1_total']}")
    print(f"  S2: {est['s2_aciertos']}/{est['s2_total']}")
    print(f"  Nivel: {est.get('nivel_desempeno', 'N/A')}")
    print(f"  Sesiones: {est.get('secciones_completadas', [])}")
