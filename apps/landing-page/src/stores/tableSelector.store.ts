import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type OrderType = 'dine_in' | 'takeout' | 'delivery';

interface TableSelectorState {
    orderType: OrderType;
    tableId: string | null;
    tableNumber: number | null;
    deliveryAddress: string;
    customerName: string;
    customerPhone: string;

    setOrderType: (type: OrderType) => void;
    setTable: (id: string | null, number: number | null) => void;
    setDeliveryDetails: (details: { address?: string; name?: string; phone?: string }) => void;
    reset: () => void;
}

export const useTableSelectorStore = create<TableSelectorState>()(
    persist(
        (set) => ({
            orderType: 'takeout',
            tableId: null,
            tableNumber: null,
            deliveryAddress: '',
            customerName: '',
            customerPhone: '',

            setOrderType: (orderType) => set({ orderType }),
            setTable: (tableId, tableNumber) => set({ tableId, tableNumber }),
            setDeliveryDetails: (details) => set((state) => ({
                deliveryAddress: details.address ?? state.deliveryAddress,
                customerName: details.name ?? state.customerName,
                customerPhone: details.phone ?? state.customerPhone,
            })),
            reset: () => set({
                orderType: 'takeout',
                tableId: null,
                tableNumber: null,
                deliveryAddress: '',
                customerName: '',
                customerPhone: '',
            }),
        }),
        {
            name: 'order-context-storage',
        }
    )
);
