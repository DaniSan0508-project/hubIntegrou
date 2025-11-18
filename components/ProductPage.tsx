import React, { useState, useEffect, useCallback } from 'react';
import { Product, ProductFilters, Pagination } from '../types';
import { api } from '../services/api';
import LoadingSpinner from './LoadingSpinner';
import PaginationControls from './PaginationControls';
import SyncProductsModal from './SyncProductsModal';
import { FilterIcon, RefreshIcon, SearchIcon, ChevronUpIcon, ChevronDownIcon, DownloadIcon } from './Icons';
import ProductCard from './ProductCard';

// Helper to format a raw numeric string (e.g., "12.50") into BRL currency format.
const formatBRL = (value: string | undefined): string => {
    if (!value) return '';
    const number = parseFloat(value);
    if (isNaN(number)) return '';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(number);
};

// Helper to parse a formatted currency string (e.g., "R$ 12,50") into a raw numeric string ("12.50").
const parseBRL = (value: string): string => {
    if (!value) return '';
    const digitsOnly = value.replace(/\D/g, '');
    if (digitsOnly === '') return '';
    const number = parseInt(digitsOnly, 10) / 100;
    return number.toFixed(2);
};


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
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div>
                 <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">Situação</label>
                 <select
                    id="status-filter"
                    value={tempFilters.status || ''}
                    onChange={(e) => onFilterChange({ ...tempFilters, status: e.target.value as ProductFilters['status'] })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-gray-900"
                >
                    <option value="">Todas</option>
                    <option value="active">Ativo</option>
                    <option value="inactive">Inativo</option>
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Faixa de Preço</label>
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        placeholder="Mín."
                        value={formatBRL(tempFilters.priceFrom)}
                        onChange={(e) => onFilterChange({ ...tempFilters, priceFrom: parseBRL(e.target.value) })}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-gray-900"
                    />
                    <span className="text-gray-500">-</span>
                    <input
                        type="text"
                        placeholder="Máx."
                        value={formatBRL(tempFilters.priceTo)}
                        onChange={(e) => onFilterChange({ ...tempFilters, priceTo: parseBRL(e.target.value) })}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-gray-900"
                    />
                </div>
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
    const [isIfoodSectionOpen, setIsIfoodSectionOpen] = useState(true);

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
                <h2 className="text-lg font-semibold text-gray-700">Gerenciar Produtos</h2>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => setIsSyncModalOpen(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg text-sm flex items-center"
                    >
                        <DownloadIcon className="mr-2 h-5 w-5" />
                        Sincronizar Produtos
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
                <div className="bg-white rounded-lg shadow-sm border mt-4">
                    <div 
                        className="flex justify-between items-center cursor-pointer p-4"
                        onClick={() => setIsIfoodSectionOpen(!isIfoodSectionOpen)}
                        role="button"
                        aria-expanded={isIfoodSectionOpen}
                    >
                        <div className="flex items-center">
                            <img src="https://logodownload.org/wp-content/uploads/2017/05/ifood-logo-0.png" alt="iFood Logo" className="h-6 mr-3"/>
                            <h3 className="font-semibold text-gray-800">Produtos iFood ({pagination?.total ?? 0})</h3>
                        </div>
                        <button className="text-gray-500 hover:text-indigo-600 p-1 rounded-full">
                            {isIfoodSectionOpen ? <ChevronUpIcon className="h-5 w-5" /> : <ChevronDownIcon className="h-5 w-5" />}
                        </button>
                    </div>

                    {isIfoodSectionOpen && (
                        <div className="p-4 border-t border-gray-200">
                            {products.length > 0 ? (
                                <>
                                    <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                        {products.map((product) => (
                                            <ProductCard key={product.id} product={product} />
                                        ))}
                                    </ul>
                                    {pagination && pagination.totalPages > 1 && (
                                        <PaginationControls 
                                            currentPage={pagination.currentPage}
                                            totalPages={pagination.totalPages}
                                            onPageChange={handlePageChange}
                                        />
                                    )}
                                </>
                            ) : (
                                <p className="text-center text-gray-500 py-8">Nenhum produto encontrado para os filtros aplicados.</p>
                            )}
                        </div>
                    )}
                </div>
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
