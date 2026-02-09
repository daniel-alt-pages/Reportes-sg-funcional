"""
sync_individual_files.py
=========================
Sincroniza los archivos individuales de estudiantes con students.json
para asegurar que todos tengan los puntajes calibrados correctamente.
"""

import json
import os
from pathlib import Path

def sync_simulation(sim_id: str):
    """Sincroniza los archivos individuales de un simulacro."""
    
    base_path = Path(__file__).parent.parent / "reportes-sg-next" / "public" / "data" / "simulations" / sim_id
    students_file = base_path / "students.json"
    estudiantes_dir = base_path / "estudiantes"
    
    if not students_file.exists():
        print(f"  [!] No existe students.json para {sim_id}")
        return
        
    # Cargar students.json
    with open(students_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Detectar estructura (array o object)
    if 'estudiantes' in data and isinstance(data['estudiantes'], list):
        estudiantes = {str(e['informacion_personal']['numero_identificacion']): e for e in data['estudiantes']}
    elif 'students' in data and isinstance(data['students'], dict):
        estudiantes = data['students']
    else:
        print(f"  [!] Estructura desconocida en students.json")
        return
    
    print(f"\n[{sim_id}] Sincronizando {len(estudiantes)} estudiantes...")
    
    # Crear directorio si no existe
    estudiantes_dir.mkdir(exist_ok=True)
    
    updated = 0
    created = 0
    
    for id_est, datos in estudiantes.items():
        archivo = estudiantes_dir / f"{id_est}.json"
        
        # Verificar si el archivo existe y tiene puntaje diferente
        if archivo.exists():
            try:
                with open(archivo, 'r', encoding='utf-8') as f:
                    existing = json.load(f)
                
                # Comparar puntaje global
                if existing.get('puntaje_global') != datos.get('puntaje_global'):
                    print(f"    [{id_est}] Actualizado: {existing.get('puntaje_global')} -> {datos.get('puntaje_global')}")
                    updated += 1
                else:
                    continue  # Ya está sincronizado
            except:
                pass
        else:
            created += 1
        
        # Escribir archivo actualizado
        with open(archivo, 'w', encoding='utf-8') as f:
            json.dump(datos, f, ensure_ascii=False, indent=2)
    
    print(f"  [OK] Creados: {created}, Actualizados: {updated}")

def main():
    print("=" * 60)
    print("SINCRONIZACIÓN DE ARCHIVOS INDIVIDUALES")
    print("=" * 60)
    
    # Sincronizar todos los simulacros
    simulations = ['SG11-08', 'SG11-09']
    
    for sim in simulations:
        sync_simulation(sim)
    
    print("\n" + "=" * 60)
    print("[OK] SINCRONIZACION COMPLETADA")
    print("=" * 60)

if __name__ == "__main__":
    main()
