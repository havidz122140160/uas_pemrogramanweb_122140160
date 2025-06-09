# 🎵 Asyik.in - Music Player

_Dengarkan Musik, Atur Playlist, Sesukamu!_

---

## 📄 Deskripsi Proyek

**Asyik.in** adalah sebuah aplikasi pemutar musik berbasis web yang dikembangkan sebagai proyek untuk mata kuliah Pemrograman Web. Aplikasi ini memungkinkan pengguna untuk tidak hanya mendengarkan musik, tetapi juga mengelola koleksi playlist pribadi secara penuh, serta mengeksplorasi musik baru dari sumber eksternal.

Proyek ini dibangun dengan arsitektur full-stack modern, memisahkan antara logika frontend yang interaktif dengan backend yang mengelola data dan proses.

---

## ✨ Fitur Utama & Implementasi CRUD

Aplikasi ini mengimplementasikan operasi **CRUD (Create, Read, Update, Delete)** pada beberapa entitas utama:

* **👤 Autentikasi Pengguna**
    * **Create:** Pendaftaran (Sign Up) pengguna baru.
    * **Read:** Login dengan verifikasi kredensial.
    * Sesi login yang persisten di sisi frontend.

* **🎶 Manajemen Playlist Lokal**
    * **Create:** Membuat playlist baru dengan nama kustom melalui API.
    * **Read:** Menampilkan semua playlist dan lagu-lagu di dalamnya dari API.
    * **Delete:** Menghapus playlist dari sistem.

* **🎧 Manajemen Lagu dalam Playlist**
    * **Create (Add):** Menambahkan lagu baru ke dalam koleksi dari sumber eksternal (Jamendo API) dan menautkannya ke playlist.
    * **Update:** Menambahkan lagu yang sudah ada ke playlist, atau menghapus lagu dari playlist (memperbarui daftar lagu di dalam suatu playlist).

* **🔍 Pencarian & Eksplorasi Musik**
    * Pencarian lagu secara *real-time* di dalam playlist yang sedang aktif (Client-Side).
    * Pencarian lagu eksternal secara global menggunakan **Jamendo API**.
    * Memutar lagu penuh (Creative Commons) langsung dari hasil pencarian Jamendo.

* **▶️ Pemutar Musik Fungsional**
    * Kontrol Play, Pause, Next, dan Previous.
    * Seek Bar (Progress Bar) yang interaktif untuk melihat durasi dan melompat ke bagian lagu tertentu.

---

## 🛠️ Teknologi yang Digunakan

### Frontend
* **Library:** React.js
* **Build Tool:** Vite
* **Styling:** Tailwind CSS
* **Bahasa:** JavaScript (ES6+ & JSX)
* **HTTP Client:** Axios & Fetch API

### Backend
* **Framework:** Pyramid (Python 3)
* **Server WSGI:** Waitress
* **Bahasa:** Python
* **Manajemen Paket:** Pip & `venv`

---

## 👨‍💻 Dibuat oleh

**Havidz Ridho**

* NIM: 122140160
* GitHub: [@havidz122140160](https://github.com/havid122140160)
* Email:[havidz.122140160@student.itera.ac.id]

---

### Asyik.in
_Dengarkan Musik, Atur Playlist, Sesukamu!_
