import pdfplumber
import os
import re

BASE_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'rankings_2025')
pdf_path = os.path.join(BASE_DIR, "Amazonas.pdf")

print(f"Inspecting {pdf_path}...")

# Regex pattern
# 1    001000501    COL NAVAL AF-41...    A    7    60    57    53    51    58    55,462    277
# Capture groups:
# 1: Rank (digits)
# 2: Code (digits)
# 3: Name (Non-greedy match until Calendar)
# 4: Calendar (A or B)
# 5: Evaluated (digits)
# 6: Lec
# 7: Mat
# 8: Soc
# 9: Cie
# 10: Ing
# 11: Avg (digits + comma + digits)
# 12: Global (digits)
pattern = re.compile(r'^(\d+)\s+(\d+)\s+(.+?)\s+([AB])\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+([\d,]+)\s+(\d+)')

with pdfplumber.open(pdf_path) as pdf:
    first_page = pdf.pages[0]
    text = first_page.extract_text()
    
    print("\n--- REGEX MATCHING ---")
    for line in text.split('\n'):
        match = pattern.match(line.strip())
        if match:
            print(f"MATCH: {match.groups()}")
        else:
            # print(f"NO MATCH: {line[:50]}...") # Too verbose
            pass
            
    # Also check Bogota
    print("\n--- BOGOTA CHECK ---")

pdf_path_bog = os.path.join(BASE_DIR, "Bogota.pdf")
with pdfplumber.open(pdf_path_bog) as pdf:
    first_page = pdf.pages[0]
    text = first_page.extract_text()
    count = 0
    for line in text.split('\n'):
        match = pattern.match(line.strip())
        if match:
            count += 1
            if count < 3:
                print(f"BOG MATCH: {match.groups()}")
    print(f"Total Matches in Bogota Pg1: {count}")
