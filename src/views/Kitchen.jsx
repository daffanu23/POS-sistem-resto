import React, { useContext, useState } from 'react';
import { StoreContext } from '../context/StoreContext';
import imageCompression from 'browser-image-compression'; 

export default function Kitchen() {
  const { 
    user, signOut, menuItems, addProduct, editProduct, 
    deleteProduct, uploadProductImage, toggleAvailability 
  } = useContext(StoreContext);
  
  const [formData, setFormData] = useState({
    name: '',
    category: 'Makanan',
    price: '',
    stock_quantity: ''
  });
  
  const [imageFile, setImageFile] = useState(null); 
  const [isUploading, setIsUploading] = useState(false); 
  const [uploadingImageId, setUploadingImageId] = useState(null);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setIsUploading(true);
    let imageUrl = null;

    try {
      if (imageFile) {
        const options = { maxSizeMB: 0.2, maxWidthOrHeight: 800, useWebWorker: true };
        const compressedFile = await imageCompression(imageFile, options);
        imageUrl = await uploadProductImage(compressedFile);
      }

      await addProduct({
        name: formData.name,
        category: formData.category,
        price: parseFloat(formData.price),
        stock_quantity: parseInt(formData.stock_quantity, 10),
        image_url: imageUrl 
      });

      setFormData({ name: '', category: 'Makanan', price: '', stock_quantity: '' });
      setImageFile(null);
      document.getElementById('image-input').value = '';

    } catch (error) {
      console.error("Proses tambah produk gagal:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleEditImage = async (productId, file) => {
    if (!file) return;
    
    setUploadingImageId(productId); 
    try {
      const options = { maxSizeMB: 0.2, maxWidthOrHeight: 800, useWebWorker: true };
      const compressedFile = await imageCompression(file, options);
      const newImageUrl = await uploadProductImage(compressedFile);
      
      if (newImageUrl) {
        await editProduct(productId, { image_url: newImageUrl });
      }
    } catch (error) {
      console.error("Gagal mengubah gambar:", error);
      alert("Gagal mengubah gambar!");
    } finally {
      setUploadingImageId(null);
      document.getElementById(`image-upload-${productId}`).value = '';
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Panel Dapur (Inventory & Status)</h2>
        <button onClick={signOut} style={{ padding: '5px 15px', background: 'red', color: 'white', borderRadius: '5px', border: 'none', cursor: 'pointer' }}>Logout</button>
      </div>
      <p>Halo, {user?.user_metadata?.full_name}!</p>

      <hr style={{ margin: '20px 0' }} />

      {/* FORM TAMBAH PRODUK */}
      <h3>Tambah Menu Baru</h3>
      <form onSubmit={handleAddSubmit} style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input required type="text" name="name" placeholder="Nama Menu" value={formData.name} onChange={handleInputChange} style={{ padding: '8px' }} />
        
        <select name="category" value={formData.category} onChange={handleInputChange} style={{ padding: '8px' }}>
          <option value="Makanan">Makanan</option>
          <option value="Minuman">Minuman</option>
          <option value="Snack">Snack</option>
        </select>

        <input required type="number" name="price" placeholder="Harga (Rp)" value={formData.price} onChange={handleInputChange} style={{ padding: '8px' }} />
        <input required type="number" name="stock_quantity" placeholder="Jumlah Stok" value={formData.stock_quantity} onChange={handleInputChange} style={{ padding: '8px' }} />
        
        <input id="image-input" type="file" accept="image/*" onChange={handleFileChange} />
        
        <button type="submit" disabled={isUploading} style={{ background: isUploading ? 'gray' : 'green', color: 'white', padding: '8px 15px', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
          {isUploading ? 'Mengunggah...' : 'Tambah Menu'}
        </button>
      </form>

      <hr style={{ margin: '20px 0' }} />

      {/* DAFTAR MENU & TOMBOL ACTION */}
      <h3>Daftar Menu Tersedia</h3>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f4f4f4' }}>
              <th style={{ padding: '12px 8px', border: '1px solid #ddd' }}>Gambar</th>
              <th style={{ padding: '12px 8px', border: '1px solid #ddd' }}>Nama</th>
              <th style={{ padding: '12px 8px', border: '1px solid #ddd' }}>Harga</th>
              <th style={{ padding: '12px 8px', border: '1px solid #ddd' }}>Stok</th>
              <th style={{ padding: '12px 8px', border: '1px solid #ddd' }}>Status</th>
              <th style={{ padding: '12px 8px', border: '1px solid #ddd' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {menuItems.map((item) => {
              const isOutOfStock = item.stock <= 0;
              const isManuallyOff = !item.isAvailable;
              const isUnavailable = isOutOfStock || isManuallyOff;

              return (
                <tr key={item.id} style={{ 
                  background: isUnavailable ? '#f9f9f9' : 'white',
                  opacity: isUnavailable ? 0.7 : 1,
                  transition: '0.3s'
                }}>
                  <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '5px' }} />
                    ) : (
                      <span style={{ fontSize: '12px', color: 'gray' }}>No Img</span>
                    )}
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold' }}>{item.name}</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>Rp {item.price.toLocaleString('id-ID')}</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd', color: isOutOfStock ? 'red' : 'black', fontWeight: isOutOfStock ? 'bold' : 'normal' }}>
                    {item.stock} {isOutOfStock && '(Habis)'}
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>
                    <span style={{ 
                      padding: '4px 10px', 
                      borderRadius: '12px', 
                      fontSize: '12px',
                      fontWeight: 'bold',
                      background: item.isAvailable ? '#d4edda' : '#f8d7da', 
                      color: item.isAvailable ? '#155724' : '#721c24' 
                    }}>
                      {item.isAvailable ? 'ON' : 'OFF'}
                    </span>
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      
                      {/* 1. TOGGLE SWITCH ON/OFF */}
                      <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px', cursor: 'pointer', flexShrink: 0 }}>
                        <input 
                          type="checkbox" 
                          checked={item.isAvailable} 
                          onChange={() => toggleAvailability(item.id, item.isAvailable)} 
                          style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }}
                        />
                        <span style={{
                          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                          backgroundColor: item.isAvailable ? '#28a745' : '#dc3545', 
                          borderRadius: '24px', 
                          transition: '0.3s'
                        }}>
                          <span style={{
                            position: 'absolute', height: '18px', width: '18px',
                            left: item.isAvailable ? '23px' : '3px',
                            bottom: '3px',
                            backgroundColor: 'white', 
                            borderRadius: '50%', 
                            transition: '0.3s',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                          }} />
                        </span>
                      </label>

                      {/* 2. GANTI GAMBAR (Hidden Input + Button) */}
                      <input 
                        type="file" 
                        accept="image/*" 
                        style={{ display: 'none' }} 
                        id={`image-upload-${item.id}`}
                        onChange={(e) => handleEditImage(item.id, e.target.files[0])}
                      />
                      <button 
                        onClick={() => document.getElementById(`image-upload-${item.id}`).click()}
                        style={{ background: '#007bff', color: 'white', padding: '5px 10px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        disabled={uploadingImageId === item.id}
                      >
                        {uploadingImageId === item.id ? 'Loading...' : 'Ganti Gambar'}
                      </button>

                      {/* 3. EDIT STOK */}
                      <button 
                        onClick={() => {
                          const newStock = prompt(`Masukkan stok baru untuk ${item.name}:`, item.stock);
                          if (newStock !== null) editProduct(item.id, { stock_quantity: parseInt(newStock, 10) });
                        }}
                        style={{ background: '#6c757d', color: 'white', padding: '5px 10px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        Edit Stok
                      </button>

                      {/* 4. HAPUS PRODUK */}
                      <button 
                        onClick={() => deleteProduct(item.id)} 
                        style={{ background: 'darkred', color: 'white', padding: '5px 10px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        Hapus
                      </button>

                    </div>
                  </td>
                </tr>
              );
            })}
            
            {menuItems.length === 0 && (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>Belum ada menu di database.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}