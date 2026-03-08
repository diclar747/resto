import { create } from 'zustand';

interface CartItem {
  id: string;
  productVariantId: string;
  productName: string;
  variantName: string;
  quantity: number;
  unitPrice: number;
  modifiers: { id: string; name: string; priceAdjustment: number }[];
  notes?: string;
  seat?: number;
}

interface CartState {
  items: CartItem[];
  tableId: string | null;
  activeOrderId: string | null;
  orderType: 'dine_in' | 'takeaway' | 'delivery';
  notes: string;

  addItem: (item: Omit<CartItem, 'id'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  updateNotes: (id: string, notes: string) => void;
  setTable: (tableId: string | null) => void;
  setActiveOrder: (orderId: string | null) => void;
  setOrderType: (type: 'dine_in' | 'takeaway' | 'delivery') => void;
  setOrderNotes: (notes: string) => void;
  clear: () => void;

  getSubtotal: () => number;
  getItemCount: () => number;
}

let nextId = 1;

export const useCartStore = create<CartState>()((set, get) => ({
  items: [],
  tableId: null,
  activeOrderId: null,
  orderType: 'dine_in',
  notes: '',

  addItem: (item) => {
    const id = `cart-${nextId++}`;
    set((state) => ({ items: [...state.items, { ...item, id }] }));
  },

  removeItem: (id) => {
    set((state) => ({ items: state.items.filter((i) => i.id !== id) }));
  },

  updateQuantity: (id, quantity) => {
    if (quantity <= 0) {
      get().removeItem(id);
      return;
    }
    set((state) => ({
      items: state.items.map((i) => (i.id === id ? { ...i, quantity } : i)),
    }));
  },

  updateNotes: (id, notes) => {
    set((state) => ({
      items: state.items.map((i) => (i.id === id ? { ...i, notes } : i)),
    }));
  },

  setTable: (tableId) => set({ tableId }),
  setActiveOrder: (orderId) => set({ activeOrderId: orderId }),
  setOrderType: (type) => set({ orderType: type }),
  setOrderNotes: (notes) => set({ notes }),
  clear: () => set({ items: [], tableId: null, activeOrderId: null, notes: '', orderType: 'dine_in' }),

  getSubtotal: () => {
    return get().items.reduce((total, item) => {
      const modifiersTotal = item.modifiers.reduce((sum, m) => sum + m.priceAdjustment, 0);
      return total + (item.unitPrice + modifiersTotal) * item.quantity;
    }, 0);
  },

  getItemCount: () => {
    return get().items.reduce((total, item) => total + item.quantity, 0);
  },
}));
