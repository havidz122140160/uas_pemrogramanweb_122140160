# file: backend/myapp/views/playlist_views.py

from pyramid.view import view_config
from pyramid.httpexceptions import HTTPOk, HTTPNotFound, HTTPCreated, HTTPBadRequest, HTTPNoContent
import json
import uuid

# Import fungsi utilitas dari json_utils.py
from ..json_utils import load_data_from_json, save_data_to_json

# Import sessions_db dari .auth_views
from .auth_views import sessions_db

# Nama file untuk data playlist dan lagu (akan disimpan di backend/data/)
PLAYLISTS_DB_FILE = 'playlists.json'
ALL_SONGS_DB_FILE = 'songs.json'

# --- Data default jika file JSON belum ada ---
DEFAULT_ALL_SONGS_DB = {
    's1': {'id': 's1', 'title': 'Mau Dibawa Kemana', 'artist': 'Armada', 'url': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3'},
    's2': {'id': 's2', 'title': 'Senyumlah', 'artist': 'Andmesh', 'url': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3'},
    's3': {'id': 's3', 'title': 'Lemon', 'artist': 'Kenzhi Yonezu', 'url': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'},
    's4': {'id': 's4', 'title': 'Wind', 'artist': 'Akeboshi', 'url': 'URL_MUSIK_DUMMY_4.mp3'},
    's5': {'id': 's5', 'title': 'Sparkle', 'artist': 'RADWIMPS', 'url': 'URL_MUSIK_DUMMY_5.mp3'},
    's6': {'id': 's6', 'title': 'Blur', 'artist': 'Yorushika', 'url': 'URL_MUSIK_DUMMY_6.mp3'},
    's7': {'id': 's7', 'title': 'Halu', 'artist': 'Feby Putri', 'url': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3'},
    's8': {'id': 's8', 'title': 'To The Bone', 'artist': 'Pamungkas', 'url': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3'},
    's9': {'id': 's9', 'title': 'Secukupnya', 'artist': 'Hindia', 'url': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3'},
    's10': {'id': 's10', 'title': 'Monokrom', 'artist': 'Tulus', 'url': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3'}
}
DEFAULT_PLAYLISTS_DB = {
    'pl1': {'id': 'pl1', 'name': 'Playlist Pop Indonesia Hits', 'song_ids': ['s1', 's2', 's9', 's10']},
    'pl2': {'id': 'pl2', 'name': 'Santai Sore OST Anime', 'song_ids': ['s3', 's4', 's5', 's6']},
    'pl3': {'id': 'pl3', 'name': 'Indie Favorit', 'song_ids': ['s7', 's8']},
}
# -------------------------------------------

# Muat data dari file JSON, gunakan data default jika file tidak ada/kosong
ALL_SONGS_DB = load_data_from_json(ALL_SONGS_DB_FILE, DEFAULT_ALL_SONGS_DB)
PLAYLISTS_DB = load_data_from_json(PLAYLISTS_DB_FILE, DEFAULT_PLAYLISTS_DB)


@view_config(route_name='api_get_playlists', request_method='GET', renderer='json')
def get_playlists_view(request):
    """
    Mengembalikan daftar semua playlist.
    MEMBUTUHKAN TOKEN AUTENTIKASI.
    """
    # --- PENGECEKAN TOKEN AUTENTIKASI ---
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        request.response.status_code = 401 # Unauthorized
        return {'error': 'Header Authorization (Bearer token) dibutuhkan.'}

    token = auth_header.split(' ')[-1] # Ambil token setelah 'Bearer '

    # Cek apakah token ada di sessions_db kita
    # Ingat, sessions_db kita saat ini: {'session_token_string': 'email@example.com'}
    if token not in sessions_db: 
        request.response.status_code = 401 # Unauthorized
        return {'error': 'Token tidak valid atau sesi telah berakhir.'}

    user_email_from_token = sessions_db.get(token)
    print(f"GET /api/playlists: Request diizinkan untuk user {user_email_from_token} dengan token {token}")
    # --- AKHIR PENGECEKAN TOKEN ---

    # Jika token valid, lanjutkan logika view seperti biasa
    playlists_list = [playlist_data for playlist_id, playlist_data in PLAYLISTS_DB.items()]
    return playlists_list

@view_config(route_name='api_get_playlist_songs', request_method='GET', renderer='json')
def get_playlist_songs_view(request):
    # --- PENGECEKAN TOKEN AUTENTIKASI ---
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        request.response.status_code = 401 # Unauthorized
        return {'error': 'Header Authorization (Bearer token) dibutuhkan.'}

    token = auth_header.split(' ')[-1] 
    
    if token not in sessions_db: 
        request.response.status_code = 401 # Unauthorized
        return {'error': 'Token tidak valid atau sesi telah berakhir.'}
    
    user_email_from_token = sessions_db.get(token) # Ambil email user jika perlu
    print(f"Request ke {request.path}: Diizinkan untuk user {user_email_from_token} dengan token.")
    # --- AKHIR PENGECEKAN TOKEN ---

    playlist_id = request.matchdict.get('playlist_id')
    playlist_data = PLAYLISTS_DB.get(playlist_id)
    
    if not playlist_data:
        request.response.status_code = 404
        return {'error': f'Playlist dengan ID {playlist_id} tidak ditemukan.'}
            
    song_ids_in_playlist = playlist_data.get('song_ids', [])
    songs_in_playlist = []
    for song_id in song_ids_in_playlist:
        song_detail = ALL_SONGS_DB.get(song_id)
        if song_detail:
            songs_in_playlist.append(song_detail)
        else:
            print(f"Peringatan: Lagu ID {song_id} di playlist {playlist_id} tidak ditemukan di ALL_SONGS_DB.")
    return songs_in_playlist

@view_config(route_name='api_create_playlist', request_method='POST', renderer='json')
def create_playlist_view(request):
    """
    Membuat playlist baru.
    MEMBUTUHKAN TOKEN AUTENTIKASI.
    Mengharapkan JSON body dengan field "name".
    """
    # --- PENGECEKAN TOKEN AUTENTIKASI (SAMA SEPERTI DI ATAS) ---
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        request.response.status_code = 401
        return {'error': 'Header Authorization (Bearer token) dibutuhkan.'}
    token = auth_header.split(' ')[-1]
    if token not in sessions_db:
        request.response.status_code = 401
        return {'error': 'Token tidak valid atau sesi telah berakhir.'}

    user_email_from_token = sessions_db.get(token)
    print(f"POST /api/playlists: Request diizinkan untuk user {user_email_from_token} dengan token {token}")
    # --- AKHIR PENGECEKAN TOKEN ---

    # Jika token valid, lanjutkan logika view seperti biasa
    try:
        data = request.json_body
        playlist_name = data.get('name')

        if not playlist_name:
            request.response.status_code = 400
            return {'error': 'Nama playlist ("name") dibutuhkan.'}

        # ... (sisa logika pembuatan playlist sama seperti sebelumnya) ...
        new_playlist_id = 'pl' + str(len(PLAYLISTS_DB) + 1).zfill(2)
        while new_playlist_id in PLAYLISTS_DB: 
            new_playlist_id = 'pl' + str(uuid.uuid4())[:4] 

        new_playlist = {'id': new_playlist_id, 'name': playlist_name, 'song_ids': []}
        PLAYLISTS_DB[new_playlist_id] = new_playlist
        save_data_to_json(PLAYLISTS_DB, PLAYLISTS_DB_FILE)

        print(f"Playlist baru ditambahkan oleh {user_email_from_token}: {new_playlist}")

        request.response.status_code = 201 # Created
        return new_playlist 

    # ... (blok except sama seperti sebelumnya) ...
    except json.JSONDecodeError:
        request.response.status_code = 400
        return {'error': 'Format JSON tidak valid.'}
    except Exception as e:
        print(f"Error tak terduga di create_playlist_view oleh {user_email_from_token}: {e}")
        request.response.status_code = 500
        return {'error': 'Terjadi kesalahan internal pada server saat membuat playlist.'}
    
@view_config(route_name='api_delete_playlist', request_method='DELETE', renderer='json')
def delete_playlist_view(request):
    # --- PENGECEKAN TOKEN AUTENTIKASI ---
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        request.response.status_code = 401 # Unauthorized
        return {'error': 'Header Authorization (Bearer token) dibutuhkan.'}

    token = auth_header.split(' ')[-1] 
    
    if token not in sessions_db: 
        request.response.status_code = 401 # Unauthorized
        return {'error': 'Token tidak valid atau sesi telah berakhir.'}
    
    user_email_from_token = sessions_db.get(token) # Ambil email user jika perlu
    print(f"Request ke {request.path}: Diizinkan untuk user {user_email_from_token} dengan token.")
    # --- AKHIR PENGECEKAN TOKEN ---

    playlist_id = request.matchdict.get('playlist_id')
    if playlist_id in PLAYLISTS_DB:
        deleted_playlist_name = PLAYLISTS_DB[playlist_id].get('name', 'Playlist Tanpa Nama')
        del PLAYLISTS_DB[playlist_id]
        save_data_to_json(PLAYLISTS_DB, PLAYLISTS_DB_FILE) # Simpan perubahan
        
        print(f"Playlist ID {playlist_id} ('{deleted_playlist_name}') telah dihapus.")
        return {'message': f"Playlist '{deleted_playlist_name}' (ID: {playlist_id}) berhasil dihapus."}
    else:
        request.response.status_code = 404
        return {'error': f'Playlist dengan ID {playlist_id} tidak ditemukan.'}

@view_config(route_name='api_add_song_to_playlist', request_method='POST', renderer='json')
def add_song_to_playlist_view(request):
    playlist_id = request.matchdict.get('playlist_id')

    try:
        data = request.json_body
        song_id_to_add_from_body = data.get('song_id')  # Untuk lagu lokal yang sudah ada
        new_song_object_from_body = data.get('song_object')  # Untuk lagu baru dari Jamendo

        # --- Validasi Awal ---
        if playlist_id not in PLAYLISTS_DB:
            request.response.status_code = 404
            return {'error': f'Playlist dengan ID {playlist_id} tidak ditemukan.'}

        playlist = PLAYLISTS_DB[playlist_id]
        song_added_to_all_songs_db = False  # Flag apakah kita menambah lagu baru ke ALL_SONGS_DB

        # --- Logika Inti: Memproses song_id atau song_object ---
        actual_song_id_to_link = None  # ID lagu yang akan dimasukkan ke playlist.song_ids

        if new_song_object_from_body:
            # Kasus: Menambahkan lagu baru (misalnya dari Jamendo)
            print(f"Menerima song_object baru: {new_song_object_from_body.get('title')}")
            title = new_song_object_from_body.get('title')
            artist = new_song_object_from_body.get('artist')
            url = new_song_object_from_body.get('url')
            album = new_song_object_from_body.get('album', 'N/A')
            source = new_song_object_from_body.get('source', 'external')
            original_id = new_song_object_from_body.get('original_id')  # ID asli dari Jamendo

            if not all([title, artist, url]):
                request.response.status_code = 400
                return {'error': 'Untuk lagu baru, field "title", "artist", dan "url" dibutuhkan.'}

            # Buat ID lokal baru untuk lagu ini
            local_song_id = 's' + str(len(ALL_SONGS_DB) + 1).zfill(3)  # Contoh: s011, s012
            while local_song_id in ALL_SONGS_DB:  # Pastikan unik
                local_song_id = 's_ext_' + uuid.uuid4().hex[:6]

            ALL_SONGS_DB[local_song_id] = {
                'id': local_song_id,
                'title': title,
                'artist': artist,
                'url': url,
                'album': album,
                'source': source,
                'original_id': original_id
            }
            save_data_to_json(ALL_SONGS_DB, ALL_SONGS_DB_FILE)  # Simpan perubahan ke ALL_SONGS_DB
            song_added_to_all_songs_db = True
            actual_song_id_to_link = local_song_id
            print(f"Lagu baru dari {source} disimpan ke ALL_SONGS_DB dengan ID lokal: {local_song_id}")

        elif song_id_to_add_from_body:
            # Kasus: Menambahkan lagu lokal yang sudah ada di ALL_SONGS_DB
            print(f"Menerima song_id lokal: {song_id_to_add_from_body}")
            if song_id_to_add_from_body not in ALL_SONGS_DB:
                request.response.status_code = 404
                return {'error': f'Lagu dengan ID lokal {song_id_to_add_from_body} tidak ditemukan di koleksi.'}
            actual_song_id_to_link = song_id_to_add_from_body

        else:
            # Tidak ada song_id atau song_object yang valid
            request.response.status_code = 400
            return {'error': 'Data "song_id" (untuk lagu lokal) atau "song_object" (untuk lagu baru) dibutuhkan.'}

        # --- Menambahkan actual_song_id_to_link ke playlist ---
        if actual_song_id_to_link:
            if actual_song_id_to_link in playlist['song_ids']:
                song_title_info = ALL_SONGS_DB[actual_song_id_to_link].get('title', 'Lagu ini')
                print(f"Lagu ID {actual_song_id_to_link} ('{song_title_info}') sudah ada di playlist ID {playlist_id} ('{playlist['name']})")
                return {  # Status 200 OK
                    'message': f"Lagu '{song_title_info}' sudah ada di playlist '{playlist['name']}'.",
                    'playlist': playlist
                }

            playlist['song_ids'].append(actual_song_id_to_link)
            save_data_to_json(PLAYLISTS_DB, PLAYLISTS_DB_FILE)  # Simpan perubahan ke PLAYLISTS_DB

            song_title_info = ALL_SONGS_DB[actual_song_id_to_link].get('title', 'Lagu ini')
            print(f"Lagu ID {actual_song_id_to_link} ('{song_title_info}') ditambahkan ke playlist ID {playlist_id} ('{playlist['name']}')")
            print(f"PLAYLISTS_DB[{playlist_id}] sekarang: {PLAYLISTS_DB[playlist_id]}")

            return {  # Status 200 OK
                'message': f"Lagu '{song_title_info}' berhasil ditambahkan ke playlist '{playlist['name']}'.",
                'playlist': playlist  # Kembalikan playlist yang sudah diupdate
            }
        else:
            # Ini seharusnya tidak terjadi jika logika di atas benar
            request.response.status_code = 500
            return {'error': 'Gagal menentukan lagu yang akan ditambahkan.'}

    except json.JSONDecodeError:
        request.response.status_code = 400
        return {'error': 'Format JSON tidak valid.'}
    except Exception as e:
        print(f"Error tak terduga di add_song_to_playlist_view: {e}")
        request.response.status_code = 500
        return {'error': 'Terjadi kesalahan internal pada server saat menambah lagu.'}

@view_config(route_name='api_remove_song_from_playlist', request_method='DELETE', renderer='json')
def remove_song_from_playlist_view(request):
    # --- PENGECEKAN TOKEN AUTENTIKASI ---
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        request.response.status_code = 401 # Unauthorized
        return {'error': 'Header Authorization (Bearer token) dibutuhkan.'}

    token = auth_header.split(' ')[-1] 
    
    if token not in sessions_db: 
        request.response.status_code = 401 # Unauthorized
        return {'error': 'Token tidak valid atau sesi telah berakhir.'}
    
    user_email_from_token = sessions_db.get(token) # Ambil email user jika perlu
    print(f"Request ke {request.path}: Diizinkan untuk user {user_email_from_token} dengan token.")
    # --- AKHIR PENGECEKAN TOKEN ---

    playlist_id = request.matchdict.get('playlist_id')
    song_id_to_remove = request.matchdict.get('song_id')

    if playlist_id not in PLAYLISTS_DB:
        request.response.status_code = 404
        return {'error': f'Playlist dengan ID {playlist_id} tidak ditemukan.'}
    
    playlist = PLAYLISTS_DB[playlist_id]
    
    if song_id_to_remove not in playlist['song_ids']:
        request.response.status_code = 404
        return {'error': f"Lagu ID {song_id_to_remove} tidak ditemukan di playlist '{playlist['name']}'."}

    playlist['song_ids'].remove(song_id_to_remove)
    save_data_to_json(PLAYLISTS_DB, PLAYLISTS_DB_FILE) # Simpan perubahan
    
    song_title = ALL_SONGS_DB.get(song_id_to_remove, {}).get('title', 'Lagu Tanpa Judul')
    print(f"Lagu ID {song_id_to_remove} dihapus dari playlist ID {playlist_id}")
    return {
        'message': f"Lagu '{song_title}' berhasil dihapus dari playlist '{playlist['name']}'.",
        'playlist': playlist
    }