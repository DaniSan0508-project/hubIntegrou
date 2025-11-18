import React, { useState, useEffect } from 'react';
import { User, Page, StoreStatus } from '../types';
import OrderList from './OrderList';
import OrderDetail from './OrderDetail';
import ProductPage from './ProductPage';
import StorePage from './StorePage'; 
import AnalyticsPage from './AnalyticsPage';
import { LogoutIcon, OrderIcon, ProductIcon, StoreIcon, DeliveryTruckIcon, ChartBarIcon } from './Icons';
import { api } from '../services/api';

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

const StoreStatusIndicator: React.FC<{ status: StoreStatus['state'] | null; isLoading: boolean }> = ({ status, isLoading }) => {
    if (isLoading) {
        return (
            <div className="flex items-center text-xs text-gray-400 animate-pulse">
                <span className="h-2 w-2 mr-1.5 bg-gray-300 rounded-full"></span>
                Verificando status...
            </div>
        );
    }

    if (!status) return null;

    const statusMap = {
        OK: { text: 'Loja Online', color: 'bg-green-500', textColor: 'text-gray-600' },
        WARNING: { text: 'Loja com Alerta', color: 'bg-yellow-500', textColor: 'text-yellow-800' },
        ERROR: { text: 'Loja Offline', color: 'bg-red-500', textColor: 'text-red-700' },
    };
    
    const { text, color, textColor } = statusMap[status];

    return (
         <div className={`flex items-center text-xs font-medium ${textColor}`}>
            <span className={`h-2 w-2 mr-1.5 rounded-full ${color}`}></span>
            {text}
        </div>
    );
};


const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [activePage, setActivePage] = useState<Page>('orders');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [storeStatus, setStoreStatus] = useState<StoreStatus['state'] | null>(null);
  const [isStatusLoading, setIsStatusLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      setIsStatusLoading(true);
      try {
        const statusData = await api.getStoreStatus();
        setStoreStatus(statusData.state);
      } catch (error) {
        console.error("Failed to fetch store status:", error);
        setStoreStatus('ERROR'); // Assume offline if fetch fails
      } finally {
        setIsStatusLoading(false);
      }
    };

    fetchStatus();
  }, [activePage]);

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
        return <ProductPage />;
      case 'merchant':
        return <StorePage user={user} />; 
      case 'analytics':
        return <AnalyticsPage />;
      default:
        return <OrderList onSelectOrder={handleSelectOrder} />;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="bg-white shadow-md p-4 flex justify-between items-center z-10 sticky top-0">
        <div className="flex items-center">
            <div className="bg-indigo-600 p-2 rounded-full mr-3 flex-shrink-0">
                <DeliveryTruckIcon className="h-6 w-6 text-white" />
            </div>
            <div>
                <h1 className="text-xl font-bold text-gray-800 truncate" title={user.tenant.name}>{user.tenant.name}</h1>
                <p className="text-sm text-gray-500">Olá, {user.name}</p>
                <div className="mt-1">
                    <StoreStatusIndicator status={storeStatus} isLoading={isStatusLoading} />
                </div>
            </div>
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
        <NavButton
          label="Análise"
          icon={<ChartBarIcon />}
          isActive={activePage === 'analytics'}
          onClick={() => { setActivePage('analytics'); handleBackToList(); }}
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
        <div className="w-5 h-5 mb-1">{icon}</div>
        <span className="text-xs font-medium">{label}</span>
    </button>
);


export default Dashboard;
