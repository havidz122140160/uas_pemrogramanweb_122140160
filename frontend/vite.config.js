// vite.config.js (di folder frontend React abang)

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react'; // Pastikan plugin react sudah ada

export default defineConfig({
  plugins: [react()],
  server: {
    // Port untuk Vite dev server (frontend). Defaultnya 5173, bisa disesuaikan.
    port: 5173, // Pastikan ini port frontend abang

    proxy: {
      // Kunci '/api' berarti setiap request dari frontend
      // yang dimulai dengan '/api' akan diproxy.
      // Contoh: jika frontend panggil fetch('/api/users'), request ini akan diproxy.
      '/api': {
        // Target adalah alamat server backend Pyramid abang.
        // Pastikan port 6543 ini sesuai dengan yang akan kita set di development.ini Pyramid nanti.
        target: 'http://localhost:6543',

        // 'changeOrigin: true' penting agar backend menerima request
        // seolah-olah dari origin target (localhost:6543), bukan dari Vite (localhost:5173).
        // Berguna jika backend melakukan validasi Host header.
        changeOrigin: true,

        // 'rewrite' bersifat opsional.
        // Jika endpoint backend abang sudah termasuk '/api' (misalnya http://localhost:6543/api/login),
        // maka 'rewrite' tidak diperlukan, atau bisa di-set agar tidak melakukan apa-apa.
        // Jika endpoint backend abang TIDAK termasuk '/api' (misalnya http://localhost:6543/login),
        // dan frontend memanggil '/api/login', maka rewrite diperlukan untuk menghapus '/api'.
        // Contoh rewrite jika perlu menghapus '/api':
        // rewrite: (path) => path.replace(/^\/api/, '')

        // Untuk rencana kita, endpoint Pyramid akan kita buat dengan prefix /api juga
        // (contoh: /api/signup, /api/login).
        // Jadi, dengan target 'http://localhost:6543' dan path proxy '/api',
        // request frontend ke '/api/login' akan otomatis diteruskan ke 'http://localhost:6543/api/login'.
        // Sehingga, 'rewrite' spesifik mungkin tidak dibutuhkan atau bisa dikomen dulu.
      }
      // Abang bisa menambahkan rule proxy lain di sini jika perlu
    }
  }
});