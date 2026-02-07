import json
import os
import shutil
from pathlib import Path

# Configuración Inicial
# Intentamos localizar el archivo fuente
POSSIBLE_PATHS = [
    Path('output/resultados_finales.json'),
    Path('../output/resultados_finales.json'),
    Path('src/data/resultados_finales.json'),
    Path('reportes-sg-next/src/data/resultados_finales.json')
]

SOURCE_FILE = None
for p in POSSIBLE_PATHS:
    if p.exists():
        SOURCE_FILE = p
        break

PUBLIC_DATA_DIR = Path('public/data')
# Si estamos en la raiz del repo, ajustar
if not PUBLIC_DATA_DIR.exists():
    PUBLIC_DATA_DIR = Path('reportes-sg-next/public/data')

STUDENTS_DIR = PUBLIC_DATA_DIR / 'estudiantes'
AUTH_FILE = PUBLIC_DATA_DIR / 'auth_index.json'
RANKING_FILE = PUBLIC_DATA_DIR / 'ranking_index.json'

def optimize_data():
    print(f"🔹 Iniciando optimización de datos para web...")
    
    if not SOURCE_FILE or not SOURCE_FILE.exists():
        print(f"❌ Error: No se encuentra resultados_finales.json en rutas esperadas.")
        print(f"   Buscado en: {[str(p) for p in POSSIBLE_PATHS]}")
        return

    # Crear directorios
    if STUDENTS_DIR.exists():
        shutil.rmtree(STUDENTS_DIR)
    STUDENTS_DIR.mkdir(parents=True, exist_ok=True)

    try:
        with open(SOURCE_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        estudiantes = data.get('estudiantes', [])
        auth_index = []
        ranking_data = [] # Lista ligera para el ranking
        
        print(f"📊 Procesando {len(estudiantes)} estudiantes...")
        
        for est in estudiantes:
            info = est.get('informacion_personal', {})
            id_est = str(info.get('numero_identificacion', '')).strip()
            email_1 = str(info.get('correo_electronico', '')).lower().strip()
            email_2 = str(info.get('correo', '')).lower().strip()
            nombres = f"{info.get('nombres','')} {info.get('apellidos','')}".strip()
            
            if not id_est:
                continue
                
            # 1. Guardar archivo individual del estudiante (FULL data)
            # Esto reduce la carga inicial de 9MB a ~3KB por usuario solo cuando consultan
            student_file = STUDENTS_DIR / f"{id_est}.json"
            with open(student_file, 'w', encoding='utf-8') as f_out:
                json.dump(est, f_out, ensure_ascii=False)
                
            # 2. Agregar al índice de autenticación (ligero)
            emails = []
            if email_1 and '@' in email_1: emails.append(email_1)
            if email_2 and '@' in email_2 and email_2 != email_1: emails.append(email_2)
            
            for email in emails:
                auth_index.append({
                    'e': email, # email
                    'i': id_est, # id
                    'n': nombres # nombre
                })

            # 3. Agregar al índice de Ranking (ligero)
            # Extraemos solo puntajes globales de cada área (no las preguntas)
            puntajes_light = {}
            for area, p in est.get('puntajes', {}).items():
                puntajes_light[area] = {'puntaje': p.get('puntaje', 0)}

            ranking_data.append({
                'informacion_personal': {
                    'nombres': info.get('nombres',''),
                    'apellidos': info.get('apellidos',''),
                    'numero_identificacion': id_est,
                    'institucion': info.get('institucion',''),
                    'municipio': info.get('municipio',''),
                    'correo_electronico': email_1, # Para avatar
                },
                'puntaje_global': est.get('puntaje_global', 0),
                's1_aciertos': est.get('s1_aciertos', 0),
                's1_total': est.get('s1_total', 0),
                's2_aciertos': est.get('s2_aciertos', 0),
                's2_total': est.get('s2_total', 0),
                'puntajes': puntajes_light 
            })
                
        # Guardar índice de autenticación
        with open(AUTH_FILE, 'w', encoding='utf-8') as f_auth:
            json.dump(auth_index, f_auth, ensure_ascii=False, separators=(',', ':'))

        # Guardar índice de ranking
        with open(RANKING_FILE, 'w', encoding='utf-8') as f_rank:
            json.dump({'estudiantes': ranking_data}, f_rank, ensure_ascii=False)

        # 4. Copiar archivo maestro a public/data para compatibilidad con páginas legacy (Analysis Page)
        # Esto soluciona la inconsistencia entre Dashboard (individual JSON) y Analysis (Global JSON)
        dest_master = PUBLIC_DATA_DIR / 'resultados_finales.json'
        shutil.copy2(SOURCE_FILE, dest_master)
            
        print(f"✅ Optimización completada:")
        print(f"   - {len(estudiantes)} archivos JSON individuales creados en {STUDENTS_DIR}")
        print(f"   - {AUTH_FILE} (Login rápido)")
        print(f"   - {RANKING_FILE} (Tabla de líderes rápida)")
        
    except Exception as e:
        print(f"❌ Error al procesar datos: {e}")

if __name__ == '__main__':
    optimize_data()
