import React from 'react';
import Home from './views/Home'; 
import { StoreProvider } from './context/StoreContext';

export default function App() {
  return (
    <StoreProvider>
      <Home />
    </StoreProvider>
  );
}