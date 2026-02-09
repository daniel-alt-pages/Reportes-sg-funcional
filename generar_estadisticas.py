#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Generador de Estadísticas de Grupo
Uso: python generar_estadisticas.py "SG11-09"

Lee los datos del simulacro y genera estadisticas_grupo.json con:
- Distribución de respuestas por pregunta
- Clave correcta por pregunta
- Porcentaje de aciertos
"""

import json
import os
import sys
from datetime import datetime
from collections import defaultdict

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.join(BASE_DIR, 'reportes-sg-next', 'public', 'data')

def generar_estadisticas(simulacro_id):
    """Genera estadísticas de grupo a partir de resultados_finales.json"""
    
    ruta_resultados = os.path.join(OUTPUT_DIR, 'simulations', simulacro_id, 'resultados_finales.json')
    
    if not os.path.exists(ruta_resultados):
        print(f"❌ No se encontró: {ruta_resultados}")
        return None
    
    with open(ruta_resultados, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    estudiantes = data.get('estudiantes', [])
    print(f"📊 Procesando {len(estudiantes)} estudiantes...")
    
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
    
    for est in estudiantes:
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
    
    # Convertir a formato final
    for materia, preguntas in materias_data.items():
        estadisticas['materias'][materia] = {}
        
        for key, data in preguntas.items():
            total = data['total']
            estadisticas['materias'][materia][key] = {
                'numero': int(key.replace('pregunta_', '')),
                'respuesta_correcta': data['clave'],
                'total_respuestas': total,
                'aciertos': data['correctas'],
                'porcentaje_aciertos': round((data['correctas'] / total * 100) if total > 0 else 0, 1),
                'distribucion': dict(data['respuestas'])
            }
    
    # Guardar archivo
    ruta_salida = os.path.join(OUTPUT_DIR, 'estadisticas_grupo.json')
    with open(ruta_salida, 'w', encoding='utf-8') as f:
        json.dump(estadisticas, f, ensure_ascii=False, indent=2)
    
    print(f"✅ Estadísticas guardadas en: {ruta_salida}")
    
    # También guardar en la carpeta del simulacro
    ruta_sim = os.path.join(OUTPUT_DIR, 'simulations', simulacro_id, 'estadisticas_grupo.json')
    with open(ruta_sim, 'w', encoding='utf-8') as f:
        json.dump(estadisticas, f, ensure_ascii=False, indent=2)
    
    print(f"✅ Copia guardada en: {ruta_sim}")
    
    return estadisticas

def main():
    if len(sys.argv) < 2:
        print("Uso: python generar_estadisticas.py SG11-09")
        sys.exit(1)
    
    simulacro_id = sys.argv[1]
    print(f"🔄 Generando estadísticas para: {simulacro_id}")
    generar_estadisticas(simulacro_id)

if __name__ == '__main__':
    main()
