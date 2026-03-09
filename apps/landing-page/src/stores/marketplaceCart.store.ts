import { create } from 'zustand';

export interface CartItem {
    id: string; // unique ID for the cart item (usually constructed from productId + variantId)
    productId: string;
    variantId: string;
    name: string;
    price: number;
    quantity: number;
    branchId: string; // The branch this item belongs to
}

interface CartStore {
    items: CartItem[];
    addItem: (item: CartItem) => void;
    removeItem: (id: string) => void;
    updateQuantity: (id: string, newQuantity: number) => void;
    clearCart: () => void;
    branchId: string | null;
    total: number;
}

export const useMarketplaceCartStore = create<CartStore>((set, get) => ({
    items: [],
    branchId: null,
    total: 0,

    addItem: (product) => {
        const currentItems = get().items;
        const currentBranch = get().branchId;

        // Check if adding from a different branch
        if (currentBranch && currentBranch !== product.branchId && currentItems.length > 0) {
            // Here we could throw an error or handle it in the UI
            alert("Atención: Solo puedes realizar pedidos a un restaurante a la vez. Finaliza o limpia el carrito primero.");
            return;
        }

        const existingItem = currentItems.find(i => i.id === product.id);

        let newItems;
        if (existingItem) {
            newItems = currentItems.map(item =>
                item.id === product.id
                    ? { ...item, quantity: item.quantity + product.quantity }
                    : item
            );
        } else {
            newItems = [...currentItems, product];
        }

        set({
            items: newItems,
            branchId: product.branchId,
            total: newItems.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0)
        });
    },

    removeItem: (id) => {
        const newItems = get().items.filter(item => item.id !== id);
        set({
            items: newItems,
            branchId: newItems.length === 0 ? null : get().branchId,
            total: newItems.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0)
        });
    },

    updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
            get().removeItem(id);
            return;
        }

        const newItems = get().items.map(item =>
            item.id === id ? { ...item, quantity } : item
        );

        set({
            items: newItems,
            total: newItems.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0)
        });
    },

    clearCart: () => {
        set({ items: [], branchId: null, total: 0 });
    }
}));
