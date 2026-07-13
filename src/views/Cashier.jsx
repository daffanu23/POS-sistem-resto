import React, { useContext, useEffect, useState, useRef } from 'react';
import { StoreContext } from '../context/StoreContext';
import { supabase } from '../supabaseClient'; 
import { useReactToPrint } from 'react-to-print'; 
import { QRCodeSVG } from 'qrcode.react'; 

export default function Cashier() {
  const { user, signOut, menuItems } = useContext(StoreContext);
  
  // State Antrean Pesanan
  const [orders, setOrders] = useState([]);
  const [isLoadingQueue, setIsLoadingQueue] = useState(true);

  // State Point of Sale (POS) Manual
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [orderType, setOrderType] = useState('Dine In');
  const [paymentMethod, setPaymentMethod] = useState('Tunai'); 
  const [cashReceived, setCashReceived] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // State Modal Struk
  const [receiptData, setReceiptData] = useState(null);
  const componentRef = useRef();

  // State Generator QR Meja
  const [showQrManager, setShowQrManager] = useState(false);
  const [inputJumlahMeja, setInputJumlahMeja] = useState(10); 
  const qrPrintRef = useRef();

  useEffect(() => {
    fetchOrders();
    
    const snapScript = "https://app.sandbox.midtrans.com/snap/snap.js";
    const clientKey = "SB-Mid-client-XXXXX"; // Sesuaikan dengan Client Key Sandbox Anda
    
    if (!document.getElementById("midtrans-script")) {
      const script = document.createElement("script");
      script.src = snapScript;
      script.id = "midtrans-script";
      script.setAttribute("data-client-key", clientKey);
      document.body.appendChild(script);
    }
  }, []);

  const fetchOrders = async () => {
    setIsLoadingQueue(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .neq('status', 'pending') 
        .order('created_at', { ascending: false }); 
      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error("Gagal mengambil antrean:", error.message);
    } finally {
      setIsLoadingQueue(false);
    }
  };

  const markAsCompleted = async (orderId) => {
    try {
      await supabase.from('orders').update({ status: 'completed' }).eq('id', orderId);
      fetchOrders(); 
    } catch (error) {
      alert("Gagal memperbarui status pesanan.");
    }
  };

  const addToCart = (product) => {
    if (product.stock <= 0 || !product.isAvailable) return alert("Menu tidak tersedia atau stok habis!");
    const existing = cart.find(i => i.id === product.id);
    if (existing) {
      if (existing.quantity >= product.stock) return alert("Jumlah melampaui stok!");
      setCart(cart.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const decreaseQuantity = (id) => {
    const item = cart.find(i => i.id === id);
    if (!item) return;
    if (item.quantity === 1) setCart(cart.filter(i => i.id !== id));
    else setCart(cart.map(i => i.id === id ? { ...i, quantity: item.quantity - 1 } : i));
  };

  const removeFromCart = (id) => setCart(cart.filter(i => i.id !== id));

  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const change = (paymentMethod === 'Tunai' && cashReceived) ? parseInt(cashReceived, 10) - totalAmount : 0;

  const handlePayment = async (e) => {
    e.preventDefault();
    if (!customerName || cart.length === 0) return alert("Nama pelanggan atau keranjang kosong!");
    if (paymentMethod === 'Tunai' && (!cashReceived || change < 0)) return alert("Nominal uang tunai kurang!");

    setIsProcessing(true);
    try {
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([{ customer_name: customerName, order_type: orderType, total_amount: totalAmount, status: paymentMethod === 'Tunai' ? 'paid' : 'pending' }])
        .select().single();

      if (orderError) throw orderError;

      await supabase.from('order_items').insert(cart.map(i => ({ 
        order_id: orderData.id, product_id: i.id, quantity: i.quantity, subtotal: i.price * i.quantity 
      })));

      if (paymentMethod === 'Tunai') {
        tampilkanStruk(orderData.id);
      } else {
        const { data: midData, error: midError } = await supabase.functions.invoke('create-payment', {
          body: { order_id: orderData.id, total_amount: totalAmount, customer_name: customerName, is_qris_only: true }
        });

        if (midError || !midData?.token) throw new Error("Gagal memperoleh token Midtrans.");

        if (window.snap) {
          window.snap.pay(midData.token, {
            onSuccess: async () => {
              await supabase.from('orders').update({ status: 'paid' }).eq('id', orderData.id);
              tampilkanStruk(orderData.id);
            },
            onClose: () => setIsProcessing(false)
          });
        }
      }
    } catch (error) {
      alert("Kendala: " + error.message);
      setIsProcessing(false);
    }
  };

  const tampilkanStruk = (id) => {
    setReceiptData({ 
      orderId: id, customerName, orderType, paymentMethod, cashierName: user?.user_metadata?.full_name || 'Kasir', 
      items: [...cart], totalAmount, cashReceived: paymentMethod === 'Tunai' ? parseInt(cashReceived, 10) : totalAmount, 
      change: paymentMethod === 'Tunai' ? change : 0, date: new Date().toLocaleString('id-ID') 
    });
    setCart([]); setCustomerName(''); setCashReceived(''); setPaymentMethod('Tunai'); fetchOrders(); setIsProcessing(false);
  };

  const handlePrintReceipt = useReactToPrint({ contentRef: componentRef });
  const handlePrintQrCodes = useReactToPrint({ contentRef: qrPrintRef });

  // URL DIKUNCI LANGSUNG KE PRODUCTION VERCEL RESTORAN
  const baseUrl = "https://pos-sistem-resto.vercel.app";

  return (
    <div style={{ padding: '25px', maxWidth: '1600px', margin: '0 auto', fontFamily: 'sans-serif', boxSizing: 'border-box' }}>
      
      {/* HEADER UTAMA */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', backgroundColor: '#fff', padding: '15px', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
        <div>
          <h2 style={{ margin: 0, color: '#333' }}>Panel Operasional Kasir</h2>
          <p style={{ margin: '4px 0 0 0', color: '#777', fontSize: '14px' }}>Petugas: <strong>{user?.user_metadata?.full_name || 'Kasir Resto'}</strong></p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setShowQrManager(true)} style={{ background: '#007bff', color: 'white', padding: '10px 15px', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
            🛠️ Generator QR Meja
          </button>
          <button onClick={signOut} style={{ background: '#dc3545', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Logout</button>
        </div>
      </div>

      <hr style={{ border: '1px solid #eee', marginBottom: '20px' }} />

      {/* LAYOUT GRID UTAMA */}
      <div style={{ display: 'flex', gap: '25px', alignItems: 'flex-start' }}>
        
        {/* AREA A: POS WALK-IN (70%) */}
        <div style={{ flex: 7, display: 'flex', gap: '20px' }}>
          <div style={{ flex: 1.3, background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #ddd', maxHeight: '78vh', overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', borderBottom: '2px solid #f0f0f0', paddingBottom: '8px' }}>Daftar Menu Restoran</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '12px' }}>
              {menuItems.map(item => (
                <div key={item.id} onClick={() => addToCart(item)} style={{ border: '1px solid #e0e0e0', padding: '12px', textAlign: 'center', borderRadius: '8px', cursor: 'pointer', backgroundColor: '#fafafa' }}>
                  <strong style={{ fontSize: '14px', display: 'block', marginBottom: '5px' }}>{item.name}</strong>
                  <span style={{ color: '#28a745', fontWeight: 'bold', fontSize: '13px' }}>Rp {item.price.toLocaleString('id-ID')}</span>
                  <small style={{ display: 'block', color: '#888', fontSize: '11px', marginTop: '4px' }}>Stok: {item.stock}</small>
                </div>
              ))}
            </div>
          </div>

          <div style={{ flex: 1, background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #ddd' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', borderBottom: '2px solid #f0f0f0', paddingBottom: '8px' }}>Detail Keranjang</h3>
            <form onSubmit={handlePayment}>
              <input type="text" placeholder="Input Nama Pelanggan" required value={customerName} onChange={e => setCustomerName(e.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}/>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                <select value={orderType} onChange={e => setOrderType(e.target.value)} style={{ flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}>
                  <option value="Dine In">Dine In</option>
                  <option value="Takeaway">Takeaway</option>
                </select>
                <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} style={{ flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid #007bff', background: '#f4f9ff', fontWeight: 'bold' }}>
                  <option value="Tunai">💰 Tunai</option>
                  <option value="QRIS">📱 Langsung QRIS</option>
                </select>
              </div>

              <div style={{ minHeight: '160px', maxHeight: '28vh', overflowY: 'auto', background: '#fcfcfc', padding: '10px', borderRadius: '6px', marginBottom: '15px', border: '1px solid #eee' }}>
                {cart.length === 0 ? (
                  <p style={{ color: '#bbb', textAlign: 'center', marginTop: '50px', fontSize: '13px' }}>Belum ada item terpilih</p>
                ) : (
                  cart.map(i => (
                    <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', paddingBottom: '6px', borderBottom: '1px solid #f5f5f5', fontSize: '13px' }}>
                      <div style={{ maxWidth: '55%' }}>
                        <strong>{i.name}</strong>
                        <div style={{ color: '#666', fontSize: '11px' }}>Rp {(i.price * i.quantity).toLocaleString('id-ID')}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button type="button" onClick={() => decreaseQuantity(i.id)} style={{ padding: '3px 8px', borderRadius: '4px', border: '1px solid #ccc', background: '#fff' }}>-</button>
                        <span style={{ fontWeight: 'bold' }}>{i.quantity}</span>
                        <button type="button" onClick={() => addToCart(i)} style={{ padding: '3px 8px', borderRadius: '4px', border: '1px solid #ccc', background: '#fff' }}>+</button>
                        <button type="button" onClick={() => removeFromCart(i.id)} style={{ background: 'transparent', border: 'none', color: '#dc3545', marginLeft: '4px' }}>✕</button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div style={{ borderTop: '2px dashed #e0e0e0', paddingTop: '12px', marginBottom: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>
                  <span>Total Bill:</span><span>Rp {totalAmount.toLocaleString('id-ID')}</span>
                </div>
                {paymentMethod === 'Tunai' ? (
                  <>
                    <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>Nominal Uang Tunai:</label>
                    <input type="number" required placeholder="Masukkan nominal uang" value={cashReceived} onChange={e => setCashReceived(e.target.value)} style={{ width: '100%', padding: '10px', fontSize: '14px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}/>
                    {cashReceived && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginTop: '8px', color: change < 0 ? '#dc3545' : '#28a745', fontWeight: 'bold' }}>
                        <span>{change < 0 ? 'Uang Kurang:' : 'Kembalian:'}</span><span>Rp {Math.abs(change).toLocaleString('id-ID')}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ padding: '10px', backgroundColor: '#e8f5e9', color: '#2e7d32', borderRadius: '6px', fontSize: '12px', textAlign: 'center' }}>
                    Jendela QRIS Midtrans akan langsung terbuka otomatis.
                  </div>
                )}
              </div>
              <button type="submit" disabled={isProcessing || cart.length === 0 || (paymentMethod === 'Tunai' && change < 0)} style={{ width: '100%', padding: '14px', background: (cart.length === 0 || (paymentMethod === 'Tunai' && change < 0)) ? '#ccc' : (paymentMethod === 'QRIS' ? '#0288d1' : '#2e7d32'), color: 'white', border: 'none', borderRadius: '6px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer' }}>
                {isProcessing ? '🔄 Menghubungkan...' : `Proses Transaksi ${paymentMethod}`}
              </button>
            </form>
          </div>
        </div>

        {/* AREA B: MONITOR ANTREAN (30%) */}
        <div style={{ flex: 3, background: '#fdfdfd', padding: '20px', borderRadius: '8px', border: '1px solid #ddd', maxHeight: '78vh', overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '2px solid #f0f0f0', paddingBottom: '8px' }}>
            <h3 style={{ margin: 0, fontSize: '16px' }}>Antrean Masuk</h3>
            <button onClick={fetchOrders} style={{ padding: '4px 8px', fontSize: '12px', cursor: 'pointer' }}>🔄 Refresh</button>
          </div>
          {isLoadingQueue ? ( <p style={{ fontSize: '13px' }}>Memuat...</p> ) : orders.length === 0 ? ( <p style={{ color: '#999', textAlign: 'center', fontSize: '13px' }}>Belum ada pesanan.</p> ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {orders.map(o => (
                <div key={o.id} style={{ background: '#fff', padding: '12px', borderRadius: '6px', border: '1px solid #e0e0e0', borderLeft: o.status === 'paid' ? '5px solid #ffc107' : '5px solid #28a745' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <strong style={{ fontSize: '13px' }}>{o.customer_name}</strong>
                    <span style={{ fontSize: '11px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '10px', background: o.status === 'paid' ? '#fff3cd' : '#d4edda', color: o.status === 'paid' ? '#856404' : '#155724' }}>{o.status === 'paid' ? 'ANTRE' : 'SELESAI'}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>{o.order_type} | Rp {o.total_amount.toLocaleString('id-ID')}</div>
                  {o.status === 'paid' && ( <button onClick={() => markAsCompleted(o.id)} style={{ width: '100%', padding: '6px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>Tandai Selesai</button> )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ================= MODAL STRUK BELANJA ================= */}
      {receiptData && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: '20px', borderRadius: '8px', width: '340px' }}>
            <div style={{ background: '#fff', border: '1px solid #ccc', padding: '15px' }}>
              <div ref={componentRef} style={{ fontFamily: "'Courier New', Courier, monospace", fontSize: '12px', color: '#000' }}>
                <div style={{ textAlign: 'center' }}><strong>KAFE RESTO KITA</strong><br/>===============================</div>
                <p>Nama  : {receiptData.customerName}<br/>Metode: {receiptData.paymentMethod}</p>
                {receiptData.items.map(i => <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between' }}><span>{i.name} x{i.quantity}</span><span>{(i.price * i.quantity).toLocaleString()}</span></div>)}
                <div style={{ borderTop: '1px dashed #000', marginTop: '10px', paddingTop: '5px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><strong>TOTAL:</strong><strong>Rp {receiptData.totalAmount.toLocaleString()}</strong></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>KEMBALI:</span><span>Rp {receiptData.change.toLocaleString()}</span></div>
                </div>
              </div>
            </div>
            <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
              <button onClick={handlePrintReceipt} style={{ flex: 1, padding: '10px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>🖨️ Cetak</button>
              <button onClick={() => setReceiptData(null)} style={{ flex: 1, padding: '10px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>Tutup</button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL DUA: INTERNAL QR CODE GENERATOR MANAGER
      ============================================================ */}
      {showQrManager && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div style={{ background: 'white', padding: '25px', borderRadius: '8px', width: '650px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 5px 20px rgba(0,0,0,0.3)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
              <h3 style={{ margin: 0 }}>Alat Generator Cetak QR Meja Restoran</h3>
              <button onClick={() => setShowQrManager(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
            </div>

            <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', alignItems: 'center' }}>
              <label style={{ fontSize: '14px', fontWeight: 'bold' }}>Jumlah Meja di Restoran:</label>
              <input 
                type="number" min="1" max="50" value={inputJumlahMeja} 
                onChange={(e) => setInputJumlahMeja(parseInt(e.target.value, 10) || 1)}
                style={{ width: '80px', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '15px', textAlign: 'center' }}
              />
              <button onClick={handlePrintQrCodes} style={{ background: '#28a745', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', marginLeft: 'auto' }}>
                🖨️ Cetak Semua QR Meja
              </button>
            </div>

            {/* AREA PREVIEW TAMPILAN QR YANG AKAN DI-PRINT */}
            <div style={{ flex: 1, overflowY: 'auto', background: '#f9f9f9', padding: '15px', borderRadius: '6px', border: '1px solid #eee' }}>
              <div ref={qrPrintRef} style={{ 
                background: 'white', padding: '20px', display: 'grid', 
                gridTemplateColumns: 'repeat(2, 1fr)', gap: '30px', justifyContent: 'center'
              }}>
                {Array.from({ length: inputJumlahMeja }, (_, index) => {
                  const nomorMeja = index + 1;
                  // LINK SEKARANG DIKUNCI MATI KE DOMAIN VERCEL UTAMA
                  const targetUrl = `${baseUrl}/?menu=true&table=${nomorMeja}`;
                  
                  return (
                    <div key={nomorMeja} style={{ 
                      border: '2px dashed #000', padding: '20px', textAlign: 'center', 
                      display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: '#fff',
                      pageBreakInside: 'avoid' 
                    }}>
                      <span style={{ fontFamily: 'monospace', fontSize: '14px', fontWeight: 'bold', marginBottom: '5px', letterSpacing: '1px' }}>SELAMAT DATANG</span>
                      <strong style={{ fontSize: '18px', marginBottom: '12px' }}>MEJA NOMOR {nomorMeja}</strong>
                      
                      <QRCodeSVG value={targetUrl} size={130} level={"H"} includeMargin={true} />
                      
                      <p style={{ fontSize: '11px', color: '#555', marginTop: '10px', marginBottom: 0, fontFamily: 'monospace' }}>
                        Scan untuk Memesan & Membayar
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}