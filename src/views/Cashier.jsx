import React, { useContext, useEffect, useState, useRef } from 'react';
import { StoreContext } from '../context/StoreContext';
import { supabase } from '../supabaseClient'; 
import { useReactToPrint } from 'react-to-print'; // IMPORT LIBRARY BARU

export default function Cashier() {
  const { user, signOut, menuItems } = useContext(StoreContext);
  
  // State Antrean
  const [orders, setOrders] = useState([]);
  const [isLoadingQueue, setIsLoadingQueue] = useState(true);

  // State Kasir Manual
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [orderType, setOrderType] = useState('Dine In');
  const [cashReceived, setCashReceived] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // State Struk
  const [receiptData, setReceiptData] = useState(null);
  
  // REFERENSI UNTUK REACT-TO-PRINT
  const componentRef = useRef();

  useEffect(() => {
    fetchOrders();
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
      console.error("Gagal mengambil data pesanan:", error.message);
    } finally {
      setIsLoadingQueue(false);
    }
  };

  const markAsCompleted = async (orderId) => {
    try {
      const { error } = await supabase.from('orders').update({ status: 'completed' }).eq('id', orderId);
      if (error) throw error;
      fetchOrders(); 
    } catch (error) {
      console.error("Gagal update status:", error.message);
      alert("Gagal menyelesaikan pesanan.");
    }
  };

  const addToCart = (product) => {
    if (product.stock <= 0 || !product.isAvailable) return alert("Menu ini sedang tidak tersedia atau habis!");
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      if (existingItem.quantity >= product.stock) return alert("Stok tidak mencukupi!");
      setCart(cart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const decreaseQuantity = (productId) => {
    const existingItem = cart.find(item => item.id === productId);
    if (!existingItem) return;
    if (existingItem.quantity === 1) {
      setCart(cart.filter(item => item.id !== productId));
    } else {
      setCart(cart.map(item => item.id === productId ? { ...item, quantity: item.quantity - 1 } : item));
    }
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const change = cashReceived ? parseInt(cashReceived, 10) - totalAmount : 0;

  const handleCashPayment = async (e) => {
    e.preventDefault();
    if (!customerName) return alert("Masukkan nama pelanggan terlebih dahulu!");
    if (cart.length === 0) return alert("Keranjang masih kosong!");
    if (!cashReceived || change < 0) return alert("Jumlah uang tunai kurang!");

    setIsProcessing(true);
    try {
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([{
          customer_name: customerName,
          order_type: orderType,
          total_amount: totalAmount,
          status: 'paid' 
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItemsData = cart.map(item => ({
        order_id: orderData.id,
        product_id: item.id,
        quantity: item.quantity,
        subtotal: item.price * item.quantity
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItemsData);
      if (itemsError) throw itemsError;

      setReceiptData({
        orderId: orderData.id,
        customerName: customerName,
        orderType: orderType,
        cashierName: user?.user_metadata?.full_name || 'Kasir',
        items: [...cart],
        totalAmount: totalAmount,
        cashReceived: parseInt(cashReceived, 10),
        change: change,
        date: new Date().toLocaleString('id-ID')
      });

      setCart([]);
      setCustomerName('');
      setCashReceived('');
      fetchOrders(); 

    } catch (error) {
      console.error("Gagal memproses pembayaran:", error.message);
      alert("Terjadi kesalahan saat menyimpan pesanan.");
    } finally {
      setIsProcessing(false);
    }
  };

// FUNGSI CETAK DARI REACT-TO-PRINT YANG BARU (Versi 3+)
  const handlePrint = useReactToPrint({
    contentRef: componentRef, // <--- Baris ini yang diubah
    documentTitle: `Struk_${receiptData?.customerName || 'Pelanggan'}`,
    onAfterPrint: () => console.log('Berhasil mencetak struk!'),
  });

  return (
    <div style={{ padding: '20px', maxWidth: '1600px', margin: '0 auto', boxSizing: 'border-box' }}>
      
      {/* HEADER KASIR */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <div>
          <h2 style={{ margin: 0 }}>Panel Kasir</h2>
          <p style={{ margin: '3px 0 0 0', color: 'gray', fontSize: '14px' }}>Halo, {user?.user_metadata?.full_name || 'Kasir'}!</p>
        </div>
        <button onClick={signOut} style={{ padding: '8px 15px', background: '#dc3545', color: 'white', borderRadius: '5px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
          Logout
        </button>
      </div>

      <hr style={{ border: '1px solid #eee', marginBottom: '20px' }} />

      {/* LAYOUT UTAMA (70% KASIR : 30% ANTREAN) */}
      <div style={{ display: 'flex', gap: '25px', alignItems: 'flex-start' }}>
        
        {/* AREA A: WALK-IN (70%) */}
        <div style={{ flex: '7', display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
          
          {/* Katalog Menu */}
          <div style={{ flex: '1.2', background: '#fff', padding: '15px', borderRadius: '8px', border: '1px solid #ddd', maxHeight: '82vh', overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '16px' }}>Katalog Menu</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px' }}>
              {menuItems.map(item => {
                const isUnavailable = item.stock <= 0 || !item.isAvailable;
                return (
                  <div 
                    key={item.id} 
                    onClick={() => addToCart(item)}
                    style={{ 
                      border: '1px solid #eee', padding: '10px', borderRadius: '8px', cursor: isUnavailable ? 'not-allowed' : 'pointer',
                      opacity: isUnavailable ? 0.5 : 1, textAlign: 'center', transition: '0.2s', background: '#fff'
                    }}
                  >
                    <div style={{ height: '75px', background: '#f4f4f4', marginBottom: '8px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }} />
                      ) : <span style={{ fontSize: '10px', color: '#aaa' }}>No Img</span>}
                    </div>
                    <strong style={{ fontSize: '13px', display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{item.name}</strong>
                    <span style={{ fontSize: '12px', color: '#28a745', fontWeight: 'bold' }}>Rp {item.price.toLocaleString('id-ID')}</span>
                    <span style={{ fontSize: '11px', display: 'block', color: 'gray' }}>Stok: {item.stock}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Keranjang Kasir */}
          <div style={{ flex: '1', background: '#fff', padding: '15px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '16px' }}>Keranjang Pesanan</h3>
            <form onSubmit={handleCashPayment}>
              <div style={{ marginBottom: '12px' }}>
                <input type="text" placeholder="Nama Pelanggan" required value={customerName} onChange={(e) => setCustomerName(e.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
                <select value={orderType} onChange={(e) => setOrderType(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}>
                  <option value="Dine In">Dine In</option>
                  <option value="Takeaway">Takeaway</option>
                </select>
              </div>

              <div style={{ minHeight: '180px', maxHeight: '30vh', overflowY: 'auto', background: '#f9f9f9', padding: '10px', borderRadius: '4px', marginBottom: '12px', border: '1px solid #eee' }}>
                {cart.length === 0 ? (
                  <p style={{ color: '#aaa', textAlign: 'center', marginTop: '60px', fontSize: '14px' }}>Keranjang kosong</p>
                ) : (
                  cart.map(item => (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '13px', alignItems: 'center', borderBottom: '1px solid #f0f0f0', paddingBottom: '8px' }}>
                      <div style={{ maxWidth: '55%' }}>
                        <strong style={{ display: 'block' }}>{item.name}</strong>
                        <span style={{ color: '#666', fontSize: '12px' }}>Rp {(item.price * item.quantity).toLocaleString('id-ID')}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button type="button" onClick={() => decreaseQuantity(item.id)} style={{ width: '24px', height: '24px', borderRadius: '4px', border: '1px solid #ccc', background: '#fff', cursor: 'pointer', fontWeight: 'bold' }}>-</button>
                        <span style={{ minWidth: '20px', textAlign: 'center', fontWeight: 'bold' }}>{item.quantity}</span>
                        <button type="button" onClick={() => addToCart(item)} style={{ width: '24px', height: '24px', borderRadius: '4px', border: '1px solid #ccc', background: '#fff', cursor: 'pointer', fontWeight: 'bold' }}>+</button>
                        <button type="button" onClick={() => removeFromCart(item.id)} style={{ background: 'transparent', border: 'none', color: '#dc3545', cursor: 'pointer', fontWeight: 'bold', marginLeft: '8px' }}>✕</button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div style={{ marginBottom: '15px', borderTop: '2px dashed #ddd', paddingTop: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>
                  <span>Total Tagihan:</span>
                  <span>Rp {totalAmount.toLocaleString('id-ID')}</span>
                </div>
                <label style={{ display: 'block', fontSize: '12px', color: 'gray', marginBottom: '4px' }}>Uang Tunai Diterima:</label>
                <input type="number" required placeholder="Masukkan nominal pembayaran" value={cashReceived} onChange={(e) => setCashReceived(e.target.value)} style={{ width: '100%', padding: '10px', fontSize: '15px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box', marginBottom: '8px' }} />

                {cashReceived && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: change < 0 ? '#dc3545' : '#28a745', fontWeight: 'bold' }}>
                    <span>{change < 0 ? 'Uang Kurang:' : 'Kembalian:'}</span>
                    <span>Rp {Math.abs(change).toLocaleString('id-ID')}</span>
                  </div>
                )}
              </div>

              <button type="submit" disabled={isProcessing || cart.length === 0 || change < 0} style={{ width: '100%', padding: '12px', background: (cart.length === 0 || change < 0) ? '#ccc' : '#007bff', color: 'white', border: 'none', borderRadius: '4px', fontSize: '15px', fontWeight: 'bold', cursor: (cart.length === 0 || change < 0) ? 'not-allowed' : 'pointer' }}>
                {isProcessing ? 'Memproses...' : 'Proses Pembayaran Tunai'}
              </button>
            </form>
          </div>
        </div>

        {/* AREA B: ANTREAN MONITORING (30%) */}
        <div style={{ flex: '3', background: '#f9f9f9', padding: '15px', borderRadius: '8px', border: '1px solid #ddd', maxHeight: '82vh', overflowY: 'auto', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3 style={{ margin: 0, fontSize: '16px' }}>Antrean Pesanan</h3>
            <button onClick={fetchOrders} style={{ padding: '4px 8px', cursor: 'pointer', fontSize: '12px' }}>🔄 Refresh</button>
          </div>
          {isLoadingQueue ? (
            <p style={{ fontSize: '14px' }}>Memuat antrean...</p>
          ) : orders.length === 0 ? (
            <p style={{ color: 'gray', textAlign: 'center', padding: '20px', fontSize: '14px' }}>Belum ada pesanan masuk.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {orders.map((order) => (
                <div key={order.id} style={{ background: 'white', padding: '12px', borderRadius: '6px', borderLeft: order.status === 'paid' ? '5px solid #ffc107' : '5px solid #28a745', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
                    <strong style={{ fontSize: '14px' }}>{order.customer_name}</strong>
                    <span style={{ background: order.status === 'paid' ? '#fff3cd' : '#d4edda', color: order.status === 'paid' ? '#856404' : '#155724', padding: '2px 6px', borderRadius: '10px', fontSize: '11px', fontWeight: 'bold' }}>
                      {order.status === 'paid' ? 'PERLU DISAJIKAN' : 'SELESAI'}
                    </span>
                  </div>
                  <div style={{ fontSize: '13px', color: '#555', marginBottom: '8px' }}>
                    <p style={{ margin: '0 0 4px 0' }}>Tipe: <strong>{order.order_type}</strong></p>
                    <p style={{ margin: '0 0 4px 0' }}>Total: <strong>Rp {order.total_amount.toLocaleString('id-ID')}</strong></p>
                  </div>
                  {order.status === 'paid' && (
                    <button onClick={() => markAsCompleted(order.id)} style={{ width: '100%', padding: '6px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>
                      Tandai Selesai
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================
          MODAL STRUK DIGITAL (DENGAN REACT-TO-PRINT)
      ============================================================ */}
      {receiptData && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            background: '#f4f4f4', padding: '20px', borderRadius: '8px', width: '340px', 
            boxShadow: '0 10px 25px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', alignItems: 'center'
          }}>
            
            {/* INI ADALAH KOMPONEN YANG AKAN DI-PRINT (DISIMPAN DI DALAM REF) */}
            <div style={{ background: 'white', width: '100%', padding: '20px', boxSizing: 'border-box', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
              
              <div ref={componentRef} style={{ 
                fontFamily: "'Courier New', Courier, monospace", 
                fontSize: '12px', 
                color: '#000', 
                width: '100%',
                padding: '10px' // Padding agar saat diprint tidak mepet tepi kertas
              }}>
                <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                  <h2 style={{ margin: '0 0 5px 0', fontSize: '18px' }}>KAFE RESTO KITA</h2>
                  <p style={{ margin: '0 0 2px 0' }}>Jl. Raya Merdeka, Malang</p>
                  <p style={{ margin: 0 }}>Telp: 0812-3456-7890</p>
                  <div style={{ borderBottom: '1px dashed #000', margin: '10px 0' }}></div>
                </div>

                <div style={{ marginBottom: '10px' }}>
                  <table style={{ width: '100%', fontSize: '12px' }}>
                    <tbody>
                      <tr><td style={{ paddingBottom: '4px' }}>Tgl</td><td style={{ paddingBottom: '4px' }}>: {receiptData.date}</td></tr>
                      <tr><td style={{ paddingBottom: '4px' }}>Kasir</td><td style={{ paddingBottom: '4px' }}>: {receiptData.cashierName}</td></tr>
                      <tr><td style={{ paddingBottom: '4px' }}>Nama</td><td style={{ paddingBottom: '4px' }}>: {receiptData.customerName} ({receiptData.orderType})</td></tr>
                    </tbody>
                  </table>
                  <div style={{ borderBottom: '1px dashed #000', margin: '10px 0' }}></div>
                </div>

                <div style={{ marginBottom: '10px' }}>
                  <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                    <tbody>
                      {receiptData.items.map(item => (
                        <tr key={item.id}>
                          <td style={{ paddingBottom: '6px', verticalAlign: 'top' }}>
                            <div style={{ fontWeight: 'bold' }}>{item.name}</div>
                            <div>{item.quantity} x {item.price.toLocaleString('id-ID')}</div>
                          </td>
                          <td style={{ paddingBottom: '6px', textAlign: 'right', verticalAlign: 'bottom' }}>
                            {(item.price * item.quantity).toLocaleString('id-ID')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div style={{ borderBottom: '1px dashed #000', margin: '10px 0' }}></div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span>Total</span>
                    <span>Rp {receiptData.totalAmount.toLocaleString('id-ID')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span>Tunai</span>
                    <span>Rp {receiptData.cashReceived.toLocaleString('id-ID')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '14px', marginTop: '6px' }}>
                    <span>Kembali</span>
                    <span>Rp {receiptData.change.toLocaleString('id-ID')}</span>
                  </div>
                </div>
                
                <div style={{ textAlign: 'center', marginTop: '20px' }}>
                  <div style={{ borderBottom: '1px dashed #000', margin: '10px 0' }}></div>
                  <p style={{ margin: '0 0 5px 0' }}>Terima Kasih Atas Kunjungan Anda</p>
                  <p style={{ margin: 0, fontSize: '10px' }}>Powered by POS Resto</p>
                  <p style={{ margin: '5px 0 0 0', fontSize: '10px', color: '#666' }}>ID: {receiptData.orderId.substring(0,8)}</p>
                </div>
              </div>

            </div>

            {/* Tombol Kontrol Modal */}
            <div style={{ marginTop: '20px', display: 'flex', gap: '10px', width: '100%' }}>
              <button onClick={handlePrint} style={{ flex: 1, padding: '12px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>
                🖨️ Cetak Struk
              </button>
              <button onClick={() => setReceiptData(null)} style={{ flex: 1, padding: '12px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>
                Tutup
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}