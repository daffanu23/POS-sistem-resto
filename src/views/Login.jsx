import React, { useContext } from 'react';
import { StoreContext } from '../context/StoreContext';

export default function Login() {
  const { signInWithGoogle } = useContext(StoreContext);

  return (
    <div style={{ padding: '50px 20px', textAlign: 'center', maxWidth: '400px', margin: '100px auto', border: '1px solid #ddd', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
      <h2 style={{ marginBottom: '10px' }}>POS Resto</h2>
      <p style={{ color: 'gray', marginBottom: '30px' }}>Silakan masuk untuk mengakses sistem</p>
      
      <button 
        onClick={signInWithGoogle} 
        style={{ 
          padding: '12px 20px', 
          background: '#4285F4', 
          color: 'white', 
          border: 'none', 
          borderRadius: '4px', 
          cursor: 'pointer',
          width: '100%',
          fontSize: '16px',
          fontWeight: 'bold'
        }}
      >
        Login dengan Google
      </button>
    </div>
  );
}