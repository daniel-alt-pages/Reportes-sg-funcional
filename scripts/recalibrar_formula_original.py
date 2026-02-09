"""
RECALIBRAR SG11-09 - USANDO FORMULA ORIGINAL (SG11-08)
======================================================
Usa la misma formula calcular_puntaje_icfes que se uso en SG11-08.
NO usa penalizaciones ni topes adicionales.
"""

import json
from pathlib import Path
from statistics import mean

BASE_DIR = Path(__file__).parent.parent
INPUT_DIR = BASE_DIR / "data" / "input"
SIM_DIR = BASE_DIR / "reportes-sg-next" / "public" / "data" / "simulations" / "SG11-09"
OUTPUT_ESTUDIANTES = BASE_DIR / "reportes-sg-next" / "public" / "data" / "estudiantes"

print("=" * 60)
print("RECALIBRADOR SG11-09 - FORMULA ORIGINAL (SG11-08)")
print("=" * 60)

# Cargar calibracion para contar totales
with open(INPUT_DIR / "calibracion.json", "r", encoding="utf-8") as f:
    calibracion = json.load(f)

total_s1_calibracion = sum(1 for d in calibracion.values() if d.get('sesion') == 'S1')
total_s2_calibracion = sum(1 for d in calibracion.values() if d.get('sesion') == 'S2')
print(f"Total preguntas S1: {total_s1_calibracion}")
print(f"Total preguntas S2: {total_s2_calibracion}")

# Cargar estudiantes
with open(SIM_DIR / "students.json", "r", encoding="utf-8") as f:
    data = json.load(f)

estudiantes = data.get('students', {})
print(f"Estudiantes: {len(estudiantes)}")

# FORMULA ORIGINAL (IDENTICA A SG11-08)
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

# Pesos ICFES
PESOS = {
    'matematicas': 3,
    'lectura critica': 3,
    'sociales y ciudadanas': 3,
    'ciencias naturales': 3,
    'ingles': 1
}
TOTAL_PESOS = sum(PESOS.values())

print("\nRecalculando con formula original...")
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
        est['s1_total'] = total_s1_calibracion
        est['s2_aciertos'] = s2_aciertos
        est['s2_total'] = total_s2_calibracion
        
        # Recalcular puntajes con formula ORIGINAL
        suma_ponderada = 0
        
        for materia, puntaje_data in puntajes.items():
            correctas = puntaje_data.get('correctas', 0)
            total = puntaje_data.get('total_preguntas', 1)
            
            # FORMULA ORIGINAL - solo porcentaje
            porcentaje = (correctas / total * 100) if total > 0 else 0
            puntaje = calcular_puntaje_icfes(porcentaje)
            
            puntaje_data['puntaje'] = int(round(puntaje))
            puntaje_data['porcentaje_real'] = round(porcentaje, 2)
            
            # Clave normalizada para pesos
            materia_key = materia.lower().replace('a', 'a').replace('i', 'i')
            if 'matem' in materia_key:
                peso = 3
            elif 'lectura' in materia_key:
                peso = 3
            elif 'social' in materia_key:
                peso = 3
            elif 'ciencia' in materia_key or 'natural' in materia_key:
                peso = 3
            elif 'ingl' in materia_key:
                peso = 1
            else:
                peso = 0
                
            suma_ponderada += puntaje_data['puntaje'] * peso
        
        # Puntaje global
        promedio = suma_ponderada / TOTAL_PESOS
        puntaje_global = int(round(promedio * 5))
        puntaje_global = min(500, puntaje_global)
        
        est['puntaje_global'] = puntaje_global
        
        # Nivel ICFES
        if puntaje_global >= 400:
            est['nivel_desempeno'] = "Superior"
        elif puntaje_global >= 325:
            est['nivel_desempeno'] = "Alto"
        elif puntaje_global >= 250:
            est['nivel_desempeno'] = "Medio"
        else:
            est['nivel_desempeno'] = "Bajo"
        
        contador += 1
        
    except Exception as e:
        print(f"Error {id_est}: {e}")

print(f"Procesados: {contador}")

# Ordenar y guardar
estudiantes_ordenados = sorted(
    estudiantes.keys(),
    key=lambda x: estudiantes[x].get('puntaje_global', 0),
    reverse=True
)

output_data = {
    "version": "1.2.0",
    "simulationId": "SG11-09",
    "formula": "original_sg08",
    "index": estudiantes_ordenados,
    "students": estudiantes
}

# Backup
import shutil
backup_path = SIM_DIR / "students_backup_before_original.json"
if (SIM_DIR / "students.json").exists():
    shutil.copy(SIM_DIR / "students.json", backup_path)
    print(f"Backup: {backup_path.name}")

with open(SIM_DIR / "students.json", "w", encoding="utf-8") as f:
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
print("\n" + "=" * 60)
print("ESTADISTICAS")
print("=" * 60)
print(f"Max: {max(puntajes_globales)}")
print(f"Min: {min(puntajes_globales)}")
print(f"Promedio: {round(mean(puntajes_globales), 1)}")

# Verificar Rosa
print("\n--- Rosa Mendieta (1097912847) ---")
rosa = estudiantes.get('1097912847', {})
if rosa:
    print(f"Global: {rosa.get('puntaje_global')}")
    print(f"Nivel: {rosa.get('nivel_desempeno')}")
    for m, p in rosa.get('puntajes', {}).items():
        print(f"  {m}: {p.get('correctas')}/{p.get('total_preguntas')} ({p.get('porcentaje_real')}%) -> {p.get('puntaje')}")
else:
    print("No encontrada")

print("\n[COMPLETADO]")
