import pandas as pd
import os
import sys

# Subir 2 niveles: scripts/ranking_analysis -> scripts -> raíz
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
ANALYSIS_DIR = os.path.join(ROOT_DIR, 'data', 'analysis_results')
CSV_PATH = os.path.join(ANALYSIS_DIR, 'rankings_2025_consolidated.csv')
OUTPUT_TXT = os.path.join(ANALYSIS_DIR, 'top_performers.txt')

def find_top_performers():
    if not os.path.exists(CSV_PATH):
        print("CSV file not found!")
        return

    # Load data
    df = pd.read_csv(CSV_PATH)
    
    # Ensure numeric
    numeric_cols = ['Lectura', 'Matematicas', 'Sociales', 'Ciencias', 'Ingles', 'Global']
    for col in numeric_cols:
        df[col] = pd.to_numeric(df[col], errors='coerce')

    with open(OUTPUT_TXT, 'w', encoding='utf-8') as f:
        f.write("--- NATIONAL RECORDS (2025) ---\n")
        
        for col in numeric_cols:
            max_val = df[col].max()
            # Get all rows with this max value
            winners = df[df[col] == max_val]
            
            f.write(f"\n🏆 {col.upper()}: {max_val}\n")
            for _, row in winners.iterrows():
                f.write(f"   - {row['Colegio'].strip()} ({row['Departamento']})\n")
    
    print(f"Top performers saved to {OUTPUT_TXT}")

if __name__ == "__main__":
    find_top_performers()
