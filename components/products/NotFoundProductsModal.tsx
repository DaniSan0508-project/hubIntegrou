
import React, { useState, useEffect, useCallback } from 'react';
import { NotFoundItem, Pagination } from '../../types';
import { api } from '../../services/api';
import LoadingSpinner from '../core/LoadingSpinner';
import PaginationControls from '../core/PaginationControls';
import { PlusIcon } from '../core/Icons';


interface NotFoundProductsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddItem: (item: NotFoundItem) => void;
}

const NotFoundProductsModal: React.FC<NotFoundProductsModalProps> = ({ isOpen, onClose, onAddItem }) => {
    const [items, setItems] = useState<NotFoundItem[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [addedItemIds, setAddedItemIds] = useState<Set<string>>(new Set());

    const fetchItems = useCallback(async (page: number) => {
        setIsLoading(true);
        setError(null);
        try {
            const { items: fetchedItems, pagination: fetchedPagination } = await api.getNotFoundItems(page);
            setItems(fetchedItems);
            setPagination(fetchedPagination);
        } catch (err) {
            setError("Falha ao carregar itens não encontrados.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            fetchItems(1);
            setAddedItemIds(new Set()); // Reset on open
        }
    }, [isOpen, fetchItems]);
    
    const handlePageChange = (newPage: number) => {
        if (pagination && newPage >= 1 && newPage <= pagination.totalPages) {
            fetchItems(newPage);
        }
    };

    const handleAddItemClick = (item: NotFoundItem) => {
        onAddItem(item);
        setAddedItemIds(prev => new Set(prev).add(item.id));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl h-full max-h-[80vh] flex flex-col">
                <header className="p-4 border-b flex justify-between items-center">
                    <h2 className="text-lg font-bold text-gray-800">Produtos Não Encontrados</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl font-bold">×</button>
                </header>

                <main className="p-4 flex-1 overflow-y-auto">
                     {isLoading ? (
                        <div className="flex justify-center items-center h-full"><LoadingSpinner /></div>
                    ) : error ? (
                        <div className="text-center text-red-500">{error}</div>
                    ) : (
                        <>
                            {items.length > 0 ? (
                                <div className="space-y-2">
                                    {items.map(item => (
                                        <div key={item.id} className="p-3 bg-gray-50 rounded-lg flex justify-between items-center">
                                            <div>
                                                <p className="font-semibold text-gray-800">{item.name}</p>
                                                <p className="text-sm text-gray-500">Cód. Barras: {item.barcode || 'N/A'}</p>
                                            </div>
                                            <button 
                                                onClick={() => handleAddItemClick(item)} 
                                                disabled={addedItemIds.has(item.id)}
                                                className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed text-sm font-semibold py-1 px-3 rounded-lg flex items-center"
                                            >
                                                <PlusIcon className="mr-1 h-4 w-4" />
                                                {addedItemIds.has(item.id) ? 'Adicionado' : 'Adicionar'}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center text-gray-500">Nenhum item não encontrado.</p>
                            )}
                        </>
                    )}
                </main>
                
                {pagination && pagination.totalPages > 1 && (
                    <footer className="p-4 border-t">
                        <PaginationControls 
                            currentPage={pagination.currentPage}
                            totalPages={pagination.totalPages}
                            onPageChange={handlePageChange}
                        />
                    </footer>
                )}
            </div>
        </div>
    );
};

export default NotFoundProductsModal;