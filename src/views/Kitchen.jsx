import React, { useContext } from 'react';
import { StoreContext } from '../context/StoreContext';
import { ChefHat, ToggleLeft, ToggleRight, Plus, Minus } from 'lucide-react';

export default function Kitchen() {
  const { menuItems, updateStock, toggleAvailability } = useContext(StoreContext);

  return (
    <div className="container">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem', marginTop: '1rem' }}>
        <ChefHat size={32} color="var(--primary-color)" />
        <h2 style={{ margin: 0 }}>Dapur Cafeifa</h2>
      </div>

      <div className="grid-cards">
        {menuItems.map(item => (
          <div key={item.id} className="card" style={{ borderLeft: `4px solid ${item.isAvailable ? 'var(--success)' : 'var(--danger)'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ marginBottom: '0.25rem' }}>{item.name}</h3>
                <span className={`badge ${item.isAvailable ? 'available' : 'unavailable'}`}>
                  {item.isAvailable ? 'Tersedia' : 'Habis/Tidak Tersedia'}
                </span>
              </div>
              <button 
                onClick={() => toggleAvailability(item.id)}
                style={{ background: 'transparent', padding: 0, color: item.isAvailable ? 'var(--success)' : 'var(--gray-300)' }}
              >
                {item.isAvailable ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
              </button>
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--background-light)', padding: '0.75rem', borderRadius: '8px' }}>
              <span style={{ fontWeight: '500' }}>Stok saat ini:</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button 
                  onClick={() => updateStock(item.id, Math.max(0, item.stock - 1))}
                  className="btn-danger" 
                  style={{ padding: '0.25rem' }}
                >
                  <Minus size={16} />
                </button>
                <span style={{ fontWeight: 'bold', fontSize: '1.2rem', minWidth: '30px', textAlign: 'center' }}>
                  {item.stock}
                </span>
                <button 
                  onClick={() => updateStock(item.id, item.stock + 1)}
                  className="btn-success" 
                  style={{ padding: '0.25rem' }}
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
