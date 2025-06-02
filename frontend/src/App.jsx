// src/App.jsx
import React, { useState, useEffect } from 'react'; // Tambahkan useEffect
import SignupPage from './components/SignupPage.jsx';
import LoginPage from './components/LoginPage.jsx';
import MainPage from './components/MainPage.jsx';

const PAGES = {
  SIGNUP: 'signup',
  LOGIN: 'login',
  MAIN_APP: 'main_app',
};

function App() {
  // State untuk pengguna yang sedang login (menyimpan objek user)
  // Awalnya null, akan diisi dari localStorage jika ada
  const [currentUser, setCurrentUser] = useState(null);
  
  // State untuk halaman yang aktif jika BELUM login (antara signup atau login)
  const [authPage, setAuthPage] = useState(PAGES.SIGNUP); // Default ke Signup jika belum login

  // Cek localStorage saat komponen App pertama kali dimuat
  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('currentUser');
    if (storedToken && storedUser) {
      try {
        const user = JSON.parse(storedUser);
        console.log('User ditemukan di localStorage:', user, 'Token:', storedToken);
        setCurrentUser({ ...user, token: storedToken }); // Set currentUser dari localStorage
      } catch (error) {
        console.error("Gagal parse user dari localStorage:", error);
        localStorage.removeItem('authToken'); // Hapus jika data korup
        localStorage.removeItem('currentUser');
      }
    }
  }, []); // Array dependensi kosong agar useEffect ini hanya jalan sekali saat mount

  // Fungsi yang dipanggil dari LoginPage setelah login sukses
  const handleLoginSuccess = (userData) => {
    console.log('Login sukses di App.jsx, user data:', userData);
    const token = localStorage.getItem('authToken'); // Ambil token yang baru disimpan
    setCurrentUser({ ...userData, token }); // Update state currentUser
    // Navigasi ke main app tidak lagi diatur oleh currentPage, tapi oleh adanya currentUser
  };

  // Fungsi yang dipanggil dari MainPage untuk logout
  const handleLogout = () => {
    console.log('Logout dipanggil');
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    setCurrentUser(null); // Hapus state currentUser
    setAuthPage(PAGES.LOGIN); // Arahkan ke halaman login setelah logout
  };

  // Navigasi antara halaman login dan signup (jika belum terautentikasi)
  const navigateAuthPage = (pageName) => {
    setAuthPage(pageName);
  };

  // Komponen Logo dan Footer (sama seperti sebelumnya)
  const Logo = () => (
    <div className="absolute top-6 left-6 sm:top-8 sm:left-8 z-20">
      <a href="#" className="text-2xl font-bold text-brand-blue-dark">asyik.in</a>
    </div>
  );
  const Footer = () => (
    <footer className="fixed bottom-0 left-0 right-0 text-center p-3 sm:p-4 text-xs text-brand-footer-text bg-brand-background z-10">
      asyik.in - Platform streaming musik gratis. (Pemrograman Web - havidz 122140160)
    </footer>
  );
  
  // --- Header Aplikasi (Contoh menampilkan nama user jika sudah login) ---
  const AppHeader = () => (
    <header className="bg-slate-800 shadow-md p-4 flex justify-between items-center sticky top-0 z-50 text-brand-dark-text-primary">
      <h1> <span className="text-xl font-bold text-black-400">asyik</span><span className="text-xl font-bold text-sky-400">.in</span> </h1>
      {currentUser && ( // Tampilkan hanya jika sudah login
        <div className="flex items-center">
          <span className="mr-4 text-sm font-bold">Halo, {currentUser.name || currentUser.email}!</span>
          <button 
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white font-semibold py-1 px-3 rounded-md text-xs sm:text-sm"
          >
            Logout
          </button>
        </div>
      )}
    </header>
  );


  // Render halaman berdasarkan status autentikasi (currentUser)
  let pageToRender;
  if (currentUser) {
    // Jika sudah login, tampilkan MainPage
    // Kita tidak lagi menggunakan onLogout di MainPage karena AppHeader sudah punya tombol logout
    // Tapi jika desain abang menaruh logout di MainPage, prop onLogout bisa diteruskan lagi
    pageToRender = <MainPage user={currentUser} onLogout={handleLogout} />; 
  } else {
    // Jika belum login, tampilkan halaman Signup atau Login
    if (authPage === PAGES.SIGNUP) {
      pageToRender = <SignupPage onNavigateToLogin={() => navigateAuthPage(PAGES.LOGIN)} />;
    } else { // PAGES.LOGIN
      pageToRender = <LoginPage onNavigateToSignup={() => navigateAuthPage(PAGES.SIGNUP)} onLoginSuccess={handleLoginSuccess} />;
    }
  }

  return (
    <div className={`${currentUser ? 'bg-brand-dark-bg' : 'bg-brand-background'} text-brand-text-dark font-sans min-h-screen flex flex-col`}>
      {/* Tampilkan AppHeader jika sudah login, atau Logo standar jika belum */}
      {currentUser ? <AppHeader /> : <Logo />}
      
      <div className="flex-1 flex flex-col overflow-hidden"> {/* Dibungkus flex-col agar MainPage bisa flex-1 juga */}
        {pageToRender}
      </div>

      {!currentUser && <Footer />} 
      
    </div>
  );
}

export default App;