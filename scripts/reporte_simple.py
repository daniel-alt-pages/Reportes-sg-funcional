
import json
import os
from pathlib import Path

def generar_reporte():
    base_dir = Path(__file__).parent.parent
    json_path = base_dir / "output" / "resultados_finales.json"
    
    if not json_path.exists():
        print(f"Error: No se encontró el archivo {json_path}")
        return

    try:
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        estudiantes_list = data.get('estudiantes', [])
        if isinstance(estudiantes_list, dict):
            estudiantes = estudiantes_list
        else:
            # Es una lista, convertir a dict usando ID
            estudiantes = {str(e.get('id', i)): e for i, e in enumerate(estudiantes_list)}
            
        print(f"Total estudiantes cargados: {len(estudiantes)}")
        
        # Clasificar estudiantes
        s1_only = []
        s2_only = []
        completos = []
        
        for id_est, est in estudiantes.items():
            sesiones = est.get('sesiones', [])
            if len(sesiones) == 2:
                completos.append(id_est)
            elif 'S1' in sesiones:
                s1_only.append(id_est)
            elif 'S2' in sesiones:
                s2_only.append(id_est)
                
        # Seleccionar muestra representativa
        muestras = []
        if s1_only: muestras.append(s1_only[0])
        if s2_only: muestras.append(s2_only[0])
        if completos: muestras.append(completos[0])
        
        # Agregar uno con puntaje bajo
        bajos = sorted(estudiantes.items(), key=lambda x: x[1].get('puntaje_global', 0))
        if bajos: muestras.append(bajos[0][0])
        
        casos_unicos = list(set(muestras))
        
        print("\n" + "="*90)
        print(f"REPORTE DETALLADO DE PUNTAJES Y ERRORES ({len(casos_unicos)} casos representativos)")
        print("="*90)
        
        for id_est in casos_unicos:
            est = estudiantes[id_est]
            nombre = est.get('nombre', 'Desconocido')
            sesiones = est.get('sesiones', [])
            global_score = est.get('puntaje_global', 0)
            
            print(f"\nESTUDIANTE: {nombre}")
            print(f"ID: {id_est}")
            print(f"Sesiones: {sesiones}")
            print(f"Puntaje Global: {global_score}/500")
            
            print("-" * 90)
            encabezado = f"{'MATERIA':<25} | {'PUNTAJE':<8} | {'CORRECTAS':<10} | {'TOTAL REAL':<10} | {'FALTANTES':<10} | {'EFECTIVIDAD'}"
            print(encabezado)
            print("-" * 90)
            
            materias_orden = ['lectura crítica', 'matemáticas', 'sociales y ciudadanas', 'ciencias naturales', 'inglés']
            
            for materia in materias_orden:
                datos_mat = est['puntajes'].get(materia, {})
                
                puntaje = datos_mat.get('puntaje', 0)
                correctas = datos_mat.get('correctas', 0)
                total_preg = datos_mat.get('total_preguntas', 0)
                faltantes = datos_mat.get('preguntas_faltantes', 0)
                
                porc = (correctas / total_preg * 100) if total_preg > 0 else 0
                
                print(f"{materia:<25} | {puntaje:<8} | {correctas:<10} | {total_preg:<10} | {faltantes:<10} | {porc:.1f}%")
            print("-" * 90)

    except Exception as e:
        print(f"Error al leer JSON: {e}")

if __name__ == "__main__":
    generar_reporte()
