import React, { useContext } from 'react';
import { StoreContext } from '../context/StoreContext';

export default function Cashier() {
  const { user, signOut } = useContext(StoreContext);

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* HEADER KASIR */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, color: 'var(--primary-color, #333)' }}>Panel Kasir</h2>
          <p style={{ margin: '5px 0 0 0', color: 'gray' }}>
            Halo, {user?.user_metadata?.full_name || 'Kasir'}! Selamat bertugas.
          </p>
        </div>
        
        <button 
          onClick={signOut} 
          style={{ 
            padding: '8px 15px', 
            background: '#dc3545', 
            color: 'white', 
            borderRadius: '5px', 
            border: 'none', 
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Logout
        </button>
      </div>

      <hr style={{ margin: '20px 0', border: '1px solid #eee' }} />

      {/* TEMPAT KERJA KASIR (Akan kita isi nanti) */}
      <div style={{ 
        textAlign: 'center', 
        padding: '50px', 
        background: '#f9f9f9', 
        borderRadius: '8px',
        border: '1px dashed #ccc'
      }}>
        <h3 style={{ color: '#666' }}>Area Kerja Kasir Masih Kosong</h3>
        <p style={{ color: '#999' }}>
          Daftar pesanan masuk dan sistem input pesanan manual (walk-in) akan segera dibangun di sini.
        </p>
      </div>

    </div>
  );
}