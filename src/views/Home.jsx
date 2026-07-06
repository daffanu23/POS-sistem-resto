import React from 'react';
import { Link } from 'react-router-dom';
import { Coffee, ChefHat, Monitor } from 'lucide-react';

export default function Home() {
  return (
    <div className="container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
      <Coffee size={64} color="var(--primary-color)" style={{ marginBottom: '1rem' }} />
      <h1 style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>Cafeifa</h1>
      <p style={{ fontSize: '1.2rem', color: 'var(--gray-800)', marginBottom: '3rem' }}>
        Pilih peran Anda untuk masuk ke sistem
      </p>

      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link to="/mobile" className="card" style={{ width: '250px', display: 'flex', flexDirection: 'column', alignItems: 'center', textDecoration: 'none', transition: 'transform 0.2s' }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
          <div style={{ background: 'var(--background-light)', padding: '1.5rem', borderRadius: '50%', marginBottom: '1rem' }}>
            <Monitor size={48} color="var(--primary-light)" />
          </div>
          <h2>Pelanggan</h2>
          <p style={{ color: 'var(--gray-800)', marginTop: '0.5rem', fontSize: '0.9rem' }}>Pesan menu via Mobile</p>
        </Link>

        <Link to="/kitchen" className="card" style={{ width: '250px', display: 'flex', flexDirection: 'column', alignItems: 'center', textDecoration: 'none', transition: 'transform 0.2s' }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
          <div style={{ background: 'var(--background-light)', padding: '1.5rem', borderRadius: '50%', marginBottom: '1rem' }}>
            <ChefHat size={48} color="var(--primary-light)" />
          </div>
          <h2>Dapur</h2>
          <p style={{ color: 'var(--gray-800)', marginTop: '0.5rem', fontSize: '0.9rem' }}>Update stok & status menu</p>
        </Link>

        <Link to="/cashier" className="card" style={{ width: '250px', display: 'flex', flexDirection: 'column', alignItems: 'center', textDecoration: 'none', transition: 'transform 0.2s' }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
          <div style={{ background: 'var(--background-light)', padding: '1.5rem', borderRadius: '50%', marginBottom: '1rem' }}>
            <Coffee size={48} color="var(--primary-light)" />
          </div>
          <h2>Kasir / Admin</h2>
          <p style={{ color: 'var(--gray-800)', marginTop: '0.5rem', fontSize: '0.9rem' }}>Kelola pesanan & pembayaran</p>
        </Link>
      </div>
    </div>
  );
}
