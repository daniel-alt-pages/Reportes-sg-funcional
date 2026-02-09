"""
RECALIBRAR SG11-09 - VERSIÓN CORREGIDA
======================================
Ajusta los puntajes usando una fórmula más justa:
- Base: Porcentaje de aciertos ponderado
- Sin topes fijos agresivos
- Escala ICFES real (0-100 por área, 0-500 global)
"""

import json
from pathlib import Path
from statistics import mean

BASE_DIR = Path(__file__).parent.parent
INPUT_DIR = BASE_DIR / "data" / "input"
SIM_DIR = BASE_DIR / "reportes-sg-next" / "public" / "data" / "simulations" / "SG11-09"
OUTPUT_ESTUDIANTES = BASE_DIR / "reportes-sg-next" / "public" / "data" / "estudiantes"

# Cargar datos
print("=" * 60)
print("RECALIBRADOR SG11-09 - VERSIÓN CORREGIDA")
print("=" * 60)

# Cargar calibración
print("\n[1/5] Cargando calibración...")
with open(INPUT_DIR / "calibracion.json", "r", encoding="utf-8") as f:
    calibracion = json.load(f)

print(f"   Preguntas calibradas: {len(calibracion)}")

# Contar totales reales por sesión desde la calibración
total_s1_calibracion = sum(1 for d in calibracion.values() if d.get('sesion') == 'S1')
total_s2_calibracion = sum(1 for d in calibracion.values() if d.get('sesion') == 'S2')
print(f"   Total preguntas S1 (calibración): {total_s1_calibracion}")
print(f"   Total preguntas S2 (calibración): {total_s2_calibracion}")

# Cargar estudiantes
print("\n[2/5] Cargando estudiantes...")
with open(SIM_DIR / "students.json", "r", encoding="utf-8") as f:
    data = json.load(f)

estudiantes = data.get('students', {})
print(f"   Estudiantes cargados: {len(estudiantes)}")

# Pesos ICFES para el puntaje global (oficial)
PESOS = {
    'matemáticas': 3,
    'lectura crítica': 3,
    'sociales y ciudadanas': 3,
    'ciencias naturales': 3,
    'inglés': 1
}
TOTAL_PESOS = sum(PESOS.values())

def calcular_puntaje_icfes_justo(porcentaje, num_errores=0, materia=None):
    """
    Calcula el puntaje ICFES de forma más justa.
    
    La fórmula ICFES real es compleja y usa TRI (Teoría de Respuesta al Ítem).
    Esta aproximación usa una escala más lineal y justa:
    
    - 100% = 100 puntos
    - 95%+ = 90-99 puntos
    - 90%+ = 80-89 puntos
    - 80%+ = 70-79 puntos
    - 70%+ = 60-69 puntos
    - etc.
    """
    if porcentaje >= 100:
        return 100
    elif porcentaje >= 95:
        # 95-100% -> 90-100 puntos (interpolación)
        return 90 + ((porcentaje - 95) / 5) * 10
    elif porcentaje >= 90:
        # 90-95% -> 82-90 puntos
        return 82 + ((porcentaje - 90) / 5) * 8
    elif porcentaje >= 85:
        # 85-90% -> 75-82 puntos
        return 75 + ((porcentaje - 85) / 5) * 7
    elif porcentaje >= 80:
        # 80-85% -> 68-75 puntos
        return 68 + ((porcentaje - 80) / 5) * 7
    elif porcentaje >= 70:
        # 70-80% -> 55-68 puntos
        return 55 + ((porcentaje - 70) / 10) * 13
    elif porcentaje >= 60:
        # 60-70% -> 45-55 puntos
        return 45 + ((porcentaje - 60) / 10) * 10
    elif porcentaje >= 50:
        # 50-60% -> 35-45 puntos
        return 35 + ((porcentaje - 50) / 10) * 10
    elif porcentaje >= 30:
        # 30-50% -> 20-35 puntos
        return 20 + ((porcentaje - 30) / 20) * 15
    else:
        # 0-30% -> 0-20 puntos
        return (porcentaje / 30) * 20

def normalizar_nombre(nombre):
    """Normaliza el nombre del estudiante."""
    if not nombre:
        return ""
    return " ".join(word.capitalize() for word in str(nombre).strip().split())

# Procesar cada estudiante
print("\n[3/5] Recalculando puntajes con fórmula justa...")
contador = 0
errores_count = 0

for id_est, est in estudiantes.items():
    try:
        # Normalizar nombres
        info = est.get('informacion_personal', {})
        info['nombres'] = normalizar_nombre(info.get('nombres', ''))
        info['apellidos'] = normalizar_nombre(info.get('apellidos', ''))
        info['nombre_completo'] = f"{info['nombres']} {info['apellidos']}".strip()
        
        # Obtener respuestas detalladas
        respuestas_det = est.get('respuestas_detalladas', {})
        puntajes = est.get('puntajes', {})
        
        # Calcular aciertos S1 y S2
        s1_aciertos = 0
        s2_aciertos = 0
        
        for materia, respuestas in respuestas_det.items():
            if isinstance(respuestas, list):
                for resp in respuestas:
                    num = resp.get('numero', 0)
                    es_correcta = resp.get('es_correcta', False)
                    
                    # Buscar en calibración
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
        
        # Recalcular puntajes por materia
        suma_ponderada = 0
        
        for materia, puntaje_data in puntajes.items():
            correctas = puntaje_data.get('correctas', 0)
            total = puntaje_data.get('total_preguntas', 1)
            
            # Calcular porcentaje real
            porcentaje = (correctas / total * 100) if total > 0 else 0
            num_errores = total - correctas
            
            # Calcular puntaje usando fórmula justa
            puntaje_final = calcular_puntaje_icfes_justo(porcentaje, num_errores, materia)
            
            puntaje_data['puntaje'] = int(round(puntaje_final))
            puntaje_data['porcentaje_real'] = round(porcentaje, 2)
            
            if materia in PESOS:
                suma_ponderada += puntaje_data['puntaje'] * PESOS[materia]
        
        # Calcular puntaje global
        promedio = suma_ponderada / TOTAL_PESOS
        puntaje_global = int(round(promedio * 5))  # Escala 0-500
        puntaje_global = min(500, puntaje_global)  # Limitar a 500
        
        est['puntaje_global'] = puntaje_global
        
        # Determinar nivel de desempeño ICFES
        if puntaje_global >= 400:
            nivel = "Superior"
        elif puntaje_global >= 325:
            nivel = "Alto"
        elif puntaje_global >= 250:
            nivel = "Medio"
        else:
            nivel = "Bajo"
        
        est['nivel_desempeno'] = nivel
        
        contador += 1
        if contador % 50 == 0:
            print(f"   Procesados: {contador}/{len(estudiantes)}")
            
    except Exception as e:
        errores_count += 1
        print(f"   [!] Error procesando {id_est}: {e}")

print(f"   Procesados correctamente: {contador}")
if errores_count > 0:
    print(f"   Errores: {errores_count}")

# Recalcular el índice (ordenar por puntaje global)
print("\n[4/5] Reconstruyendo índice...")
estudiantes_ordenados = sorted(
    estudiantes.keys(),
    key=lambda x: estudiantes[x].get('puntaje_global', 0),
    reverse=True
)

# Guardar students.json principal
print("\n[5/5] Guardando archivos...")
output_data = {
    "version": "1.1.0",
    "simulationId": "SG11-09",
    "calibracion": "corregida",
    "index": estudiantes_ordenados,
    "students": estudiantes
}

# Crear backup
backup_path = SIM_DIR / "students_backup_v1.json"
import shutil
if (SIM_DIR / "students.json").exists():
    shutil.copy(SIM_DIR / "students.json", backup_path)
    print(f"   Backup creado: {backup_path.name}")

with open(SIM_DIR / "students.json", "w", encoding="utf-8") as f:
    json.dump(output_data, f, ensure_ascii=False, indent=2)
print(f"   [OK] Guardado: students.json")

# También generar archivos individuales actualizados
print("\n[EXTRA] Generando archivos individuales...")
OUTPUT_ESTUDIANTES.mkdir(parents=True, exist_ok=True)

for id_est, est in estudiantes.items():
    # Copiar sesiones a secciones_completadas para compatibilidad
    est['secciones_completadas'] = est.get('sesiones', [])
    
    individual_path = OUTPUT_ESTUDIANTES / f"{id_est}.json"
    with open(individual_path, "w", encoding="utf-8") as f:
        json.dump(est, f, ensure_ascii=False, indent=2)

print(f"   [OK] Generados {len(estudiantes)} archivos individuales")

# Estadísticas finales
puntajes_globales = [e.get('puntaje_global', 0) for e in estudiantes.values()]
print("\n" + "=" * 60)
print("ESTADÍSTICAS FINALES")
print("=" * 60)
print(f"Total estudiantes: {len(estudiantes)}")
print(f"Puntaje máximo: {max(puntajes_globales)}")
print(f"Puntaje mínimo: {min(puntajes_globales)}")
print(f"Promedio: {round(mean(puntajes_globales), 1)}")

# Verificar distribución por nivel
niveles = {}
for e in estudiantes.values():
    n = e.get('nivel_desempeno', 'N/A')
    niveles[n] = niveles.get(n, 0) + 1

print("\nDistribución por nivel:")
for nivel, count in sorted(niveles.items()):
    pct = (count / len(estudiantes)) * 100
    print(f"   {nivel}: {count} ({pct:.1f}%)")

# Verificar Leysa
print("\n" + "-" * 60)
print("VERIFICACIÓN: Leysa Martinez (1104261261)")
print("-" * 60)
leysa = estudiantes.get('1104261261', {})
if leysa:
    print(f"S1: {leysa.get('s1_aciertos')}/{leysa.get('s1_total')}")
    print(f"S2: {leysa.get('s2_aciertos')}/{leysa.get('s2_total')}")
    print(f"Puntaje Global: {leysa.get('puntaje_global')}")
    print(f"Nivel: {leysa.get('nivel_desempeno')}")
    print("\nPuntajes por área:")
    for materia, data in leysa.get('puntajes', {}).items():
        print(f"   {materia}: {data.get('correctas')}/{data.get('total_preguntas')} ({data.get('porcentaje_real')}%) -> {data.get('puntaje')} pts")
else:
    print("   [!] No encontrada")

print("\n[COMPLETADO]")
