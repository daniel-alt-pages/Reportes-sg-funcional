import os
import requests
from pathlib import Path

# Configuration
BASE_DIR = Path(__file__).parent.parent.parent
DATA_DIR = BASE_DIR / "data" / "research"

URLS = {
    "boletin_ed_7.pdf": "https://www.icfes.gov.co/wp-content/uploads/2024/11/Edicion-7-boletin-saber-al-detalle-1.pdf",
    "boletin_ed_8.pdf": "https://www.icfes.gov.co/wp-content/uploads/2025/02/8-Edicion-boletin-saber-al-detalle.pdf",
    "boletin_ed_1.pdf": "https://www.icfes.gov.co/wp-content/uploads/2024/11/Boletin-1-como-se-generan-los-puntajes-en-las-pruebas.pdf",
    "boletin_ed_12.pdf": "https://www.icfes.gov.co/wp-content/uploads/2024/11/Saber-al-Detalle-ED-12-10082023.pdf"
}

def setup_directories():
    if not DATA_DIR.exists():
        print(f"Creating directory: {DATA_DIR}")
        DATA_DIR.mkdir(parents=True, exist_ok=True)

def download_file(url, filename):
    filepath = DATA_DIR / filename
    print(f"Downloading {filename} from {url}...")
    
    try:
        response = requests.get(url, stream=True)
        response.raise_for_status()
        
        with open(filepath, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        print(f"Saved to {filepath}")
        return True
    except Exception as e:
        print(f"Error downloading {filename}: {e}")
        return False

def main():
    setup_directories()
    
    success_count = 0
    for filename, url in URLS.items():
        if download_file(url, filename):
            success_count += 1
            
    if success_count == len(URLS):
        print("\nAll downloads completed successfully.")
    else:
        print(f"\nCompleted {success_count}/{len(URLS)} downloads.")

if __name__ == "__main__":
    main()
