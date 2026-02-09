import json

# Comparar fórmulas SG11-08 vs actual
print("=== Comparando fórmulas de cálculo ===\n")

# SG11-08 (Rosa)
with open('reportes-sg-next/public/data/simulations/SG11-08/estudiantes/1097912847.json', 'r', encoding='utf-8') as f:
    sg08 = json.load(f)
    
print('--- SG11-08 (Rosa Mendieta) ---')
print('Puntaje Global:', sg08.get('puntaje_global'))
for m, p in sg08.get('puntajes', {}).items():
    correctas = p.get('correctas')
    total = p.get('total_preguntas')
    puntaje = p.get('puntaje')
    porc = p.get('porcentaje_real', (correctas/total*100) if total else 0)
    print(f'  {m}: {correctas}/{total} ({porc:.1f}%) -> {puntaje} pts')

# Verificar la relación entre porcentaje y puntaje
print('\n--- Análisis de la fórmula SG11-08 ---')
for m, p in sg08.get('puntajes', {}).items():
    correctas = p.get('correctas', 0)
    total = p.get('total_preguntas', 1)
    puntaje = p.get('puntaje', 0)
    porc = (correctas/total*100) if total else 0
    # Verificar si es lineal (puntaje ≈ porcentaje)
    diferencia = puntaje - porc
    print(f'  {m}: %={porc:.1f}, puntaje={puntaje}, diff={diferencia:.1f}')
