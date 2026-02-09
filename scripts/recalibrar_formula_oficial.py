"""
RECALIBRAR SIMULACROS - FORMULA OFICIAL DOCUMENTADA
====================================================
Implementa la fórmula EXACTA de config/LOGICA_CALIFICACION.md

Fórmula por rangos:
- 100%      -> 100
- 96-99%    -> 80 + ((% - 96) / 4) * 6
- 88-95%    -> 70 + ((% - 88) / 8) * 10
- 76-87%    -> 55 + ((% - 76) / 12) * 15
- 60-75%    -> 35 + ((% - 60) / 16) * 20
- 40-59%    -> 15 + ((% - 40) / 20) * 20
- 0-39%     -> (% / 40) * 15
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
print("RECALIBRADOR - FORMULA OFICIAL (config/LOGICA_CALIFICACION.md)")
print("=" * 70)

# FORMULA OFICIAL DOCUMENTADA
def calcular_puntaje_oficial(porcentaje):
    """
    Calcula el puntaje usando la formula OFICIAL documentada.
    Fuente: config/LOGICA_CALIFICACION.md
    """
    if porcentaje >= 100:
        return 100
    elif porcentaje >= 96:
        # Rango 96-99%: 80 + ((% - 96) / 4) * 6 -> Resultado: 80-86
        return 80 + ((porcentaje - 96) / 4) * 6
    elif porcentaje >= 88:
        # Rango 88-95%: 70 + ((% - 88) / 8) * 10 -> Resultado: 70-80
        return 70 + ((porcentaje - 88) / 8) * 10
    elif porcentaje >= 76:
        # Rango 76-87%: 55 + ((% - 76) / 12) * 15 -> Resultado: 55-70
        return 55 + ((porcentaje - 76) / 12) * 15
    elif porcentaje >= 60:
        # Rango 60-75%: 35 + ((% - 60) / 16) * 20 -> Resultado: 35-55
        return 35 + ((porcentaje - 60) / 16) * 20
    elif porcentaje >= 40:
        # Rango 40-59%: 15 + ((% - 40) / 20) * 20 -> Resultado: 15-35
        return 15 + ((porcentaje - 40) / 20) * 20
    else:
        # Rango 0-39%: (% / 40) * 15 -> Resultado: 0-15
        return (porcentaje / 40) * 15


# Verificar formula con ejemplos de la documentacion
print("\n[VERIFICACION] Probando formula con ejemplos:")
test_cases = [
    (100, 100),  # Perfecto
    (99.9, 85.85),  # Casi perfecto -> ~86
    (95, 78.75),  # 70 + ((95-88)/8)*10 = 70 + 8.75 = 78.75
    (88, 70),     # 70 + 0 = 70
    (80, 60),     # 55 + ((80-76)/12)*15 = 55 + 5 = 60
    (76, 55),     # 55 + 0 = 55
    (75, 53.75),  # 35 + ((75-60)/16)*20 = 35 + 18.75 = 53.75
    (60, 35),     # 35 + 0 = 35
    (50, 25),     # 15 + ((50-40)/20)*20 = 15 + 10 = 25
    (40, 15),     # 15 + 0 = 15
    (20, 7.5),    # (20/40)*15 = 7.5
    (0, 0),       # 0
]

for porc, esperado in test_cases:
    resultado = calcular_puntaje_oficial(porc)
    ok = "OK" if abs(resultado - esperado) < 0.1 else "ERROR"
    print(f"  {porc}% -> {resultado:.2f} (esperado: {esperado}) [{ok}]")


# Cargar calibracion para S1/S2
with open(INPUT_DIR / "calibracion.json", "r", encoding="utf-8") as f:
    calibracion = json.load(f)

total_s1 = sum(1 for d in calibracion.values() if d.get('sesion') == 'S1')
total_s2 = sum(1 for d in calibracion.values() if d.get('sesion') == 'S2')
print(f"\nPreguntas S1: {total_s1}, S2: {total_s2}")

# Cargar estudiantes SG11-09
print("\n[PROCESANDO] SG11-09...")
with open(SIM_DIR_09 / "students.json", "r", encoding="utf-8") as f:
    data = json.load(f)

estudiantes = data.get('students', {})
print(f"Estudiantes: {len(estudiantes)}")

# Pesos oficiales
PESOS = {
    'matematicas': 3,
    'lectura critica': 3,
    'sociales y ciudadanas': 3,
    'ciencias naturales': 3,
    'ingles': 1
}
TOTAL_PESOS = 13

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
        
        # Recalcular puntajes con FORMULA OFICIAL
        suma_ponderada = 0
        
        for materia, puntaje_data in puntajes.items():
            correctas = puntaje_data.get('correctas', 0)
            total = puntaje_data.get('total_preguntas', 1)
            
            porcentaje = (correctas / total * 100) if total > 0 else 0
            puntaje = calcular_puntaje_oficial(porcentaje)
            
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
        
        # Puntaje global: (suma_ponderada / 13) * 5
        promedio = suma_ponderada / TOTAL_PESOS
        puntaje_global = int(round(promedio * 5))
        puntaje_global = min(500, puntaje_global)
        
        est['puntaje_global'] = puntaje_global
        
        # Nivel segun documentacion (basado en global)
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

# Ordenar y guardar
estudiantes_ordenados = sorted(
    estudiantes.keys(),
    key=lambda x: estudiantes[x].get('puntaje_global', 0),
    reverse=True
)

output_data = {
    "version": "2.0.0",
    "simulationId": "SG11-09",
    "formula": "oficial_documentada",
    "index": estudiantes_ordenados,
    "students": estudiantes
}

# Backup
backup_path = SIM_DIR_09 / "students_backup_v2.json"
if (SIM_DIR_09 / "students.json").exists():
    shutil.copy(SIM_DIR_09 / "students.json", backup_path)
    print(f"Backup: {backup_path.name}")

with open(SIM_DIR_09 / "students.json", "w", encoding="utf-8") as f:
    json.dump(output_data, f, ensure_ascii=False, indent=2)
print("[OK] students.json guardado")

# Generar archivos individuales
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

# Distribucion por nivel
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
