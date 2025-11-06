import React from 'react';
import { Product } from '../types';

const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
    return (
        <li className="bg-white rounded-lg shadow-sm border p-4 flex flex-col justify-between list-none">
            {/* Top Section */}
            <div>
                <h3 className="font-medium text-gray-800 truncate" title={product.name}>{product.name}</h3>
                <p className="text-sm text-gray-500">{product.barcode}</p>
            </div>

            {/* Middle Section */}
            <div className="flex justify-between items-center my-4">
                <div>
                    <p className="text-xs text-gray-500">Preço</p>
                    <p className="font-semibold text-gray-900">{formatCurrency(product.price)}</p>
                </div>
                <div className="text-right">
                    <p className="text-xs text-gray-500">Estoque</p>
                    <p className="font-semibold text-gray-900">{product.stock}</p>
                </div>
            </div>

            {/* Bottom Section (Footer) */}
            <div className="flex items-center space-x-2 flex-wrap">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${product.isOnIfood ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {product.isOnIfood ? 'Ativo no iFood' : 'Inativo no iFood'}
                </span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${product.isSynced ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {product.isSynced ? 'Sincronizado' : 'Pendente'}
                </span>
            </div>
        </li>
    );
};

export default ProductCard;