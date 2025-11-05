// FIX: Add the missing 'User' interface to resolve import errors.
export interface User {
  id: string;
  name: string;
  email: string;
}

export enum OrderStatus {
  // Active
  PLC = 'PLC', // Placed
  COM = 'COM', // Confirmed
  SPS = 'SPS', // Separation Started
  SPE = 'SPE', // Separation Ended
  DSP = 'DSP', // Dispatched
  OPA = 'OPA', // Arrived at Destination

  // Final
  CON = 'CON', // Concluded
  DDCS = 'DDCS', // Delivered by iFood (Concluded)
  CAN = 'CAN', // Cancelled
  CAR = 'CAR', // Cancellation Requested
  CANCELLATION_REQUESTED = 'CANCELLATION_REQUESTED', // Cancellation in Progress
}


export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
  uniqueId: string;
}

export interface Order {
  id: string;
  localId: string;
  displayId: string;
  customerName: string;
  total: number;
  status: OrderStatus;
  createdAt: string;
  items: OrderItem[];
  deliveryAddress: string;
  paymentMethod: string;
  deliveryProvider: 'TAKEOUT' | 'IFOOD' | 'MERCHANT' | 'UNKNOWN';
}

export type Page = 'orders' | 'products' | 'merchant';

export interface Pagination {
  currentPage: number;
  perPage: number;
  total: number;
  totalPages: number;
}

export interface PaginatedOrders {
  orders: Order[];
  pagination: Pagination;
}

export interface OrderFilters {
  searchTerm?: string;
  status?: OrderStatus | '';
  dateRange?: 'today' | 'week' | 'month' | '';
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  perPage?: number;
}


// --- Product Management Types ---

export interface Product {
  id: string;
  name: string;
  barcode: string;
  price: number;
  stock: number;
  status: 'active' | 'inactive';
  isSynced: boolean;
  createdAt: string;
}

export interface ProductToAdd {
  barcode: string;
  name: string;
  price: number;
  stock: number;
  status: 'active' | 'inactive';
}


export interface PaginatedProducts {
  products: Product[];
  pagination: Pagination;
}

export interface ProductFilters {
  name?: string;
  barcode?: string;
  price?: string; 
  status?: 'active' | 'inactive' | '';
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  perPage?: number;
}

export interface NotFoundItem {
    id: string;
    barcode: string;
    name: string;
    notes: string;
    status: string;
    createdAt: string;
}

export interface PaginatedNotFoundItems {
    items: NotFoundItem[];
    pagination: Pagination;
}


// --- Store Management Types ---

export interface StoreStatus {
  state: 'OK' | 'WARNING' | 'ERROR';
  problems: { description: string }[];
}

export interface OpeningHour {
  dayOfWeek: 'SUNDAY' | 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY';
  start: string; // "HH:mm"
  end: string;   // "HH:mm"
}

export interface Interruption {
  id: string;
  description: string;
  start: string; // ISO 8601 Date String
  end: string;   // ISO 8601 Date String
}
