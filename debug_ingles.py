#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Debug script para verificar el procesamiento de claves de Inglés
"""

import pandas as pd
import json
import os
import re

def normalizar_nombre_columna(col):
    """Normaliza el nombre de columna para hacer coincidir claves y respuestas"""
    col_norm = col.strip()
    if col_norm.startswith('Q') and not col_norm.startswith('Qu'):
        col_norm = col_norm[1:]
    if col_norm.startswith('q') and not col_norm.startswith('qu'):
        col_norm = col_norm[1:]
    col_norm = re.sub(r'(\d+)\.[A-Za-z]?\s*\[', r'\1 [', col_norm)
    col_norm = re.sub(r'\s+', ' ', col_norm).strip()
    return col_norm

# Cargar claves
ruta_claves = 'data/input/SG11 - 09/claves'
claves = {}
for archivo in os.listdir(ruta_claves):
    if archivo.endswith('.csv'):
        ruta = os.path.join(ruta_claves, archivo)
        df = pd.read_csv(ruta)
        columnas = df.columns.tolist()
        respuestas = df.iloc[0].tolist()
        
        for col, resp in zip(columnas, respuestas):
            match = re.search(r'\[(\d+)\.?\]', col)
            if match:
                clave_valor = str(resp).strip().upper() if pd.notna(resp) else ''
                claves[col] = clave_valor
                claves[normalizar_nombre_columna(col)] = clave_valor

print(f"Total claves cargadas: {len(claves)}")

# Procesar un estudiante de la sesión 2
ruta_respuestas = 'data/input/SG11 - 09/respuestas/SESION 2 - S11 S-09 (Respuestas) - Respuestas de formulario 1.csv'
df = pd.read_csv(ruta_respuestas)

print(f"\nProcesando primera fila...")
fila = df.iloc[0]

# Procesar solo columnas de Inglés
for columna in df.columns:
    if '[' not in columna or ']' not in columna:
        continue
    
    if 'ingl' not in columna.lower():
        continue
    
    # extraer número de pregunta
    match = re.search(r'\[(\d+)\.\]', columna)
    if not match:
        continue
    
    num = match.group(1)
    if int(num) not in [85, 86, 87, 88, 89, 90]:
        continue
    
    respuesta_estudiante = str(fila.get(columna, '')).strip().upper() if pd.notna(fila.get(columna)) else ''
    col_normalizada = normalizar_nombre_columna(columna)
    clave_correcta = claves.get(columna, '') or claves.get(col_normalizada, '')
    
    print(f"\nQ{num}:")
    print(f"  Columna: {columna}")
    print(f"  Normalizada: {col_normalizada}")
    print(f"  Respuesta estudiante: {respuesta_estudiante}")
    print(f"  claves[columna]: '{claves.get(columna, '')}'")
    print(f"  claves[normalizada]: '{claves.get(col_normalizada, '')}'")
    print(f"  Clave final: {clave_correcta}")
