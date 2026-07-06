import React, { createContext, useState } from 'react';

export const StoreContext = createContext();

export const StoreProvider = ({ children }) => {
  // Initial Menu Data
  const [menuItems, setMenuItems] = useState([
    { id: 1, name: 'Espresso', price: 20000, stock: 10, isAvailable: true, category: 'Coffee' },
    { id: 2, name: 'Americano', price: 25000, stock: 15, isAvailable: true, category: 'Coffee' },
    { id: 3, name: 'Cappuccino', price: 30000, stock: 8, isAvailable: true, category: 'Coffee' },
    { id: 4, name: 'Cafe Latte', price: 30000, stock: 12, isAvailable: true, category: 'Coffee' },
    { id: 5, name: 'Croissant', price: 25000, stock: 5, isAvailable: true, category: 'Food' },
    { id: 6, name: 'Cheesecake', price: 35000, stock: 0, isAvailable: false, category: 'Food' },
  ]);

  // Orders state
  const [orders, setOrders] = useState([]);

  // Functions for Kitchen
  const updateStock = (id, newStock) => {
    setMenuItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, stock: newStock, isAvailable: newStock > 0 ? item.isAvailable : false } : item
      )
    );
  };

  const toggleAvailability = (id) => {
    setMenuItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, isAvailable: !item.isAvailable } : item
      )
    );
  };

  // Functions for Mobile
  const placeOrder = (cartItems, type, customerName) => {
    const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const newOrder = {
      id: Date.now(),
      items: cartItems,
      total,
      type,
      customerName,
      status: 'Pending', // Pending, Paid (Cash), Paid (Transfer)
      timestamp: new Date().toISOString()
    };
    
    // Decrease stock based on order
    cartItems.forEach(cartItem => {
       setMenuItems(prev => 
         prev.map(menuItem => 
           menuItem.id === cartItem.id 
             ? { ...menuItem, stock: Math.max(0, menuItem.stock - cartItem.quantity) } 
             : menuItem
         )
       )
    });

    setOrders(prev => [newOrder, ...prev]);
  };

  // Functions for Cashier
  const processPayment = (orderId, paymentMethod) => {
    setOrders(prev =>
      prev.map(order =>
        order.id === orderId ? { ...order, status: `Paid (${paymentMethod})` } : order
      )
    );
  };

  return (
    <StoreContext.Provider
      value={{
        menuItems,
        orders,
        updateStock,
        toggleAvailability,
        placeOrder,
        processPayment
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};
