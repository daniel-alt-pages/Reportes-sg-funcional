import json

# SG11-09 (ruta general)
with open('reportes-sg-next/public/data/estudiantes/1097912847.json', 'r', encoding='utf-8') as f:
    data = json.load(f)
    
print('=== Rosa Mendieta - SG11-09 ===')
print('Puntaje Global:', data.get('puntaje_global'))
for m, p in data.get('puntajes', {}).items():
    correctas = p.get('correctas')
    total = p.get('total_preguntas')
    puntaje = p.get('puntaje')
    print(f'  {m}: {correctas}/{total} -> {puntaje} pts')
