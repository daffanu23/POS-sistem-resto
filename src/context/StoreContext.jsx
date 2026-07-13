import React, { createContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export const StoreContext = createContext();

export const StoreProvider = ({ children }) => {
  const [menuItems, setMenuItems] = useState([]);
  const [user, setUser] = useState(null); 
  const [userRole, setUserRole] = useState(null); 
  const [loading, setLoading] = useState(true);

  // 1. Ambil Data Menu
  const fetchMenu = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('category', { ascending: true });

      if (error) throw error;

      const formattedData = (data || []).map(item => ({
        id: item.id,
        name: item.name,
        price: parseFloat(item.price),
        stock: item.stock_quantity,
        isAvailable: item.is_available,
        category: item.category,
        image_url: item.image_url
      }));
      
      setMenuItems(formattedData);
    } catch (error) {
      console.error('Gagal mengambil data menu:', error.message);
      setMenuItems([]); 
    } finally {
      setLoading(false);
    }
  };

  // Cek Sesi Login saat Pertama Dibuka
  useEffect(() => {
    fetchMenu();

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        fetchUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        fetchUserProfile(session.user.id);
      } else {
        setUser(null);
        setUserRole(null);
      }
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      setUserRole(data.role);
    } catch (error) {
      console.error("Gagal mengambil role:", error);
    } finally {
      setLoading(false);
    }
  };

  // 2. Fungsi CRUD Produk
  const addProduct = async (newProduct) => {
    try {
      const { error } = await supabase.from('products').insert([newProduct]);
      if (error) throw error;
      alert('Produk berhasil ditambahkan!');
      fetchMenu(); 
    } catch (error) {
      console.error('Gagal menambah produk:', error.message);
      alert('Gagal menambah produk!');
    }
  };

  const editProduct = async (id, updatedFields) => {
    try {
      const { error } = await supabase.from('products').update(updatedFields).eq('id', id);
      if (error) throw error;
      alert('Produk berhasil diupdate!');
      fetchMenu(); 
    } catch (error) {
      console.error('Gagal mengupdate produk:', error.message);
    }
  };

  const deleteProduct = async (id) => {
    const confirmDelete = window.confirm('Yakin ingin menghapus produk ini?');
    if (!confirmDelete) return;

    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      alert('Produk dihapus!');
      fetchMenu(); 
    } catch (error) {
      console.error('Gagal menghapus produk:', error.message);
    }
  };

  // 3. Fungsi Upload Gambar
  const uploadProductImage = async (file) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.floor(Math.random() * 1000)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error.message);
      return null;
    }
  };

  // 4. Fungsi Toggle On/Off
  const toggleAvailability = async (id, currentStatus) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_available: !currentStatus })
        .eq('id', id);

      if (error) throw error; // Jika error dari database, lempar ke catch
      fetchMenu(); // Jika sukses, refresh tabel
    } catch (error) {
      console.error('Gagal mengubah status produk:', error.message);
      alert('Gagal mengubah status produk! Cek console browser Anda.');
    }
  };

  // 5. Fungsi Place Order (Dari Web Pelanggan ke Database)
  const placeOrder = async (cartItems, type, customerName) => {
    try {
      // Hitung total harga dari keranjang
      const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      // 1. Buat kepala pesanan di tabel 'orders'
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([{
          customer_name: customerName,
          order_type: type,
          total_amount: totalAmount,
          status: 'pending_payment'
        }])
        .select() // .select() wajib dipanggil agar Supabase mengembalikan ID pesanan yang baru dibuat
        .single();

      if (orderError) throw orderError;

      // 2. Siapkan detail item yang dipesan
      const orderItemsData = cartItems.map(item => ({
        order_id: orderData.id,
        product_id: item.id,
        quantity: item.quantity,
        subtotal: item.price * item.quantity
      }));

      // 3. Masukkan item-item tersebut ke tabel 'order_items'
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItemsData);

      if (itemsError) throw itemsError;

      console.log('Pesanan berhasil dibuat dengan ID:', orderData.id);

    } catch (error) {
      console.error('Gagal membuat pesanan:', error.message);
      alert('Terjadi kesalahan saat memproses pesanan. Silakan coba lagi.');
    }
  };

  // Autentikasi
  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'google' });
  };
  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <StoreContext.Provider
      value={{
        menuItems, user, userRole, loading,
        signInWithGoogle, signOut, fetchMenu,
        addProduct, editProduct, deleteProduct,
        uploadProductImage, toggleAvailability, placeOrder
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};