import React, { useState, useEffect, useContext } from 'react';
import { supabase } from '../supabaseClient';
import { StoreContext } from '../context/StoreContext'; // IMPORT CONTEXT

export default function MobileCustomer() {
  // AMBIL DATA MENU DARI CONTEXT (Sama seperti Kasir)
  const { menuItems } = useContext(StoreContext); 
  
  const [cart, setCart] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [tableNumber, setTableNumber] = useState(null);
  const [orderSuccess, setOrderSuccess] = useState(false);

  // Filter menu yang stoknya ada dan tersedia langsung dari Context
  const availableMenu = menuItems.filter(item => item.isAvailable && item.stock > 0);

  useEffect(() => {
    // Tangkap parameter nomor meja dari URL hasil scan QR
    const searchParams = new URLSearchParams(window.location.search);
    const table = searchParams.get('table');
    setTableNumber(table || 'Bawa Pulang');

    // Siapkan script Midtrans di HP pelanggan
    const snapScript = "https://app.sandbox.midtrans.com/snap/snap.js";
    const clientKey = "Mid-client-k1JTDssT7uPoIOz_"; // Ganti dengan Client Key Sandbox Anda
    
    if (!document.getElementById("midtrans-script-mobile")) {
      const script = document.createElement("script");
      script.src = snapScript;
      script.id = "midtrans-script-mobile";
      script.setAttribute("data-client-key", clientKey);
      document.body.appendChild(script);
    }
  }, []);

  const addToCart = (product) => {
    const existing = cart.find(i => i.id === product.id);
    if (existing) {
      if (existing.quantity >= product.stock) return alert("Maksimal stok tercapai!");
      setCart(cart.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const decreaseQuantity = (id) => {
    const item = cart.find(i => i.id === id);
    if (!item) return;
    if (item.quantity === 1) {
      setCart(cart.filter(i => i.id !== id));
    } else {
      setCart(cart.map(i => i.id === id ? { ...i, quantity: item.quantity - 1 } : i));
    }
  };

  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsProcessing(true);

    try {
      // 1. Buat pesanan dengan status 'pending'
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([{ 
          customer_name: `Meja ${tableNumber}`, 
          order_type: 'Dine In', 
          total_amount: totalAmount, 
          status: 'pending' 
        }])
        .select().single();

      if (orderError) throw orderError;

      // 2. Simpan item pesanan
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(cart.map(i => ({ 
          order_id: orderData.id, 
          product_id: i.id, 
          quantity: i.quantity, 
          subtotal: i.price * i.quantity 
        })));

      if (itemsError) throw itemsError;

      // 3. Panggil Edge Function Midtrans
      const { data: midData, error: midError } = await supabase.functions.invoke('create-payment', {
        body: { 
          order_id: orderData.id, 
          total_amount: totalAmount, 
          customer_name: `Meja ${tableNumber}`,
          is_qris_only: false 
        }
      });

      if (midError || !midData?.token) throw new Error("Gagal terhubung ke gerbang pembayaran.");

      // 4. Buka popup Midtrans di HP pelanggan
      if (window.snap) {
        window.snap.pay(midData.token, {
          onSuccess: async () => {
            await supabase.from('orders').update({ status: 'paid' }).eq('id', orderData.id);
            setCart([]);
            setOrderSuccess(true);
            setIsProcessing(false);
          },
          onPending: () => {
            alert("Pembayaran tertunda. Silakan selesaikan di aplikasi Anda.");
            setIsProcessing(false);
          },
          onError: () => {
            alert("Pembayaran gagal. Silakan coba lagi.");
            setIsProcessing(false);
          },
          onClose: () => {
            setIsProcessing(false);
          }
        });
      }
    } catch (error) {
      alert("Terjadi kesalahan: " + error.message);
      setIsProcessing(false);
    }
  };

  if (orderSuccess) {
    return (
      <div style={{ padding: '30px 20px', textAlign: 'center', fontFamily: 'sans-serif' }}>
        <h1 style={{ color: '#28a745', fontSize: '40px', margin: '0 0 10px 0' }}>✓</h1>
        <h2>Pembayaran Berhasil!</h2>
        <p style={{ color: '#666' }}>Pesanan Anda sedang disiapkan oleh dapur. Silakan tunggu di <strong>Meja {tableNumber}</strong>.</p>
        <button 
          onClick={() => setOrderSuccess(false)}
          style={{ marginTop: '20px', padding: '12px 24px', background: '#007bff', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', width: '100%' }}
        >
          Pesan Lagi
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '15px', maxWidth: '500px', margin: '0 auto', fontFamily: 'sans-serif', paddingBottom: '100px' }}>
      
      {/* HEADER PELANGGAN */}
      <div style={{ textAlign: 'center', padding: '15px 0', borderBottom: '1px solid #eee', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, color: '#333' }}>KAFE RESTO KITA</h2>
        <p style={{ margin: '5px 0 0 0', color: '#007bff', fontWeight: 'bold' }}>📍 Meja Nomor {tableNumber}</p>
      </div>

      {/* KATALOG MENU MOBILE */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {availableMenu.length === 0 ? (
           <p style={{ textAlign: 'center', color: 'gray' }}>Sedang memuat menu atau menu sedang kosong...</p>
        ) : (
          availableMenu.map(item => (
            <div key={item.id} style={{ display: 'flex', background: '#fff', padding: '10px', borderRadius: '12px', border: '1px solid #eaeaea', boxShadow: '0 2px 5px rgba(0,0,0,0.02)' }}>
              
              <div style={{ width: '80px', height: '80px', background: '#f4f4f4', borderRadius: '8px', overflow: 'hidden', marginRight: '15px', flexShrink: 0 }}>
                {item.image_url ? (
                  <img src={item.image_url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#aaa', fontSize: '10px' }}>No Img</div>
                )}
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <strong style={{ fontSize: '15px', display: 'block', marginBottom: '4px' }}>{item.name}</strong>
                  <span style={{ color: '#28a745', fontWeight: 'bold', fontSize: '14px' }}>Rp {item.price.toLocaleString('id-ID')}</span>
                </div>
                
                <div style={{ alignSelf: 'flex-end' }}>
                  {cart.find(i => i.id === item.id) ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#f8f9fa', padding: '4px', borderRadius: '20px', border: '1px solid #ddd' }}>
                      <button onClick={() => decreaseQuantity(item.id)} style={{ width: '28px', height: '28px', borderRadius: '50%', border: 'none', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', fontWeight: 'bold', cursor: 'pointer' }}>-</button>
                      <span style={{ fontWeight: 'bold', fontSize: '14px', minWidth: '15px', textAlign: 'center' }}>{cart.find(i => i.id === item.id).quantity}</span>
                      <button onClick={() => addToCart(item)} style={{ width: '28px', height: '28px', borderRadius: '50%', border: 'none', background: '#007bff', color: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', fontWeight: 'bold', cursor: 'pointer' }}>+</button>
                    </div>
                  ) : (
                    <button onClick={() => addToCart(item)} style={{ padding: '6px 15px', background: '#007bff', color: 'white', border: 'none', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
                      + Tambah
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* FLOATING ACTION BUTTON */}
      {cart.length > 0 && (
        <div style={{ position: 'fixed', bottom: '0', left: '0', right: '0', background: 'white', padding: '15px', boxShadow: '0 -4px 15px rgba(0,0,0,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 100 }}>
          <div>
            <div style={{ fontSize: '12px', color: '#666' }}>Total Pesanan:</div>
            <strong style={{ fontSize: '18px' }}>Rp {totalAmount.toLocaleString('id-ID')}</strong>
          </div>
          <button 
            onClick={handleCheckout} 
            disabled={isProcessing}
            style={{ background: '#28a745', color: 'white', padding: '12px 25px', border: 'none', borderRadius: '25px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer' }}
          >
            {isProcessing ? 'Memproses...' : 'Bayar Sekarang ➔'}
          </button>
        </div>
      )}

    </div>
  );
}