import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Client {
    id: string;
    firstName: string;
    lastName?: string;
    email?: string;
    phone?: string;
}

interface ClientAuthStore {
    client: Client | null;
    token: string | null;
    setClientAuth: (client: Client, token: string) => void;
    logout: () => void;
}

export const useClientAuthStore = create<ClientAuthStore>()(
    persist(
        (set) => ({
            client: null,
            token: null,
            setClientAuth: (client, token) => set({ client, token }),
            logout: () => set({ client: null, token: null }),
        }),
        {
            name: 'client-auth-storage',
        }
    )
);
