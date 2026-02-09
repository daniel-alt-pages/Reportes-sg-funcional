import json
import os

# Verificar auth_index
with open('reportes-sg-next/public/data/auth_index.json', 'r', encoding='utf-8') as f:
    auth = json.load(f)

debug = [e for e in auth if e['e'] == 'agenteno11sg@gmail.com']
print('Auth entry:', debug)

if debug:
    id_est = debug[0]['i']
    print(f'ID: {id_est}')
    
    # Verificar archivos
    paths = [
        f'reportes-sg-next/public/data/simulations/SG11-08/estudiantes/{id_est}.json',
        f'reportes-sg-next/public/data/simulations/SG11-09/estudiantes/{id_est}.json',
    ]
    for p in paths:
        exists = os.path.exists(p)
        status = "EXISTE" if exists else "NO EXISTE"
        print(f'{p}: {status}')
