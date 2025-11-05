// services/api.ts
import { Order, User, OrderStatus, OrderFilters, PaginatedOrders, Pagination, Product, PaginatedProducts, ProductFilters, NotFoundItem, PaginatedNotFoundItems, ProductToAdd, StoreStatus, OpeningHour, Interruption, SalesAnalyticsData, OrderItem, OrderFee } from '../types';

// Use environment variable for the API base URL, with a fallback for local development.
const BASE_URL = (process.env.VITE_API_BASE_URL || 'https://hubintegrou.sysfar.com.br') + '/api';

// --- New Constants ---
const TOKEN_INFO_KEY = 'hubdelivery_token_info';
const REMEMBER_ME_KEY = 'hubdelivery_remember_me';

// --- Token Management ---

interface TokenInfo {
    token: string;
    expiresAt: number; // Expiration timestamp in milliseconds
}

const setTokenInfo = (token: string, expiresIn: number): void => {
    // expiresIn is in seconds. Convert to milliseconds and calculate expiry timestamp.
    // Add a 60-second buffer to refresh before it actually expires.
    const expiresAt = Date.now() + (expiresIn - 60) * 1000;
    const tokenInfo: TokenInfo = { token, expiresAt };
    localStorage.setItem(TOKEN_INFO_KEY, JSON.stringify(tokenInfo));
};

const getTokenInfo = (): TokenInfo | null => {
    const tokenInfoStr = localStorage.getItem(TOKEN_INFO_KEY);
    if (!tokenInfoStr) return null;
    try {
        return JSON.parse(tokenInfoStr);
    } catch (e) {
        localStorage.removeItem(TOKEN_INFO_KEY); // Clear corrupted data
        return null;
    }
};

const clearTokenInfo = () => {
    localStorage.removeItem(TOKEN_INFO_KEY);
    localStorage.removeItem(REMEMBER_ME_KEY);
};

const isTokenNearlyExpired = (tokenInfo: TokenInfo | null): boolean => {
    if (!tokenInfo) return true; // No token is considered expired
    return tokenInfo.expiresAt < Date.now();
};

let isRefreshing = false;
let refreshPromise: Promise<void> | null = null;

const refreshToken = async (): Promise<void> => {
    // If a refresh is already in progress, wait for it to complete
    if (isRefreshing && refreshPromise) {
        return refreshPromise;
    }
    isRefreshing = true;

    const doRefresh = async () => {
        try {
            const currentTokenInfo = getTokenInfo();
            if (!currentTokenInfo) {
                throw new Error("Nenhum token disponível para atualização.");
            }

            const response = await fetch(`${BASE_URL}/token/refresh`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${currentTokenInfo.token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Sua sessão expirou. Por favor, faça login novamente.');
            }

            const data = await response.json();
            if (data.token && data.expires_in) {
                setTokenInfo(data.token, data.expires_in);
            } else {
                throw new Error("Resposta inválida do servidor ao atualizar a sessão.");
            }
        } catch (error) {
            clearTokenInfo(); // Log out the user if refresh fails
            throw error;
        } finally {
            isRefreshing = false;
            refreshPromise = null;
        }
    };
    
    refreshPromise = doRefresh();
    return refreshPromise;
};


// --- Data Transformers ---
const transformPaginationFromApi = (apiPagination: any): Pagination => {
    return {
        currentPage: apiPagination.current_page || 1,
        perPage: parseInt(apiPagination.per_page, 10) || 100,
        total: apiPagination.total || 0,
        totalPages: apiPagination.total_pages || 1,
    };
};

/**
 * Maps status strings from the API (e.g., 'PLACED', 'CONFIRMED') to the app's internal OrderStatus enum.
 * This makes the status handling more robust by normalizing the input.
 */
const mapApiStatusToEnum = (apiStatus?: string): OrderStatus => {
    if (!apiStatus) return OrderStatus.PLC;
    // Normalize the status: trim whitespace, uppercase, and replace spaces with underscores.
    const upperStatus = apiStatus.trim().toUpperCase().replace(/ /g, '_');
    switch (upperStatus) {
        case 'PLACED':
        case 'PLC':
            return OrderStatus.PLC;
        case 'CONFIRMED':
        case 'COM':
            return OrderStatus.COM;
        case 'SEPARATION_STARTED':
        case 'SPS':
            return OrderStatus.SPS;
        case 'SEPARATION_ENDED':
        case 'SPE':
        case 'RFI': // Ready for Integration - Map to SPE to show 'Dispatch' as next action
            return OrderStatus.SPE;
        case 'DISPATCHED':
        case 'DSP':
            return OrderStatus.DSP;
        case 'ARRIVED_AT_DESTINATION':
        case 'OPA':
            return OrderStatus.OPA;
        case 'CONCLUDED':
        case 'CON':
            return OrderStatus.CON;
        case 'DELIVERED_BY_IFOOD':
        case 'DDCS':
            return OrderStatus.DDCS;
        case 'CANCELLED':
        case 'CANCELED':
        case 'CAN':
            return OrderStatus.CAN;
        case 'CANCELLATION_REQUESTED':
        case 'CAR':
            return OrderStatus.CAR;
        case 'CANCELLATION_IN_PROGRESS':
             return OrderStatus.CANCELLATION_REQUESTED;
        default:
            console.warn(`Unknown order status received from API: "${apiStatus}". Defaulting to PLC.`);
            return OrderStatus.PLC;
    }
}

const transformPaymentMethodName = (apiMethod?: string): string => {
    if (!apiMethod) {
        return 'Não informado';
    }
    const upperMethod = apiMethod.toUpperCase();
    if (upperMethod === 'CREDIT') return 'Crédito';
    if (upperMethod === 'CASH') return 'Dinheiro';
    if (upperMethod === 'DEBIT') return 'Débito';
    if (upperMethod.startsWith('VOU')) return 'Vale';
    return apiMethod; // Return original if no mapping, as it could be "Visa", etc.
};


// Converts API snake_case and nested responses to frontend-friendly camelCase
const transformOrderFromApi = (apiEntry: any): Order => {
  const apiOrder = apiEntry.order || apiEntry || {};
  const apiConsumer = apiEntry.consumer || {};
  const virtualBag = apiOrder.ifood?.virtual_bag;

  let items: OrderItem[] = [];
  let total: number = 0;
  let subtotal: number | undefined = undefined;
  let deliveryFee: number | undefined = undefined;
  let otherFees: OrderFee[] | undefined = undefined;
  let paymentMethod: string = 'Não informado';
  let deliveryCode: string | undefined = apiOrder.ifood?.delivery_code;
  let pickupCode: string | undefined = apiOrder.ifood?.pickup_code;
  let deliveryAddress: string = apiOrder.delivery_address || 'Endereço não informado';

  if (virtualBag) {
    // ---- Use virtual_bag as the source of truth ----
    items = virtualBag.bag?.items?.map((item: any): OrderItem => ({
        uniqueId: item.uniqueId,
        id: item.uniqueId,
        name: item.name,
        quantity: item.quantity,
        price: (item.prices?.unitValue?.value || 0) / 100,
        total: (item.prices?.grossValue?.value || 0) / 100,
        ean: item.ean,
    })) || [];

    subtotal = (virtualBag.bag?.prices?.grossValue?.value || 0) / 100;
    deliveryFee = (virtualBag.operationMode?.delivery?.prices?.grossValue?.value || 0) / 100;

    otherFees = virtualBag.fees?.map((fee: any): OrderFee => {
        const feeValue = fee.values?.[0]?.amount?.value || 0;
        const feeType = fee.values?.[0]?.type || 'Taxa';
        return {
            type: feeType,
            amount: feeValue / 100,
        };
    }) || [];

    const totalFromPayments = virtualBag.payment?.methods?.reduce((sum: number, method: any) => sum + (method.amount?.value || 0), 0) / 100;
    total = totalFromPayments || (subtotal + deliveryFee + (otherFees?.reduce((sum, fee) => sum + fee.amount, 0) ?? 0));

    const mainPaymentMethod = virtualBag.payment?.methods?.[0];
    if (mainPaymentMethod) {
        paymentMethod = transformPaymentMethodName(mainPaymentMethod.name);
        if (mainPaymentMethod.card?.brand) {
            paymentMethod += ` (${mainPaymentMethod.card.brand})`;
        }
    }

    if (virtualBag.customer?.localizer?.code) {
        deliveryCode = virtualBag.customer.localizer.code;
    }
    const pickupCodeData = virtualBag.verificationCodes?.find((code: any) => code.name === 'PICKUP_CODE');
    if (pickupCodeData) {
        pickupCode = pickupCodeData.value;
    }

    const addr = virtualBag.customer?.billingAddress || virtualBag.operationMode?.delivery?.destination;
    if (addr) {
        deliveryAddress = [addr.streetName, addr.streetNumber, addr.complement, addr.district, addr.city, addr.state, addr.zipCode].filter(Boolean).join(', ');
    }

  } else {
    // ---- Fallback to original logic ----
    const apiPayment = apiOrder.payment || (apiOrder.ifood && apiOrder.ifood.payment) || {};
    const dataSource = apiOrder.ifood && typeof apiOrder.ifood === 'object' ? apiOrder.ifood : apiOrder;

    items = Array.isArray(dataSource.items) ? dataSource.items.map((item: any, index: number) => {
        const quantity = parseInt(item.quantity, 10) || 1;
        const price = parseFloat(item.unit_price) || 0;
        const ean = item.ean || undefined;
        // Use EAN as a unique identifier, falling back to index for items without EAN
        const uniqueId = ean || `${apiOrder.external_id || apiOrder.id}-${index}`;

        return {
            id: uniqueId,
            name: item.name || `Produto (EAN: ${ean || 'N/A'})`,
            quantity: quantity,
            price: price,
            total: quantity * price,
            uniqueId: uniqueId,
            ean: ean,
        };
    }) : [];
    
    total = parseFloat(apiPayment.amount) || items.reduce((sum, item) => sum + item.total, 0);
    paymentMethod = transformPaymentMethodName(apiPayment.method);
  }
  
  const dataSourceForStatus = apiOrder.ifood && typeof apiOrder.ifood === 'object' ? apiOrder.ifood : apiOrder;
  const status = mapApiStatusToEnum(dataSourceForStatus.status);

  const deliveryProviderStr = (apiOrder.delivery_provider || (apiOrder.ifood && apiOrder.ifood.delivery_provider) || 'UNKNOWN').toUpperCase();
  let deliveryProvider: Order['deliveryProvider'];
  if (deliveryProviderStr === 'TAKEOUT') deliveryProvider = 'TAKEOUT';
  else if (deliveryProviderStr === 'IFOOD') deliveryProvider = 'IFOOD';
  else if (deliveryProviderStr === 'MERCHANT') deliveryProvider = 'MERCHANT';
  else deliveryProvider = 'UNKNOWN';

  const localId = apiOrder.id?.toString();
  if (!localId) {
    console.error(`Order with external_id ${apiOrder.external_id} is missing a local 'id'.`);
  }

  return {
    id: apiOrder.external_id || localId || 'missing-id',
    localId: localId || 'missing-local-id',
    displayId: apiOrder.short_code || (apiOrder.ifood && apiOrder.ifood.short_code) || apiOrder.id?.toString() || '#',
    customerName: apiConsumer.name || 'N/A',
    total: total,
    status: status,
    createdAt: dataSourceForStatus.created_at || new Date().toISOString(),
    items: items,
    deliveryAddress: deliveryAddress,
    paymentMethod: paymentMethod,
    deliveryProvider: deliveryProvider,
    // new fields
    deliveryCode: deliveryCode,
    pickupCode: pickupCode,
    subtotal: subtotal,
    deliveryFee: deliveryFee,
    otherFees: otherFees,
  };
};

const transformUserFromApi = (apiResponse: any): User => {
    const apiUser = apiResponse.user || {};
    const apiTenant = apiResponse.tenant || {};
    const apiIntegrations = apiResponse.integrations || { providers: [] };

    return {
        id: apiUser.id,
        name: apiUser.name,
        email: apiUser.email,
        tenant: {
            id: apiTenant.id,
            name: apiTenant.name || 'Nome da Loja Indisponível',
            cnpj: apiTenant.cnpj,
        },
        integrations: {
            providers: Array.isArray(apiIntegrations.providers) ? apiIntegrations.providers : [],
        },
    };
};

const transformProductFromApi = (apiProduct: any): Product => {
    return {
        id: apiProduct.id,
        name: apiProduct.name,
        barcode: apiProduct.barcode,
        price: parseFloat(apiProduct.value) || 0,
        stock: parseInt(apiProduct.stock_quantity, 10) || 0,
        status: apiProduct.status === true ? 'active' : 'inactive',
        isSynced: apiProduct.sync_status === 'synced',
        createdAt: apiProduct.created_at || new Date().toISOString(),
    };
};

const transformNotFoundItemFromApi = (apiItem: any): NotFoundItem => {
    return {
        id: apiItem.id,
        barcode: apiItem.barcode,
        name: apiItem.name,
        notes: apiItem.notes || '',
        status: apiItem.status || 'unknown',
        createdAt: apiItem.created_at || new Date().toISOString(),
    };
};

const transformStoreStatusFromApi = (apiStatus: any): StoreStatus => {
    // Assuming the API response for status is nested under a `data` key
    const data = apiStatus.data || {};
    return {
        state: data.state || 'ERROR', // Default to ERROR if state is missing
        problems: Array.isArray(data.problems) ? data.problems.map((p: any) => ({ description: p.description || 'Problema não descrito' })) : [],
    };
};

const transformOpeningHoursFromApi = (apiHours: any): OpeningHour[] => {
    // Assuming the API returns a `shifts` array
    if (!apiHours || !Array.isArray(apiHours.shifts)) {
        return [];
    }
    return apiHours.shifts.map((shift: any) => ({
        dayOfWeek: shift.dayOfWeek,
        // The API returns "HH:mm:ss", but we only need "HH:mm" for the time input
        start: shift.start?.substring(0, 5) || '00:00',
        end: shift.end?.substring(0, 5) || '00:00',
    }));
};

const transformInterruptionsFromApi = (apiInterruptions: any): Interruption[] => {
    if (!Array.isArray(apiInterruptions)) {
        return [];
    }
    return apiInterruptions.map((item: any) => ({
        id: item.id,
        description: item.description,
        start: item.start,
        end: item.end,
    }));
};


// --- API Fetch Helper ---
const fetchWithAuth = async (url: string, options: RequestInit = {}): Promise<any> => {
    let tokenInfo = getTokenInfo();
    const rememberMe = localStorage.getItem(REMEMBER_ME_KEY) === 'true';

    if (isTokenNearlyExpired(tokenInfo)) {
        if (rememberMe) {
            try {
                await refreshToken();
                tokenInfo = getTokenInfo(); // Get the new token info
            } catch (error) {
                // refreshToken already logs out on failure; re-throw to stop the original API call.
                throw new Error("Sua sessão expirou. Por favor, faça login novamente.");
            }
        } else {
             clearTokenInfo(); // Token expired and not set to remember me
             throw new Error("Sessão expirada. Por favor, faça login novamente.");
        }
    }

    if (!tokenInfo) {
        throw new Error("Não autenticado.");
    }
    
    const headers = new Headers(options.headers);

    if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
    }
    if (!headers.has('Accept')) {
        headers.set('Accept', 'application/json');
    }

    headers.set('Authorization', `Bearer ${tokenInfo.token}`);

    const response = await fetch(`${BASE_URL}${url}`, { ...options, headers });

    if (!response.ok) {
        if (response.status === 401) {
            clearTokenInfo();
        }
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorData.message || 'Ocorreu um erro na requisição.');
    }

    // Handle responses with no content
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
        return response.json();
    }
    return {}; // Return empty object for 204 No Content, etc.
};


// --- Public API Service ---
export const api = {
    login: async (email: string, password: string, rememberMe: boolean): Promise<User> => {
        const response = await fetch(`${BASE_URL}/portal/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        if (!response.ok) {
           const errorData = await response.json().catch(() => ({ message: 'Credenciais inválidas' }));
           throw new Error(errorData.message || 'Credenciais inválidas');
        }

        const data = await response.json();
        const token = data.token;
        const expiresIn = data.expires_in;

        if (token && expiresIn) {
            setTokenInfo(token, expiresIn);
             if (rememberMe) {
                localStorage.setItem(REMEMBER_ME_KEY, 'true');
            } else {
                localStorage.removeItem(REMEMBER_ME_KEY);
            }
            return await api.getMe();
        } else {
            throw new Error('Resposta de login inválida do servidor.');
        }
    },

    logout: () => {
        clearTokenInfo();
        return Promise.resolve();
    },

    getMe: async (): Promise<User> => {
        if (!getTokenInfo()) {
            return Promise.reject(new Error('Não autenticado'));
        }
        const data = await fetchWithAuth('/portal/me');
        return transformUserFromApi(data);
    },

    getOrders: async (filters: OrderFilters = {}): Promise<PaginatedOrders> => {
        const params = new URLSearchParams();
        
        if (filters.searchTerm) {
            // If search term is all digits, assume it's a short_code search
            if (/^\d+$/.test(filters.searchTerm)) {
                params.append('short_code', filters.searchTerm);
            } else {
                // Otherwise, it's a customer_name search
                params.append('customer_name', filters.searchTerm);
            }
        }

        if (filters.status) {
            params.append('status', filters.status);
        }

        if (filters.perPage) {
            params.append('per_page', String(filters.perPage));
        }

        if (filters.page) {
            params.append('page', String(filters.page));
        }

        const formatDate = (d: Date) => d.toISOString().split('T')[0];

        // Prioritize custom date fields if they exist
        if (filters.dateFrom) {
            params.append('date_from', filters.dateFrom);
        }
        if (filters.dateTo) {
            params.append('date_to', filters.dateTo);
        } 
        // Otherwise, use the date range presets
        else if (filters.dateRange) {
            const today = new Date();
            const endDate = new Date(today);
            let startDate: Date;
            
            if (filters.dateRange === 'today') {
                startDate = new Date(today);
            } else if (filters.dateRange === 'week') {
                startDate = new Date(today);
                const dayOfWeek = today.getDay(); // Sunday = 0, Monday = 1, ...
                // Adjust to make Monday the first day of the week
                const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
                startDate.setDate(diff);
            } else if (filters.dateRange === 'month') {
                startDate = new Date(today.getFullYear(), today.getMonth(), 1);
            } else {
                 startDate = new Date(today); // Fallback
            }
            
            params.append('date_from', formatDate(startDate));
            params.append('date_to', formatDate(endDate));
        }

        const queryString = params.toString();
        const url = `/erp/orders${queryString ? `?${queryString}` : ''}`;

        const data = await fetchWithAuth(url);
        
        // Handle both paginated and non-paginated responses
        const ordersArray = data.orders || (Array.isArray(data) ? data : []);

        if (!Array.isArray(ordersArray)) {
            console.error("API response for orders is not an array:", data);
            throw new Error("Formato de resposta inesperado do servidor.");
        }

        let pagination: Pagination;
        if (data.pagination) {
            // This is a paginated response (filters were applied)
            pagination = transformPaginationFromApi(data.pagination);
        } else {
            // This is a non-paginated response (e.g., initial load with no filters)
            // Create a default pagination object.
            pagination = {
                currentPage: 1,
                perPage: ordersArray.length,
                total: ordersArray.length,
                totalPages: 1, // There's only one page of data
            };
        }

        return {
            orders: ordersArray.map(transformOrderFromApi),
            pagination: pagination,
        };
    },

    getOrderById: async (id: string): Promise<Order> => {
        // The list endpoint can be filtered by the unique local ID and include virtual_bag details.
        const data = await fetchWithAuth(`/erp/orders?order_id=${id}&include_virtual_bag=1`);
        const ordersArray = data.orders;
        if (ordersArray && ordersArray.length > 0) {
            return transformOrderFromApi(ordersArray[0]);
        }
        throw new Error('Pedido não encontrado');
    },

    updateOrderStatus: async (order: Order, nextStatus: OrderStatus): Promise<void> => {
        let endpoint = '';
        const { localId, deliveryProvider } = order;

        if (!localId || localId === 'missing-local-id') {
            throw new Error('Este pedido não possui um ID local e não pode ser atualizado.');
        }

        // Map the next status to the correct API endpoint from the documentation
        switch (nextStatus) {
            case OrderStatus.COM:
                endpoint = `/erp/orders/${localId}/confirm`;
                break;
            case OrderStatus.SPS:
                endpoint = `/erp/orders/${localId}/start-separation`;
                break;
            case OrderStatus.SPE:
                endpoint = `/erp/orders/${localId}/end-separation`;
                break;
            case OrderStatus.DSP:
                // Use specific iFood dispatch endpoint if applicable, based on PRD.
                if (deliveryProvider === 'IFOOD') {
                    endpoint = `/erp/orders/${localId}/dispatch-to-ifood`;
                } else {
                    endpoint = `/erp/orders/${localId}/dispatch`;
                }
                break;
            case OrderStatus.CON:
                endpoint = `/erp/orders/${localId}/conclude-order`;
                break;
            case OrderStatus.CAN:
                endpoint = `/erp/orders/${localId}/cancel-order`;
                break;
            default:
                throw new Error(`Ação para o status ${nextStatus} não implementada.`);
        }

        // Most status change routes are POST with no body.
        await fetchWithAuth(endpoint, {
            method: 'POST',
            body: JSON.stringify({}), // Sending empty JSON object
        });

        // The component will handle the state update optimistically.
        return;
    },
    
    getSalesAnalytics: async (dateFrom: string, dateTo: string): Promise<SalesAnalyticsData> => {
        const params = new URLSearchParams();
        params.append('date_from', dateFrom);
        params.append('date_to', dateTo);
        params.append('per_page', '9999'); // Fetch a large number of orders to cover the period

        const url = `/erp/orders?${params.toString()}`;
        const data = await fetchWithAuth(url);
        
        const ordersArray = data.orders || (Array.isArray(data) ? data : []);

        if (!Array.isArray(ordersArray)) {
            console.error("API response for orders is not an array for analytics:", data);
            throw new Error("Formato de resposta inesperado do servidor para análise.");
        }

        const orders: Order[] = ordersArray.map(transformOrderFromApi);

        const dailySalesMap = new Map<string, number>();
        const statusCounts = {
            confirmed: 0,
            completed: 0,
            cancelled: 0,
        };
        
        const confirmedStatuses = [OrderStatus.COM, OrderStatus.SPS, OrderStatus.SPE, OrderStatus.DSP, OrderStatus.OPA];
        const completedStatuses = [OrderStatus.CON, OrderStatus.DDCS];
        const cancelledStatuses = [OrderStatus.CAN, OrderStatus.CAR, OrderStatus.CANCELLATION_REQUESTED];

        orders.forEach(order => {
            if (confirmedStatuses.includes(order.status)) {
                statusCounts.confirmed++;
            } else if (completedStatuses.includes(order.status)) {
                statusCounts.completed++;
                // Aggregate daily sales only for completed orders
                const orderDate = new Date(order.createdAt.replace(' ', 'T')).toISOString().split('T')[0]; // YYYY-MM-DD
                const currentTotal = dailySalesMap.get(orderDate) || 0;
                dailySalesMap.set(orderDate, currentTotal + order.total);
            } else if (cancelledStatuses.includes(order.status)) {
                statusCounts.cancelled++;
            }
        });

        const dailySales = Array.from(dailySalesMap.entries()).map(([date, total]) => ({
            date,
            total,
        })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        return {
            dailySales,
            statusCounts,
        };
    },

    // --- Product Management API ---

    getProducts: async (filters: ProductFilters = {}): Promise<PaginatedProducts> => {
        const params = new URLSearchParams();

        if (filters.name) params.append('name', filters.name);
        if (filters.barcode) params.append('barcode', filters.barcode);
        if (filters.price) params.append('value', filters.price);
        if (filters.status) params.append('status', filters.status);
        if (filters.dateFrom) params.append('created_at_start', filters.dateFrom);
        if (filters.dateTo) params.append('created_at_end', filters.dateTo);
        if (filters.page) params.append('page', String(filters.page));
        if (filters.perPage) params.append('per_page', String(filters.perPage));
        
        const queryString = params.toString();
        const url = `/hub/local/items${queryString ? `?${queryString}` : ''}`;

        const data = await fetchWithAuth(url);
        
        const productsArray = data.data || [];
        const pagination = data.pagination ? transformPaginationFromApi(data.pagination) : {
            currentPage: 1,
            perPage: productsArray.length,
            total: productsArray.length,
            totalPages: 1,
        };

        return {
            products: productsArray.map(transformProductFromApi),
            pagination: pagination,
        };
    },

    getNotFoundItems: async (page: number = 1, perPage: number = 15): Promise<PaginatedNotFoundItems> => {
        const url = `/hub/not-found-items?page=${page}&per_page=${perPage}`;
        const data = await fetchWithAuth(url);
        
        const itemsArray = data.items || [];
        const pagination = data.pagination ? transformPaginationFromApi(data.pagination) : {
            currentPage: 1,
            perPage: itemsArray.length,
            total: itemsArray.length,
            totalPages: 1,
        };

        return {
            items: itemsArray.map(transformNotFoundItemFromApi),
            pagination: pagination,
        };
    },

    syncProducts: async (
        products: ProductToAdd[], 
        isReset: boolean,
        onProgress?: (progress: number) => void
    ): Promise<void> => {
        const BATCH_SIZE = 500;
        const totalProducts = products.length;
        let processedCount = 0;

        if (totalProducts === 0) {
            onProgress?.(100);
            return Promise.resolve();
        }

        const sendBatch = async (batch: ProductToAdd[], endpoint: string) => {
            const payload = {
                items: batch.map(p => ({
                    barcode: p.barcode,
                    name: p.name,
                    value: p.price,
                    // FIX: Corrected property from 'stock_quantity' to 'stock' to match the ProductToAdd type.
                    stock: p.stock,
                    status: p.status === 'active',
                }))
            };
            await fetchWithAuth(endpoint, {
                method: 'POST',
                body: JSON.stringify(payload),
            });
            processedCount += batch.length;
            const progress = Math.round((processedCount / totalProducts) * 100);
            onProgress?.(progress);
        };

        if (isReset) {
            const firstBatch = products.slice(0, BATCH_SIZE);
            if (firstBatch.length > 0) {
                await sendBatch(firstBatch, '/erp/sync-with-reset');
            }

            for (let i = BATCH_SIZE; i < totalProducts; i += BATCH_SIZE) {
                const batch = products.slice(i, i + BATCH_SIZE);
                if (batch.length > 0) {
                    await sendBatch(batch, '/erp/products/sync');
                }
            }
        } else {
            for (let i = 0; i < totalProducts; i += BATCH_SIZE) {
                const batch = products.slice(i, i + BATCH_SIZE);
                 if (batch.length > 0) {
                    await sendBatch(batch, '/erp/products/sync');
                }
            }
        }
    },
    
    // --- Store Management API ---
    
    getStoreStatus: async (): Promise<StoreStatus> => {
        const data = await fetchWithAuth('/hub/ifood/merchant/status');
        return transformStoreStatusFromApi(data);
    },

    getOpeningHours: async (): Promise<OpeningHour[]> => {
        const data = await fetchWithAuth('/hub/ifood/merchant/opening-hours');
        return transformOpeningHoursFromApi(data);
    },

    updateOpeningHours: async (hours: Omit<OpeningHour, 'id'>[]): Promise<void> => {
        const dayOfWeekStringToNumber: Record<OpeningHour['dayOfWeek'], number> = {
            SUNDAY: 1,
            MONDAY: 2,
            TUESDAY: 3,
            WEDNESDAY: 4,
            THURSDAY: 5,
            FRIDAY: 6,
            SATURDAY: 7,
        };
        // API expects "HH:mm:ss" format and numeric dayOfWeek.
        const payload = {
            shifts: hours.map(h => ({
                dayOfWeek: dayOfWeekStringToNumber[h.dayOfWeek],
                start: `${h.start}:00`,
                end: `${h.end}:00`,
            }))
        };
        await fetchWithAuth('/hub/ifood/merchant/opening-hours', {
            method: 'PUT',
            body: JSON.stringify(payload)
        });
    },

    getInterruptions: async (): Promise<Interruption[]> => {
        const data = await fetchWithAuth('/hub/ifood/merchant/interruptions');
        return transformInterruptionsFromApi(data);
    },
    
    createInterruption: async (interruption: Omit<Interruption, 'id'>): Promise<void> => {
        await fetchWithAuth('/hub/ifood/merchant/interruptions', {
            method: 'POST',
            body: JSON.stringify(interruption)
        });
    },

    deleteInterruption: async (id: string): Promise<void> => {
        await fetchWithAuth(`/hub/ifood/merchant/interruptions/${id}`, {
            method: 'DELETE'
        });
    },
};