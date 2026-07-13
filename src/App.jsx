import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { StoreProvider } from './context/StoreContext';
import Home from './views/Home';
import MobileCustomer from './views/MobileCustomer';
import Kitchen from './views/Kitchen';
import Cashier from './views/Cashier';
import { Home as HomeIcon } from 'lucide-react';
import './App.css'; // You can remove this or use it for additional global styles
import Login from './views/Login';

const Header = () => {
  const location = useLocation();
  if (location.pathname === '/') return null;
  return (
    <header className="app-header">
      <Link to="/" className="app-title" style={{ textDecoration: 'none' }}>
        <HomeIcon size={24} />
        <span>Cafeifa</span>
      </Link>
    </header>
  );
};

function App() {
  return (
    <StoreProvider>
      <Router>
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Header />
          <main style={{ flex: 1, backgroundColor: 'var(--background-light)' }}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/mobile" element={<MobileCustomer />} />
              <Route path="/kitchen" element={<Kitchen />} />
              <Route path="/cashier" element={<Cashier />} />
              <Route path="/login" element={<Login />} />
            </Routes>
          </main>
        </div>
      </Router>
    </StoreProvider>
  );
}

export default App;
