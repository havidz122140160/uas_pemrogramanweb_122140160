# file: backend/myapp/__init__.py

from pyramid.config import Configurator
from pyramid.events import NewResponse

def add_cors_headers_response_callback(event):
    """
    Callback untuk event NewResponse, menambahkan header CORS.
    """

    allowed_origin = 'http://localhost:5173' 

    event.response.headers.update({
        'Access-Control-Allow-Origin': allowed_origin,
        'Access-Control-Allow-Methods': 'POST, GET, DELETE, PUT, OPTIONS', # OPTIONS penting untuk pre-flight
        'Access-Control-Allow-Headers': 'Origin, Content-Type, Accept, Authorization, X-Requested-With',
        'Access-Control-Allow-Credentials': 'true', # Jika akan menggunakan cookies/session atau Authorization header
        'Access-Control-Max-Age': '3600' # Berapa lama browser bisa cache pre-flight response (detik)
    })

# Fungsi utama aplikasi Pyramid kita
def main(global_config, **settings):
    """
    Fungsi ini mengembalikan aplikasi WSGI Pyramid.
    """
    config = Configurator(settings=settings)

    # 1. Tambahkan event subscriber untuk CORS manual
    # Ini akan memastikan header CORS ditambahkan ke semua response.
    config.add_subscriber(add_cors_headers_response_callback, NewResponse)

    # 2. Sertakan konfigurasi rute (URL) dari file routes.py
    # Kita akan buat file myapp.routes sebentar lagi
    config.include('.routes') # Tanda '.' berarti relatif terhadap paket 'myapp'

    # 3. Pindai @view_config decorators di dalam paket ini (terutama di folder views)
    # Ini akan otomatis menemukan fungsi-fungsi view kita
    config.scan()

    # (Opsional) Sertakan pyramid_debugtoolbar jika diinstall dan diinginkan saat development
    # config.include('pyramid_debugtoolbar') # Pastikan sudah ada di 'requires' setup.py

    return config.make_wsgi_app()