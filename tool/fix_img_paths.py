import os
import re

files_to_fix = [
    r'f:\EFVFINAL\VHA\EFV-F\public\js\profile.js',
    r'f:\EFVFINAL\VHA\EFV-F\public\js\checkout.js',
    r'f:\EFVFINAL\VHA\EFV-F\public\js\cart.js'
]

for file_path in files_to_fix:
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Replacements
    # this.src='img/... -> this.src='${CONFIG.BASE_PATH}assets/images/...'
    content = re.sub(r"this\.src='img/([^']+)'", r"this.src='${CONFIG.BASE_PATH}assets/images/\1'", content)
    # || 'img/... -> || (CONFIG.BASE_PATH + 'assets/images/...')
    content = re.sub(r"\|\|\s*'img/([^']+)'", r"|| (CONFIG.BASE_PATH + 'assets/images/\1')", content)
    # = 'img/... -> = CONFIG.BASE_PATH + 'assets/images/...'
    content = re.sub(r"=\s*'img/([^']+)'", r"= CONFIG.BASE_PATH + 'assets/images/\1'", content)
    # return 'img/... -> return CONFIG.BASE_PATH + 'assets/images/...'
    content = re.sub(r"return\s*'img/([^']+)'", r"return CONFIG.BASE_PATH + 'assets/images/\1'", content)
    # .startsWith('img/')
    content = content.replace(".startsWith('img/')", ".startsWith('assets/images/')")
    
    # cart.js: 'img/placeholder.png' inside ternary object
    content = content.replace(": 'img/placeholder.png'", ": CONFIG.BASE_PATH + 'assets/images/placeholder.png'")
    
    # Other potential:
    content = content.replace("'img/logo.png'", "CONFIG.BASE_PATH + 'assets/images/logo.png'")

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

print('Done fixing JS paths.')
