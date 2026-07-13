import React, { useContext } from 'react';
import { StoreContext } from '../context/StoreContext';
import { Navigate } from 'react-router-dom';

export default function Login() {
  const { user, userRole, signInWithGoogle, loading } = useContext(StoreContext);

  // Jika masih loading ngecek sesi, tampilkan kosong
  if (loading) return <div className="container">Loading...</div>;

  // Jika sudah login, otomatis arahkan sesuai rolenya
  if (user) {
    if (userRole === 'kitchen') return <Navigate to="/kitchen" />;
    if (userRole === 'cashier' || userRole === 'admin') return <Navigate to="/cashier" />;
    return <Navigate to="/" />; // Fallback
  }

  return (
    <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '100px' }}>
      <h2>Login Pegawai Cafeifa</h2>
      <p style={{ marginBottom: '20px', color: 'gray' }}>Gunakan akun Google Anda untuk masuk</p>
      
      <button 
        className="btn-primary" 
        onClick={signInWithGoogle}
        style={{ padding: '10px 20px', fontSize: '1.1rem' }}
      >
        Lanjutkan dengan Google
      </button>
    </div>
  );
}