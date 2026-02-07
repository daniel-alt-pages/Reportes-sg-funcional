import re

with open('templates/Informe.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Corregir caracteres mal codificados (UTF-8 double encoding)
replacements = {
    'Ã¡': 'á',
    'Ã©': 'é',
    'Ã­': 'í',
    'Ã³': 'ó',
    'Ãº': 'ú',
    'Ã±': 'ñ',
}

for bad, good in replacements.items():
    content = content.replace(bad, good)

with open('templates/Informe.html', 'w', encoding='utf-8') as f:
    f.write(content)

print('Archivo corregido')
