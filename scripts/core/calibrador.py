"""
CALIBRADOR - Sistema de Análisis de Dificultad (Metodología ICFES)
===================================================================
Calcula parámetros de calibración siguiendo terminología oficial.

Parámetros:
- Índice de Dificultad (p): Proporción de aciertos (0-1)
- Clasificación: MUY_FACIL, FACIL, MEDIA, DIFICIL, MUY_DIFICIL
- es_cascara: True si es pregunta fácil (fallarla penaliza mucho)
"""
import pandas as pd
import json
from pathlib import Path
from procesar import detectar_archivos, leer_archivo, cargar_claves, identificar_materia, extraer_numero_pregunta

BASE_DIR = Path(__file__).parent.parent.parent
ENTRADA_DIR = BASE_DIR / "data" / "input"
SALIDA_CALIB = ENTRADA_DIR / "calibracion.json"

def generar_calibracion():
    print("=" * 60)
    print("CALIBRADOR ICFES - Análisis de Ítems")
    print("=" * 60)
    
    archivos = detectar_archivos()
    calibracion = {}
    stats_por_area = {}
    
    for sesion_key, claves_key in [('respuestas_s1', 'claves_s1'), ('respuestas_s2', 'claves_s2')]:
        ruta_resp = archivos[sesion_key]
        ruta_clav = archivos[claves_key]
        
        if not ruta_resp or not ruta_clav:
            continue
            
        print(f"\n[*] Analizando {sesion_key}...")
        df = leer_archivo(ruta_resp)
        claves = cargar_claves(ruta_clav)
        
        for col_clave, resp_correcta in claves.items():
            if col_clave not in df.columns:
                continue
                
            materia = identificar_materia(col_clave)
            numero = extraer_numero_pregunta(col_clave)
            
            if not materia or not numero:
                continue
            
            # ÍNDICE DE DIFICULTAD (p)
            resps = df[col_clave].astype(str).str.strip().str.upper()
            total = len(resps)
            aciertos = (resps == str(resp_correcta).strip().upper()).sum()
            p_value = aciertos / total if total > 0 else 0
            
            # CLASIFICACIÓN ICFES (Boletín 7)
            if p_value >= 0.75:
                tipo = 'MUY_FACIL'
                peso = 1
                es_cascara = True
            elif p_value >= 0.55:
                tipo = 'FACIL'
                peso = 1.5
                es_cascara = True
            elif p_value >= 0.35:
                tipo = 'MEDIA'
                peso = 2
                es_cascara = False
            elif p_value >= 0.25:
                tipo = 'DIFICIL'
                peso = 2.5
                es_cascara = False
            else:
                tipo = 'MUY_DIFICIL'
                peso = 3
                es_cascara = False
                
            key = f"{materia}_{numero}"
            calibracion[key] = {
                'materia': materia,
                'numero': numero,
                'indice_dificultad': round(p_value, 4),
                'clasificacion': tipo,
                'peso': peso,
                'es_cascara': es_cascara,
                'aciertos': int(aciertos),
                'total': total,
                'sesion': sesion_key.replace('respuestas_', '').upper()
            }
            
            # Stats
            if materia not in stats_por_area:
                stats_por_area[materia] = {'total': 0, 'cascaras': 0, 'dificiles': 0}
            stats_por_area[materia]['total'] += 1
            if es_cascara:
                stats_por_area[materia]['cascaras'] += 1
            if 'DIFICIL' in tipo:
                stats_por_area[materia]['dificiles'] += 1
            
    # Guardar
    with open(SALIDA_CALIB, 'w', encoding='utf-8') as f:
        json.dump(calibracion, f, indent=4, ensure_ascii=False)
    
    print("\n" + "=" * 60)
    print("RESUMEN DE CALIBRACIÓN")
    print("=" * 60)
    print(f"Total preguntas: {len(calibracion)}")
    for area, stats in stats_por_area.items():
        print(f"  {area}: {stats['total']} preg | {stats['cascaras']} cáscaras | {stats['dificiles']} difíciles")

if __name__ == "__main__":
    generar_calibracion()
