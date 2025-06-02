// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html", // atau "./public/index.html" jika pakai struktur public
    "./src/**/*.{js,jsx,ts,tsx,vue}", // Pastikan ini mencakup semua file komponen abang
  ],
  theme: {
    extend: {
      colors: {
        // Warna brand terang yang mungkin sudah ada (dari halaman Login/Signup)
        'brand-blue': {
          DEFAULT: '#3B82F6', // GANTI DENGAN BIRU UTAMA ABANG
          light: '#60A5FA',
          dark: '#2563EB',
        },
        'brand-background': '#F3F4F6', // GANTI DENGAN BG HALAMAN LOGIN/SIGNUP ABANG
        'brand-card': '#FFFFFF',
        'brand-input-bg': '#F9FAFB',
        'brand-label': '#4B5563',
        'brand-text-dark': '#1F2937',
        'brand-footer-text': '#6B7280',

        // TAMBAHKAN INI UNTUK TEMA GELAP (Beranda)
        // GANTI SEMUA KODE HEX DI BAWAH INI DENGAN WARNA DARI DESAIN ABANG!
        'brand-dark-bg': 'slate-900',          // Contoh: Warna background utama Beranda (misal, slate-900)
        'brand-dark-card': 'slate-800',       // Contoh: Warna panel/kartu di Beranda (misal, slate-800)
        'brand-dark-blue-accent': 'sky-400', // Contoh: Warna biru terang untuk aksen/highlight (misal, sky-400)
        'brand-dark-text-primary': 'slate-200',// Contoh: Warna teks utama di background gelap (misal, slate-200)
        'brand-dark-text-secondary': 'slate-400',// Contoh: Warna teks sekunder (misal, slate-400)
        'brand-dark-border': 'slate-700',     // Contoh: Warna border (misal, slate-700)
      }
    },
  },
  plugins: [],
}