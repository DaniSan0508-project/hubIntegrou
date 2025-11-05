import React, { useState } from 'react';
import { User, Page } from '../types';
import OrderList from './OrderList';
import OrderDetail from './OrderDetail';
import ProductPage from './ProductPage'; // Import the new ProductPage component
import { LogoutIcon, OrderIcon, ProductIcon, StoreIcon } from './Icons';

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [activePage, setActivePage] = useState<Page>('orders');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const handleSelectOrder = (orderId: string) => {
    setSelectedOrderId(orderId);
  };

  const handleBackToList = () => {
    setSelectedOrderId(null);
  };
  
  const renderContent = () => {
    if (selectedOrderId) {
        return <OrderDetail orderId={selectedOrderId} onBack={handleBackToList} />;
    }
    switch (activePage) {
      case 'orders':
        return <OrderList onSelectOrder={handleSelectOrder} />;
      case 'products':
        return <ProductPage />; // Render the ProductPage component
      case 'merchant':
        return <div className="p-4 text-center">Gerenciamento da Loja (Em Breve)</div>;
      default:
        return <OrderList onSelectOrder={handleSelectOrder} />;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="bg-white shadow-md p-4 flex justify-between items-center z-10 sticky top-0">
        <div>
            <h1 className="text-xl font-bold text-gray-800">HubIntegrou</h1>
            <p className="text-sm text-gray-500">Olá, {user.name}</p>
        </div>
        <button onClick={onLogout} className="text-gray-500 hover:text-red-500" aria-label="Sair">
          <LogoutIcon />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto pb-24">
        {renderContent()}
      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around p-2 z-10">
        <NavButton
          label="Pedidos"
          icon={<OrderIcon />}
          isActive={activePage === 'orders'}
          onClick={() => { setActivePage('orders'); handleBackToList(); }}
        />
        <NavButton
          label="Produtos"
          icon={<ProductIcon />}
          isActive={activePage === 'products'}
          onClick={() => { setActivePage('products'); handleBackToList(); }}
        />
        <NavButton
          label="Loja"
          icon={<StoreIcon />}
          isActive={activePage === 'merchant'}
          onClick={() => { setActivePage('merchant'); handleBackToList(); }}
        />
      </footer>
    </div>
  );
};

interface NavButtonProps {
    label: string;
    icon: React.ReactNode;
    isActive: boolean;
    onClick: () => void;
}

const NavButton: React.FC<NavButtonProps> = ({ label, icon, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`flex flex-col items-center justify-center w-24 h-16 rounded-lg transition-colors duration-200 ${isActive ? 'text-indigo-600 bg-indigo-50' : 'text-gray-500 hover:bg-gray-100'}`}
    >
        <div className="w-6 h-6 mb-1">{icon}</div>
        <span className="text-xs font-medium">{label}</span>
    </button>
);


export default Dashboard;