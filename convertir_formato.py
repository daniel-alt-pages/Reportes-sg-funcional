#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Convierte resultados_finales.json a students.json y statistics.json"""

import json
import os
import sys

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

sim_id = sys.argv[1] if len(sys.argv) > 1 else 'SG11-09'
base_path = f'reportes-sg-next/public/data/simulations/{sim_id}'

# Cargar resultados finales
with open(f'{base_path}/resultados_finales.json', 'r', encoding='utf-8') as f:
    resultados = json.load(f)

# Convertir a formato students.json
students_data = {
    'version': '1.0.0',
    'simulationId': sim_id,
    'students': {},
    'index': []
}

for est in resultados['estudiantes']:
    id_est = est['informacion_personal']['numero_identificacion']
    students_data['students'][id_est] = est
    students_data['index'].append(id_est)

# Guardar students.json
with open(f'{base_path}/students.json', 'w', encoding='utf-8') as f:
    json.dump(students_data, f, ensure_ascii=False, indent=2)

print(f'students.json creado: {len(students_data["index"])} estudiantes')

# Generar estadísticas
stats = {
    'simulacro': sim_id,
    'total_estudiantes': len(resultados['estudiantes']),
    'promedios': {},
    'distribucion_niveles': {'superior': 0, 'alto': 0, 'medio': 0, 'bajo': 0},
    'histograma_puntajes': {}
}

materias_totales = {}
for est in resultados['estudiantes']:
    puntaje_global = est.get('puntaje_global', 0)
    
    # Distribución por nivel
    if puntaje_global >= 400:
        stats['distribucion_niveles']['superior'] += 1
    elif puntaje_global >= 350:
        stats['distribucion_niveles']['alto'] += 1
    elif puntaje_global >= 300:
        stats['distribucion_niveles']['medio'] += 1
    else:
        stats['distribucion_niveles']['bajo'] += 1
    
    # Histograma (rangos de 25)
    rango = (puntaje_global // 25) * 25
    key = f'{rango}-{rango+24}'
    stats['histograma_puntajes'][key] = stats['histograma_puntajes'].get(key, 0) + 1
    
    # Promedios por materia
    for materia, datos in est.get('puntajes', {}).items():
        if materia not in materias_totales:
            materias_totales[materia] = {'suma': 0, 'count': 0}
        materias_totales[materia]['suma'] += datos.get('puntaje', 0)
        materias_totales[materia]['count'] += 1

for materia, datos in materias_totales.items():
    if datos['count'] > 0:
        stats['promedios'][materia] = round(datos['suma'] / datos['count'], 2)

# Guardar statistics.json
with open(f'{base_path}/statistics.json', 'w', encoding='utf-8') as f:
    json.dump(stats, f, ensure_ascii=False, indent=2)

print(f'statistics.json creado')
print(f'Total estudiantes: {stats["total_estudiantes"]}')
print(f'Distribucion: {stats["distribucion_niveles"]}')
