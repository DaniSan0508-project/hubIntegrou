// services/productParser.ts
import { ProductToAdd } from '../types';

// Type assertion for global libraries for environments where they are globally available
declare const XLSX: any;
declare const Papa: any;

/**
 * Iterates through raw data from a file and transforms it into a list of valid products.
 * @param data The array of raw items (e.g., rows from a sheet).
 * @param processor A function that converts a single raw item into a ProductToAdd object or null.
 * @returns A promise that resolves to an array of valid, unique products.
 */
const processData = (data: any[], processor: (item: any) => ProductToAdd | null): Promise<ProductToAdd[]> => {
    return new Promise((resolve) => {
        const validProducts: ProductToAdd[] = [];
        const uniqueBarcodes = new Set<string>();

        for (const item of data) {
            const product = processor(item);
            // Add only if the product is valid and its barcode is not already added
            if (product && product.barcode && !uniqueBarcodes.has(product.barcode)) {
                validProducts.push(product);
                uniqueBarcodes.add(product.barcode);
            }
        }
        resolve(validProducts);
    });
};

/**
 * Parses a file (CSV, XML, XLSX) and extracts a list of products.
 * @param file The file to parse.
 * @returns A promise that resolves to an array of ProductToAdd.
 */
export const parseProductFile = (file: File): Promise<ProductToAdd[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = async (e) => {
            try {
                const content = e.target?.result;
                if (!content) {
                    return reject(new Error("Não foi possível ler o conteúdo do arquivo."));
                }

                if (file.name.endsWith('.csv')) {
                    Papa.parse(content as string, {
                        header: false, // CSVs are treated as headerless; rows are arrays of values.
                        skipEmptyLines: true,
                        complete: async (results: any) => {
                            if (results.errors.length > 0) {
                                return reject(new Error(`Erro ao analisar CSV: ${results.errors[0].message}`));
                            }
                            // Process rows, assuming a fixed column order
                            const products = await processData(results.data, (row: any[]) => {
                                // Expects: [barcode, name, price, stock, promotion_price?]
                                if (!Array.isArray(row) || row.length < 4) {
                                    return null; // Skip invalid or incomplete rows
                                }
                                const barcode = row[0];
                                const name = row[1];
                                const priceStr = String(row[2] || '0').replace(',', '.');
                                const price = parseFloat(priceStr);
                                const stock = parseInt(row[3] || '0', 10);
                                const promoPriceStr = String(row[4] || '0').replace(',', '.');
                                const promoPrice = parseFloat(promoPriceStr);

                                if (barcode && name && !isNaN(price) && !isNaN(stock)) {
                                    return { 
                                        barcode: String(barcode).trim(), 
                                        name: String(name).trim(), 
                                        price, 
                                        promotion_price: !isNaN(promoPrice) && promoPrice > 0 ? promoPrice : null,
                                        stock, 
                                        status: 'active' 
                                    };
                                }
                                return null;
                            });
                            resolve(products);
                        },
                        error: (err: Error) => reject(err),
                    });
                } else if (file.name.endsWith('.xml')) {
                    const parser = new DOMParser();
                    const xmlDoc = parser.parseFromString(content as string, "text/xml");
                    if (xmlDoc.getElementsByTagName('parsererror').length) {
                        return reject(new Error('Erro ao analisar o arquivo XML. Verifique o formato.'));
                    }
                    const items = Array.from(xmlDoc.getElementsByTagName('prod'));
                    const products = await processData(items, (item) => {
                        const barcode = item.getElementsByTagName('cEAN')[0]?.textContent || '';
                        const name = item.getElementsByTagName('xProd')[0]?.textContent || '';
                        const price = parseFloat(item.getElementsByTagName('vUnCom')[0]?.textContent || '0');
                        const stock = parseInt(item.getElementsByTagName('qCom')[0]?.textContent || '0', 10);
                        // NOTE: promotion_price is not supported for XML as no standard tag was defined.
                        if (barcode && name && !isNaN(price) && !isNaN(stock)) {
                            return { barcode: barcode.trim(), name, price, stock, status: 'active', promotion_price: null };
                        }
                        return null;
                    });
                    resolve(products);
                } else { // Handles .xlsx, .xls
                    const workbook = XLSX.read(content, { type: 'binary' });
                    const sheetName = workbook.SheetNames[0];
                    const sheet = workbook.Sheets[sheetName];
                    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
                    const [header, ...rows] = data;
                    if (!header || (header as any[]).length === 0) return resolve([]);

                    const mapHeader = (h: string[]) => ({
                        barcode: h.findIndex(c => /barcode|ean/i.test(String(c))),
                        name: h.findIndex(c => /name|produto|descri/i.test(String(c))),
                        price: h.findIndex(c => /price|valor|value|preço|preco/i.test(String(c))),
                        promotion_price: h.findIndex(c => /promotion_price|preco_promocional|preço promocional|preco promocao|promotion price/i.test(String(c))),
                        stock: h.findIndex(c => /stock|estoque|qtd/i.test(String(c))),
                    });
                    
                    const headerMap = mapHeader(header as string[]);

                    if (headerMap.barcode === -1 || headerMap.name === -1) {
                         return reject(new Error("Arquivo Excel inválido. Verifique se as colunas de cabeçalho (ex: 'barcode', 'name') existem."));
                    }

                    const products = await processData(rows, (row: any[]) => {
                        const barcode = row[headerMap.barcode];
                        const name = row[headerMap.name];
                        const price = parseFloat(String(row[headerMap.price] || '0').replace(',', '.'));
                        const promoPrice = headerMap.promotion_price > -1 ? parseFloat(String(row[headerMap.promotion_price] || '0').replace(',', '.')) : NaN;
                        const stock = parseInt(row[headerMap.stock] || '0', 10);
                         if (barcode && name && !isNaN(price) && !isNaN(stock)) {
                            return {
                                barcode: String(barcode).trim(),
                                name,
                                price,
                                promotion_price: !isNaN(promoPrice) && promoPrice > 0 ? promoPrice : null,
                                stock,
                                status: 'active'
                            };
                        }
                        return null;
                    });
                    resolve(products);
                }
            } catch (err) {
                reject(err);
            }
        };

        reader.onerror = () => reject(new Error("Erro ao ler o arquivo."));

        if (file.name.endsWith('.xml') || file.name.endsWith('.csv')) {
            reader.readAsText(file);
        } else {
            reader.readAsBinaryString(file);
        }
    });
};