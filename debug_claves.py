import pandas as pd
import re
import os

def normalizar_nombre_columna(col):
    col_norm = col.strip()
    if col_norm.startswith('Q') and not col_norm.startswith('Qu'):
        col_norm = col_norm[1:]
    if col_norm.startswith('q') and not col_norm.startswith('qu'):
        col_norm = col_norm[1:]
    col_norm = re.sub(r'(\d+)\.[A-Za-z]?\s*\[', r'\1 [', col_norm)
    col_norm = re.sub(r'\s+', ' ', col_norm).strip()
    return col_norm

# Este es la ruta que usa el script
ruta_claves = 'data/input/SG11 - 09/claves'

claves = {}
archivos = [f for f in os.listdir(ruta_claves) if f.endswith('.csv')]

for archivo in archivos:
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
            
# Ahora simular lo que pasa con la columna de respuestas
columna = 'Ingles Parte 1.B [85.]'
col_normalizada = normalizar_nombre_columna(columna)
clave_correcta = claves.get(columna, '') or claves.get(col_normalizada, '')

print(f"Columna respuesta: {repr(columna)}")
print(f"Columna normalizada: {repr(col_normalizada)}")
print(f"claves.get(columna): {repr(claves.get(columna, ''))}")
print(f"claves.get(col_normalizada): {repr(claves.get(col_normalizada, ''))}")
print(f"clave_correcta final: {repr(clave_correcta)}")
