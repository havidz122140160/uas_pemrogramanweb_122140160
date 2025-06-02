# file: backend/myapp/json_utils.py
import os
import json

# Menentukan direktori DATA_DIR relatif terhadap lokasi file json_utils.py ini
# __file__ adalah path ke json_utils.py
# os.path.dirname(__file__) adalah direktori myapp/
# os.path.join(..., '..', 'data') akan naik satu level ke 'backend/' lalu masuk ke 'data/'
DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')

def ensure_data_dir_exists():
    if not os.path.exists(DATA_DIR):
        os.makedirs(DATA_DIR)
        print(f"Direktori data dibuat di: {DATA_DIR}")

def load_data_from_json(filename, default_data={}):
    filepath = os.path.join(DATA_DIR, filename)
    try:
        if os.path.exists(filepath) and os.path.getsize(filepath) > 0:
            with open(filepath, 'r') as f:
                return json.load(f)
        else:
            print(f"File {filepath} tidak ditemukan atau kosong. Membuat file baru dengan data default.")
            with open(filepath, 'w') as f:
                json.dump(default_data, f, indent=4)
            return default_data
    except (FileNotFoundError, json.JSONDecodeError) as e:
        print(f"Error memuat {filepath} atau file korup: {e}. Menggunakan data default dan membuat file baru.")
        with open(filepath, 'w') as f:
            json.dump(default_data, f, indent=4)
        return default_data

def save_data_to_json(data, filename):
    filepath = os.path.join(DATA_DIR, filename)
    try:
        ensure_data_dir_exists() # Pastikan direktori ada sebelum menyimpan
        with open(filepath, 'w') as f:
            json.dump(data, f, indent=4)
        print(f"Data berhasil disimpan ke {filepath}")
    except Exception as e:
        print(f"Error menyimpan data ke {filepath}: {e}")

# Panggil ensure_data_dir_exists() saat modul ini diimpor pertama kali
ensure_data_dir_exists()