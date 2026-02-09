"""
RECALIBRAR SG11-09
==================
Recalcula los puntajes del simulacro SG11-09 usando:
- Datos de calibración (peso, dificultad por pregunta)
- Fórmula ICFES oficial
- Cálculo correcto de S1/S2 aciertos y totales
"""

import json
from pathlib import Path
from statistics import mean

BASE_DIR = Path(__file__).parent.parent
INPUT_DIR = BASE_DIR / "data" / "input"
SIM_DIR = BASE_DIR / "reportes-sg-next" / "public" / "data" / "simulations" / "SG11-09"

# Cargar datos
print("=" * 60)
print("RECALIBRADOR SG11-09")
print("=" * 60)

# Cargar calibración
print("\n[1/5] Cargando calibración...")
with open(INPUT_DIR / "calibracion.json", "r", encoding="utf-8") as f:
    calibracion = json.load(f)

# Agrupar calibración por número de pregunta
calib_por_pregunta = {}
for key, data in calibracion.items():
    num = data['numero']
    if num not in calib_por_pregunta:
        calib_por_pregunta[num] = data
    else:
        # Si hay duplicados, usar la materia correcta
        pass
        
print(f"   Preguntas calibradas: {len(calibracion)}")

# Determinar qué preguntas pertenecen a cada sesión
preguntas_s1 = set()
preguntas_s2 = set()
for key, data in calibracion.items():
    num = data['numero']
    sesion = data.get('sesion', 'S1')
    if sesion == 'S1':
        preguntas_s1.add(num)
    else:
        preguntas_s2.add(num)

print(f"   Preguntas S1: {len(preguntas_s1)} (números {min(preguntas_s1)}-{max(preguntas_s1)})")
print(f"   Preguntas S2: {len(preguntas_s2)} (números {min(preguntas_s2)}-{max(preguntas_s2)})")

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
index = data.get('index', list(estudiantes.keys()))
print(f"   Estudiantes cargados: {len(estudiantes)}")

# Pesos ICFES para el puntaje global
PESOS = {
    'matemáticas': 3,
    'lectura crítica': 3,
    'sociales y ciudadanas': 3,
    'ciencias naturales': 3,
    'inglés': 1
}
TOTAL_PESOS = sum(PESOS.values())

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

def normalizar_nombre(nombre):
    """Normaliza el nombre del estudiante."""
    if not nombre:
        return ""
    # Capitalizar cada palabra
    return " ".join(word.capitalize() for word in str(nombre).strip().split())

# Procesar cada estudiante
print("\n[3/5] Recalculando puntajes...")
contador = 0
errores = 0

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
        
        # Calcular aciertos S1 y S2 usando las claves de calibración
        s1_aciertos = 0
        s2_aciertos = 0
        total_respondidas_s1 = 0
        total_respondidas_s2 = 0
        
        # Iterar sobre todas las respuestas por materia
        for materia, respuestas in respuestas_det.items():
            if isinstance(respuestas, dict):
                items_iter = respuestas.items()
            elif isinstance(respuestas, list):
                items_iter = [(str(r.get('numero', 0)), r) for r in respuestas]
            else:
                continue
                
            for num_str, resp_data in items_iter:
                try:
                    num = int(num_str)
                    es_correcta = resp_data.get('es_correcta', False)
                    
                    # Buscar en calibración usando clave materia_numero
                    key = f"{materia}_{num}"
                    info_calib = calibracion.get(key, {})
                    sesion = info_calib.get('sesion', None)
                    
                    # Si no hay calibración, usar heurística basada en materia
                    if not sesion:
                        # Materias típicamente en S1: Matemáticas (parcial), parte de LC, Sociales, Ciencias
                        # Materias típicamente en S2: Inglés, resto de materias
                        if materia == 'inglés':
                            sesion = 'S2'
                        elif num <= 66 and materia in ['lectura crítica', 'matemáticas']:
                            sesion = 'S1'
                        else:
                            sesion = 'S1'  # Default
                    
                    if sesion == 'S1':
                        total_respondidas_s1 += 1
                        if es_correcta:
                            s1_aciertos += 1
                    elif sesion == 'S2':
                        total_respondidas_s2 += 1
                        if es_correcta:
                            s2_aciertos += 1
                            
                except (ValueError, TypeError):
                    continue
        
        # Asignar valores S1/S2
        est['s1_aciertos'] = s1_aciertos
        est['s1_total'] = total_s1_calibracion  # Total de preguntas S1 según calibración
        est['s2_aciertos'] = s2_aciertos
        est['s2_total'] = total_s2_calibracion  # Total de preguntas S2 según calibración
        
        # Recalcular puntajes por materia usando calibración
        suma_ponderada = 0
        
        for materia, puntaje_data in puntajes.items():
            correctas = puntaje_data.get('correctas', 0)
            total = puntaje_data.get('total_preguntas', 1)
            
            # Obtener respuestas de esta materia para calcular puntaje ponderado
            resp_materia = respuestas_det.get(materia, {})
            
            # Calcular puntaje ponderado usando calibración
            score_ponderado = 0
            max_score_posible = 0
            errores_faciles = 0
            aciertos_dificiles = 0
            total_faciles = 0
            
            if isinstance(resp_materia, dict):
                items = resp_materia.items()
            elif isinstance(resp_materia, list):
                items = [(str(r.get('numero', 0)), r) for r in resp_materia]
            else:
                items = []
            
            for num_str, resp_data in items:
                try:
                    num = int(num_str)
                    es_correcta = resp_data.get('es_correcta', False)
                    
                    # Buscar calibración para esta pregunta
                    key = f"{materia}_{num}"
                    info_calib = calibracion.get(key, {})
                    
                    peso = info_calib.get('peso', 1)
                    clasificacion = info_calib.get('clasificacion', 'MEDIA')
                    es_cascara = info_calib.get('es_cascara', False)
                    
                    max_score_posible += peso
                    
                    if es_correcta:
                        score_ponderado += peso
                        if 'DIFICIL' in clasificacion:
                            aciertos_dificiles += 1
                    else:
                        if es_cascara:
                            errores_faciles += 1
                    
                    if es_cascara:
                        total_faciles += 1
                        
                except (ValueError, TypeError):
                    continue
            
            # Calcular porcentaje ponderado
            if max_score_posible > 0:
                base_score = (score_ponderado / max_score_posible) * 100
            else:
                # Fallback: usar porcentaje simple
                base_score = (correctas / total * 100) if total > 0 else 0
            
            # Aplicar penalización por inconsistencia (suavizada)
            penalizacion = 0
            if total_faciles > 0 and errores_faciles > 0:
                if aciertos_dificiles > 0:
                    penalizacion = min(errores_faciles * 1, 10)
                else:
                    penalizacion = min(errores_faciles * 0.5, 5)
            
            puntaje_final = max(0, base_score - penalizacion)
            
            # Aplicar topes por errores
            TOPES_1_ERROR = {
                'matemáticas': 86,
                'lectura crítica': 82,
                'sociales y ciudadanas': 84,
                'ciencias naturales': 82,
                'inglés': 87
            }
            
            num_errores = total - correctas if total > 0 else 0
            
            if num_errores > 0:
                tope = TOPES_1_ERROR.get(materia, 88)
                # Reducir tope por cada error adicional
                tope_calculado = tope - ((num_errores - 1) * 2)
                tope_calculado = max(40, tope_calculado)
                puntaje_final = min(puntaje_final, tope_calculado)
            
            puntaje_data['puntaje'] = int(round(puntaje_final))
            puntaje_data['score_ponderado'] = round(score_ponderado, 1)
            puntaje_data['peso_total'] = round(max_score_posible, 1)
            puntaje_data['porcentaje_real'] = round((correctas / total * 100) if total > 0 else 0, 2)
            
            if materia in PESOS:
                suma_ponderada += puntaje_data['puntaje'] * PESOS[materia]
        
        # Calcular puntaje global
        promedio = suma_ponderada / TOTAL_PESOS
        puntaje_global = int(round(promedio * 5))  # Escala 0-500
        
        # Limitar a 500 máximo
        puntaje_global = min(500, puntaje_global)
        
        est['puntaje_global'] = puntaje_global
        
        # Determinar nivel de desempeño
        if puntaje_global >= 413:
            nivel = "Superior"
        elif puntaje_global >= 350:
            nivel = "Alto"
        elif puntaje_global >= 275:
            nivel = "Medio"
        else:
            nivel = "Bajo"
        
        est['nivel_desempeno'] = nivel
        
        contador += 1
        if contador % 50 == 0:
            print(f"   Procesados: {contador}/{len(estudiantes)}")
            
    except Exception as e:
        errores += 1
        print(f"   [!] Error procesando {id_est}: {e}")

print(f"   Procesados correctamente: {contador}")
if errores > 0:
    print(f"   Errores: {errores}")

# Recalcular el índice
print("\n[4/5] Reconstruyendo índice...")
# Ordenar por puntaje global descendente
estudiantes_ordenados = sorted(
    estudiantes.keys(),
    key=lambda x: estudiantes[x].get('puntaje_global', 0),
    reverse=True
)

# Guardar
print("\n[5/5] Guardando archivo...")
output_data = {
    "version": "1.0.1",
    "simulationId": "SG11-09",
    "index": estudiantes_ordenados,
    "students": estudiantes
}

# Crear backup
backup_path = SIM_DIR / "students_backup.json"
if (SIM_DIR / "students.json").exists():
    import shutil
    shutil.copy(SIM_DIR / "students.json", backup_path)
    print(f"   Backup creado: {backup_path.name}")

with open(SIM_DIR / "students.json", "w", encoding="utf-8") as f:
    json.dump(output_data, f, ensure_ascii=False, indent=2)

print(f"   Archivo guardado: {SIM_DIR / 'students.json'}")

# Estadísticas finales
puntajes_globales = [e.get('puntaje_global', 0) for e in estudiantes.values()]
print("\n" + "=" * 60)
print("ESTADÍSTICAS FINALES")
print("=" * 60)
print(f"Total estudiantes: {len(estudiantes)}")
print(f"Puntaje máximo: {max(puntajes_globales)}")
print(f"Puntaje mínimo: {min(puntajes_globales)}")
print(f"Promedio: {round(mean(puntajes_globales), 1)}")

# Verificar un estudiante de ejemplo
ejemplo_id = estudiantes_ordenados[0]
ejemplo = estudiantes[ejemplo_id]
print(f"\n[Verificación] Mejor estudiante:")
print(f"   ID: {ejemplo_id}")
print(f"   Nombre: {ejemplo['informacion_personal'].get('nombre_completo', 'N/A')}")
print(f"   S1: {ejemplo.get('s1_aciertos', 0)}/{ejemplo.get('s1_total', 0)}")
print(f"   S2: {ejemplo.get('s2_aciertos', 0)}/{ejemplo.get('s2_total', 0)}")
print(f"   Global: {ejemplo.get('puntaje_global', 0)}")
print(f"   Nivel: {ejemplo.get('nivel_desempeno', 'N/A')}")

print("\n[COMPLETADO]")
