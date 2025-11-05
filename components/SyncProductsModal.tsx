import React, { useState, useRef, useCallback } from 'react';
import { ProductToAdd } from '../types';
import { api } from '../services/api';
import LoadingSpinner from './LoadingSpinner';
import { UploadIcon, TrashIcon, PlusIcon, SyncIcon } from './Icons';
import { parseProductFile } from '../services/productParser'; // Import the new parser

interface SyncProductsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSyncComplete: () => void;
}

const SyncProductsModal: React.FC<SyncProductsModalProps> = ({ isOpen, onClose, onSyncComplete }) => {
    const [syncQueue, setSyncQueue] = useState<ProductToAdd[]>([]);
    const [isReset, setIsReset] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncProgress, setSyncProgress] = useState(0);
    const [importMessage, setImportMessage] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isParsing, setIsParsing] = useState(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    const resetState = useCallback(() => {
        setSyncQueue([]);
        setIsReset(false);
        setIsSyncing(false);
        setImportMessage('');
        setError(null);
        setIsParsing(false);
        setSyncProgress(0);
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

    const ManualAddForm: React.FC<{ onAdd: (product: ProductToAdd) => boolean }> = ({ onAdd }) => {
        const [product, setProduct] = useState<ProductToAdd>({ barcode: '', name: '', price: 0, stock: 0, status: 'active' });

        const handleSubmit = (e: React.FormEvent) => {
            e.preventDefault();
            if (!product.barcode || !product.name) {
                alert("Código de Barras e Nome são obrigatórios.");
                return;
            }
            if (product.price < 0 || product.stock < 0) {
                alert("Preço e Estoque não podem ser negativos.");
                return;
            }
            if(onAdd(product)) {
                setProduct({ barcode: '', name: '', price: 0, stock: 0, status: 'active' }); // Reset form on success
            }
        };
        
        const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
            const { name, value } = e.target;
            setProduct(prev => ({ ...prev, [name]: (name === 'price' || name === 'stock') ? Number(value) : value }));
        };

        return (
            <form onSubmit={handleSubmit} className="p-4 border rounded-lg bg-gray-50 space-y-4">
                <h3 className="font-semibold text-gray-700">2. Adicionar Produto Manualmente</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input type="text" name="barcode" placeholder="Cód. Barras" value={product.barcode} onChange={handleChange} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg" required />
                    <input type="text" name="name" placeholder="Nome do Produto" value={product.name} onChange={handleChange} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg" required />
                    <input type="number" name="price" placeholder="Preço" value={product.price || ''} onChange={handleChange} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg" min="0" step="0.01" required />
                    <input type="number" name="stock" placeholder="Estoque" value={product.stock || ''} onChange={handleChange} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg" min="0" step="1" required />
                </div>
                 <div className="flex items-center justify-between">
                    <select name="status" value={product.status} onChange={handleChange} className="px-3 py-2 bg-white border border-gray-300 rounded-lg">
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
                    
                    <ManualAddForm onAdd={(product) => {
                         if (syncQueue.some(p => p.barcode === product.barcode)) {
                            alert(`Produto com código de barras ${product.barcode} já está na fila.`);
                            return false;
                        }
                        setSyncQueue(prev => [...prev, product]);
                        return true;
                     }} />

                    <div>
                        <h3 className="font-semibold text-gray-700 mb-2">3. Fila de Sincronização ({syncQueue.length} produtos)</h3>
                        <div className="border rounded-lg max-h-60 overflow-y-auto">
                            {syncQueue.length > 0 ? (
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-100 sticky top-0 z-10">
                                        <tr>
                                            <th className="p-3 font-semibold text-gray-600 uppercase tracking-wider">Produto</th>
                                            <th className="p-3 font-semibold text-gray-600 uppercase tracking-wider">Cód. Barras</th>
                                            <th className="p-3 font-semibold text-gray-600 uppercase tracking-wider text-center">Ação</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white">
                                        {syncQueue.map(p => (
                                            <tr key={p.barcode} className="border-b last:border-b-0 even:bg-gray-50">
                                                <td className="p-3 text-gray-900 font-medium">{p.name}</td>
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
                                    <SyncIcon className="mr-2 h-5 w-5" /> 
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