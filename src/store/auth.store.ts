import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type UserTokenPayload = {
    id: string;
    email: string;
    name?: string;
    role: "ADMIN" | "CLIENT";
    image?: string;
}

interface AuthState {
    user: UserTokenPayload | null
    setUser: (user: UserTokenPayload | null) => void
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            setUser: (user) => set({ user }),
        }),
        {
            name: 'auth-storage',
        }
    )
)
