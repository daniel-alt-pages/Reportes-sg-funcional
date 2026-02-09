#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Procesador de Simulacros - Script independiente
Uso: python procesar_simulacro.py "SG11 - 09"

Lee las claves y respuestas de data/input/{simulacro}/
Genera resultados en reportes-sg-next/public/data/simulations/{simulacro}/
"""

import pandas as pd
import json
import os
import sys
import re
from datetime import datetime

# Configurar salida UTF-8 para Windows
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

# Configuración de rutas
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
INPUT_DIR = os.path.join(BASE_DIR, 'data', 'input')
OUTPUT_DIR = os.path.join(BASE_DIR, 'reportes-sg-next', 'public', 'data', 'simulations')

def calcular_puntaje_icfes(porcentaje):
    """Calcula puntaje ICFES basado en porcentaje de aciertos (Fórmula SG11-08)"""
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

def normalizar_id(simulacro_id):
    """Normaliza el ID del simulacro para usarlo como nombre de carpeta"""
    return simulacro_id.replace(' ', '').replace('-', '-')

def normalizar_nombre_columna(col):
    """Normaliza el nombre de columna para hacer coincidir claves y respuestas"""
    # Remover prefijo Q o q al inicio
    col_norm = col.strip()
    if col_norm.startswith('Q') and not col_norm.startswith('Qu'):
        col_norm = col_norm[1:]
    if col_norm.startswith('q') and not col_norm.startswith('qu'):
        col_norm = col_norm[1:]
    
    # Normalizar Inglés: "Ingles Parte 1.A [80.]" -> "Ingles Parte 1 [80.]"
    # Remover sufijo .A, .B, etc. antes del número de pregunta
    col_norm = re.sub(r'(\d+)\.[A-Za-z]?\s*\[', r'\1 [', col_norm)
    
    # Normalizar número de pregunta: [71.] -> [71] (quitar punto dentro de corchetes)
    col_norm = re.sub(r'\[(\d+)\.\]', r'[\1]', col_norm)
    
    # Normalizar espacios
    col_norm = re.sub(r'\s+', ' ', col_norm).strip()
    
    return col_norm

def cargar_claves(ruta_claves):
    """Carga las claves de los archivos CSV"""
    claves = {}
    archivos = [f for f in os.listdir(ruta_claves) if f.endswith('.csv')]
    
    print(f"📋 Cargando claves de {len(archivos)} archivos...")
    
    for archivo in archivos:
        ruta = os.path.join(ruta_claves, archivo)
        df = pd.read_csv(ruta)
        columnas = df.columns.tolist()
        respuestas = df.iloc[0].tolist()
        
        for col, resp in zip(columnas, respuestas):
            match = re.search(r'\[(\d+)\.?\]', col)
            if match:
                # Guardar con el nombre original Y con nombre normalizado
                clave_valor = str(resp).strip().upper() if pd.notna(resp) else ''
                claves[col] = clave_valor
                claves[normalizar_nombre_columna(col)] = clave_valor
    
    print(f"   ✓ {len(claves)} claves cargadas")
    return claves

def cargar_calibracion(ruta_calibracion=None):
    """Carga los datos de calibración con pesos y dificultades"""
    if ruta_calibracion is None:
        ruta_calibracion = os.path.join(BASE_DIR, 'data', 'input', 'calibracion.json')
    
    if not os.path.exists(ruta_calibracion):
        print("   ⚠️ No se encontró archivo de calibración, usando pesos por defecto")
        return None
    
    with open(ruta_calibracion, 'r', encoding='utf-8') as f:
        calibracion = json.load(f)
    
    # Convertir a formato más accesible: {materia: {numero: info}}
    calibracion_por_pregunta = {}
    for key, info in calibracion.items():
        materia = info['materia'].lower()
        numero = str(info['numero'])
        if materia not in calibracion_por_pregunta:
            calibracion_por_pregunta[materia] = {}
        calibracion_por_pregunta[materia][numero] = {
            'peso': info.get('peso', 1),
            'dificultad': info.get('indice_dificultad', 0.5),
            'clasificacion': info.get('clasificacion', 'MEDIA'),
            'es_cascara': info.get('es_cascara', True)
        }
    
    print(f"   ✓ Calibración cargada: {len(calibracion)} preguntas configuradas")
    return calibracion_por_pregunta

def encontrar_columna(df, patrones):
    """Busca una columna que coincida con alguno de los patrones"""
    for col in df.columns:
        col_lower = col.lower()
        for patron in patrones:
            if patron.lower() in col_lower:
                return col
    return None

def procesar_respuestas(ruta_respuestas, claves):
    """Procesa las respuestas de los estudiantes"""
    archivos = [f for f in os.listdir(ruta_respuestas) if f.endswith('.csv')]
    estudiantes = {}
    
    print(f"📊 Procesando respuestas de {len(archivos)} archivos...")
    
    for archivo in archivos:
        sesion = 'S1' if 'SESION 1' in archivo.upper() or 'S-1' in archivo.upper() else 'S2'
        ruta = os.path.join(ruta_respuestas, archivo)
        df = pd.read_csv(ruta)
        
        print(f"   Archivo: {archivo}")
        print(f"   Registros: {len(df)}")
        
        # Buscar columnas de información personal
        col_id = encontrar_columna(df, ['número de identificación', 'numero de identificacion', 'identificación (NO', 'identificacion (NO'])
        col_nombres = encontrar_columna(df, ['nombre(s) completo', 'nombre(es) completo', 'nombres completos'])
        col_apellidos = encontrar_columna(df, ['apellidos completo', 'apellidos'])
        col_telefono = encontrar_columna(df, ['telefónico', 'telefonico', 'whatsapp', 'celular'])
        col_depto = encontrar_columna(df, ['departamento'])
        col_institucion = encontrar_columna(df, ['institución', 'institucion', 'colegio'])
        col_fecha = encontrar_columna(df, ['marca temporal', 'timestamp'])
        
        print(f"   Columna ID: {col_id}")
        print(f"   Columna Nombres: {col_nombres}")
        
        if not col_id:
            print(f"   ⚠️ No se encontró columna de identificación en {archivo}")
            print(f"   Columnas disponibles: {list(df.columns[:10])}")
            continue
        
        procesados = 0
        for idx, fila in df.iterrows():
            # Obtener ID
            id_val = fila.get(col_id)
            if pd.isna(id_val):
                continue
            
            id_estudiante = str(id_val).replace('.', '').replace(',', '').replace(' ', '').strip()
            if not id_estudiante or id_estudiante == 'nan':
                continue
            
            # Inicializar estudiante si no existe
            if id_estudiante not in estudiantes:
                estudiantes[id_estudiante] = {
                    'informacion_personal': {
                        'numero_identificacion': id_estudiante,
                        'nombres': str(fila.get(col_nombres, '')).strip() if col_nombres and pd.notna(fila.get(col_nombres)) else '',
                        'apellidos': str(fila.get(col_apellidos, '')).strip() if col_apellidos and pd.notna(fila.get(col_apellidos)) else '',
                        'telefono': str(fila.get(col_telefono, '')).strip() if col_telefono and pd.notna(fila.get(col_telefono)) else '',
                        'departamento': str(fila.get(col_depto, '')).strip() if col_depto and pd.notna(fila.get(col_depto)) else '',
                        'institucion': str(fila.get(col_institucion, '')).strip() if col_institucion and pd.notna(fila.get(col_institucion)) else ''
                    },
                    'fecha': str(fila.get(col_fecha, '')).strip() if col_fecha and pd.notna(fila.get(col_fecha)) else '',
                    'puntajes': {},
                    'respuestas_detalladas': {},
                    'secciones_completadas': []
                }
            
            est = estudiantes[id_estudiante]
            if sesion not in est['secciones_completadas']:
                est['secciones_completadas'].append(sesion)
            
            # Procesar respuestas
            for columna in df.columns:
                if '[' not in columna or ']' not in columna:
                    continue
                
                respuesta_estudiante = str(fila.get(columna, '')).strip().upper() if pd.notna(fila.get(columna)) else ''
                
                # Buscar clave usando nombre original y normalizado
                col_normalizada = normalizar_nombre_columna(columna)
                clave_correcta = claves.get(columna, '') or claves.get(col_normalizada, '')
                
                # Determinar materia
                col_lower = columna.lower()
                if 'matem' in col_lower:
                    materia = 'matemáticas'
                elif 'lectura' in col_lower:
                    materia = 'lectura crítica'
                elif 'social' in col_lower or 'ciudadan' in col_lower:
                    materia = 'sociales y ciudadanas'
                elif 'natural' in col_lower or 'ciencias n' in col_lower:
                    materia = 'ciencias naturales'
                elif 'ingl' in col_lower:
                    materia = 'inglés'
                else:
                    continue
                
                # Inicializar materia
                if materia not in est['puntajes']:
                    est['puntajes'][materia] = {
                        'correctas': 0,
                        'total_preguntas': 0,
                        'porcentaje_real': 0,
                        'puntaje': 0
                    }
                if materia not in est['respuestas_detalladas']:
                    est['respuestas_detalladas'][materia] = {}
                
                # Extraer número de pregunta (acepta [71.] o [71])
                match = re.search(r'\[(\d+)\.?\]', columna)
                if match:
                    num_pregunta = match.group(1)
                    
                    # Verificar si es correcta
                    es_correcta = False
                    if clave_correcta:
                        if '-' in clave_correcta:
                            respuestas_validas = [r.strip() for r in clave_correcta.split('-')]
                            es_correcta = respuesta_estudiante in respuestas_validas
                        else:
                            es_correcta = respuesta_estudiante == clave_correcta
                    
                    est['puntajes'][materia]['total_preguntas'] += 1
                    if es_correcta:
                        est['puntajes'][materia]['correctas'] += 1
                    
                    est['respuestas_detalladas'][materia][num_pregunta] = {
                        'respuesta': respuesta_estudiante,
                        'correcta': clave_correcta,
                        'es_correcta': es_correcta
                    }
            
            procesados += 1
        
        print(f"   ✓ {procesados} estudiantes procesados")
    
    return estudiantes

def calcular_puntajes_finales(estudiantes, calibracion=None):
    """Calcula los puntajes finales de cada estudiante usando la fórmula SG11-08 con topes deslizantes"""
    
    PESOS = {
        'matemáticas': 3,
        'lectura crítica': 3,
        'sociales y ciudadanas': 3,
        'ciencias naturales': 3,
        'inglés': 1
    }
    TOTAL_PESOS = sum(PESOS.values())  # 13
    
    # Topes máximos por materia cuando hay exactamente 1 error
    TOPES_1_ERROR = {
        'matemáticas': 86,
        'lectura crítica': 82,
        'sociales y ciudadanas': 84,
        'ciencias naturales': 82,
        'inglés': 87
    }
    
    # Penalidad adicional por cada error después del primero
    PENALIDAD_POR_ERROR = {
        'matemáticas': 2,
        'lectura crítica': 2,
        'sociales y ciudadanas': 2,
        'ciencias naturales': 2,
        'inglés': 2
    }
    
    for id_est, est in estudiantes.items():
        suma_ponderada = 0
        
        for materia, datos in est['puntajes'].items():
            if datos['total_preguntas'] == 0:
                datos['puntaje'] = 0
                continue
            
            # Obtener respuestas detalladas para esta materia
            respuestas = est.get('respuestas_detalladas', {}).get(materia, {})
            
            # Calcular puntaje base
            if calibracion and materia.lower() in calibracion:
                cal_materia = calibracion[materia.lower()]
                score_ponderado = 0
                peso_total_materia = 0
                fallo_faciles = 0
                acierto_dificiles = 0
                total_faciles = 0
                
                for num_pregunta, resp_data in respuestas.items():
                    peso_pregunta = 1.0
                    clasificacion = 'MEDIA'
                    es_cascara = False
                    
                    if num_pregunta in cal_materia:
                        peso_pregunta = cal_materia[num_pregunta].get('peso', 1)
                        clasificacion = cal_materia[num_pregunta].get('clasificacion', 'MEDIA')
                        es_cascara = cal_materia[num_pregunta].get('es_cascara', False)
                    
                    peso_total_materia += peso_pregunta
                    
                    es_correcta = resp_data.get('es_correcta', False)
                    if es_correcta:
                        score_ponderado += peso_pregunta
                        if 'DIFICIL' in clasificacion:
                            acierto_dificiles += 1
                    else:
                        if es_cascara:
                            fallo_faciles += 1
                    
                    if es_cascara:
                        total_faciles += 1
                
                # Calcular porcentaje ponderado
                if peso_total_materia > 0:
                    base_score = (score_ponderado / peso_total_materia) * 100
                else:
                    base_score = (datos['correctas'] / datos['total_preguntas']) * 100
                
                # Penalización por inconsistencia (fallar fáciles + acertar difíciles)
                penalizacion = 0
                if total_faciles > 0 and fallo_faciles > 0:
                    if acierto_dificiles > 0:
                        penalizacion = fallo_faciles * 1
                        penalizacion = min(penalizacion, 10)
                    else:
                        penalizacion = fallo_faciles * 0.5
                        penalizacion = min(penalizacion, 5)
                
                puntaje_base = max(0, calcular_puntaje_icfes(base_score) - penalizacion)
                
                datos['score_ponderado'] = round(score_ponderado, 2)
                datos['peso_total'] = round(peso_total_materia, 2)
                datos['porcentaje_real'] = round(base_score, 2)
                
            else:
                # Sin calibración: cálculo simple
                porcentaje = (datos['correctas'] / datos['total_preguntas']) * 100
                puntaje_base = calcular_puntaje_icfes(porcentaje)
                datos['porcentaje_real'] = round(porcentaje, 2)
            
            # APLICAR TOPES DESLIZANTES (clave para que 1 error no sea 100)
            num_errores = datos['total_preguntas'] - datos['correctas']
            
            if num_errores == 0:
                # Sin errores: puntaje máximo posible
                puntaje_final = puntaje_base
            else:
                # Con errores: aplicar topes
                tope_1_error = TOPES_1_ERROR.get(materia, 86)
                penal_error = PENALIDAD_POR_ERROR.get(materia, 2)
                
                # Calcular costo de errores según dificultad
                costo_errores = 0
                if calibracion and materia.lower() in calibracion:
                    cal_materia = calibracion[materia.lower()]
                    for num_pregunta, resp_data in respuestas.items():
                        if not resp_data.get('es_correcta', True):
                            clasificacion = 'MEDIA'
                            if num_pregunta in cal_materia:
                                clasificacion = cal_materia[num_pregunta].get('clasificacion', 'MEDIA')
                            
                            if 'MUY_FACIL' in clasificacion:
                                costo_errores += 1.3
                            elif 'FACIL' in clasificacion:
                                costo_errores += 1.1
                            elif 'MEDIA' in clasificacion:
                                costo_errores += 1.0
                            elif 'DIFICIL' in clasificacion:
                                costo_errores += 0.7
                            else:
                                costo_errores += 0.5
                else:
                    costo_errores = num_errores
                
                # Tope deslizante
                tope_calculado = tope_1_error - ((costo_errores - 1) * penal_error)
                tope_calculado = min(tope_calculado, tope_1_error)  # Nunca superar tope
                tope_calculado = max(40, tope_calculado)  # Mínimo 40
                
                puntaje_final = min(puntaje_base, tope_calculado)
            
            datos['puntaje'] = int(round(puntaje_final))
            
            # Sumar a puntaje global
            if materia in PESOS:
                suma_ponderada += datos['puntaje'] * PESOS[materia]
        
        # Calcular puntaje global
        est['puntaje_global'] = int(round((suma_ponderada / TOTAL_PESOS) * 5))
        
        # Determinar nivel de desempeño
        pg = est['puntaje_global']
        if pg >= 400:
            est['nivel_desempeno'] = 'Superior'
        elif pg >= 350:
            est['nivel_desempeno'] = 'Alto'
        elif pg >= 300:
            est['nivel_desempeno'] = 'Medio'
        else:
            est['nivel_desempeno'] = 'Bajo'
        
        est['score_real'] = sum(d['correctas'] for d in est['puntajes'].values())
        est['score_reportado'] = est['score_real']
        est['usa_calibracion'] = calibracion is not None
    
    return estudiantes

def guardar_resultados(simulacro_id, estudiantes):
    """Guarda los resultados en la carpeta de salida"""
    id_normalizado = normalizar_id(simulacro_id)
    carpeta_salida = os.path.join(OUTPUT_DIR, id_normalizado)
    os.makedirs(carpeta_salida, exist_ok=True)
    
    # Guardar resultados finales
    resultado_final = {
        'simulacro': simulacro_id,
        'fecha_procesamiento': datetime.now().isoformat(),
        'total_estudiantes': len(estudiantes),
        'estudiantes': list(estudiantes.values())
    }
    
    ruta_resultados = os.path.join(carpeta_salida, 'resultados_finales.json')
    with open(ruta_resultados, 'w', encoding='utf-8') as f:
        json.dump(resultado_final, f, ensure_ascii=False, indent=2)
    
    print(f"💾 Resultados guardados en: {ruta_resultados}")
    
    # Guardar students.json (copia para compatibilidad con ranking/dashboard)
    ruta_students = os.path.join(carpeta_salida, 'students.json')
    with open(ruta_students, 'w', encoding='utf-8') as f:
        json.dump(resultado_final, f, ensure_ascii=False, indent=2)
    print(f"   ✓ students.json generado (unificado con resultados_finales)")
    
    # Guardar archivo de estudiantes individuales
    carpeta_estudiantes = os.path.join(carpeta_salida, 'estudiantes')
    os.makedirs(carpeta_estudiantes, exist_ok=True)
    
    for id_est, datos in estudiantes.items():
        ruta_estudiante = os.path.join(carpeta_estudiantes, f'{id_est}.json')
        with open(ruta_estudiante, 'w', encoding='utf-8') as f:
            json.dump(datos, f, ensure_ascii=False, indent=2)
    
    print(f"   ✓ {len(estudiantes)} archivos de estudiantes creados")
    
    # Actualizar current_simulation.json si existe
    ruta_current = os.path.join(BASE_DIR, 'reportes-sg-next', 'public', 'data', 'current_simulation.json')
    if os.path.exists(ruta_current):
        with open(ruta_current, 'r', encoding='utf-8') as f:
            current = json.load(f)
        
        if id_normalizado not in current.get('available', []):
            current['available'].append(id_normalizado)
            with open(ruta_current, 'w', encoding='utf-8') as f:
                json.dump(current, f, ensure_ascii=False, indent=2)
            print(f"   ✓ Simulacro agregado a current_simulation.json")
    
    # Crear manifest.json
    manifest = {
        'id': id_normalizado,
        'name': simulacro_id,
        'date': datetime.now().strftime('%Y-%m-%d'),
        'totalStudents': len(estudiantes)
    }
    
    with open(os.path.join(carpeta_salida, 'manifest.json'), 'w', encoding='utf-8') as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)
    
    # === GENERAR estadisticas_grupo.json ===
    print("📊 Generando estadísticas de grupo...")
    from collections import defaultdict
    
    estadisticas = {
        'metadata': {
            'simulacro': simulacro_id,
            'total_evaluados': len(estudiantes),
            'fecha_generacion': datetime.now().isoformat()
        },
        'materias': {}
    }
    
    # Agrupar respuestas por materia y pregunta
    materias_data = defaultdict(lambda: defaultdict(lambda: {
        'total': 0,
        'correctas': 0,
        'respuestas': defaultdict(int),
        'clave': None
    }))
    
    for est in estudiantes.values():
        respuestas_det = est.get('respuestas_detalladas', {})
        
        for materia, preguntas in respuestas_det.items():
            for num_pregunta, info in preguntas.items():
                key = f"pregunta_{num_pregunta}"
                preg_data = materias_data[materia][key]
                
                respuesta = info.get('respuesta', '')
                correcta = info.get('correcta', '')
                es_correcta = info.get('es_correcta', False)
                
                preg_data['total'] += 1
                if es_correcta:
                    preg_data['correctas'] += 1
                
                if respuesta:
                    preg_data['respuestas'][respuesta] += 1
                
                if correcta and not preg_data['clave']:
                    preg_data['clave'] = correcta
    
    # Convertir a formato final con porcentajes
    for materia, preguntas in materias_data.items():
        estadisticas['materias'][materia] = {}
        
        for key, data in preguntas.items():
            total = data['total']
            # Calcular distribución como porcentajes
            distribucion_pct = {}
            for opcion, count in data['respuestas'].items():
                distribucion_pct[opcion] = round((count / total * 100) if total > 0 else 0, 0)
            
            estadisticas['materias'][materia][key] = {
                'numero': int(key.replace('pregunta_', '')),
                'respuesta_correcta': data['clave'],
                'total_respuestas': total,
                'aciertos': data['correctas'],
                'porcentaje_acierto': round((data['correctas'] / total * 100) if total > 0 else 0, 1),
                'distribucion': distribucion_pct
            }
    
    # Guardar estadisticas_grupo.json en carpeta del simulacro
    ruta_stats = os.path.join(carpeta_salida, 'estadisticas_grupo.json')
    with open(ruta_stats, 'w', encoding='utf-8') as f:
        json.dump(estadisticas, f, ensure_ascii=False, indent=2)
    print(f"   ✓ estadisticas_grupo.json generado")
    
    # También copiar al public/data para fallback global
    ruta_stats_global = os.path.join(BASE_DIR, 'reportes-sg-next', 'public', 'data', 'estadisticas_grupo.json')
    with open(ruta_stats_global, 'w', encoding='utf-8') as f:
        json.dump(estadisticas, f, ensure_ascii=False, indent=2)
    
    # Copiar estudiantes a la carpeta pública general
    ruta_estudiantes_public = os.path.join(BASE_DIR, 'reportes-sg-next', 'public', 'data', 'estudiantes')
    os.makedirs(ruta_estudiantes_public, exist_ok=True)
    for id_est, datos in estudiantes.items():
        ruta_est = os.path.join(ruta_estudiantes_public, f'{id_est}.json')
        with open(ruta_est, 'w', encoding='utf-8') as f:
            json.dump(datos, f, ensure_ascii=False, indent=2)
    print(f"   ✓ Estudiantes copiados a public/data/estudiantes/")
    
    # Copiar resultados_finales.json a public/data
    ruta_resultados_global = os.path.join(BASE_DIR, 'reportes-sg-next', 'public', 'data', 'resultados_finales.json')
    with open(ruta_resultados_global, 'w', encoding='utf-8') as f:
        json.dump(resultado_final, f, ensure_ascii=False, indent=2)
    print(f"   ✓ resultados_finales.json copiado a public/data/")
    
    return carpeta_salida

def listar_simulacros():
    """Lista los simulacros disponibles"""
    print("\n📁 Simulacros disponibles en data/input/:")
    print("-" * 50)
    
    if not os.path.exists(INPUT_DIR):
        print("   ⚠️ No existe la carpeta data/input/")
        return
    
    for nombre in sorted(os.listdir(INPUT_DIR)):
        ruta = os.path.join(INPUT_DIR, nombre)
        if os.path.isdir(ruta) and nombre.startswith('SG'):
            tiene_claves = os.path.exists(os.path.join(ruta, 'claves'))
            tiene_respuestas = os.path.exists(os.path.join(ruta, 'respuestas'))
            
            estado = '✓' if tiene_claves and tiene_respuestas else '❌'
            print(f"   {estado} {nombre}")
            
            if tiene_claves:
                n_claves = len([f for f in os.listdir(os.path.join(ruta, 'claves')) if f.endswith('.csv')])
                print(f"      📋 Claves: {n_claves} archivos")
            
            if tiene_respuestas:
                n_resp = len([f for f in os.listdir(os.path.join(ruta, 'respuestas')) if f.endswith('.csv')])
                print(f"      📊 Respuestas: {n_resp} archivos")
    
    print()

def main():
    print("=" * 60)
    print("🎓 PROCESADOR DE SIMULACROS")
    print("=" * 60)
    
    if len(sys.argv) < 2:
        listar_simulacros()
        print("Uso: python procesar_simulacro.py \"SG11 - 09\"")
        print("     python procesar_simulacro.py --list")
        sys.exit(1)
    
    if sys.argv[1] == '--list':
        listar_simulacros()
        sys.exit(0)
    
    simulacro_id = sys.argv[1]
    ruta_simulacro = os.path.join(INPUT_DIR, simulacro_id)
    
    if not os.path.exists(ruta_simulacro):
        print(f"❌ No se encontró el simulacro: {simulacro_id}")
        listar_simulacros()
        sys.exit(1)
    
    ruta_claves = os.path.join(ruta_simulacro, 'claves')
    ruta_respuestas = os.path.join(ruta_simulacro, 'respuestas')
    
    if not os.path.exists(ruta_claves):
        print(f"❌ No se encontró la carpeta de claves: {ruta_claves}")
        sys.exit(1)
    
    if not os.path.exists(ruta_respuestas):
        print(f"❌ No se encontró la carpeta de respuestas: {ruta_respuestas}")
        sys.exit(1)
    
    print(f"\n🔄 Procesando: {simulacro_id}")
    print("-" * 50)
    
    # Cargar claves
    claves = cargar_claves(ruta_claves)
    
    # Cargar calibración (si existe)
    calibracion = cargar_calibracion()
    
    # Procesar respuestas
    estudiantes = procesar_respuestas(ruta_respuestas, claves)
    
    if not estudiantes:
        print("❌ No se encontraron estudiantes para procesar")
        sys.exit(1)
    
    # Calcular puntajes (con calibración si está disponible)
    print(f"\n📈 Calculando puntajes para {len(estudiantes)} estudiantes...")
    if calibracion:
        print("   ⚖️ Aplicando pesos por dificultad de pregunta")
    estudiantes = calcular_puntajes_finales(estudiantes, calibracion)
    
    # Guardar resultados
    print(f"\n💾 Guardando resultados...")
    carpeta_salida = guardar_resultados(simulacro_id, estudiantes)
    
    print("\n" + "=" * 60)
    print(f"✅ PROCESAMIENTO COMPLETADO")
    print(f"   Simulacro: {simulacro_id}")
    print(f"   Estudiantes: {len(estudiantes)}")
    print(f"   Calibración: {'✓ Aplicada' if calibracion else '✗ No disponible'}")
    print(f"   Salida: {carpeta_salida}")
    print("=" * 60)

if __name__ == '__main__':
    main()
