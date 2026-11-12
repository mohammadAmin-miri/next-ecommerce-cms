import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  productId: string;
  title: string;
  slug: string;
  image: string;
  variantSku: string;
  color: string;
  size: string;
  unitPrice: number;
  quantity: number;
  maxStock: number;
}

export interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (variantSku: string) => void;
  updateQuantity: (variantSku: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (newItem: CartItem) => {
        set((state) => {
          const existingIndex = state.items.findIndex(
            (i) => i.variantSku === newItem.variantSku
          );

          if (existingIndex > -1) {
            const updatedItems = [...state.items];
            const currentQty = updatedItems[existingIndex].quantity;
            const nextQty = Math.min(
              newItem.maxStock,
              currentQty + newItem.quantity
            );
            updatedItems[existingIndex] = {
              ...updatedItems[existingIndex],
              quantity: nextQty,
            };
            return { items: updatedItems };
          }

          return { items: [...state.items, newItem] };
        });
      },

      removeItem: (variantSku: string) => {
        set((state) => ({
          items: state.items.filter((i) => i.variantSku !== variantSku),
        }));
      },

      updateQuantity: (variantSku: string, quantity: number) => {
        set((state) => ({
          items: state.items.map((i) =>
            i.variantSku === variantSku
              ? { ...i, quantity: Math.max(1, Math.min(i.maxStock, quantity)) }
              : i
          ),
        }));
      },

      clearCart: () => set({ items: [] }),

      getTotalItems: () =>
        get().items.reduce((sum, item) => sum + item.quantity, 0),

      getTotalPrice: () =>
        get().items.reduce(
          (sum, item) => sum + item.unitPrice * item.quantity,
          0
        ),
    }),
    {
      name: 'next-ecommerce-cart-storage', // ذخیره خودکار سبد خرید در localStorage مرورگر
    }
  )
);