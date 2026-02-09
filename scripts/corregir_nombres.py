"""
CORREGIR NOMBRES - Script para intentar reparar caracteres corruptos
=====================================================================
Intenta reemplazar caracteres de reemplazo (�) por los caracteres más probables.
"""

import json
import unicodedata
import re
from pathlib import Path

# Mapeo de caracteres corruptos comunes a sus versiones correctas
# Basado en patrones típicos de errores de codificación latin-1 -> utf-8
CORRECCIONES = {
    '�': '',  # Eliminar caracteres de reemplazo
    # Patrones comunes de corrupción
    'Ã¡': 'á', 'Ã©': 'é', 'Ã­': 'í', 'Ã³': 'ó', 'Ãº': 'ú',
    'Ã±': 'ñ', 'Ã': 'Á', 'Ã': 'É', 'Ã': 'Í', 'Ã': 'Ó',
    'Ã': 'Ú', 'Ã': 'Ñ', 'Ã¼': 'ü', 'Ã': 'Ü',
    # Caracteres de reemplazo con contexto
}

def limpiar_nombre(texto):
    """Intenta limpiar y normalizar un nombre corrupto."""
    if not texto:
        return ""
    
    # Si tiene replacement character, intentar limpiar
    if '�' in texto:
        # Reemplazar el replacement character por vacío
        texto = texto.replace('�', '')
        # Limpiar espacios dobles resultantes
        texto = ' '.join(texto.split())
    
    # Capitalizar correctamente
    palabras = texto.split()
    resultado = []
    for palabra in palabras:
        # Excepciones para preposiciones comunes en español
        if palabra.lower() in ['de', 'del', 'la', 'las', 'los', 'el', 'y', 'e']:
            resultado.append(palabra.lower())
        else:
            resultado.append(palabra.capitalize())
    
    return ' '.join(resultado)

# Cargar datos
BASE_DIR = Path(__file__).parent.parent
SIM_DIR = BASE_DIR / "reportes-sg-next" / "public" / "data" / "simulations" / "SG11-09"

print("Cargando datos...")
with open(SIM_DIR / "students.json", "r", encoding="utf-8") as f:
    data = json.load(f)

# Procesar todos los estudiantes
contador = 0
corregidos = 0

for id_est, est in data['students'].items():
    info = est.get('informacion_personal', {})
    
    nombres_original = info.get('nombres', '')
    apellidos_original = info.get('apellidos', '')
    
    nombres_limpio = limpiar_nombre(nombres_original)
    apellidos_limpio = limpiar_nombre(apellidos_original)
    
    # Verificar si hubo cambios
    if nombres_limpio != nombres_original or apellidos_limpio != apellidos_original:
        corregidos += 1
        print(f"  [{corregidos}] {nombres_original} {apellidos_original} -> {nombres_limpio} {apellidos_limpio}")
    
    info['nombres'] = nombres_limpio
    info['apellidos'] = apellidos_limpio
    info['nombre_completo'] = f"{nombres_limpio} {apellidos_limpio}".strip()
    
    contador += 1

print(f"\nProcesados: {contador}")
print(f"Corregidos: {corregidos}")

# Guardar
with open(SIM_DIR / "students.json", "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"Archivo guardado.")

# Mostrar algunos ejemplos
print("\nEJEMPLOS DE NOMBRES:")
for id in data['index'][:10]:
    nombre = data['students'][id]['informacion_personal']['nombre_completo']
    print(f"  - {nombre}")
