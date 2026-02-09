import json

with open('reportes-sg-next/public/data/simulations/SG11-09/students.json', 'r', encoding='utf-8') as f:
    data = json.load(f)
    st = data['students'][data['index'][0]]
    ing = st.get('respuestas_detalladas', {}).get('Ingles', {})
    
    print("Keys 80-100:")
    for k in sorted(ing.keys(), key=lambda x: int(x)):
        if int(k) >= 80 and int(k) <= 100:
            clave = ing[k].get("correcta", "")
            print(f"  {k}: clave={clave}")
    
    print("\nPreguntas sin clave (80-134):")
    sin_clave = []
    for k in sorted(ing.keys(), key=lambda x: int(x)):
        if int(k) >= 80:
            clave = ing[k].get("correcta", "")
            if not clave:
                sin_clave.append(k)
    print(sin_clave)
