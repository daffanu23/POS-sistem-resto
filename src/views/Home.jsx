import React, { useContext } from 'react';
import { StoreContext } from '../context/StoreContext';
import Login from './Login';
import Kitchen from './Kitchen';
import Cashier from './Cashier';
import MobileCustomer from './MobileCustomer';

export default function Home() {
  const { user, userRole, loading } = useContext(StoreContext);

  // MEMBACA LINK URL: Apakah ada kata "?menu=true"?
  const queryParams = new URLSearchParams(window.location.search);
  const isCustomerMenu = queryParams.get('menu') === 'true';

  if (loading) {
    return (
      <div style={{ textAlign: 'center', marginTop: '20vh' }}>
        <h3>Memuat sistem...</h3>
      </div>
    );
  }

  // Jika belum login...
  if (!user) {
    // ...tapi link-nya adalah link pelanggan (hasil scan QR), langsung buka Etalase!
    if (isCustomerMenu) {
      return <MobileCustomer />;
    }
    // ...jika link biasa, berarti ini pegawai yang mau masuk, tampilkan Login.
    return <Login />;
  }

  // Jika sudah login, arahkan sesuai rolenya
  if (userRole === 'kitchen') {
    return <Kitchen />;
  }

  if (userRole === 'cashier') {
    return <Cashier />;
  }

  // Default fallback
  return <MobileCustomer />;
}