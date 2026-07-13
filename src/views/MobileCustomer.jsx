import React, { useContext, useState } from 'react';
import { StoreContext } from '../context/StoreContext';
import { ShoppingCart, Plus, Minus, ArrowRight } from 'lucide-react';

export default function MobileCustomer() {
  const { menuItems, placeOrder } = useContext(StoreContext);
  const [cart, setCart] = useState([]);
  const [isCheckout, setIsCheckout] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [orderType, setOrderType] = useState('Dine In');
  const [orderSuccess, setOrderSuccess] = useState(false);

  // KITA TIDAK LAGI MEMFILTER MENU, SEMUA MENU DITAMPILKAN
  // const availableItems = menuItems.filter(item => item.isAvailable && item.stock > 0);

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        if (existing.quantity >= item.stock) return prev; // Cannot exceed stock
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (id) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === id);
      if (existing && existing.quantity > 1) {
        return prev.map(i => i.id === id ? { ...i, quantity: i.quantity - 1 } : i);
      }
      return prev.filter(i => i.id !== id);
    });
  };

  const getCartCount = () => cart.reduce((sum, item) => sum + item.quantity, 0);
  const getCartTotal = () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleCheckout = (e) => {
    e.preventDefault();
    if (!customerName) {
      alert("Masukkan nama terlebih dahulu");
      return;
    }
    placeOrder(cart, orderType, customerName);
    setOrderSuccess(true);
    setCart([]);
    setIsCheckout(false);
  };

  if (orderSuccess) {
    return (
      <div className="container" style={{ textAlign: 'center', marginTop: '5rem' }}>
        <div style={{ background: 'white', padding: '3rem', borderRadius: '12px', display: 'inline-block' }}>
          <h2 style={{ color: 'var(--success)', marginBottom: '1rem' }}>Pesanan Berhasil!</h2>
          <p>Terima kasih <strong>{customerName}</strong>, pesanan Anda sedang diproses.</p>
          <button className="btn-primary" style={{ marginTop: '2rem' }} onClick={() => setOrderSuccess(false)}>
            Pesan Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingBottom: '80px' }}>
      <h2 style={{ marginBottom: '1.5rem', marginTop: '1rem' }}>Menu Cafeifa</h2>

      {!isCheckout ? (
        <>
          <div className="grid-cards">
            {/* SEKARANG KITA MENGGUNAKAN menuItems, BUKAN availableItems */}
            {menuItems.map(item => {
              // LOGIKA BARU: Cek apakah menu habis atau dimatikan dari dapur
              const isUnavailable = !item.isAvailable || item.stock <= 0;

              return (
                <div key={item.id} className="card" style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'space-between', 
                  padding: '1rem',
                  // EFEK ABU-ABU JIKA TIDAK TERSEDIA
                  filter: isUnavailable ? 'grayscale(100%) opacity(60%)' : 'none',
                  pointerEvents: isUnavailable ? 'none' : 'auto' // Mencegah interaksi jika tidak tersedia
                }}>
                  <div>
                    {/* TAMPILAN GAMBAR PRODUK */}
                    {item.image_url ? (
                      <img 
                        src={item.image_url} 
                        alt={item.name} 
                        style={{ 
                          width: '100%', 
                          height: '160px', 
                          objectFit: 'cover', 
                          borderRadius: '8px', 
                          marginBottom: '1rem' 
                        }} 
                      />
                    ) : (
                      <div style={{ 
                        width: '100%', 
                        height: '160px', 
                        backgroundColor: '#f3f4f6', 
                        borderRadius: '8px', 
                        marginBottom: '1rem', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        color: '#9ca3af',
                        fontSize: '0.9rem'
                      }}>
                        Tidak ada gambar
                      </div>
                    )}

                    <h3 style={{ fontSize: '1.2rem', marginBottom: '0.25rem' }}>{item.name}</h3>
                    <p style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>Rp {item.price.toLocaleString('id-ID')}</p>
                    
                    {/* INDIKATOR STOK / HABIS */}
                    <p style={{ 
                      fontSize: '0.8rem', 
                      color: isUnavailable ? 'red' : 'var(--gray-800)', 
                      marginTop: '0.5rem',
                      fontWeight: isUnavailable ? 'bold' : 'normal'
                    }}>
                      {isUnavailable ? 'Habis / Tidak Tersedia' : `Sisa stok: ${item.stock}`}
                    </p>
                  </div>

                  <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    {/* JIKA HABIS, TAMPILKAN TOMBOL DISABLED */}
                    {isUnavailable ? (
                      <button disabled style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: 'none', background: '#ccc', color: '#666', fontWeight: 'bold' }}>
                        Habis
                      </button>
                    ) : cart.find(c => c.id === item.id) ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--gray-200)', borderRadius: '8px', padding: '0.25rem' }}>
                        <button onClick={() => removeFromCart(item.id)} style={{ padding: '0.25rem', background: 'white', color: 'var(--danger)', borderRadius: '4px', border: 'none' }}><Minus size={16} /></button>
                        <span style={{ fontWeight: 'bold', width: '20px', textAlign: 'center' }}>{cart.find(c => c.id === item.id).quantity}</span>
                        <button onClick={() => addToCart(item)} style={{ padding: '0.25rem', background: 'white', color: 'var(--success)', borderRadius: '4px', border: 'none' }} disabled={cart.find(c => c.id === item.id).quantity >= item.stock}><Plus size={16} /></button>
                      </div>
                    ) : (
                      <button className="btn-primary" style={{ width: '100%' }} onClick={() => addToCart(item)}>
                        Tambah
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {cart.length > 0 && (
            <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'white', padding: '1rem', boxShadow: '0 -4px 6px -1px rgba(0,0,0,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ position: 'relative' }}>
                  <ShoppingCart size={28} color="var(--primary-color)" />
                  <span style={{ position: 'absolute', top: '-8px', right: '-8px', background: 'var(--danger)', color: 'white', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold' }}>
                    {getCartCount()}
                  </span>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--gray-800)' }}>Total</p>
                  <p style={{ margin: 0, fontWeight: 'bold', color: 'var(--primary-color)' }}>Rp {getCartTotal().toLocaleString('id-ID')}</p>
                </div>
              </div>
              <button className="btn-primary" onClick={() => setIsCheckout(true)}>
                Checkout <ArrowRight size={18} />
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h3>Konfirmasi Pesanan</h3>
          <div style={{ margin: '1.5rem 0' }}>
            {cart.map(item => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--gray-200)' }}>
                <span>{item.quantity}x {item.name}</span>
                <span>Rp {(item.price * item.quantity).toLocaleString('id-ID')}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', fontWeight: 'bold', fontSize: '1.2rem' }}>
              <span>Total Pembayaran</span>
              <span style={{ color: 'var(--primary-color)' }}>Rp {getCartTotal().toLocaleString('id-ID')}</span>
            </div>
          </div>

          <form onSubmit={handleCheckout}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Nama Pelanggan</label>
              <input
                type="text"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--gray-300)' }}
                placeholder="Masukkan nama Anda"
                required
              />
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Tipe Pesanan</label>
              <select
                value={orderType}
                onChange={e => setOrderType(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--gray-300)' }}
              >
                <option value="Dine In">Makan di Tempat (Dine In)</option>
                <option value="Takeaway">Bawa Pulang (Takeaway)</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setIsCheckout(false)}>Kembali</button>
              <button type="submit" className="btn-primary" style={{ flex: 2 }}>Pesan Sekarang</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}