import pandas as pd
import json
import os
import glob
import re
import numpy as np

# Rutas
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) # scripts/.. -> ReportesSG-main
INPUT_RESPUESTAS = os.path.join(BASE_DIR, 'data', 'input', 'respuestas')
INPUT_CLAVES = os.path.join(BASE_DIR, 'data', 'input', 'claves')
OUTPUT_JSON = r"c:/Users/Daniel/Downloads/reportes-sg-next/src/data/estadisticas_grupo.json"

def normalizar_nombre_columna(col):
    """Normaliza el nombre de la columna para matching."""
    return col.strip()

def identificar_materia(nombre_columna):
    col_lower = nombre_columna.lower()
    if 'matem' in col_lower: return 'matemáticas'
    if 'lectura' in col_lower: return 'lectura crítica'
    if 'sociales' in col_lower: return 'sociales y ciudadanas'
    if 'naturales' in col_lower: return 'ciencias naturales'
    if 'ingl' in col_lower: return 'inglés'
    return None

def extraer_numero(nombre_columna):
    match = re.search(r'\[(\d+)\.?\]', nombre_columna)
    if match:
        return int(match.group(1))
    return None

def cargar_csv(ruta):
    try:
        return pd.read_csv(ruta, encoding='utf-8')
    except:
        try:
            return pd.read_csv(ruta, encoding='latin-1')
        except:
            print(f"Error leyendo {ruta}")
            return None

def main():
    print("Iniciando cálculo de estadísticas exactas...")
    
    # 1. Encontrar archivos
    archivos_respuestas = glob.glob(os.path.join(INPUT_RESPUESTAS, "*.csv"))
    archivos_claves = glob.glob(os.path.join(INPUT_CLAVES, "*.csv"))
    
    estadisticas_globales = {
        "metadata": {
            "total_evaluados": 0,
            "fecha_generacion": pd.Timestamp.now().isoformat()
        },
        "materias": {}
    }
    
    # Inicializar materias
    for m in ['matemáticas', 'lectura crítica', 'sociales y ciudadanas', 'ciencias naturales', 'inglés']:
        estadisticas_globales["materias"][m] = {}

    total_estudiantes_set = set()

    # Procesar por Sesión (S1 y S2)
    for sesion in ['SESION 1', 'SESION 2']:
        print(f"Procesando {sesion}...")
        
        # Buscar archivos correspondientes
        f_resp = next((f for f in archivos_respuestas if sesion in f.upper().replace('SESIÓN', 'SESION')), None)
        f_clave = next((f for f in archivos_claves if sesion in f.upper().replace('SESIÓN', 'SESION')), None)
        
        if not f_resp or not f_clave:
            print(f"Falta archivo de respuestas o claves para {sesion}")
            continue
            
        df_resp = cargar_csv(f_resp)
        df_clave = cargar_csv(f_clave)
        
        if df_resp is None or df_clave is None:
            continue

        # Identificar columna de ID (para contar estudiantes únicos)
        id_col = next((c for c in df_resp.columns if 'identificacion' in c.lower() or 'id' in c.lower()), None)
        if id_col:
            total_estudiantes_set.update(df_resp[id_col].astype(str).unique())

        # Procesar claves
        claves_map = {} # {columna_nombre: respuesta_correcta}
        for col in df_clave.columns:
            if '[' in col and ']' in col:
                val = str(df_clave[col].iloc[0]).strip().upper()
                claves_map[col] = val
        
        # Procesar respuestas
        for col in df_resp.columns:
            # Buscar si esta columna tiene clave
            # Las columnas en respuestas pueden tener nombres ligeramente distintos, pero suelen contener el tag [N.]
            
            # Buscar la clave correspondiente
            # Opcion 1: Matching exacto
            clave_col = col
            respuesta_correcta = claves_map.get(col)
            
            # Opcion 2: Matching aproximado (si el CSV de respuestas cambia headers)
            if not respuesta_correcta:
                # Intentar buscar por numero de pregunta
                num = extraer_numero(col)
                mat = identificar_materia(col)
                if num and mat:
                    # Buscar en claves alguna columna que tenga ese num y materia
                    for k, v in claves_map.items():
                        if extraer_numero(k) == num and identificar_materia(k) == mat:
                            respuesta_correcta = v
                            break
            
            if not respuesta_correcta:
                continue
                
            # Tenemos respuesta y clave
            materia_key = identificar_materia(col)
            numero_preg = extraer_numero(col)
            
            if not materia_key or not numero_preg:
                continue
                
            # Calcular estadísticas
            respuestas_col = df_resp[col].fillna('NR').astype(str).str.strip().str.upper()
            total = len(respuestas_col)
            
            # Conteo de opciones
            counts = respuestas_col.value_counts().to_dict()
            distribucion = {
                "A": 0, "B": 0, "C": 0, "D": 0, "NR": 0
            }
            
            for k, v in counts.items():
                k_clean = k.replace('.', '')
                if k_clean in distribucion:
                    distribucion[k_clean] = v
                else:
                    # Mapear cosas raras a NR o ignorar
                    pass
            
            # Normalizar a porcentajes
            distribucion_pct = {k: round((v / total) * 100, 1) for k, v in distribucion.items()}
            
            # Aciertos
            try:
                aciertos = respuestas_col == respuesta_correcta
                num_aciertos = aciertos.sum()
                pct_acierto = round((num_aciertos / total) * 100, 1)
            except:
                pct_acierto = 0
            
            # Guardar
            key_preg = f"pregunta_{numero_preg}"
            estadisticas_globales["materias"][materia_key][key_preg] = {
                "numero": numero_preg,
                "respuesta_correcta": respuesta_correcta,
                "distribucion": distribucion_pct,
                "porcentaje_acierto": pct_acierto,
                "total_evaluados": total
            }

    estadisticas_globales["metadata"]["total_evaluados"] = len(total_estudiantes_set)
    
    # Guardar JSON
    os.makedirs(os.path.dirname(OUTPUT_JSON), exist_ok=True)
    with open(OUTPUT_JSON, 'w', encoding='utf-8') as f:
        json.dump(estadisticas_globales, f, indent=4, ensure_ascii=False)
        
    print(f"Estadísticas guardadas en {OUTPUT_JSON}")

if __name__ == '__main__':
    main()
