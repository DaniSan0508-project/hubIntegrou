import React from 'react';
import { Product } from '../types';

const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
    const hasPromotion = product.promotion_price && product.promotion_price > 0 && product.promotion_price < product.price;
    const isInactive = product.status === 'inactive';

    return (
        <li className={`rounded-lg shadow-sm border p-4 flex flex-col justify-between list-none transition-colors ${isInactive ? 'bg-gray-100' : 'bg-white'}`}>
            {/* Top Section */}
            <div>
                <h3 className={`font-medium truncate ${isInactive ? 'text-gray-500' : 'text-gray-800'}`} title={product.name}>{product.name}</h3>
                <p className={`text-sm ${isInactive ? 'text-gray-400' : 'text-gray-500'}`}>{product.barcode}</p>
            </div>

            {/* Middle Section */}
            <div className="flex justify-between items-center my-4">
                <div>
                    <p className={`text-xs ${isInactive ? 'text-gray-400' : 'text-gray-500'}`}>Preço</p>
                    {hasPromotion ? (
                        <div>
                            <p className={`text-sm line-through ${isInactive ? 'text-gray-400' : 'text-gray-500'}`}>{formatCurrency(product.price)}</p>
                            <p className={`font-semibold text-lg ${isInactive ? 'text-gray-600' : 'text-green-600'}`}>{formatCurrency(product.promotion_price!)}</p>
                        </div>
                    ) : (
                        <p className={`font-semibold ${isInactive ? 'text-gray-600' : 'text-gray-900'}`}>{formatCurrency(product.price)}</p>
                    )}
                </div>
                <div className="text-right">
                    <p className={`text-xs ${isInactive ? 'text-gray-400' : 'text-gray-500'}`}>Estoque</p>
                    <p className={`font-semibold ${isInactive ? 'text-gray-600' : 'text-gray-900'}`}>{product.stock}</p>
                </div>
            </div>

            {/* Bottom Section (Footer) */}
            <div className="flex items-center space-x-2 flex-wrap pt-2 border-t">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${isInactive ? 'bg-gray-200 text-gray-500' : (product.isSynced ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800')}`}>
                    {product.isSynced ? 'Sincronizado' : 'Pendente para Sincronização'}
                </span>
            </div>
        </li>
    );
};

export default ProductCard;
