
import pandas as pd
import numpy as np

def simular_curva():
    print("=== SIMULACIÓN DE CURVA DE PUNTAJES (0 a 10 Errores) ===")
    print("Parametros actuales:")
    
    # CONFIGURACIÓN ACTUAL (Copiada de procesar.py)
    TOPES_1_ERROR = {
        'matemáticas': 86,
        'lectura crítica': 81,
        'sociales y ciudadanas': 82,
        'ciencias naturales': 84,
        'inglés': 86
    }
    
    PENALIDAD_POR_ERROR = {
        'matemáticas': 2,
        'lectura crítica': 2,
        'sociales y ciudadanas': 2,
        'ciencias naturales': 2,
        'inglés': 2
    }
    
    # Estructura del examen
    PREGUNTAS_POR_MATERIA = {
        'lectura crítica': {'S1': 41, 'S2': 0},
        'matemáticas': {'S1': 25, 'S2': 25},
        'sociales y ciudadanas': {'S1': 25, 'S2': 25},
        'ciencias naturales': {'S1': 29, 'S2': 29},
        'inglés': {'S1': 0, 'S2': 55}
    }

    def calcular_puntaje_simulado(materia, num_errores, tipo_error='MEDIA'):
        # Simulación de variables
        total_s1 = PREGUNTAS_POR_MATERIA[materia]['S1']
        total_s2 = PREGUNTAS_POR_MATERIA[materia]['S2']
        total_preguntas = total_s1 + total_s2
        
        # Asumimos que presenta ambas sesiones
        preguntas_faltantes = 0
        total_ajustado = total_preguntas
        
        correctas = total_preguntas - num_errores
        
        # 1. Calcular Puntaje Base Ponderado (Simulado simplificado)
        # Asumimos peso 1 para todas para ver la curva base
        max_score_posible = total_preguntas * 1
        score_ponderado = correctas * 1
        
        if max_score_posible > 0:
            base_score = (score_ponderado / max_score_posible) * 100
        else:
            base_score = 0
            
        # 2. Penalización por inconsistencia (Simulado)
        # Asumimos que no hay inconsistencia grave en la simulación estándar
        penalizacion = 0 
        
        puntaje_final = max(0, base_score - penalizacion)
        
        # 3. Topes Deslizantes
        costo_errores = 0
        
        # Simular costos según tipo de error
        # MUY_FACIL=1.3, FACIL=1.1, MEDIA=1.0, DIFICIL=0.7, MUY_DIFICIL=0.5
        factor_costo = 1.0 # Default MEDIA
        if tipo_error == 'CASCARA': factor_costo = 1.3
        elif tipo_error == 'DIFICIL': factor_costo = 0.7
        
        costo_errores = num_errores * factor_costo
        
        tope_1_error = TOPES_1_ERROR.get(materia, 88)
        penal_error = PENALIDAD_POR_ERROR.get(materia, 2)
        
        if num_errores == 0:
            pass # 100
        else:
            # Formula extraída de procesar.py
            tope_calculado = tope_1_error - ((costo_errores - 1) * penal_error)
            tope_calculado = max(40, tope_calculado)
            puntaje_final = min(puntaje_final, tope_calculado)
            
        return int(round(puntaje_final))

    # Generar tabla
    materias = ['lectura crítica', 'matemáticas', 'inglés'] # Muestra representativa
    
    print(f"\n{'ERROR':<5} | {'MAT (50p)':<10} | {'LEC (41p)':<10} | {'ING (55p)':<10} | {'DIFERENCIA'}")
    print("-" * 60)
    
    prev_scores = {m: 100 for m in materias}
    
    for errores in range(11):
        row_str = f"{errores:<5} | "
        diffs = []
        
        current_scores = {}
        for materia in materias:
            score = calcular_puntaje_simulado(materia, errores, tipo_error='MEDIA')
            current_scores[materia] = score
            
            # Formato: Score (Diff)
            diff = score - prev_scores[materia]
            diff_str = f"({diff})" if errores > 0 else ""
            
            row_str += f"{score:<3} {diff_str:<6} | "
            
        print(row_str)
        prev_scores = current_scores

    print("\nNOTA: Simulación asumiendo errores en preguntas de dificultad MEDIA.")
    print("      Si falla preguntas 'Cáscara', el puntaje bajará más rápido.")
    print("      Si falla preguntas 'Difíciles', el puntaje bajará más lento.")

if __name__ == "__main__":
    simular_curva()
