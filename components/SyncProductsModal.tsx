import React, { useState, useRef, useCallback } from 'react';
import { ProductToAdd } from '../types';
import { api } from '../services/api';
import LoadingSpinner from './LoadingSpinner';
import { UploadIcon, TrashIcon, PlusIcon, DownloadIcon, SearchIcon } from './Icons';
import { parseProductFile } from '../services/productParser';

interface SyncProductsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSyncComplete: () => void;
}

const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

// --- Sub-component for Manual Product Addition ---
interface ManualAddFormProps {
    product: Partial<ProductToAdd>;
    setProduct: React.Dispatch<React.SetStateAction<Partial<ProductToAdd>>>;
    onAdd: (product: ProductToAdd) => void;
    syncQueue: ProductToAdd[];
}

const ManualAddForm: React.FC<ManualAddFormProps> = ({ product, setProduct, onAdd, syncQueue }) => {
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        
        const { barcode, name, price, promotion_price, stock } = product;

        // Enhanced validation for required fields
        if (!barcode?.trim() || !name?.trim() || price === undefined || stock === undefined) {
            setError("Por favor, preencha todos os campos obrigatórios (Barras, Nome, Preço, Estoque).");
            return;
        }

        if (syncQueue.some(p => p.barcode === barcode.trim())) {
            setError(`Produto com código de barras ${barcode} já está na fila.`);
            return;
        }
        
        // Price and stock are numbers, so a check for < 0 is sufficient as they are required.
        if (price < 0 || stock < 0) {
            setError("Preço e Estoque não podem ser negativos.");
            return;
        }

        if (promotion_price !== undefined && promotion_price !== null && promotion_price >= price) {
            setError("O preço promocional deve ser menor que o preço normal.");
            return;
        }
        
        const productToAdd: ProductToAdd = {
            barcode: barcode.trim(),
            name: name.trim(),
            price: price,
            stock: stock,
            status: product.status ?? 'active',
            promotion_price: promotion_price || null,
        };

        onAdd(productToAdd);
    };
    
    const handleGenericChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setError(null);
        const { name, value } = e.target;
        const isNumberField = ['stock'].includes(name);

        setProduct(prev => ({
            ...prev,
            [name]: isNumberField ? (value === '' ? undefined : Number(value)) : value
        }));
    };

    const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setError(null);
        const { name, value } = e.target;
        // Get only digits from the input
        const digits = value.replace(/\D/g, '');
        if (digits === '') {
            setProduct(prev => ({ ...prev, [name]: undefined }));
            return;
        }
        // Convert string of cents to a float value
        const numberValue = Number(digits) / 100;
        
        setProduct(prev => ({
            ...prev,
            [name]: numberValue
        }));
    };

    const formatToBRL = (value: number | undefined): string => {
        if (value === undefined || isNaN(value)) {
            return '';
        }
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value);
    };

    return (
        <form onSubmit={handleSubmit} className="p-4 border rounded-lg bg-gray-50 space-y-4">
            <h3 className="font-semibold text-gray-700">2. Adicionar Produto Manualmente</h3>
            <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input type="text" name="barcode" placeholder="Cód. Barras" value={product.barcode || ''} onChange={handleGenericChange} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900" />
                    <input type="text" name="name" placeholder="Nome do Produto" value={product.name || ''} onChange={handleGenericChange} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input type="text" name="price" placeholder="Preço" value={formatToBRL(product.price)} onChange={handleCurrencyChange} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900" />
                    <input type="text" name="promotion_price" placeholder="Preço Promocional" value={formatToBRL(product.promotion_price)} onChange={handleCurrencyChange} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900" />
                </div>
                <div className="grid grid-cols-1">
                    <input type="number" name="stock" placeholder="Estoque" value={product.stock ?? ''} onChange={handleGenericChange} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900" min="0" step="1" />
                </div>
            </div>
            {error && <p className="text-red-500 text-sm text-center pt-2">{error}</p>}
             <div className="flex items-center justify-between pt-4">
                <select name="status" value={product.status} onChange={handleGenericChange} className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900">
                    <option value="active">Ativo</option>
                    <option value="inactive">Inativo</option>
                </select>
                <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg text-sm flex items-center justify-center">
                    <PlusIcon className="mr-2 h-5 w-5" /> Adicionar à Fila
                </button>
            </div>
        </form>
    );
};


// --- Main Modal Component ---
const SyncProductsModal: React.FC<SyncProductsModalProps> = ({ isOpen, onClose, onSyncComplete }) => {
    const [syncQueue, setSyncQueue] = useState<ProductToAdd[]>([]);
    const [isReset, setIsReset] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncProgress, setSyncProgress] = useState(0);
    const [importMessage, setImportMessage] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isParsing, setIsParsing] = useState(false);
    
    // State for pagination and filtering
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const ITEMS_PER_PAGE = 10;
    
    // State for the manual add form is lifted here to be controlled externally
    const [manualProduct, setManualProduct] = useState<Partial<ProductToAdd>>({
        barcode: '',
        name: '',
        price: undefined,
        promotion_price: undefined,
        stock: undefined,
        status: 'active'
    });

    const fileInputRef = useRef<HTMLInputElement>(null);

    const resetState = useCallback(() => {
        setSyncQueue([]);
        setIsReset(false);
        setIsSyncing(false);
        setImportMessage('');
        setError(null);
        setIsParsing(false);
        setSyncProgress(0);
        setManualProduct({ barcode: '', name: '', price: undefined, promotion_price: undefined, stock: undefined, status: 'active' });
        setCurrentPage(1);
        setSearchTerm('');
    }, []);

    const handleClose = () => {
        resetState();
        onClose();
    };
    
    const handleRemoveFromQueue = (barcode: string) => {
        setSyncQueue(prev => prev.filter(p => p.barcode !== barcode));
    };

    const handleSync = async () => {
        if (syncQueue.length === 0) {
            setError("A fila de sincronização está vazia.");
            return;
        }
        if (isReset && !window.confirm("Atenção! A 'Carga Total' irá apagar TODOS os produtos existentes antes de enviar os novos. Deseja continuar?")) {
            return;
        }
        
        setIsSyncing(true);
        setError(null);
        setSyncProgress(0);
        try {
            await api.syncProducts(syncQueue, isReset, (progress) => {
                setSyncProgress(progress);
            });
            onSyncComplete();
            handleClose();
        } catch (err: any) {
            setError(err.message || "Ocorreu um erro ao sincronizar.");
        } finally {
            setIsSyncing(false);
        }
    };
    
    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsParsing(true);
        setImportMessage('Lendo e processando arquivo...');
        setError(null);

        try {
            const newProducts = await parseProductFile(file);
            
            const currentBarcodes = new Set(syncQueue.map(p => p.barcode));
            const uniqueNewProducts = newProducts.filter(p => !currentBarcodes.has(p.barcode));

            setSyncQueue(prev => [...prev, ...uniqueNewProducts]);

            if (newProducts.length > 0) {
                const addedCount = uniqueNewProducts.length;
                const duplicateCount = newProducts.length - addedCount;
                let message = `${addedCount} produtos foram adicionados à fila.`;
                if (duplicateCount > 0) {
                    message += ` ${duplicateCount} duplicados foram ignorados.`;
                }
                setImportMessage(message);
            } else {
                 setImportMessage('Nenhum produto válido encontrado no arquivo.');
            }

        } catch (err: any) {
            const errorMessage = err.message || "Ocorreu um erro desconhecido ao processar o arquivo.";
            setImportMessage(`Erro: ${errorMessage}`);
            console.error(err);
        } finally {
            setIsParsing(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    if (!isOpen) return null;

    // Filtering and Pagination Logic
    const filteredProducts = syncQueue.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.barcode.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
    const paginatedProducts = filteredProducts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-full max-h-[90vh] flex flex-col">
                <header className="p-4 border-b flex justify-between items-center flex-shrink-0">
                    <h2 className="text-xl font-bold text-gray-800">Sincronizar Produtos</h2>
                    <button onClick={handleClose} className="text-gray-500 hover:text-gray-800 text-2xl font-bold">×</button>
                </header>
                
                <main className="p-4 flex-1 overflow-y-auto space-y-6">
                    <div className="p-4 border rounded-lg bg-gray-50">
                         <h3 className="font-semibold text-gray-700 mb-2">1. Importar de Arquivo</h3>
                         <p className="text-sm text-gray-500 mb-3">Aceita arquivos .xlsx, .xls, .csv, ou .xml.</p>
                         <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".xlsx, .xls, .csv, .xml" disabled={isParsing} />
                         <button onClick={() => fileInputRef.current?.click()} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg text-sm w-full flex items-center justify-center disabled:bg-gray-300" disabled={isParsing}>
                            {isParsing ? (
                                <><LoadingSpinner size="sm" className="mr-2"/> Processando...</>
                            ) : (
                                <><UploadIcon className="mr-2 h-5 w-5" /> Selecionar Arquivo</>
                            )}
                        </button>
                         {importMessage && <p className="text-sm text-gray-600 mt-2">{importMessage}</p>}
                    </div>
                    
                    <ManualAddForm 
                        product={manualProduct}
                        setProduct={setManualProduct}
                        syncQueue={syncQueue}
                        onAdd={(product) => {
                            setSyncQueue(prev => [...prev, product]);
                            // Reset form state after successful add
                            setManualProduct({ barcode: '', name: '', price: undefined, promotion_price: undefined, stock: undefined, status: 'active' });
                         }} 
                    />

                    <div>
                        <h3 className="font-semibold text-gray-700 mb-2">3. Fila de Sincronização ({syncQueue.length} produtos)</h3>
                        
                        <div className="relative mb-2">
                            <input
                                type="text"
                                placeholder="Buscar por nome ou cód. de barras..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1); // Reset page on new search
                                }}
                                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-gray-900"
                            />
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <SearchIcon className="h-5 w-5 text-gray-400" />
                            </div>
                        </div>

                        <div className="border rounded-lg max-h-60 overflow-y-auto">
                            {syncQueue.length > 0 ? (
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-100 sticky top-0 z-10">
                                        <tr>
                                            <th className="p-3 font-semibold text-gray-600 uppercase tracking-wider">Produto</th>
                                            <th className="p-3 font-semibold text-gray-600 uppercase tracking-wider">Preços</th>
                                            <th className="p-3 font-semibold text-gray-600 uppercase tracking-wider">Cód. Barras</th>
                                            <th className="p-3 font-semibold text-gray-600 uppercase tracking-wider text-center">Ação</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {paginatedProducts.map(p => (
                                            <tr key={p.barcode} className="hover:bg-gray-50">
                                                <td className="p-3 text-gray-900 font-medium">{p.name}</td>
                                                <td className="p-3 text-gray-700">
                                                    {p.promotion_price && p.promotion_price > 0 ? (
                                                        <div>
                                                            <span className="line-through text-gray-500">{formatCurrency(p.price)}</span>
                                                            <span className="font-bold text-green-600 block">{formatCurrency(p.promotion_price)}</span>
                                                        </div>
                                                    ) : (
                                                        <span>{formatCurrency(p.price)}</span>
                                                    )}
                                                </td>
                                                <td className="p-3 text-gray-700 font-mono">{p.barcode}</td>
                                                <td className="p-3 text-center">
                                                    <button onClick={() => handleRemoveFromQueue(p.barcode)} className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 transition-colors">
                                                        <TrashIcon className="h-5 w-5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <p className="p-6 text-center text-gray-500">Adicione produtos manualmente ou importe um arquivo.</p>
                            )}
                        </div>
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between mt-2 px-1">
                                <button
                                    onClick={() => setCurrentPage(p => p - 1)}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Anterior
                                </button>
                                <span className="text-sm text-gray-600">
                                    Página {currentPage} de {totalPages}
                                </span>
                                <button
                                    onClick={() => setCurrentPage(p => p + 1)}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Próximo
                                </button>
                            </div>
                        )}
                    </div>
                </main>

                <footer className="p-4 border-t bg-gray-50 flex-shrink-0">
                    {error && <p className="text-red-500 text-sm mb-2 text-center">{error}</p>}
                    
                    {isSyncing && (
                        <div className="mb-4">
                            <div className="flex justify-between mb-1">
                                <span className="text-sm font-medium text-gray-700">Enviando lotes...</span>
                                <span className="text-sm font-medium text-indigo-700">{syncProgress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div 
                                    className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300 ease-linear"
                                    style={{ width: `${syncProgress}%` }}
                                ></div>
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="flex items-center">
                            <input type="checkbox" id="reset-sync" checked={isReset} onChange={(e) => setIsReset(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" disabled={isSyncing} />
                            <label htmlFor="reset-sync" className="ml-2 block text-sm text-gray-900">
                                Carga Total <span className="text-gray-500 font-normal">(apaga todos os produtos antes de enviar)</span>
                            </label>
                        </div>
                        <button onClick={handleSync} disabled={isSyncing || syncQueue.length === 0} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center w-full sm:w-auto disabled:bg-indigo-300 disabled:cursor-wait">
                            {isSyncing ? (
                                <>
                                    <LoadingSpinner size="sm" className="mr-2" /> 
                                    Sincronizando...
                                </>
                            ) : (
                                <>
                                    <DownloadIcon className="mr-2 h-5 w-5" /> 
                                    Sincronizar {syncQueue.length} Produtos
                                </>
                            )}
                        </button>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default SyncProductsModal;