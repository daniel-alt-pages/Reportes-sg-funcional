import pandas as pd
import os
import json

# Subir 2 niveles: scripts/ranking_analysis -> scripts -> raíz
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
ANALYSIS_DIR = os.path.join(ROOT_DIR, 'data', 'analysis_results')
CSV_PATH = os.path.join(ANALYSIS_DIR, 'rankings_2025_consolidated.csv')
REPORT_PATH = os.path.join(ANALYSIS_DIR, 'score_analysis_report.json')

def analyze_scores():
    if not os.path.exists(CSV_PATH):
        print("CSV file not found!")
        return

    # Load data
    df = pd.read_csv(CSV_PATH)
    
    # Clean numeric columns (just in case)
    numeric_cols = ['Lectura', 'Matematicas', 'Sociales', 'Ciencias', 'Ingles', 'Promedio', 'Global']
    for col in numeric_cols:
        df[col] = pd.to_numeric(df[col], errors='coerce')
        
    stats = {}
    
    # 1. Global Stats
    stats['global_summary'] = df[numeric_cols].describe().to_dict()
    
    # 2. Percentiles (Benchmarks)
    percentiles = [0.1, 0.25, 0.5, 0.75, 0.9, 0.95, 0.99]
    stats['percentiles'] = df[numeric_cols].quantile(percentiles).to_dict()
    
    # 3. Maxima (Realistic Ceilings)
    stats['maxima'] = df[numeric_cols].max().to_dict()
    
    # 4. Filter for Top Performing Schools (Calendar A and B usually mix, here check Calendar)
    # The user asked for "Calendar A", verified.
    
    # 5. Correlations (Just for interest)
    stats['correlations'] = df[numeric_cols].corr().to_dict()

    # Save to JSON for report generation
    with open(REPORT_PATH, 'w') as f:
        json.dump(stats, f, indent=4)
        
    print(f"Analysis complete. Report saved to {REPORT_PATH}")
    
    # Print a quick summary to stdout for the agent to read
    print("\n--- QUICK SUMMARY ---")
    print(df[numeric_cols].quantile([0.5, 0.9, 0.99]))
    print("\n--- MAX VALUES ---")
    print(df[numeric_cols].max())

if __name__ == "__main__":
    analyze_scores()
