from flask import Flask, render_template, request, jsonify, send_file, send_from_directory
import pandas as pd
import json
from datetime import datetime
import os
from werkzeug.utils import secure_filename
import threading
import time
import sys
import webbrowser
app = Flask(__name__)

# Rutas organizadas (Nueva estructura reorganizada)
app.config['INPUT_FOLDER'] = 'data/input'  # Carpeta con los simulacros
app.config['DATOS_FOLDER'] = '_procesamiento/temp'
app.config['RESULTADOS_FOLDER'] = '_procesamiento/temp'
app.config['CARGAR_FOLDER'] = '_procesamiento'
app.config['SALIDA_FOLDER'] = '_salida'
app.config['ASSETS_FOLDER'] = 'assets'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max-limit

# Variable global para rastrear el simulacro activo
simulacro_actual = None

# Asegurarse de que los directorios existen
os.makedirs(app.config['DATOS_FOLDER'], exist_ok=True)
os.makedirs(app.config['RESULTADOS_FOLDER'], exist_ok=True)
os.makedirs(app.config['CARGAR_FOLDER'], exist_ok=True)
os.makedirs(app.config['SALIDA_FOLDER'], exist_ok=True)

# Ruta para servir archivos de assets (iconos, QR, watermarks)
@app.route('/assets/<path:filename>')
def serve_assets(filename):
    return send_from_directory(app.config['ASSETS_FOLDER'], filename)

def convertir_timestamp(timestamp):
    """Convierte el timestamp a fecha legible."""
    try:
        # Si es una cadena vacía o None, retornar fecha no válida
        if not timestamp:
            return "Fecha no válida"
            
        # Convertir a string si no lo es
        timestamp = str(timestamp)
        
        # Si es un timestamp numérico
        if timestamp.isdigit():
            if len(timestamp) == 13:  # Milisegundos
                timestamp = int(timestamp) / 1000
            else:
                timestamp = int(timestamp)
            return datetime.fromtimestamp(timestamp).strftime('%Y-%m-%d')
            
        # Intentar parsear como fecha de pandas
        try:
            fecha = pd.to_datetime(timestamp)
            return fecha.strftime('%Y-%m-%d')
        except:
            pass
            
        return "Fecha no válida"
    except Exception as e:
        print(f"Error procesando timestamp {timestamp}: {e}")
        return "Fecha no válida"

def es_departamento_valido(departamento):
    """Valida si el departamento está en la lista de departamentos válidos."""
    departamentos_validos = {
        "Amazonas", "Antioquia", "Arauca", "Atlantico", "Bolivar", "Boyaca",
        "Caldas", "Caqueta", "Casanare", "Cauca", "Cesar", "Choco", "Cordoba",
        "Cundinamarca", "Guainia", "Guaviare", "Huila", "La Guajira", "Magdalena",
        "Meta", "Narino", "Norte de Santander", "Putumayo", "Quindio", "Risaralda",
        "San Andres y Providencia", "Santander", "Sucre", "Tolima", "Valle del Cauca",
        "Vaupes", "Vichada", "Bogota"
    }
    
    # Normalizar el departamento para la comparación
    departamento_normalizado = departamento.strip().lower()
    departamento_normalizado = departamento_normalizado.replace('á', 'a').replace('é', 'e').replace('í', 'i').replace('ó', 'o').replace('ú', 'u')
    departamento_normalizado = departamento_normalizado.replace('ñ', 'n')
    
    # Normalizar los departamentos válidos para la comparación
    departamentos_normalizados = {d.lower().replace('á', 'a').replace('é', 'e').replace('í', 'i').replace('ó', 'o').replace('ú', 'u').replace('ñ', 'n') for d in departamentos_validos}
    
    return departamento_normalizado in departamentos_normalizados

def limpiar_numero_identificacion(numero):
    """Limpia el número de identificación eliminando caracteres no numéricos."""
    try:
        # Convertir a string si no lo es
        numero = str(numero)
        # Eliminar todos los caracteres no numéricos (puntos, espacios, etc.)
        return ''.join(filter(str.isdigit, numero))
    except Exception as e:
        print(f"Error limpiando número de identificación {numero}: {e}")
        return numero

def extraer_respuesta_correcta(nombre_columna):
    """
    Extrae la respuesta correcta del nombre de la columna del Excel.
    Ejemplo: "Pregunta 1 [Respuesta correcta: C]" -> "C"
    """
    import re
    match = re.search(r'\[Respuesta correcta:\s*([A-H])\]', nombre_columna, re.IGNORECASE)
    return match.group(1).upper() if match else None

def calcular_puntaje_materia_icfes(porcentaje):
    """
    Calcula el puntaje de una materia basado en una curva "Humanizada"
    que suaviza el castigo en rangos medios y bajos, pero mantiene la exigencia en la cima.
    """
    if porcentaje >= 100:
        return 100.0
    elif porcentaje >= 96:
        # Zona de Excelencia (Salto al vacío: Max 86)
        # 96% -> 80
        # 99.9% -> 86
        return 80 + ((porcentaje - 96) / 3.99) * 6
    elif porcentaje >= 75:
        # Zona Alta (65 - 85 puntos)
        # 75% -> 65
        # 95% -> 85
        return 65 + ((porcentaje - 75) / 20) * 20
    elif porcentaje >= 50:
        # Zona Media (45 - 64 puntos) - GRAN MEJORA AQUÍ
        # 50% -> 45
        # 74% -> 64
        return 45 + ((porcentaje - 50) / 24) * 19
    elif porcentaje >= 25:
        # Zona Baja (30 - 44 puntos) - Red de seguridad
        # 25% -> 30
        # 49% -> 44
        return 30 + ((porcentaje - 25) / 24) * 14
    else:
        # Zona Insuficiente (0 - 29 puntos)
        return (porcentaje / 25) * 29

def procesar_datos(df, prefijo):
    """Procesa los datos del DataFrame y calcula estadísticas."""
    resultados = []
    resumen = []
    respuestas_base = {}
    
    # Procesar el primer usuario como base
    primera_fila = df.iloc[0]
    for columna in primera_fila.index:
        if "S1 [" in columna or "S2 [" in columna or "Ingles Parte" in columna:
            if "S1 [" in columna:
                materia = columna.split(" S1 [")[0].lower()
            elif "S2 [" in columna:
                materia = columna.split(" S2 [")[0].lower()
            elif "Ingles Parte" in columna:
                materia = "inglés"
            
            if materia not in respuestas_base:
                respuestas_base[materia] = {}
            
            if "S1 [" in columna:
                numero_pregunta = columna.split("S1 [")[1].split(".")[0]
            elif "S2 [" in columna:
                numero_pregunta = columna.split("S2 [")[1].split(".")[0]
            elif "Ingles Parte" in columna:
                # Formato: "Ingles Parte X [Y.Z]" donde X es la parte, Y es el número de pregunta
                # El número de pregunta está DESPUÉS del corchete [
                import re
                match = re.search(r'\[(\d+)', columna)
                if match:
                    numero_pregunta = match.group(1)
                else:
                    # Fallback: tomar el último número
                    numeros = re.findall(r'\d+', columna)
                    numero_pregunta = numeros[-1] if numeros else '0'
            
            respuestas_base[materia][numero_pregunta] = primera_fila[columna]
    
    # Guardar archivo base en la carpeta Datos
    with open(os.path.join(app.config['DATOS_FOLDER'], f"{prefijo}_respuestas_base.json"), 'w', encoding='utf-8') as archivo:
        json.dump(respuestas_base, archivo, ensure_ascii=False, indent=2)
    
    # Procesar todos los usuarios
    for idx, fila in df.iterrows():
        # Procesar la fecha usando pandas - buscar tanto Timestamp como Marca temporal
        timestamp = None
        for campo_fecha in ["Timestamp", "Marca temporal","timestamp", "marca temporal","marca de tiempo","Marca de tiempo","timestamp","Timestamp","Marca temporal"]:
            if campo_fecha in df.columns:
                timestamp = fila.get(campo_fecha)
                break
        if pd.notna(timestamp):
            if isinstance(timestamp, pd.Timestamp):
                fecha = timestamp.strftime('%Y-%m-%d %H:%M:%S')
            else:
                fecha = convertir_timestamp(timestamp)
        else:
            fecha = "Fecha no válida"
            
        score_reportado = int(fila.get("Score", 0))
        
        # Buscar las columnas de información personal en el DataFrame
        columnas_info = {
            "nombres": ["Nombre(s) completo(s)", "Nombre(es) completo(os)", "Nombres", "Nombre", "Nombre(es) Completo(os)"],
            "apellidos": ["Apellidos completos", "Apellidos", "Apellido", "APELLIDOS COMPLETOS"],
            "tipo_identificacion": ["¿Qué tipo de identificación?", "Tipo de identificación", "Tipo de documento"],
            "numero_identificacion": ["Número de identificación (Intente NO equivocarse)", "Número de identificación", "Documento", "Número de identificación (Intenté NO equivocarse)"],
            "telefono": ["Número telefónico/WhatsApp", "Teléfono", "WhatsApp", "Celular", "Número telefónico/WhatsApp"],
            "municipio": ["Departamento de residencia", "Departamento", "Departamento De Residencia"],
            "tipo_examen": ["¿Qué examen que aplicarás?", "Tipo de examen", "Examen"]
        }
        
        info_personal = {}
        for campo, posibles_columnas in columnas_info.items():
            valor = ""
            for col in posibles_columnas:
                if col in df.columns:
                    valor = str(fila.get(col, "")).strip()
                    if valor:  # Si encontramos un valor no vacío, lo usamos
                        break
            
            # Limpiar número de identificación
            if campo == "numero_identificacion" and valor:
                valor = limpiar_numero_identificacion(valor)
            
            # Validar departamento
            if campo == "municipio" and valor:
                if not es_departamento_valido(valor):
                    valor = "No aplica"
            
            info_personal[campo] = valor
        
        materias = {}
        for columna in fila.index:
            if "S1 [" in columna or "S2 [" in columna or "Ingles Parte" in columna:
                if "S1 [" in columna:
                    materia = columna.split(" S1 [")[0].lower()
                elif "S2 [" in columna:
                    materia = columna.split(" S2 [")[0].lower()
                elif "Ingles Parte" in columna:
                    materia = "inglés"
                    
                if materia not in materias:
                    materias[materia] = {"preguntas": []}
                materias[materia]["preguntas"].append(columna)
        
        resumen_usuario = {
            "informacion_personal": info_personal,
            "fecha": fecha,
            "puntajes": {},
            "score_reportado": score_reportado,
            "score_real": 0,
            "puntaje_global": 0,
            "tipo": info_personal.get("tipo_examen", "")
        }
        
        resultado = {
            "informacion_personal": info_personal.copy(),
            "fecha": fecha,
            "puntajes": {},
            "detalle_respuestas": {},
            "score_reportado": score_reportado,
            "score_real": 0,
            "tipo": info_personal.get("tipo_examen", ""),
            "puntaje_global": 0
        }
        
        total_correctas = 0
        respuestas_detalladas = {}  # Para guardar respuestas detalladas por materia
        
        for materia, info in materias.items():
            total_preguntas = len(info["preguntas"])
            correctas = 0
            detalle_respuestas = []
            respuestas_materia = []  # Para estadísticas
            
            for pregunta in info["preguntas"]:
                if "S1 [" in pregunta:
                    numero_pregunta = pregunta.split("S1 [")[1].split(".")[0]
                elif "S2 [" in pregunta:
                    numero_pregunta = pregunta.split("S2 [")[1].split(".")[0]
                elif "Ingles Parte" in pregunta:
                    # Formato: "Ingles Parte X [Y.Z]" donde X es la parte, Y es el número de pregunta
                    # El número de pregunta está DESPUÉS del corchete [
                    import re
                    match = re.search(r'\[(\d+)', pregunta)
                    if match:
                        numero_pregunta = match.group(1)
                    else:
                        # Fallback: tomar el último número
                        numeros = re.findall(r'\d+', pregunta)
                        numero_pregunta = numeros[-1] if numeros else '0'
                    
                respuesta_usuario = str(fila.get(pregunta, "")).strip().upper()
                
                # Extraer respuesta correcta de la columna
                respuesta_correcta_columna = extraer_respuesta_correcta(pregunta)
                
                # Usar respuesta de la columna si existe, sino usar la base
                if respuesta_correcta_columna:
                    respuesta_correcta = respuesta_correcta_columna
                else:
                    respuesta_correcta = respuestas_base[materia].get(numero_pregunta, "")
                
                es_correcta = respuesta_usuario == respuesta_correcta if respuesta_correcta else False
                if es_correcta:
                    correctas += 1
                    total_correctas += 1
                
                detalle_respuestas.append({
                    "numero_pregunta": numero_pregunta,
                    "respuesta_usuario": respuesta_usuario if respuesta_usuario else "NR",
                    "respuesta_correcta": respuesta_correcta,
                    "es_correcta": es_correcta
                })
                
                # Guardar para estadísticas - limpiar número de pregunta
                try:
                    # Extraer solo dígitos del número de pregunta
                    numero_limpio = ''.join(filter(str.isdigit, str(numero_pregunta)))
                    numero_int = int(numero_limpio) if numero_limpio else 0
                except:
                    numero_int = 0
                
                respuestas_materia.append({
                    "numero": numero_int,
                    "respuesta_estudiante": respuesta_usuario if respuesta_usuario else "NR",
                    "respuesta_correcta": respuesta_correcta,
                    "es_correcta": es_correcta
                })
            
            # --- CURVA NO LINEAL ---
            if total_preguntas > 0:
                porcentaje_raw = (correctas / total_preguntas) * 100
                puntaje = int(round(calcular_puntaje_materia_icfes(porcentaje_raw)))
            else:
                porcentaje_raw = 0
                puntaje = 0
            # -----------------------

            resultado["puntajes"][materia] = {
                "correctas": correctas,
                "total_preguntas": total_preguntas,
                "puntaje": puntaje,
                "porcentaje_real": round(porcentaje_raw, 2)
            }
            
            resumen_usuario["puntajes"][materia] = {
                "correctas": correctas,
                "total_preguntas": total_preguntas,
                "puntaje": puntaje,
                "porcentaje_real": round(porcentaje_raw, 2)
            }
            
            resultado["detalle_respuestas"][materia] = detalle_respuestas
            respuestas_detalladas[materia] = respuestas_materia
        
        # Agregar respuestas detalladas al resumen para estadísticas
        resumen_usuario["respuestas_detalladas"] = respuestas_detalladas
        
        resultado["score_real"] = total_correctas
        resumen_usuario["score_real"] = total_correctas
        
        # --- CALCULO GLOBAL PRELIMINAR (SOLO PARA REFERENCIA EN JSON PARCIAL) ---
        PESOS = {
            'matemáticas': 3,
            'lectura crítica': 3,
            'sociales y ciudadanas': 3,
            'ciencias naturales': 3,
            'inglés': 1
        }
        TOTAL_PESOS = 13 # Siempre normalizar sobre 13
        
        suma_ponderada = 0
        for mat_nombre, mat_data in resultado["puntajes"].items():
            if mat_nombre in PESOS:
                suma_ponderada += mat_data["puntaje"] * PESOS[mat_nombre]
            else:
                # Si hay materias extrañas, asumimos peso 3 por defecto o ignoralas?
                # Por seguridad, si no está en la lista estándar, ignoremos o demos peso 1.
                # Para ser consistente con LOGICA_CALIFICACION.md, solo sumamos las conocidas.
                pass
        
        promedio_ponderado = suma_ponderada / TOTAL_PESOS
        puntaje_global = int(round(promedio_ponderado * 5))
        # ------------------------------------------------------------------------
        
        resultado["puntaje_global"] = puntaje_global
        resumen_usuario["puntaje_global"] = puntaje_global
        
        if score_reportado != total_correctas:
            resultado["mensaje_score"] = f"El score reportado ({score_reportado}) no coincide con el score real ({total_correctas})"
            resumen_usuario["mensaje_score"] = f"El score reportado ({score_reportado}) no coincide con el score real ({total_correctas})"
        
        resultados.append(resultado)
        resumen.append(resumen_usuario)
    
    # Guardar archivos en sus respectivas carpetas
    with open(os.path.join(app.config['DATOS_FOLDER'], f"{prefijo}_resultados.json"), 'w', encoding='utf-8') as archivo:
        json.dump(resultados, archivo, ensure_ascii=False, indent=2)
    
    with open(os.path.join(app.config['RESULTADOS_FOLDER'], f"{prefijo}_resumen.json"), 'w', encoding='utf-8') as archivo:
        json.dump(resumen, archivo, ensure_ascii=False, indent=2)
    
    return resultados

def generar_resultados_finales():
    """Genera el archivo de resultados finales combinando ambas secciones."""
    try:
        # Leer los archivos de resumen
        with open(os.path.join(app.config['RESULTADOS_FOLDER'], 'seccion1_resumen.json'), 'r', encoding='utf-8') as f:
            seccion1 = json.load(f)
        with open(os.path.join(app.config['RESULTADOS_FOLDER'], 'seccion2_resumen.json'), 'r', encoding='utf-8') as f:
            seccion2 = json.load(f)

        print("\n=== Depuración de Combinación de Secciones ===")
        print(f"Número de estudiantes en sección 1: {len(seccion1)}")
        print(f"Número de estudiantes en sección 2: {len(seccion2)}")

        # Inicializar estructura de resultados
        resultado_final = {
            "estudiantes": []
        }

        # Crear un diccionario para combinar estudiantes por identificación
        estudiantes_combinados = {}
        ids_procesados = set()

        # Procesar estudiantes de la sección 1
        for estudiante in seccion1:
            try:
                info = estudiante["informacion_personal"]
                clave = info['numero_identificacion'].strip()
                print(f"\nProcesando estudiante de sección 1:")
                print(f"ID: {clave}")
                print(f"Nombre: {info['nombres']} {info['apellidos']}")
                
                if clave not in estudiantes_combinados:
                    estudiantes_combinados[clave] = {
                        "informacion_personal": info,
                        "tipo": estudiante.get("tipo", ""),
                        "puntajes": estudiante["puntajes"].copy(),
                        "respuestas_detalladas": estudiante.get("respuestas_detalladas", {}).copy(),
                        "score_reportado": estudiante["score_reportado"],
                        "score_real": estudiante["score_real"],
                        "puntaje_global": estudiante["puntaje_global"],
                        "fecha": estudiante.get("fecha", "Fecha no válida"),
                        "secciones_completadas": ["seccion1"]
                    }
                    ids_procesados.add(clave)
            except Exception as e:
                print(f"Error procesando estudiante de sección 1: {str(e)}")
                continue

        # Procesar estudiantes de la sección 2
        for estudiante in seccion2:
            try:
                info = estudiante["informacion_personal"]
                clave = info['numero_identificacion'].strip()
                print(f"\nProcesando estudiante de sección 2:")
                print(f"ID: {clave}")
                print(f"Nombre: {info['nombres']} {info['apellidos']}")
                
                if clave not in estudiantes_combinados:
                    # Nuevo estudiante que solo está en sección 2
                    estudiantes_combinados[clave] = {
                        "informacion_personal": info,
                        "tipo": estudiante.get("tipo", ""),
                        "puntajes": estudiante["puntajes"].copy(),
                        "respuestas_detalladas": estudiante.get("respuestas_detalladas", {}).copy(),
                        "score_reportado": estudiante["score_reportado"],
                        "score_real": estudiante["score_real"],
                        "puntaje_global": estudiante["puntaje_global"],
                        "fecha": estudiante.get("fecha", "Fecha no válida"),
                        "secciones_completadas": ["seccion2"]
                    }
                else:
                    # Estudiante existente, combinar datos de sección 2
                    estudiantes_combinados[clave]["secciones_completadas"].append("seccion2")
                    
                    # Combinar puntajes correctamente
                    for materia, puntajes_seccion2 in estudiante["puntajes"].items():
                        if materia in estudiantes_combinados[clave]["puntajes"]:
                            # Materia existe en ambas secciones, sumar los valores
                            estudiantes_combinados[clave]["puntajes"][materia]["correctas"] += puntajes_seccion2["correctas"]
                            estudiantes_combinados[clave]["puntajes"][materia]["total_preguntas"] += puntajes_seccion2["total_preguntas"]
                            # Recalcular el puntaje con el nuevo total y NUEVA CURVA
                            total_preguntas = estudiantes_combinados[clave]["puntajes"][materia]["total_preguntas"]
                            correctas = estudiantes_combinados[clave]["puntajes"][materia]["correctas"]
                            
                            if total_preguntas > 0:
                                porcentaje_raw = (correctas / total_preguntas) * 100
                                estudiantes_combinados[clave]["puntajes"][materia]["puntaje"] = int(round(calcular_puntaje_materia_icfes(porcentaje_raw)))
                                estudiantes_combinados[clave]["puntajes"][materia]["porcentaje_real"] = round(porcentaje_raw, 2)
                            else:
                                estudiantes_combinados[clave]["puntajes"][materia]["puntaje"] = 0
                                estudiantes_combinados[clave]["puntajes"][materia]["porcentaje_real"] = 0
                        else:
                            # Materia nueva, agregar directamente
                            estudiantes_combinados[clave]["puntajes"][materia] = puntajes_seccion2.copy()
                    
                    estudiantes_combinados[clave]["score_reportado"] += estudiante["score_reportado"]
                    estudiantes_combinados[clave]["score_real"] += estudiante["score_real"]
                    
                    # Combinar respuestas detalladas
                    if "respuestas_detalladas" in estudiante:
                        if "respuestas_detalladas" not in estudiantes_combinados[clave]:
                            estudiantes_combinados[clave]["respuestas_detalladas"] = {}
                        estudiantes_combinados[clave]["respuestas_detalladas"].update(estudiante["respuestas_detalladas"])
                    
                    # Actualizar fecha si la de sección 2 es válida
                    if estudiante.get("fecha", "Fecha no válida") != "Fecha no válida":
                        estudiantes_combinados[clave]["fecha"] = estudiante["fecha"]
                
                ids_procesados.add(clave)
            except Exception as e:
                print(f"Error procesando estudiante de sección 2: {str(e)}")
                continue

        # Convertir el diccionario a lista y calcular puntajes finales GLOBALES
        PESOS = {
            'matemáticas': 3,
            'lectura crítica': 3,
            'sociales y ciudadanas': 3,
            'ciencias naturales': 3,
            'inglés': 1
        }
        TOTAL_PESOS = 13

        for clave, estudiante in estudiantes_combinados.items():
            # Calcular Puntaje Global Ponderado
            suma_ponderada = 0
            for mat_nombre, mat_data in estudiante["puntajes"].items():
                if mat_nombre in PESOS:
                    suma_ponderada += mat_data["puntaje"] * PESOS[mat_nombre]
            
            promedio_ponderado = suma_ponderada / TOTAL_PESOS
            estudiante["puntaje_global"] = int(round(promedio_ponderado * 5))
            
            resultado_final["estudiantes"].append(estudiante)

        print(f"\nTotal de estudiantes procesados: {len(ids_procesados)}")
        print(f"Total de estudiantes en resultado final: {len(resultado_final['estudiantes'])}")

        # Guardar el archivo de resultados finales
        with open(os.path.join(app.config['CARGAR_FOLDER'], 'resultados_finales.json'), 'w', encoding='utf-8') as f:
            json.dump(resultado_final, f, ensure_ascii=False, indent=2)

        return True

    except Exception as e:
        print(f"Error al generar resultados finales: {str(e)}")
        return False

def calcular_estadisticas_grupo():
    """
    Calcula estadísticas grupales por pregunta para cada materia.
    Lee resultados_finales.json y genera estadisticas_grupo.json
    """
    try:
        # Cargar resultados finales
        with open(os.path.join(app.config['CARGAR_FOLDER'], 'resultados_finales.json'), 'r', encoding='utf-8') as f:
            datos = json.load(f)
        
        estudiantes = datos['estudiantes']
        total_estudiantes = len(estudiantes)
        
        # Estructura para guardar estadísticas
        estadisticas = {
            "metadata": {
                "total_evaluados": total_estudiantes,
                "fecha_generacion": datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            },
            "materias": {}
        }
        
        # Obtener todas las materias
        materias_set = set()
        for est in estudiantes:
            if 'respuestas_detalladas' in est:
                materias_set.update(est['respuestas_detalladas'].keys())
        
        # Por cada materia
        for materia in materias_set:
            estadisticas["materias"][materia] = {}
            
            # Recopilar todas las respuestas por pregunta
            respuestas_por_pregunta = {}
            
            for estudiante in estudiantes:
                if 'respuestas_detalladas' not in estudiante:
                    continue
                    
                if materia not in estudiante['respuestas_detalladas']:
                    continue
                
                for respuesta in estudiante['respuestas_detalladas'][materia]:
                    num_pregunta = respuesta['numero']
                    
                    if num_pregunta not in respuestas_por_pregunta:
                        respuestas_por_pregunta[num_pregunta] = {
                            "respuesta_correcta": respuesta['respuesta_correcta'],
                            "respuestas": []
                        }
                    
                    respuestas_por_pregunta[num_pregunta]["respuestas"].append(
                        respuesta['respuesta_estudiante']
                    )
            
            # Calcular estadísticas por pregunta
            for num_pregunta, datos_pregunta in sorted(respuestas_por_pregunta.items()):
                respuestas = datos_pregunta["respuestas"]
                total_respuestas = len(respuestas)
                
                # Contar distribución
                distribucion = {}
                opciones = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'NR']
                
                for opcion in opciones:
                    count = respuestas.count(opcion)
                    porcentaje = round((count / total_respuestas * 100), 1) if total_respuestas > 0 else 0
                    distribucion[opcion] = porcentaje
                
                # Calcular % de acierto
                correcta = datos_pregunta["respuesta_correcta"]
                aciertos = respuestas.count(correcta) if correcta else 0
                porcentaje_acierto = round((aciertos / total_respuestas * 100), 1) if total_respuestas > 0 else 0
                
                estadisticas["materias"][materia][f"pregunta_{num_pregunta}"] = {
                    "numero": num_pregunta,
                    "respuesta_correcta": correcta,
                    "distribucion": distribucion,
                    "porcentaje_acierto": porcentaje_acierto,
                    "total_evaluados": total_respuestas
                }
        
        # Guardar estadísticas
        with open(os.path.join(app.config['CARGAR_FOLDER'], 'estadisticas_grupo.json'), 'w', encoding='utf-8') as f:
            json.dump(estadisticas, f, ensure_ascii=False, indent=2)
        
        print(f"Estadísticas grupales generadas exitosamente")
        return estadisticas
        
    except Exception as e:
        print(f"Error calculando estadísticas: {str(e)}")
        return None

@app.route('/')
def index():
    return render_template('Informe.html')

@app.route('/informe')
def informe():
    return render_template('Informe.html')

@app.route('/api/simulacros')
def listar_simulacros():
    """Lista todos los simulacros disponibles en data/input/"""
    try:
        input_folder = app.config['INPUT_FOLDER']
        simulacros = []
        
        if os.path.exists(input_folder):
            for nombre in os.listdir(input_folder):
                ruta = os.path.join(input_folder, nombre)
                if os.path.isdir(ruta) and nombre.startswith('SG'):
                    # Verificar si tiene las subcarpetas necesarias
                    tiene_respuestas = os.path.exists(os.path.join(ruta, 'respuestas'))
                    tiene_claves = os.path.exists(os.path.join(ruta, 'claves'))
                    
                    # Contar archivos
                    num_respuestas = len([f for f in os.listdir(os.path.join(ruta, 'respuestas')) if f.endswith('.csv')]) if tiene_respuestas else 0
                    num_claves = len([f for f in os.listdir(os.path.join(ruta, 'claves')) if f.endswith('.csv')]) if tiene_claves else 0
                    
                    # Verificar si ya fue procesado
                    id_normalizado = nombre.replace(' ', '').replace('-', '-')
                    ruta_procesado = os.path.join(app.config['CARGAR_FOLDER'], id_normalizado, 'resultados_finales.json')
                    procesado = os.path.exists(ruta_procesado)
                    
                    simulacros.append({
                        'id': nombre,
                        'id_normalizado': id_normalizado,
                        'tiene_respuestas': tiene_respuestas,
                        'tiene_claves': tiene_claves,
                        'num_respuestas': num_respuestas,
                        'num_claves': num_claves,
                        'procesado': procesado,
                        'listo': tiene_respuestas and tiene_claves and num_respuestas >= 2 and num_claves >= 2
                    })
        
        # Ordenar por nombre
        simulacros.sort(key=lambda x: x['id'])
        
        return jsonify({
            'simulacros': simulacros,
            'simulacro_actual': simulacro_actual
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/simulacros/seleccionar', methods=['POST'])
def seleccionar_simulacro():
    """Selecciona el simulacro activo para procesar"""
    global simulacro_actual
    try:
        datos = request.get_json()
        simulacro_id = datos.get('simulacro_id')
        
        if not simulacro_id:
            return jsonify({'error': 'No se especificó el simulacro'}), 400
        
        # Verificar que existe
        ruta = os.path.join(app.config['INPUT_FOLDER'], simulacro_id)
        if not os.path.exists(ruta):
            return jsonify({'error': f'No se encontró el simulacro: {simulacro_id}'}), 404
        
        simulacro_actual = simulacro_id
        
        # Crear carpeta de procesamiento para este simulacro
        id_normalizado = simulacro_id.replace(' ', '').replace('-', '-')
        carpeta_procesamiento = os.path.join(app.config['CARGAR_FOLDER'], id_normalizado)
        os.makedirs(carpeta_procesamiento, exist_ok=True)
        os.makedirs(os.path.join(carpeta_procesamiento, 'temp'), exist_ok=True)
        
        return jsonify({
            'success': True,
            'simulacro_actual': simulacro_actual,
            'mensaje': f'Simulacro {simulacro_id} seleccionado'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/simulacros/procesar', methods=['POST'])
def procesar_simulacro():
    """Procesa un simulacro leyendo claves y respuestas desde la carpeta"""
    global simulacro_actual
    try:
        datos = request.get_json()
        simulacro_id = datos.get('simulacro_id') or simulacro_actual
        
        if not simulacro_id:
            return jsonify({'error': 'No se ha seleccionado ningún simulacro'}), 400
        
        simulacro_actual = simulacro_id
        ruta_simulacro = os.path.join(app.config['INPUT_FOLDER'], simulacro_id)
        
        if not os.path.exists(ruta_simulacro):
            return jsonify({'error': f'No se encontró la carpeta del simulacro: {simulacro_id}'}), 404
        
        ruta_claves = os.path.join(ruta_simulacro, 'claves')
        ruta_respuestas = os.path.join(ruta_simulacro, 'respuestas')
        
        # Verificar que existan las carpetas
        if not os.path.exists(ruta_claves):
            return jsonify({'error': 'No se encontró la carpeta de claves'}), 404
        if not os.path.exists(ruta_respuestas):
            return jsonify({'error': 'No se encontró la carpeta de respuestas'}), 404
        
        # Cargar claves de ambas sesiones
        claves = {}
        archivos_claves = [f for f in os.listdir(ruta_claves) if f.endswith('.csv')]
        
        for archivo in archivos_claves:
            df_claves = pd.read_csv(os.path.join(ruta_claves, archivo))
            columnas = df_claves.columns.tolist()
            respuestas = df_claves.iloc[0].tolist()
            
            for col, resp in zip(columnas, respuestas):
                # Extraer materia y número de pregunta del nombre de columna
                # Formato: "Matemáticas S1 [1.]" o "Ingles Parte 1 [80.]"
                import re
                match = re.search(r'\[(\d+)\.\]', col)
                if match:
                    num_pregunta = match.group(1)
                    claves[col] = str(resp).strip().upper()
        
        print(f"Claves cargadas: {len(claves)} preguntas")
        
        # Cargar respuestas de estudiantes
        archivos_respuestas = [f for f in os.listdir(ruta_respuestas) if f.endswith('.csv')]
        
        estudiantes_combinados = {}
        
        for archivo in archivos_respuestas:
            sesion = 'S1' if 'SESION 1' in archivo.upper() or 'S1' in archivo.upper() else 'S2'
            df_resp = pd.read_csv(os.path.join(ruta_respuestas, archivo))
            
            print(f"Procesando {archivo}: {len(df_resp)} registros")
            
            # Encontrar columnas de identificación (buscar más patrones)
            cols_id = [c for c in df_resp.columns if 
                       ('número' in c.lower() and 'identificación' in c.lower()) or
                       ('numero' in c.lower() and 'identificacion' in c.lower()) or
                       ('identificación' in c.lower() and 'no te equivoques' in c.lower()) or
                       ('identificacion' in c.lower() and 'no te equivoques' in c.lower()) or
                       c.lower().strip() == 'documento']
            cols_nombre = [c for c in df_resp.columns if 'nombre' in c.lower() and 'completo' in c.lower()]
            cols_apellido = [c for c in df_resp.columns if 'apellido' in c.lower()]
            cols_telefono = [c for c in df_resp.columns if 'telefono' in c.lower() or 'whatsapp' in c.lower() or 'celular' in c.lower()]
            cols_depto = [c for c in df_resp.columns if 'departamento' in c.lower()]
            cols_institucion = [c for c in df_resp.columns if 'instituci' in c.lower() or 'colegio' in c.lower()]
            cols_fecha = [c for c in df_resp.columns if 'temporal' in c.lower() or 'timestamp' in c.lower()]
            
            print(f"Columnas ID encontradas: {cols_id}")
            print(f"Columnas nombre encontradas: {cols_nombre}")
            
            for idx, fila in df_resp.iterrows():
                # Obtener identificación
                id_estudiante = None
                for col in cols_id:
                    val = fila.get(col)
                    if pd.notna(val):
                        id_estudiante = str(val).replace('.', '').replace(',', '').strip()
                        break
                
                if not id_estudiante:
                    continue
                
                # Obtener información personal
                nombres = ''
                for col in cols_nombre:
                    val = fila.get(col)
                    if pd.notna(val):
                        nombres = str(val).strip()
                        break
                
                apellidos = ''
                for col in cols_apellido:
                    val = fila.get(col)
                    if pd.notna(val):
                        apellidos = str(val).strip()
                        break
                
                telefono = ''
                for col in cols_telefono:
                    val = fila.get(col)
                    if pd.notna(val):
                        telefono = str(val).strip()
                        break
                
                departamento = ''
                for col in cols_depto:
                    val = fila.get(col)
                    if pd.notna(val):
                        departamento = str(val).strip()
                        break
                
                institucion = ''
                for col in cols_institucion:
                    val = fila.get(col)
                    if pd.notna(val):
                        institucion = str(val).strip()
                        break
                
                fecha = ''
                for col in cols_fecha:
                    val = fila.get(col)
                    if pd.notna(val):
                        fecha = str(val).strip()
                        break
                
                # Inicializar estudiante si no existe
                if id_estudiante not in estudiantes_combinados:
                    estudiantes_combinados[id_estudiante] = {
                        'informacion_personal': {
                            'numero_identificacion': id_estudiante,
                            'nombres': nombres,
                            'apellidos': apellidos,
                            'telefono': telefono,
                            'departamento': departamento,
                            'institucion': institucion
                        },
                        'fecha': fecha,
                        'puntajes': {},
                        'respuestas_detalladas': {},
                        'secciones_completadas': []
                    }
                
                est = estudiantes_combinados[id_estudiante]
                est['secciones_completadas'].append(sesion)
                
                # Procesar respuestas de este estudiante
                for columna in df_resp.columns:
                    if '[' in columna and ']' in columna:
                        respuesta_estudiante = str(fila.get(columna, '')).strip().upper()
                        clave_correcta = claves.get(columna, '')
                        
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
                        
                        # Inicializar materia si no existe
                        if materia not in est['puntajes']:
                            est['puntajes'][materia] = {
                                'correctas': 0,
                                'total_preguntas': 0,
                                'porcentaje_real': 0,
                                'puntaje': 0
                            }
                        
                        if materia not in est['respuestas_detalladas']:
                            est['respuestas_detalladas'][materia] = {}
                        
                        # Extraer número de pregunta
                        import re
                        match = re.search(r'\[(\d+)\.\]', columna)
                        if match:
                            num_pregunta = match.group(1)
                            
                            # Verificar si es correcta (soportar múltiples respuestas correctas con -)
                            es_correcta = False
                            if clave_correcta:
                                if '-' in clave_correcta:
                                    # Múltiples respuestas válidas
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
        
        # Calcular puntajes finales
        for id_est, est in estudiantes_combinados.items():
            total_puntaje = 0
            total_peso = 0
            
            for materia, datos in est['puntajes'].items():
                if datos['total_preguntas'] > 0:
                    porcentaje = (datos['correctas'] / datos['total_preguntas']) * 100
                    datos['porcentaje_real'] = round(porcentaje, 2)
                    datos['puntaje'] = int(round(calcular_puntaje_materia_icfes(porcentaje)))
                    
                    # Peso para puntaje global
                    peso = 1 if materia == 'inglés' else 3
                    total_puntaje += datos['puntaje'] * peso
                    total_peso += peso
            
            est['puntaje_global'] = int(round((total_puntaje / total_peso) * 5)) if total_peso > 0 else 0
            est['score_real'] = sum(d['correctas'] for d in est['puntajes'].values())
            est['score_reportado'] = est['score_real']
        
        # Guardar resultados
        id_normalizado = simulacro_id.replace(' ', '').replace('-', '-')
        carpeta_salida = os.path.join(app.config['CARGAR_FOLDER'], id_normalizado)
        os.makedirs(carpeta_salida, exist_ok=True)
        
        resultado_final = {
            'simulacro': simulacro_id,
            'fecha_procesamiento': datetime.now().isoformat(),
            'total_estudiantes': len(estudiantes_combinados),
            'estudiantes': list(estudiantes_combinados.values())
        }
        
        with open(os.path.join(carpeta_salida, 'resultados_finales.json'), 'w', encoding='utf-8') as f:
            json.dump(resultado_final, f, ensure_ascii=False, indent=2)
        
        # Ya no sobrescribimos el archivo compartido - cada simulacro tiene sus propios resultados
        print(f"Resultados guardados en: {carpeta_salida}/resultados_finales.json")
        
        return jsonify({
            'success': True,
            'mensaje': f'Simulacro {simulacro_id} procesado exitosamente',
            'total_estudiantes': len(estudiantes_combinados),
            'claves_cargadas': len(claves)
        })
        
    except Exception as e:
        import traceback
        print(f"Error procesando simulacro: {traceback.format_exc()}")
        return jsonify({'error': str(e)}), 500


@app.route('/cargar/resultados_finales.json')
def get_resultados():
    global simulacro_actual
    try:
        # Si hay un simulacro seleccionado, cargar sus resultados específicos
        if simulacro_actual:
            id_normalizado = simulacro_actual.replace(' ', '').replace('-', '-')
            ruta_simulacro = os.path.join(app.config['CARGAR_FOLDER'], id_normalizado, 'resultados_finales.json')
            if os.path.exists(ruta_simulacro):
                with open(ruta_simulacro, 'r', encoding='utf-8') as f:
                    return jsonify(json.load(f))
        
        # Fallback a rutas originales
        ruta_output = os.path.join(app.config['SALIDA_FOLDER'], 'resultados_finales.json')
        ruta_cache = os.path.join(app.config['CARGAR_FOLDER'], 'resultados_finales.json')
        
        if os.path.exists(ruta_output):
            with open(ruta_output, 'r', encoding='utf-8') as f:
                return jsonify(json.load(f))
        elif os.path.exists(ruta_cache):
            with open(ruta_cache, 'r', encoding='utf-8') as f:
                return jsonify(json.load(f))
        else:
            return jsonify({'error': 'No se encontró resultados_finales.json'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/estadisticas-grupo')
def get_estadisticas_grupo():
    """Retorna las estadísticas grupales o las genera si no existen."""
    try:
        # Intentar cargar estadísticas existentes
        ruta_stats = os.path.join(app.config['CARGAR_FOLDER'], 'estadisticas_grupo.json')
        
        if not os.path.exists(ruta_stats):
            # Si no existen, generarlas
            estadisticas = calcular_estadisticas_grupo()
            if not estadisticas:
                return jsonify({'error': 'No se pudieron generar estadísticas'}), 500
        else:
            with open(ruta_stats, 'r', encoding='utf-8') as f:
                estadisticas = json.load(f)
        
        return jsonify(estadisticas)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/data/<path:filename>')
def serve_data(filename):
    return send_file(os.path.join('data', filename))

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file1' not in request.files or 'file2' not in request.files:
        return jsonify({'error': 'No se han proporcionado archivos'}), 400
    
    file1 = request.files['file1']
    file2 = request.files['file2']
    
    if file1.filename == '' and file2.filename == '':
        return jsonify({'error': 'No se han seleccionado archivos'}), 400
    
    try:
        resultados = []
        
        if file1.filename != '':
            # Primero leer el Excel sin parse_dates
            df1 = pd.read_excel(file1)
            # Identificar qué columnas de fecha existen
            columnas_fecha = [col for col in df1.columns if col in ["Timestamp", "Marca temporal", "timestamp", "marca temporal", "marca de tiempo", "Marca de tiempo"]]
            # Si hay columnas de fecha, intentar parsearlas
            if columnas_fecha:
                df1 = pd.read_excel(file1, parse_dates=columnas_fecha)
            resultados1 = procesar_datos(df1, "seccion1")
            resultados.append({"seccion": "1", "resultados": resultados1})
        
        if file2.filename != '':
            # Primero leer el Excel sin parse_dates
            df2 = pd.read_excel(file2)
            # Identificar qué columnas de fecha existen
            columnas_fecha = [col for col in df2.columns if col in ["Timestamp", "Marca temporal", "timestamp", "marca temporal", "marca de tiempo", "Marca de tiempo"]]
            # Si hay columnas de fecha, intentar parsearlas
            if columnas_fecha:
                df2 = pd.read_excel(file2, parse_dates=columnas_fecha)
            resultados2 = procesar_datos(df2, "seccion2")
            resultados.append({"seccion": "2", "resultados": resultados2})
        
        # Generar resultados finales
        generar_resultados_finales()
        
        # Generar estadísticas grupales automáticamente
        calcular_estadisticas_grupo()
        
        return jsonify({
            'success': True,
            'message': 'Archivos procesados exitosamente',
            'resultados': resultados
        })
    
    except Exception as e:
        print(f"Error al procesar archivos: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/apagar', methods=['POST'])
def apagar_servidor():
    """Ruta para apagar el servidor Flask."""
    try:
        # Programar el apagado después de enviar la respuesta
        def apagar_despues():
            time.sleep(1)  # Esperar 1 segundo para asegurar que la respuesta se envíe
            os._exit(0)  # Forzar el cierre del proceso
            
        threading.Thread(target=apagar_despues).start()
        return jsonify({'mensaje': 'Servidor apagándose...'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def abrir_navegador():
    """Función para abrir el navegador después de que el servidor esté listo."""
    # Verificar si es el proceso principal y no el proceso de recarga
    if os.environ.get('WERKZEUG_RUN_MAIN') != 'true':
        time.sleep(1.5)  # Esperar 1.5 segundos para asegurar que el servidor esté listo
        webbrowser.open('http://127.0.0.1:5000')

@app.route('/actualizar-puntajes', methods=['POST'])
def actualizar_puntajes():
    try:
        # Obtener los datos enviados
        datos = request.get_json()
        indice_estudiante = datos.get('indiceEstudiante')
        nuevos_puntajes = datos.get('nuevosPuntajes')

        # Cargar el archivo JSON actual
        ruta_json = os.path.join(app.config['CARGAR_FOLDER'], 'resultados_finales.json')
        with open(ruta_json, 'r', encoding='utf-8') as archivo:
            datos_json = json.load(archivo)

        # Verificar que el índice es válido
        if not (0 <= indice_estudiante < len(datos_json['estudiantes'])):
            return jsonify({'error': 'Índice de estudiante no válido'}), 400

        # Actualizar los puntajes del estudiante
        datos_json['estudiantes'][indice_estudiante]['puntajes'] = nuevos_puntajes

        # Guardar los cambios en el archivo
        with open(ruta_json, 'w', encoding='utf-8') as archivo:
            json.dump(datos_json, archivo, ensure_ascii=False, indent=2)

        return jsonify({'mensaje': 'Puntajes actualizados correctamente'}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    # Iniciar el navegador en un hilo separado
    threading.Thread(target=abrir_navegador).start()
    # Iniciar el servidor Flask
    app.run(debug=True, port=5000) 