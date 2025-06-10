// src/components/LoginPage.jsx
import React, { useState } from 'react';

function LoginPage({ onNavigateToSignup, onLoginSuccess }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    const loginData = { name, email, password };
    console.log('Mengirim data login:', loginData);

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      });

      const responseData = await response.json();

      if (response.ok) {
        console.log('Login berhasil:', responseData);
        setMessage(`Sukses: ${responseData.message || 'Login berhasil!'}`);

        if (responseData.token && responseData.user) {
          console.log('Menyimpan token dan user data ke localStorage...');
          localStorage.setItem('authToken', responseData.token);
          localStorage.setItem('currentUser', JSON.stringify(responseData.user));
        }

        if (onLoginSuccess) {
          onLoginSuccess(responseData.user);
        }
      } else {
        console.error('Login gagal:', responseData);
        setMessage(`Error: ${responseData.error || 'Login gagal.'}`);
      }
    } catch (error) {
      console.error('Error saat fetch login:', error);
      setMessage(`Error: Tidak bisa terhubung ke server. ${error.message}`);
    }
  };

  // ... (sisa JSX sama seperti sebelumnya)
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 pt-20 sm:pt-4">
      <div className="bg-brand-card p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-md">
        <h2 className="text-3xl sm:text-4xl font-bold text-center text-brand-blue mb-8">Login kuy.</h2>
        {message && (
          <div className={`p-3 mb-4 rounded-md text-sm ${message.startsWith('Error:') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {message}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="login-name" className="text-sm font-medium text-brand-label ml-1">Nama</label>
            <input
              type="text" id="login-name" name="name" value={name} onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full p-3 bg-brand-input-bg rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand-blue focus:border-transparent outline-none transition-all"
              placeholder="Nama kamu"
            />
          </div>
          <div>
            <label htmlFor="login-email" className="text-sm font-medium text-brand-label ml-1">e-mail</label>
            <input
              type="email" id="login-email" name="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full p-3 bg-brand-input-bg rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand-blue focus:border-transparent outline-none transition-all"
              placeholder="email@kamu.com" required
            />
          </div>
          <div>
            <label htmlFor="login-password" className="text-sm font-medium text-brand-label ml-1">Password</label>
            <input
              type="password" id="login-password" name="password" value={password} onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full p-3 bg-brand-input-bg rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand-blue focus:border-transparent outline-none transition-all"
              placeholder="Password kamu" required
            />
          </div>
          <button type="submit" className="w-full bg-brand-blue hover:bg-brand-blue-dark text-white font-semibold p-3.5 rounded-lg transition duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-opacity-50">
            Log In
          </button>
        </form>
        <p className="text-center text-sm text-brand-label mt-8">
          belum punya akun?{' '}
          <button onClick={onNavigateToSignup} className="font-semibold text-brand-blue hover:underline">
            Cobain dah.
          </button>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
