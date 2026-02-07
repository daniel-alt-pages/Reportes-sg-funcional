import os
import requests

# Base directory for downloads (subir 2 niveles: scripts/ranking_analysis -> scripts -> raíz)
BASE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'data', 'rankings_2025')
os.makedirs(BASE_DIR, exist_ok=True)

# List of Departments and their PDF URLs
departments = {
    "Amazonas": "https://miltonochoa.com.co/web/Ranking/Ranking%20Calendario%20AB%20%282025%29/A/dpto/Ponderado%20Amazonas.pdf",
    "Antioquia": "https://miltonochoa.com.co/web/Ranking/Ranking%20Calendario%20AB%20%282025%29/A/dpto/Ponderado%20Antioquia.pdf",
    "Arauca": "https://miltonochoa.com.co/web/Ranking/Ranking%20Calendario%20AB%20%282025%29/A/dpto/Ponderado%20Arauca.pdf",
    "Atlantico": "https://miltonochoa.com.co/web/Ranking/Ranking%20Calendario%20AB%20%282025%29/A/dpto/Ponderado%20Atlantico.pdf",
    "Bogota": "https://miltonochoa.com.co/web/Ranking/Ranking%20Calendario%20AB%20%282025%29/A/dpto/Ponderado%20Bogota.pdf",
    "Bolivar": "https://miltonochoa.com.co/web/Ranking/Ranking%20Calendario%20AB%20%282025%29/A/dpto/Ponderado%20Bolivar.pdf",
    "Boyaca": "https://miltonochoa.com.co/web/Ranking/Ranking%20Calendario%20AB%20%282025%29/A/dpto/Ponderado%20Boyaca.pdf",
    "Caldas": "https://miltonochoa.com.co/web/Ranking/Ranking%20Calendario%20AB%20%282025%29/A/dpto/Ponderado%20Caldas.pdf",
    "Caqueta": "https://miltonochoa.com.co/web/Ranking/Ranking%20Calendario%20AB%20%282025%29/A/dpto/Ponderado%20Caqueta.pdf",
    "Casanare": "https://miltonochoa.com.co/web/Ranking/Ranking%20Calendario%20AB%20%282025%29/A/dpto/Ponderado%20Casanare.pdf",
    "Cauca": "https://miltonochoa.com.co/web/Ranking/Ranking%20Calendario%20AB%20%282025%29/A/dpto/Ponderado%20Cauca.pdf",
    "Cesar": "https://miltonochoa.com.co/web/Ranking/Ranking%20Calendario%20AB%20%282025%29/A/dpto/Ponderado%20Cesar.pdf",
    "Choco": "https://miltonochoa.com.co/web/Ranking/Ranking%20Calendario%20AB%20%282025%29/A/dpto/Ponderado%20Choco.pdf",
    "Cordoba": "https://miltonochoa.com.co/web/Ranking/Ranking%20Calendario%20AB%20%282025%29/A/dpto/Ponderado%20Cordoba.pdf",
    "Cundinamarca": "https://miltonochoa.com.co/web/Ranking/Ranking%20Calendario%20AB%20%282025%29/A/dpto/Ponderado%20Cundinamarca.pdf",
    "Guainia": "https://miltonochoa.com.co/web/Ranking/Ranking%20Calendario%20AB%20%282025%29/A/dpto/Ponderado%20Guainia.pdf",
    "Guaviare": "https://miltonochoa.com.co/web/Ranking/Ranking%20Calendario%20AB%20%282025%29/A/dpto/Ponderado%20Guaviare.pdf",
    "Huila": "https://miltonochoa.com.co/web/Ranking/Ranking%20Calendario%20AB%20%282025%29/A/dpto/Ponderado%20Huila.pdf",
    "La_Guajira": "https://miltonochoa.com.co/web/Ranking/Ranking%20Calendario%20AB%20%282025%29/A/dpto/Ponderado%20La%20Guajira.pdf",
    "Magdalena": "https://miltonochoa.com.co/web/Ranking/Ranking%20Calendario%20AB%20%282025%29/A/dpto/Ponderado%20Magdalena.pdf",
    "Meta": "https://miltonochoa.com.co/web/Ranking/Ranking%20Calendario%20AB%20%282025%29/A/dpto/Ponderado%20Meta.pdf",
    "Narino": "https://miltonochoa.com.co/web/Ranking/Ranking%20Calendario%20AB%20%282025%29/A/dpto/Ponderado%20Nari%C3%B1o.pdf",
    "Norte_de_Santander": "https://miltonochoa.com.co/web/Ranking/Ranking%20Calendario%20AB%20%282025%29/A/dpto/Ponderado%20Norte%20de%20Santander.pdf",
    "Putumayo": "https://miltonochoa.com.co/web/Ranking/Ranking%20Calendario%20AB%20%282025%29/A/dpto/Ponderado%20Putumayo.pdf",
    "Quindio": "https://miltonochoa.com.co/web/Ranking/Ranking%20Calendario%20AB%20%282025%29/A/dpto/Ponderado%20Quindio.pdf",
    "Risaralda": "https://miltonochoa.com.co/web/Ranking/Ranking%20Calendario%20AB%20%282025%29/A/dpto/Ponderado%20Risaralda.pdf",
    "San_Andres": "https://miltonochoa.com.co/web/Ranking/Ranking%20Calendario%20AB%20%282025%29/A/dpto/Ponderado%20San%20Andres%20y%20Providencia.pdf",
    "Santander": "https://miltonochoa.com.co/web/Ranking/Ranking%20Calendario%20AB%20%282025%29/A/dpto/Ponderado%20Santander.pdf",
    "Sucre": "https://miltonochoa.com.co/web/Ranking/Ranking%20Calendario%20AB%20%282025%29/A/dpto/Ponderado%20Sucre.pdf",
    "Tolima": "https://miltonochoa.com.co/web/Ranking/Ranking%20Calendario%20AB%20%282025%29/A/dpto/Ponderado%20Tolima.pdf",
    "Valle_del_Cauca": "https://miltonochoa.com.co/web/Ranking/Ranking%20Calendario%20AB%20%282025%29/A/dpto/Ponderado%20Valle%20del%20Cauca.pdf",
    "Vaupes": "https://miltonochoa.com.co/web/Ranking/Ranking%20Calendario%20AB%20%282025%29/A/dpto/Ponderado%20Vaupes.pdf",
    "Vichada": "https://miltonochoa.com.co/web/Ranking/Ranking%20Calendario%20AB%20%282025%29/A/dpto/Ponderado%20Vichada.pdf",
}

def download_pdf(name, url):
    try:
        response = requests.get(url, verify=False)
        response.raise_for_status()
        
        file_path = os.path.join(BASE_DIR, f"{name}.pdf")
        with open(file_path, 'wb') as f:
            f.write(response.content)
        print(f"✅ Downloaded: {name}")
    except Exception as e:
        print(f"❌ Failed to download {name}: {e}")

if __name__ == "__main__":
    print(f"Downloading PDFs to {BASE_DIR}...")
    # Suppress SSL warnings for this script as some legacy sites might have cert issues
    import urllib3
    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
    
    for dept, url in departments.items():
        download_pdf(dept, url)
        
    print("Download process completed.")
