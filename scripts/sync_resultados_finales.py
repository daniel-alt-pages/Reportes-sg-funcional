"""
sync_resultados_finales.py
===========================
Regenera resultados_finales.json a partir de students.json calibrado
para asegurar consistencia entre todas las fuentes de datos.
"""

import json
from pathlib import Path

def sync_simulation(sim_id: str):
    """Sincroniza resultados_finales.json con students.json calibrado."""
    
    base_path = Path(__file__).parent.parent / "reportes-sg-next" / "public" / "data" / "simulations" / sim_id
    students_file = base_path / "students.json"
    resultados_file = base_path / "resultados_finales.json"
    estudiantes_dir = base_path / "estudiantes"
    
    if not students_file.exists():
        print(f"  [!] No existe students.json para {sim_id}")
        return
    
    print(f"\n[{sim_id}] Sincronizando archivos...")
    
    # 1. Cargar students.json (FUENTE DE VERDAD)
    with open(students_file, 'r', encoding='utf-8') as f:
        students_data = json.load(f)
    
    # Detectar estructura
    if 'estudiantes' in students_data and isinstance(students_data['estudiantes'], list):
        estudiantes_list = students_data['estudiantes']
        estudiantes_dict = {str(e['informacion_personal']['numero_identificacion']): e for e in estudiantes_list}
    elif 'students' in students_data and isinstance(students_data['students'], dict):
        estudiantes_dict = students_data['students']
        estudiantes_list = list(estudiantes_dict.values())
    else:
        print(f"  [!] Estructura desconocida en students.json")
        return
    
    print(f"  -> Cargados {len(estudiantes_list)} estudiantes de students.json")
    
    # 2. Regenerar resultados_finales.json
    if resultados_file.exists():
        # Preservar estructura existente pero actualizar datos
        with open(resultados_file, 'r', encoding='utf-8') as f:
            resultados_data = json.load(f)
        
        # Actualizar la lista de estudiantes con los datos calibrados
        resultados_data['estudiantes'] = estudiantes_list
        
        # Verificar cambios
        old_count = len(resultados_data.get('estudiantes', []))
        print(f"  -> Actualizando resultados_finales.json ({old_count} -> {len(estudiantes_list)} estudiantes)")
    else:
        # Crear nuevo archivo
        resultados_data = {
            'simulacro': sim_id,
            'fecha_generacion': '',
            'estudiantes': estudiantes_list
        }
        print(f"  -> Creando nuevo resultados_finales.json")
    
    # Guardar
    with open(resultados_file, 'w', encoding='utf-8') as f:
        json.dump(resultados_data, f, ensure_ascii=False, indent=2)
    
    print(f"  [OK] resultados_finales.json actualizado")
    
    # 3. Sincronizar archivos individuales
    estudiantes_dir.mkdir(exist_ok=True)
    updated = 0
    
    for id_est, datos in estudiantes_dict.items():
        archivo = estudiantes_dir / f"{id_est}.json"
        
        if archivo.exists():
            try:
                with open(archivo, 'r', encoding='utf-8') as f:
                    existing = json.load(f)
                
                if existing.get('puntaje_global') != datos.get('puntaje_global'):
                    updated += 1
            except:
                updated += 1
        else:
            updated += 1
        
        # Escribir archivo
        with open(archivo, 'w', encoding='utf-8') as f:
            json.dump(datos, f, ensure_ascii=False, indent=2)
    
    print(f"  [OK] {updated} archivos individuales actualizados")

def main():
    print("=" * 60)
    print("SINCRONIZACION DE DATOS")
    print("=" * 60)
    
    simulations = ['SG11-08', 'SG11-09']
    
    for sim in simulations:
        sync_simulation(sim)
    
    print("\n" + "=" * 60)
    print("[OK] SINCRONIZACION COMPLETADA")
    print("=" * 60)
    print("\nAhora reconstruye Next.js: npm run build")

if __name__ == "__main__":
    main()
