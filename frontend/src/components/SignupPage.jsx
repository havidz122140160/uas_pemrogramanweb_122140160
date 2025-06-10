// src/components/SignupPage.jsx
import React, { useState } from 'react';

function SignupPage({ onNavigateToLogin }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');

    const userData = { name, email, password };
    console.log('Mengirim data signup:', userData);

    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const responseData = await response.json();

      if (response.ok) {
        console.log('Signup berhasil:', responseData);
        setMessage(`Sukses: ${responseData.message || 'Pendaftaran berhasil!'}`);
      } else {
        console.error('Signup gagal:', responseData);
        setMessage(`Error: ${responseData.error || 'Pendaftaran gagal.'}`);
      }
    } catch (error) {
      console.error('Error saat fetch signup:', error);
      setMessage(`Error: Tidak bisa terhubung ke server. ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 pt-20 sm:pt-4">
      <div className="bg-brand-card p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-md">
        <h2 className="text-3xl sm:text-4xl font-bold text-center text-brand-blue mb-6">Cobain dah.</h2>

        {message && (
          <div className={`p-3 mb-4 rounded-md text-sm ${message.startsWith('Error:') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="signup-name" className="text-sm font-medium text-brand-label ml-1">Nama</label>
            <input
              type="text" id="signup-name" name="name" value={name} onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full p-3 bg-brand-input-bg rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand-blue focus:border-transparent outline-none transition-all"
              placeholder="Nama lengkap kamu" required
            />
          </div>
          <div>
            <label htmlFor="signup-email" className="text-sm font-medium text-brand-label ml-1">e-mail</label>
            <input
              type="email" id="signup-email" name="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full p-3 bg-brand-input-bg rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand-blue focus:border-transparent outline-none transition-all"
              placeholder="email@kamu.com" required
            />
          </div>
          <div>
            <label htmlFor="signup-password" className="text-sm font-medium text-brand-label ml-1">Password</label>
            <input
              type="password" id="signup-password" name="password" value={password} onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full p-3 bg-brand-input-bg rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand-blue focus:border-transparent outline-none transition-all"
              placeholder="Buat password rahasia" required
            />
          </div>
          <button type="submit" className="w-full bg-brand-blue hover:bg-brand-blue-dark text-white font-semibold p-3.5 rounded-lg transition duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-opacity-50">
            Sign In {/* Teks tombol diperbaiki agar konsisten dengan "Sign In" untuk daftar */}
          </button>
        </form>
        <p className="text-center text-sm text-brand-label mt-8">
          sudah punya akun?{' '}
          <button onClick={onNavigateToLogin} className="font-semibold text-brand-blue hover:underline">
            Login kuy.
          </button>
        </p>
      </div>
    </div>
  );
}

export default SignupPage;
