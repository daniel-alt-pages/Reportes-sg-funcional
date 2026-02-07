import pdfplumber
from pathlib import Path
import re

# Configuration
BASE_DIR = Path(__file__).parent.parent.parent
DATA_DIR = BASE_DIR / "data" / "research"
OUTPUT_FILE = DATA_DIR / "analysis_summary.txt"

KEYWORDS = [
    "Modelo",
    "TRI", 
    "Teoría de Respuesta al Ítem",
    "Calificación",
    "Puntaje",
    "Dificultad",
    "Discriminación",
    "Azar",
    "3PL",
    "Logístico",
    "Ponderación",
    # New keywords for Ed 1 and Ed 12
    "Índice Global",
    "Promedio Ponderado",
    "Desviación Estándar",
    "Transformación",
    "Escala",
    "Categoría",
    "Quintil",
    "Plantel",
    "A+", # School category
    "A",  # School category
]

def extract_text_with_context(pdf_path, keywords, context_lines=2):
    results = {}
    print(f"Analyzing {pdf_path.name}...")
    
    try:
        with pdfplumber.open(pdf_path) as pdf:
            full_text = ""
            for i, page in enumerate(pdf.pages):
                text = page.extract_text()
                if text:
                    full_text += text + "\n"
                    
            lines = full_text.split('\n')
            
            for keyword in keywords:
                keyword_matches = []
                for i, line in enumerate(lines):
                    if re.search(r'\b' + re.escape(keyword) + r'\b', line, re.IGNORECASE):
                        start = max(0, i - context_lines)
                        end = min(len(lines), i + context_lines + 1)
                        context = lines[start:end]
                        keyword_matches.append({
                            "page": "unknown", # simplistic line based approach
                            "context": "\n".join(context)
                        })
                if keyword_matches:
                    results[keyword] = keyword_matches
                    
    except Exception as e:
        print(f"Error reading {pdf_path}: {e}")
        
    return results

def main():
    report_lines = []
    
    for pdf_file in DATA_DIR.glob("*.pdf"):
        report_lines.append(f"xxx ANALYSIS OF {pdf_file.name} xxx\n")
        results = extract_text_with_context(pdf_file, KEYWORDS)
        
        for k, matches in results.items():
            report_lines.append(f"--- Keyword: {k} ({len(matches)} matches) ---")
            for m in matches[:5]: # Update to limit to first 5 matches per keyword to avoid huge output
                report_lines.append(f"Context:\n{m['context']}\n")
            if len(matches) > 5:
                report_lines.append(f"... and {len(matches) - 5} more matches.\n")
        
        report_lines.append("\n" + "="*50 + "\n")
        
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        f.write("\n".join(report_lines))
        
    print(f"Analysis complete. Results saved to {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
