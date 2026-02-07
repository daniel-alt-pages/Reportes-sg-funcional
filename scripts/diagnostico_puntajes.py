
import sys
import os

# Agregar el directorio raíz al path para importar módulos
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from core.procesar import main as procesar_todo
except ImportError:
    print("Error importando procesar.py. Verificando ruta...")
    # Intento alternativo de importación
    sys.path.append(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'scripts'))
    from core.procesar import main as procesar_todo

def diagnosticar_estudiantes():
    with open('diagnostico_resultado.txt', 'w', encoding='utf-8') as f:
        # Función auxiliar para imprimir en ambos lados
        def log(msg):
            print(msg)
            f.write(str(msg) + "\n")
            
        log("--- INICIANDO DIAGNÓSTICO DE PUNTAJES ---")
    
        try:
            # Ejecutar el procesamiento completo
            log("Ejecutando procesamiento completo...")
            resultado_completo = procesar_todo() 
        
        if not resultado_completo:
            log("El procesamiento no retornó datos.")
            return
            
        estudiantes = resultado_completo.get('estudiantes', {})
        log(f"Tipo de datos 'estudiantes': {type(estudiantes)}")
        
        # Si es una lista, convertir a diccionario por ID para facilitar búsqueda
        if isinstance(estudiantes, list):
            log("Convirtiendo lista de estudiantes a diccionario...")
            estudiantes_dict = {}
            for e in estudiantes:
                # Usar ID o un generador de ID si no tiene
                eid = e.get('id', str(id(e)))
                estudiantes_dict[eid] = e
            estudiantes = estudiantes_dict
            log(f"Convertido: {len(estudiantes)} estudiantes.")
            
        # SELECCIONAR MUESTRA DE ESTUDIANTES PARA DIAGNÓSTICO
        muestras = []
        
        # Buscar casos específicos
        s1_only = [id for id, e in estudiantes.items() if len(e.get('sesiones', [])) == 1 and 'S1' in e.get('sesiones', [])]
        s2_only = [id for id, e in estudiantes.items() if len(e.get('sesiones', [])) == 1 and 'S2' in e.get('sesiones', [])]
        ambas = [id for id, e in estudiantes.items() if len(e.get('sesiones', [])) == 2]
        
        casos = []
        if ambas: casos.append(ambas[0]) # Uno normal
        if s1_only: casos.append(s1_only[0]) # Solo S1
        if s2_only: casos.append(s2_only[0]) # Solo S2
        
        # Agregar uno bajo al azar
        ordenados = sorted(estudiantes.items(), key=lambda x: x[1].get('puntaje_global', 0))
        if ordenados: casos.append(ordenados[0][0])
        
        # Eliminar duplicados
        casos = list(set(casos))
        
        log("\n" + "="*80)
        log(f"ANÁLISIS DETALLADO DE {len(casos)} ESTUDIANTES")
        log("="*80)
        
        for id_est in casos:
            est = estudiantes[id_est]
            nombre = est.get('nombre', 'Desconocido')
            sesiones = est.get('sesiones', [])
            global_score = est.get('puntaje_global', 0)
            
            log(f"\nESTUDIANTE: {nombre} (ID: {id_est})")
            log(f"Sesiones Presentadas: {sesiones}")
            log(f"Puntaje Global: {global_score}")
            log("-" * 80)
            log(f"{'MATERIA':<25} | {'PUNTAJE':<8} | {'CORRECTAS':<10} | {'TOTAL REAL':<10} | {'FALTANTES':<10} | {'% BASE':<8}")
            log("-" * 80)
            
            for materia, datos_mat in est.get('puntajes', {}).items():
                puntaje = datos_mat.get('puntaje', 0)
                correctas = datos_mat.get('correctas', 0)
                total_preg = datos_mat.get('total_preguntas', 0) # Este es el total ajustado
                faltantes = datos_mat.get('preguntas_faltantes', 0)
                
                # Calcular porcentaje base simple
                porc = (correctas / total_preg * 100) if total_preg > 0 else 0
                
                log(f"{materia:<25} | {puntaje:<8} | {correctas:<10} | {total_preg:<10} | {faltantes:<10} | {porc:.1f}%")
                
            log("-" * 80)

    except Exception as e:
        log(f"Error crítico en diagnóstico: {e}")
        import traceback
        traceback.print_exc(file=f)

if __name__ == "__main__":
    diagnosticar_estudiantes()
