# file: backend/setup.py

from setuptools import setup, find_packages

# Daftar dependensi yang dibutuhkan oleh aplikasi kita
# Kita masukkan yang sudah kita rencanakan untuk diinstall
requires = [
    'pyramid~=2.0',
    'waitress',        # Server WSGI
    # 'pyramid_cors',  # Kita skip dulu karena ada masalah instalasi, akan ditangani Vite Proxy
    'pyramid_debugtoolbar',
    'passlib[bcrypt]', # Untuk hashing password, [bcrypt] adalah dependensi opsional yg kita butuhkan
    # Tambahkan dependensi lain jika ada nanti
]

setup(
    name='myapp',  # Nama aplikasi kita (sesuai nama folder paket utama)
    version='0.1',
    description='Backend API untuk Music Player Asyik.in',
    author='Havidz Ridho Pratama', # Ganti dengan nama abang
    author_email='havidz.122140160@student.itera.acid', # Ganti dengan email abang
    keywords='web pyramid pylons music api',
    packages=find_packages(), # Otomatis mencari paket di dalam proyek (akan menemukan 'myapp')
    include_package_data=True,
    zip_safe=False,
    install_requires=requires, # Dependensi yang didefinisikan di atas
    entry_points={
        'paste.app_factory': [
            'main = myapp:main', # Memberitahu PServe cara menjalankan aplikasi kita
                                 # 'main' di sini merujuk ke fungsi main() di myapp/__init__.py
        ],
    },
)