#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
upload_to_firestore.py
======================
Sube TODOS los datos de un simulacro a Firestore.
Reemplaza: sync_resultados_finales.py, sync_individual_files.py, FirestoreMigration.tsx

Uso:
    python scripts/upload_to_firestore.py                    # Sube todos los simulacros
    python scripts/upload_to_firestore.py --sim SG11-09      # Solo un simulacro
    python scripts/upload_to_firestore.py --config-only      # Solo actualizar config

Requisitos:
    pip install firebase-admin
    
    Necesitas un archivo de credenciales del service account de Firebase:
    - Ve a Firebase Console > Project Settings > Service Accounts > Generate new private key
    - Guarda el archivo como 'service-account.json' en la raíz del proyecto
    - O usa la variable de entorno GOOGLE_APPLICATION_CREDENTIALS
"""

import json
import os
import sys
import math
import argparse
from pathlib import Path

try:
    import firebase_admin
    from firebase_admin import credentials, firestore
except ImportError:
    print("ERROR: firebase-admin no está instalado.")
    print("Ejecuta: pip install firebase-admin")
    sys.exit(1)

# ============================================
# Configuration
# ============================================

BASE_DIR = Path(__file__).parent.parent
NEXT_DIR = BASE_DIR / "reportes-sg-next"
DATA_DIR = NEXT_DIR / "public" / "data"
SIMS_DIR = DATA_DIR / "simulations"

# Service account - buscar en orden de prioridad
SERVICE_ACCOUNT_PATHS = [
    BASE_DIR / "service-account.json",
    BASE_DIR / "firebase-service-account.json",
    BASE_DIR / "config" / "service-account.json",
]

# Admin emails (los que podrán ver todos los datos desde el panel admin)
ADMIN_EMAILS = [
    "danielaltahona1@gmail.com",
    # Agrega más admins aquí
]

# Firestore document size limit is 1MB, we chunk large arrays
CHUNK_SIZE = 50  # Students per chunk document


def init_firebase():
    """Inicializa Firebase Admin SDK."""
    if firebase_admin._apps:
        return firestore.client()

    # Buscar archivo de credenciales
    cred_path = None
    
    # 1. Variable de entorno
    env_path = os.environ.get('GOOGLE_APPLICATION_CREDENTIALS')
    if env_path and Path(env_path).exists():
        cred_path = env_path
    
    # 2. Archivos conocidos
    if not cred_path:
        for path in SERVICE_ACCOUNT_PATHS:
            if path.exists():
                cred_path = str(path)
                break
    
    if not cred_path:
        print("ERROR: No se encontró el archivo de credenciales de Firebase.")
        print(f"Buscado en: {[str(p) for p in SERVICE_ACCOUNT_PATHS]}")
        print("También puedes usar: GOOGLE_APPLICATION_CREDENTIALS=/ruta/archivo.json")
        sys.exit(1)
    
    print(f"📌 Usando credenciales: {cred_path}")
    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred)
    return firestore.client()


def load_json(path: Path) -> dict:
    """Carga un archivo JSON con manejo de errores."""
    if not path.exists():
        print(f"  ⚠️  No existe: {path}")
        return {}
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)


def upload_config(db, available_simulations: list, active_simulation: str):
    """Sube configuración de la app."""
    print("\n📋 Subiendo configuración...")
    
    # Config de app
    db.collection('config').document('app').set({
        'activeSimulation': active_simulation,
        'availableSimulations': available_simulations,
    })
    print(f"  ✅ config/app: active={active_simulation}, available={available_simulations}")
    
    # Config de admins
    db.collection('config').document('admins').set({
        'emails': ADMIN_EMAILS,
    })
    print(f"  ✅ config/admins: {len(ADMIN_EMAILS)} admin(s)")


def upload_simulation(db, sim_id: str):
    """Sube todos los datos de un simulacro."""
    sim_dir = SIMS_DIR / sim_id
    
    if not sim_dir.exists():
        print(f"  ❌ No existe directorio: {sim_dir}")
        return
    
    print(f"\n{'='*60}")
    print(f"📊 Subiendo simulacro: {sim_id}")
    print(f"{'='*60}")
    
    # 1. Manifest
    upload_manifest(db, sim_id, sim_dir)
    
    # 2. Students (individual documents + admin bulk)
    students_data = upload_students(db, sim_id, sim_dir)
    
    # 3. Statistics
    upload_statistics(db, sim_id, sim_dir)
    
    # 4. Invalidaciones
    upload_invalidaciones(db, sim_id)
    
    return students_data


def upload_manifest(db, sim_id: str, sim_dir: Path):
    """Sube el manifest del simulacro."""
    manifest = load_json(sim_dir / "manifest.json")
    if not manifest:
        manifest = {"id": sim_id, "name": sim_id}
    
    manifest_data = {
        'name': manifest.get('name', sim_id),
        'date': manifest.get('date', ''),
        'totalStudents': manifest.get('totalStudents', 0),
    }
    
    db.collection('simulations').document(sim_id).set(manifest_data)
    print(f"  ✅ Manifest: {manifest_data['name']} ({manifest_data['totalStudents']} estudiantes)")


def upload_students(db, sim_id: str, sim_dir: Path):
    """Sube datos de estudiantes: documentos individuales + bulk para admin."""
    students_file = sim_dir / "students.json"
    data = load_json(students_file)
    
    if not data:
        print(f"  ⚠️  Sin datos de estudiantes")
        return []
    
    # Detectar estructura
    if 'students' in data and isinstance(data['students'], dict):
        estudiantes_dict = data['students']
        estudiantes_list = [data['students'][sid] for sid in data.get('index', data['students'].keys())]
    elif 'estudiantes' in data and isinstance(data['estudiantes'], list):
        estudiantes_list = data['estudiantes']
        estudiantes_dict = {str(e['informacion_personal']['numero_identificacion']): e for e in estudiantes_list}
    else:
        print(f"  ❌ Estructura desconocida en students.json")
        return []
    
    total = len(estudiantes_list)
    print(f"  📤 Subiendo {total} estudiantes...")
    
    # --- A) Documentos individuales en /students/{id}/results/{simId} ---
    batch = db.batch()
    batch_count = 0
    
    for idx, (student_id, student_data) in enumerate(estudiantes_dict.items()):
        student_id = str(student_id).strip()
        if not student_id:
            continue
        
        info = student_data.get('informacion_personal', {})
        email = info.get('correo_electronico', '').lower().strip()
        
        # Perfil del estudiante (documento raíz)
        student_ref = db.collection('students').document(student_id)
        batch.set(student_ref, {
            'email': email,
            'nombre': info.get('nombres', ''),
            'apellidos': info.get('apellidos', ''),
            'numero_identificacion': student_id,
            'institucion': info.get('institucion', ''),
            'telefono': info.get('telefono', ''),
            'municipio': info.get('municipio', ''),
        }, merge=True)  # merge para no sobreescribir otros simulacros
        
        # Resultados del simulacro (sub-documento)
        results_ref = student_ref.collection('results').document(sim_id)
        batch.set(results_ref, student_data)
        
        batch_count += 2  # 2 operaciones por estudiante
        
        # Firestore batch limit: 500 operations
        if batch_count >= 490:
            batch.commit()
            batch = db.batch()
            batch_count = 0
            print(f"    → {idx + 1}/{total} procesados...")
    
    if batch_count > 0:
        batch.commit()
    
    print(f"  ✅ {total} estudiantes individuales subidos")
    
    # --- B) Bulk para admin: /admin_students/{simId}/chunks/{n} ---
    # Dividir en chunks porque Firestore tiene límite de 1MB por documento
    total_chunks = math.ceil(total / CHUNK_SIZE)
    
    for i in range(total_chunks):
        chunk = estudiantes_list[i * CHUNK_SIZE : (i + 1) * CHUNK_SIZE]
        chunk_ref = db.collection('admin_students').document(sim_id).collection('chunks').document(f'chunk_{i:03d}')
        chunk_ref.set({
            'index': i,
            'count': len(chunk),
            'estudiantes': chunk,
        })
    
    print(f"  ✅ Admin bulk: {total_chunks} chunks ({CHUNK_SIZE} est/chunk)")
    
    return estudiantes_list


def upload_statistics(db, sim_id: str, sim_dir: Path):
    """Sube estadísticas grupales."""
    # Intentar estadisticas_grupo.json primero, luego statistics.json
    stats = load_json(sim_dir / "estadisticas_grupo.json")
    if not stats:
        stats = load_json(sim_dir / "statistics.json")
    
    if not stats:
        print(f"  ⚠️  Sin estadísticas")
        return
    
    # Las estadísticas pueden ser grandes, dividir por materia si es necesario
    stats_json = json.dumps(stats, ensure_ascii=False)
    size_kb = len(stats_json.encode('utf-8')) / 1024
    
    if size_kb < 900:  # Menos de 900KB, cabe en un documento
        db.collection('simulations').document(sim_id).collection('data').document('estadisticas').set(stats)
        print(f"  ✅ Estadísticas: {size_kb:.0f}KB en 1 documento")
    else:
        # Dividir por materia
        metadata = stats.get('metadata', {})
        materias = stats.get('materias', {})
        
        db.collection('simulations').document(sim_id).collection('data').document('estadisticas').set({
            'metadata': metadata,
            'materias_keys': list(materias.keys()),
        })
        
        for materia, materia_data in materias.items():
            safe_key = materia.replace(' ', '_').replace('á', 'a').replace('é', 'e').replace('í', 'i').replace('ó', 'o').replace('ú', 'u')
            db.collection('simulations').document(sim_id).collection('data').document(f'estadisticas_{safe_key}').set({
                'materia': materia,
                'data': materia_data,
            })
        
        print(f"  ✅ Estadísticas: {size_kb:.0f}KB divididas en {len(materias) + 1} documentos")


def upload_invalidaciones(db, sim_id: str):
    """Sube invalidaciones."""
    inv_data = load_json(DATA_DIR / "invalidaciones.json")
    
    if not inv_data:
        return
    
    all_items = inv_data.get('invalidaciones', [])
    
    # Filtrar por simulacro (normalizar IDs)
    sim_items = []
    for item in all_items:
        item_sim = item.get('simulacro', '').replace(' ', '').replace('-', '')
        check_sim = sim_id.replace('-', '').replace(' ', '')
        # Match flexible: "S11 S-08" matches "SG11-08", "SG1108", etc.
        if check_sim.replace('SG', 'S11S').replace('11', '11') in item_sim.replace('SG', 'S11S') or \
           item_sim.replace(' ', '').replace('-', '') == check_sim.replace('SG', 'S11S').replace('-', ''):
            sim_items.append(item)
    
    db.collection('simulations').document(sim_id).collection('data').document('invalidaciones').set({
        'items': sim_items,
        'count': len(sim_items),
    })
    
    print(f"  ✅ Invalidaciones: {len(sim_items)} items para {sim_id}")


def main():
    parser = argparse.ArgumentParser(description='Upload data to Firestore')
    parser.add_argument('--sim', type=str, help='Solo subir un simulacro específico (ej: SG11-09)')
    parser.add_argument('--config-only', action='store_true', help='Solo actualizar config')
    args = parser.parse_args()
    
    print("=" * 60)
    print("🔥 UPLOAD TO FIRESTORE")
    print("=" * 60)
    
    db = init_firebase()
    
    # Cargar configuración actual
    current_sim = load_json(DATA_DIR / "current_simulation.json")
    active = current_sim.get('active', 'SG11-09')
    available = current_sim.get('available', [])
    
    # Subir config
    upload_config(db, available, active)
    
    if args.config_only:
        print("\n✅ Config actualizada. Listo.")
        return
    
    # Subir simulacros
    if args.sim:
        upload_simulation(db, args.sim)
    else:
        for sim_id in available:
            upload_simulation(db, sim_id)
    
    print(f"\n{'='*60}")
    print(f"✅ UPLOAD COMPLETADO")
    print(f"{'='*60}")
    print(f"\nPróximos pasos:")
    print(f"  1. Despliega las security rules: firebase deploy --only firestore:rules")
    print(f"  2. Verifica en Firebase Console que los datos están correctos")
    print(f"  3. Actualiza el frontend para usar firestoreService.ts")


if __name__ == '__main__':
    main()
