import pdfplumber
import os
import csv
import re

# Subir 2 niveles: scripts/ranking_analysis -> scripts -> raíz
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
BASE_DIR = os.path.join(ROOT_DIR, 'data', 'rankings_2025')
OUTPUT_CSV = os.path.join(ROOT_DIR, 'data', 'analysis_results', 'rankings_2025_consolidated.csv')

# Regex to capture the row structure
# Groups: 1:Rank, 2:Code, 3:Name, 4:Cal, 5:Count, 6:Lec, 7:Mat, 8:Soc, 9:Cie, 10:Ing, 11:Avg, 12:Global
PATTERN = re.compile(r'^(\d+)\s+(\d+)\s+(.+?)\s+([AB])\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+([\d,]+)\s+(\d+)')

def clean_score(value):
    if not value:
        return 0.0
    try:
        val_str = str(value).strip().replace(',', '.')
        return float(val_str)
    except ValueError:
        return 0.0

def process_pdf(pdf_path, writer):
    dept_name = os.path.splitext(os.path.basename(pdf_path))[0]
    print(f"Processing {dept_name}...")
    
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            text = page.extract_text()
            if not text:
                continue
                
            for line in text.split('\n'):
                match = PATTERN.match(line.strip())
                if match:
                    groups = match.groups()
                    rank = groups[0]
                    code = groups[1]
                    name = groups[2].strip()
                    calendar = groups[3]
                    
                    lectura = clean_score(groups[5])
                    matematicas = clean_score(groups[6])
                    sociales = clean_score(groups[7])
                    ciencias = clean_score(groups[8])
                    ingles = clean_score(groups[9])
                    promedio = clean_score(groups[10])
                    global_score = clean_score(groups[11])
                    
                    writer.writerow([
                        dept_name, rank, code, name, calendar, 
                        lectura, matematicas, sociales, ciencias, ingles, 
                        promedio, global_score
                    ])

if __name__ == "__main__":
    with open(OUTPUT_CSV, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['Departamento', 'Puesto', 'Codigo', 'Colegio', 'Calendario', 
                         'Lectura', 'Matematicas', 'Sociales', 'Ciencias', 'Ingles', 
                         'Promedio', 'Global'])
        
        for filename in os.listdir(BASE_DIR):
            if filename.lower().endswith(".pdf"):
                process_pdf(os.path.join(BASE_DIR, filename), writer)
                
    print(f"Extraction complete. Saved to {OUTPUT_CSV}")
