"""
Genera archivos individuales de estudiantes para SG11-08
"""
import json
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent
SIM_DIR = BASE_DIR / "reportes-sg-next" / "public" / "data" / "simulations" / "SG11-08"
OUTPUT_DIR = SIM_DIR / "estudiantes"

print("Generando archivos individuales SG11-08...")

# Cargar students.json
with open(SIM_DIR / "students.json", "r", encoding="utf-8") as f:
    data = json.load(f)

estudiantes = data.get('students', {})
print(f"Estudiantes: {len(estudiantes)}")

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

for id_est, est in estudiantes.items():
    with open(OUTPUT_DIR / f"{id_est}.json", "w", encoding="utf-8") as f:
        json.dump(est, f, ensure_ascii=False, indent=2)

print(f"[OK] Generados {len(estudiantes)} archivos")
