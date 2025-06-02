from pyramid.view import view_config
from pyramid.httpexceptions import HTTPBadRequest, HTTPOk, HTTPUnauthorized, HTTPConflict
import json # Masih dipakai untuk json.JSONDecodeError
import uuid


# Import fungsi CryptContext dari passlib.context
from passlib.context import CryptContext

# Import fungsi utilitas dari json_utils.py yang ada di paket myapp
from ..json_utils import load_data_from_json, save_data_to_json

# Konfigurasi untuk hashing password
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Nama file untuk database pengguna (akan disimpan di backend/data/users.json)
USERS_DB_FILE = 'users.json'

# (Simulasi) Database pengguna sekarang dimuat dari file JSON
users_db = load_data_from_json(USERS_DB_FILE, {}) # Default ke {} jika file tidak ada/kosong

# sessions_db tetap di memori, tidak perlu disimpan ke file
sessions_db = {} 

@view_config(route_name='api_signup', request_method='POST', renderer='json')
def signup_view(request):
    try:
        data = request.json_body
        name = data.get('name')
        email = data.get('email')
        password = data.get('password')

        if not all([name, email, password]):
            # raise HTTPBadRequest(json_body={'error': 'Nama, email, dan password dibutuhkan.'}) <-- ini cara lama
            # cara baru yang lebih baik jika renderer='json' sudah diset di view_config
            request.response.status_code = 400 
            return {'error': 'Nama, email, dan password dibutuhkan.'}


        if email in users_db:
            request.response.status_code = 409 # Conflict
            return {'error': f'Email {email} sudah terdaftar.'}

        print(f"TODO: HASH PASSWORD INI (dari signup_view): {password}")
        password_hash = pwd_context.hash(password) # Hash password menggunakan passlib
        print(f"Password asli: {password}, Hash yang akan disimpan: {password_hash[:20]}...")

        users_db[email] = {'name': name, 'password_hash': password_hash}
        
        # Simpan perubahan ke file JSON
        save_data_to_json(users_db, USERS_DB_FILE)
        
        print(f"Pengguna baru '{email}' didaftarkan dengan password hash.")

        request.response.status_code = 201 # Created
        return {'message': f'Pengguna {name} berhasil didaftarkan dengan email {email}.'}

    except json.JSONDecodeError:
        request.response.status_code = 400
        return {'error': 'Format JSON tidak valid.'}
    # HTTPBadRequest dan HTTPConflict sudah ditangani dengan set status_code dan return dict
    except Exception as e:
        print(f"Error tak terduga di signup_view: {e}")
        request.response.status_code = 500
        return {'error': 'Terjadi kesalahan pada server.'}


@view_config(route_name='api_login', request_method='POST', renderer='json')
def login_view(request):
    try:
        data = request.json_body
        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            request.response.status_code = 400
            return {'error': 'Email dan password dibutuhkan.'}

        user_data = users_db.get(email)
        
        print(f"TODO: VERIFIKASI PASSWORD INI (dari login_view): {password} VS {user_data.get('password_hash') if user_data else 'USER NOT FOUND'}")

        if user_data and pwd_context.verify(password, user_data['password_hash']): # <-- PERUBAHAN DI SINI
            
            # session_token = str(uuid.uuid4()) # Kita masih pakai token dummy
            # sessions_db[session_token] = email 
            
            session_token_dummy = "dummy-token-for-" + email 
            sessions_db[session_token_dummy] = email # Simpan sesi dummy jika diperlukan nanti

            print(f"User {email} logged in successfully.")

            return { 
                'message': 'Login berhasil!',
                'token': session_token_dummy, # Kirim token dummy
                'user': {'name': user_data['name'], 'email': email}
            }
        else:
            # User tidak ditemukan atau password salah
            print(f"Login gagal untuk email: {email}")
            request.response.status_code = 401 # Unauthorized
            return {'error': 'Email atau password salah.'}

    except json.JSONDecodeError:
        request.response.status_code = 400
        return {'error': 'Format JSON tidak valid.'}
    except Exception as e:
        print(f"Error tak terduga di login_view: {e}")
        request.response.status_code = 500
        return {'error': 'Terjadi kesalahan pada server.'}

@view_config(route_name='home', request_method='GET', renderer='json')
def home_view(request):
    return {'message': 'Selamat datang di Backend API Music Player Asyik.in!'}