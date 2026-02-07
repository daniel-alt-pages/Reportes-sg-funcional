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
app.config['DATOS_FOLDER'] = '_procesamiento/temp'
app.config['RESULTADOS_FOLDER'] = '_procesamiento/temp'
app.config['CARGAR_FOLDER'] = '_procesamiento'
app.config['SALIDA_FOLDER'] = '_salida'
app.config['ASSETS_FOLDER'] = 'assets'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max-limit

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

@app.route('/cargar/resultados_finales.json')
def get_resultados():
    try:
        # Primero intentar desde output (generado por procesar.py)
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