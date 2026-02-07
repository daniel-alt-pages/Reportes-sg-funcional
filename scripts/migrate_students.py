"""
Migration script to consolidate individual student JSON files into a unified format.
"""
import json
import os
from pathlib import Path

# Paths
BASE_DIR = Path(r"c:\Users\Daniel\Downloads\ReportesSG-main\ReportesSG-main\reportes-sg-next\public\data")
ESTUDIANTES_DIR = BASE_DIR / "estudiantes"
OUTPUT_DIR = BASE_DIR / "simulations" / "SG11-08"

def migrate_students():
    """Consolidate all individual student JSON files into one unified file."""
    students = {}
    index = []
    
    # Read all individual student files
    for file_path in ESTUDIANTES_DIR.glob("*.json"):
        if file_path.stem.isdigit() or (file_path.stem.replace(".", "").isdigit()):
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    student_data = json.load(f)
                    student_id = file_path.stem
                    students[student_id] = student_data
                    index.append(student_id)
                    print(f"✓ Loaded: {student_id}")
            except Exception as e:
                print(f"✗ Error loading {file_path.name}: {e}")
    
    # Sort index alphabetically
    index.sort()
    
    # Create unified structure
    unified = {
        "version": "1.0.0",
        "simulationId": "SG11-08",
        "students": students,
        "index": index
    }
    
    # Write to output
    output_file = OUTPUT_DIR / "students.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(unified, f, ensure_ascii=False, indent=2)
    
    print(f"\n✅ Created unified file: {output_file}")
    print(f"   Total students: {len(students)}")
    print(f"   File size: {output_file.stat().st_size / 1024 / 1024:.2f} MB")
    
    return len(students)

def migrate_statistics():
    """Copy group statistics to new location."""
    src = BASE_DIR / "estadisticas_grupo.json"
    dst = OUTPUT_DIR / "statistics.json"
    
    if src.exists():
        with open(src, 'r', encoding='utf-8') as f:
            data = json.load(f)
        with open(dst, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"✅ Copied statistics to: {dst}")
    else:
        print(f"⚠ Statistics file not found: {src}")

def migrate_ranking():
    """Copy ranking index to new location."""
    src = BASE_DIR / "ranking_index.json"
    dst = OUTPUT_DIR / "ranking.json"
    
    if src.exists():
        with open(src, 'r', encoding='utf-8') as f:
            data = json.load(f)
        with open(dst, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"✅ Copied ranking to: {dst}")
    else:
        print(f"⚠ Ranking file not found: {src}")

if __name__ == "__main__":
    print("=" * 50)
    print("MIGRATION: Consolidating Student Data")
    print("=" * 50)
    print()
    
    # Ensure output directory exists
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    # Run migrations
    total = migrate_students()
    print()
    migrate_statistics()
    migrate_ranking()
    
    print()
    print("=" * 50)
    print("MIGRATION COMPLETE")
    print("=" * 50)
