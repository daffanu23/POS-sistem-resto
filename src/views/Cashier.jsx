import React, { useContext, useState } from 'react';
import { StoreContext } from '../context/StoreContext';
import { Coffee, Printer, Banknote, CreditCard, CheckCircle } from 'lucide-react';

export default function Cashier() {
  const { orders, processPayment } = useContext(StoreContext);
  const [printingOrderId, setPrintingOrderId] = useState(null);

  const pendingOrders = orders.filter(o => o.status === 'Pending');
  const completedOrders = orders.filter(o => o.status !== 'Pending');

  const handlePrint = (orderId) => {
    setPrintingOrderId(orderId);
    // Simulate printing delay
    setTimeout(() => {
      alert("Nota berhasil dicetak!");
      setPrintingOrderId(null);
    }, 1500);
  };

  const OrderCard = ({ order, isCompleted }) => (
    <div className="card" style={{ marginBottom: '1rem', borderTop: `4px solid ${isCompleted ? 'var(--success)' : 'var(--warning)'}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid var(--gray-200)', paddingBottom: '0.5rem' }}>
        <div>
          <h3 style={{ margin: 0 }}>Pesanan #{order.id.toString().slice(-4)}</h3>
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--gray-800)' }}>
            Pelanggan: <strong>{order.customerName}</strong> ({order.type})
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span className="badge" style={{ backgroundColor: isCompleted ? 'var(--success)' : 'var(--warning)', color: isCompleted ? 'white' : 'var(--text-dark)' }}>
            {order.status}
          </span>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--gray-800)', marginTop: '0.25rem' }}>
            {new Date(order.timestamp).toLocaleTimeString('id-ID')}
          </p>
        </div>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        {order.items.map((item, idx) => (
          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
            <span>{item.quantity}x {item.name}</span>
            <span>Rp {(item.price * item.quantity).toLocaleString('id-ID')}</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--background-light)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem' }}>
        <span style={{ fontWeight: 'bold' }}>Total Pembayaran</span>
        <span style={{ fontWeight: 'bold', color: 'var(--primary-color)', fontSize: '1.2rem' }}>Rp {order.total.toLocaleString('id-ID')}</span>
      </div>

      {!isCompleted ? (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn-primary" style={{ flex: 1 }} onClick={() => processPayment(order.id, 'Cash')}>
            <Banknote size={18} /> Cash
          </button>
          <button className="btn-secondary" style={{ flex: 1 }} onClick={() => processPayment(order.id, 'Transfer')}>
            <CreditCard size={18} /> Transfer
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn-success" style={{ flex: 1 }} disabled>
            <CheckCircle size={18} /> Lunas
          </button>
          <button className="btn-primary" style={{ flex: 1 }} onClick={() => handlePrint(order.id)} disabled={printingOrderId === order.id}>
            <Printer size={18} /> {printingOrderId === order.id ? 'Mencetak...' : 'Cetak Nota'}
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="container">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem', marginTop: '1rem' }}>
        <Coffee size={32} color="var(--primary-color)" />
        <h2 style={{ margin: 0 }}>Kasir Cafeifa</h2>
      </div>

      <div style={{ display: 'flex', gap: '2rem', flexDirection: 'column' }}>
        <section>
          <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ background: 'var(--warning)', color: 'var(--text-dark)', width: '24px', height: '24px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontSize: '0.8rem' }}>{pendingOrders.length}</span>
            Pesanan Baru (Belum Bayar)
          </h3>
          {pendingOrders.length === 0 ? (
            <p style={{ color: 'var(--gray-800)', fontStyle: 'italic' }}>Belum ada pesanan baru.</p>
          ) : (
            <div className="grid-cards">
              {pendingOrders.map(order => <OrderCard key={order.id} order={order} isCompleted={false} />)}
            </div>
          )}
        </section>

        <section style={{ marginTop: '2rem' }}>
          <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ background: 'var(--success)', color: 'white', width: '24px', height: '24px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontSize: '0.8rem' }}>{completedOrders.length}</span>
            Pesanan Selesai (Lunas)
          </h3>
          {completedOrders.length === 0 ? (
            <p style={{ color: 'var(--gray-800)', fontStyle: 'italic' }}>Belum ada pesanan selesai.</p>
          ) : (
            <div className="grid-cards">
              {completedOrders.map(order => <OrderCard key={order.id} order={order} isCompleted={true} />)}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
