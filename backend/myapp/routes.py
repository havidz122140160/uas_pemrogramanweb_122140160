# file: backend/myapp/routes.py

def includeme(config):
    # ... (rute-rute yang sudah ada sebelumnya) ...
    config.add_route('home', '/') 
    config.add_route('api_signup', '/api/signup') 
    config.add_route('api_login', '/api/login')   

    config.add_route('api_get_playlists', '/api/playlists', request_method='GET')
    config.add_route('api_create_playlist', '/api/playlists', request_method='POST')
    config.add_route('api_delete_playlist', '/api/playlists/{playlist_id}', request_method='DELETE')
    config.add_route('api_get_playlist_songs', '/api/playlists/{playlist_id}/songs', request_method='GET')
    config.add_route('api_add_song_to_playlist', '/api/playlists/{playlist_id}/songs', request_method='POST') # Sudah ada

    # --- RUTE BARU UNTUK MENGHAPUS LAGU DARI PLAYLIST ---
    # Nama rute: 'api_remove_song_from_playlist'
    # URL: '/api/playlists/{playlist_id}/songs/{song_id}' (menggunakan ID playlist dan ID lagu di path)
    # Method: DELETE
    config.add_route('api_remove_song_from_playlist', '/api/playlists/{playlist_id}/songs/{song_id}', request_method='DELETE')
    # ----------------------------------------------------