"""
RECALIBRAR SG11-09 - FORMULA FUNCIONAL
======================================
Usa la formula EXACTA del procesar.py funcional que produce
los resultados correctos de SG11-08.
"""

import json
from pathlib import Path
from statistics import mean
import shutil

BASE_DIR = Path(__file__).parent.parent
INPUT_DIR = BASE_DIR / "data" / "input"
SIM_DIR_09 = BASE_DIR / "reportes-sg-next" / "public" / "data" / "simulations" / "SG11-09"
OUTPUT_ESTUDIANTES = BASE_DIR / "reportes-sg-next" / "public" / "data" / "estudiantes"

print("=" * 70)
print("RECALIBRADOR SG11-09 - FORMULA FUNCIONAL (procesar.py)")
print("=" * 70)

# FORMULA EXACTA DE temp_funcional/scripts/core/procesar.py
def calcular_puntaje_icfes(porcentaje):
    """Calcula el puntaje ICFES (0-100) basado en porcentaje de aciertos."""
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


# Verificar formula
print("\n[VERIFICACION] Probando formula:")
test_cases = [
    (100, "100"),
    (96, "80"),
    (99.99, "~86"),
    (75, "65"),
    (95, "~85"),
    (50, "45"),
    (74, "~64"),
    (25, "30"),
    (0, "0"),
]
for porc, esperado in test_cases:
    resultado = calcular_puntaje_icfes(porc)
    print(f"  {porc}% -> {resultado:.1f} (esperado: {esperado})")


# Cargar calibracion para S1/S2
with open(INPUT_DIR / "calibracion.json", "r", encoding="utf-8") as f:
    calibracion = json.load(f)

total_s1 = sum(1 for d in calibracion.values() if d.get('sesion') == 'S1')
total_s2 = sum(1 for d in calibracion.values() if d.get('sesion') == 'S2')
print(f"\nPreguntas S1: {total_s1}, S2: {total_s2}")

# Cargar estudiantes
with open(SIM_DIR_09 / "students.json", "r", encoding="utf-8") as f:
    data = json.load(f)

estudiantes = data.get('students', {})
print(f"Estudiantes: {len(estudiantes)}")

# Pesos
PESOS = {
    'matematicas': 3,
    'lectura critica': 3,
    'sociales y ciudadanas': 3,
    'ciencias naturales': 3,
    'ingles': 1
}
TOTAL_PESOS = 13

print("\nRecalculando...")
contador = 0

for id_est, est in estudiantes.items():
    try:
        puntajes = est.get('puntajes', {})
        respuestas_det = est.get('respuestas_detalladas', {})
        
        # Calcular S1/S2 aciertos
        s1_aciertos = 0
        s2_aciertos = 0
        
        for materia, respuestas in respuestas_det.items():
            if isinstance(respuestas, list):
                for resp in respuestas:
                    num = resp.get('numero', 0)
                    es_correcta = resp.get('es_correcta', False)
                    key = f"{materia}_{num}"
                    info_calib = calibracion.get(key, {})
                    sesion = info_calib.get('sesion', 'S1')
                    
                    if es_correcta:
                        if sesion == 'S1':
                            s1_aciertos += 1
                        else:
                            s2_aciertos += 1
        
        est['s1_aciertos'] = s1_aciertos
        est['s1_total'] = total_s1
        est['s2_aciertos'] = s2_aciertos
        est['s2_total'] = total_s2
        
        # Recalcular puntajes
        suma_ponderada = 0
        
        for materia, puntaje_data in puntajes.items():
            correctas = puntaje_data.get('correctas', 0)
            total = puntaje_data.get('total_preguntas', 1)
            
            porcentaje = (correctas / total * 100) if total > 0 else 0
            puntaje = calcular_puntaje_icfes(porcentaje)
            
            puntaje_data['puntaje'] = int(round(puntaje))
            puntaje_data['porcentaje_real'] = round(porcentaje, 2)
            
            # Determinar peso
            materia_lower = materia.lower()
            if 'matem' in materia_lower:
                peso = 3
            elif 'lectura' in materia_lower:
                peso = 3
            elif 'social' in materia_lower:
                peso = 3
            elif 'ciencia' in materia_lower or 'natural' in materia_lower:
                peso = 3
            elif 'ingl' in materia_lower:
                peso = 1
            else:
                peso = 0
                
            suma_ponderada += puntaje_data['puntaje'] * peso
        
        # Puntaje global
        promedio = suma_ponderada / TOTAL_PESOS
        puntaje_global = int(round(promedio * 5))
        puntaje_global = min(500, puntaje_global)
        
        est['puntaje_global'] = puntaje_global
        
        # Nivel
        if puntaje_global >= 350:
            est['nivel_desempeno'] = "Excelente"
        elif puntaje_global >= 259:
            est['nivel_desempeno'] = "Bueno"
        elif puntaje_global >= 200:
            est['nivel_desempeno'] = "Promedio"
        else:
            est['nivel_desempeno'] = "Por mejorar"
        
        contador += 1
        
    except Exception as e:
        print(f"  Error {id_est}: {e}")

print(f"Procesados: {contador}")

# Guardar
estudiantes_ordenados = sorted(
    estudiantes.keys(),
    key=lambda x: estudiantes[x].get('puntaje_global', 0),
    reverse=True
)

output_data = {
    "version": "2.1.0",
    "simulationId": "SG11-09",
    "formula": "procesar_funcional",
    "index": estudiantes_ordenados,
    "students": estudiantes
}

backup_path = SIM_DIR_09 / "students_backup_v3.json"
if (SIM_DIR_09 / "students.json").exists():
    shutil.copy(SIM_DIR_09 / "students.json", backup_path)
    print(f"Backup: {backup_path.name}")

with open(SIM_DIR_09 / "students.json", "w", encoding="utf-8") as f:
    json.dump(output_data, f, ensure_ascii=False, indent=2)
print("[OK] students.json guardado")

# Generar individuales
OUTPUT_ESTUDIANTES.mkdir(parents=True, exist_ok=True)
for id_est, est in estudiantes.items():
    est['secciones_completadas'] = est.get('sesiones', [])
    with open(OUTPUT_ESTUDIANTES / f"{id_est}.json", "w", encoding="utf-8") as f:
        json.dump(est, f, ensure_ascii=False, indent=2)
print(f"[OK] {len(estudiantes)} archivos individuales")

# Estadisticas
puntajes_globales = [e.get('puntaje_global', 0) for e in estudiantes.values()]
print("\n" + "=" * 70)
print("ESTADISTICAS SG11-09")
print("=" * 70)
print(f"Max: {max(puntajes_globales)}")
print(f"Min: {min(puntajes_globales)}")
print(f"Promedio: {round(mean(puntajes_globales), 1)}")

# Distribucion
niveles = {}
for e in estudiantes.values():
    n = e.get('nivel_desempeno', 'N/A')
    niveles[n] = niveles.get(n, 0) + 1

print("\nDistribucion por nivel:")
for nivel, count in sorted(niveles.items()):
    pct = (count / len(estudiantes)) * 100
    print(f"  {nivel}: {count} ({pct:.1f}%)")

# Verificar Rosa
print("\n" + "-" * 50)
print("VERIFICACION: Rosa Mendieta (1097912847)")
print("-" * 50)
rosa = estudiantes.get('1097912847', {})
if rosa:
    print(f"S1: {rosa.get('s1_aciertos')}/{rosa.get('s1_total')}")
    print(f"S2: {rosa.get('s2_aciertos')}/{rosa.get('s2_total')}")
    print(f"Global: {rosa.get('puntaje_global')}")
    print(f"Nivel: {rosa.get('nivel_desempeno')}")
    print("\nPuntajes por area:")
    for m, p in rosa.get('puntajes', {}).items():
        print(f"  {m}: {p.get('correctas')}/{p.get('total_preguntas')} ({p.get('porcentaje_real')}%) -> {p.get('puntaje')}")
else:
    print("No encontrada")

print("\n[COMPLETADO]")
