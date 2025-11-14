import React, { useState, useEffect, useCallback } from 'react';
import { Product, ProductFilters, Pagination } from '../types';
import { api } from '../services/api';
import LoadingSpinner from './LoadingSpinner';
import PaginationControls from './PaginationControls';
import SyncProductsModal from './SyncProductsModal';
import { FilterIcon, RefreshIcon, SearchIcon, SyncIcon } from './Icons';
import ProductCard from './ProductCard';

const FilterPanel: React.FC<{
    tempFilters: ProductFilters;
    onFilterChange: (filters: ProductFilters) => void;
    onApply: () => void;
    onClear: () => void;
}> = ({ tempFilters, onFilterChange, onApply, onClear }) => (
     <div className="p-4 bg-white rounded-lg shadow mb-4 border space-y-4">
        <div>
             <label className="flex items-center text-sm text-gray-500 cursor-not-allowed">
                <input
                    type="checkbox"
                    checked
                    disabled
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="ml-2 font-medium">Produtos iFood</span>
            </label>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
                type="text"
                placeholder="Nome do Produto"
                value={tempFilters.name || ''}
                onChange={(e) => onFilterChange({ ...tempFilters, name: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-gray-900"
            />
            <input
                type="text"
                placeholder="Cód. de Barras"
                value={tempFilters.barcode || ''}
                onChange={(e) => onFilterChange({ ...tempFilters, barcode: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-gray-900"
            />
        </div>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select
                value={tempFilters.status || ''}
                onChange={(e) => onFilterChange({ ...tempFilters, status: e.target.value as ProductFilters['status'] })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-gray-900"
            >
                <option value="">Todos Status</option>
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
            </select>
            <input
                type="number"
                placeholder="Preço (ex: 25.50)"
                value={tempFilters.price || ''}
                onChange={(e) => onFilterChange({ ...tempFilters, price: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-gray-900"
            />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label htmlFor="dateFrom" className="text-sm text-gray-600">De:</label>
                <input
                    type="date"
                    id="dateFrom"
                    value={tempFilters.dateFrom || ''}
                    onChange={(e) => onFilterChange({ ...tempFilters, dateFrom: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-gray-900"
                />
            </div>
            <div>
                <label htmlFor="dateTo" className="text-sm text-gray-600">Até:</label>
                <input
                    type="date"
                    id="dateTo"
                    value={tempFilters.dateTo || ''}
                    onChange={(e) => onFilterChange({ ...tempFilters, dateTo: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-gray-900"
                />
            </div>
        </div>
        <div className="flex justify-end space-x-3 pt-2">
            <button onClick={onClear} className="px-4 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100">Limpar</button>
            <button onClick={onApply} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 flex items-center"><SearchIcon className="mr-2 h-4 w-4" /> Buscar</button>
        </div>
    </div>
);


const ProductPage: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const defaultFilters: ProductFilters = { perPage: 10 };
    const [filters, setFilters] = useState<ProductFilters>(defaultFilters);
    const [tempFilters, setTempFilters] = useState<ProductFilters>(defaultFilters);
    const [showFilters, setShowFilters] = useState(false);
    const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);

    const fetchProducts = useCallback(async (appliedFilters: ProductFilters, page: number) => {
        setIsLoading(true);
        setError(null);
        try {
            const { products: fetchedProducts, pagination: fetchedPagination } = await api.getProducts({ ...appliedFilters, page });
            
            setProducts(fetchedProducts);
            setPagination(fetchedPagination);
        } catch (err: any) {
            setError('Falha ao carregar produtos.');
            console.error('Product fetch error:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProducts(filters, 1);
    }, [filters, fetchProducts]);

    const handlePageChange = (newPage: number) => {
        if (pagination && newPage >= 1 && newPage <= pagination.totalPages) {
            fetchProducts(filters, newPage);
        }
    };
    
    const handleApplyFilters = () => {
        setFilters(tempFilters);
        setShowFilters(false);
    };

    const handleClearFilters = () => {
        setTempFilters(defaultFilters);
        setFilters(defaultFilters);
        setShowFilters(false);
    };
    
    const handleSyncComplete = () => {
        fetchProducts(filters, pagination?.currentPage || 1);
        alert('Sincronização enviada com sucesso!');
    };

    const handleRefresh = () => {
      fetchProducts(filters, pagination?.currentPage || 1);
    };


    return (
        <div className="p-2 sm:p-4">
            <div className="flex justify-between items-center mb-4 px-2">
                <h2 className="text-lg font-semibold text-gray-700">Produtos ({pagination?.total ?? 0})</h2>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => setIsSyncModalOpen(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg text-sm flex items-center"
                    >
                        <SyncIcon className="mr-2 h-5 w-5" />
                        Sincronizar
                    </button>
                     <button onClick={handleRefresh} className="text-gray-500 hover:text-indigo-800 p-2 rounded-full hover:bg-indigo-50" aria-label="Atualizar produtos">
                        <RefreshIcon className={isLoading ? 'animate-spin' : ''} />
                    </button>
                    <button 
                        onClick={() => { setTempFilters(filters); setShowFilters(!showFilters) }} 
                        className="text-gray-500 hover:text-indigo-800 p-2 rounded-full hover:bg-indigo-50" 
                        aria-label="Filtrar produtos"
                    >
                        <FilterIcon />
                    </button>
                </div>
            </div>

            {showFilters && (
                <FilterPanel
                    tempFilters={tempFilters}
                    onFilterChange={setTempFilters}
                    onApply={handleApplyFilters}
                    onClear={handleClearFilters}
                />
            )}

            {isLoading ? (
                <div className="flex flex-col items-center justify-center p-10">
                    <LoadingSpinner size="lg" />
                    <p className="mt-4 text-center text-gray-500">Carregando produtos...</p>
                </div>
            ) : error ? (
                <div className="p-4 text-center text-red-500">{error}</div>
            ) : (
                <>
                    {products.length > 0 ? (
                       <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                           {products.map((product) => (
                               <ProductCard key={product.id} product={product} />
                           ))}
                       </ul>
                    ) : (
                        <p className="text-center text-gray-500 py-8">Nenhum produto encontrado.</p>
                    )}
                    {pagination && pagination.totalPages > 1 && (
                        <PaginationControls 
                            currentPage={pagination.currentPage}
                            totalPages={pagination.totalPages}
                            onPageChange={handlePageChange}
                        />
                    )}
                </>
            )}
            
            <SyncProductsModal 
                isOpen={isSyncModalOpen}
                onClose={() => setIsSyncModalOpen(false)}
                onSyncComplete={handleSyncComplete}
            />
        </div>
    );
};

export default ProductPage;