import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  productId: string;
  title: string;
  slug: string;
  image: string;
  unitPrice: number; // قیمت نهایی واحد (با احتساب تخفیف محصول و اختلاف قیمت متغیر)
  variantSku: string;
  color?: string;
  size?: string;
  quantity: number;
  maxStock: number; // سقف موجودی این متغیر در انبار
}

interface AppliedCoupon {
  code: string;
  discountAmount: number;
}

interface CartState {
  items: CartItem[];
  coupon: AppliedCoupon | null;
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, variantSku: string) => void;
  updateQuantity: (productId: string, variantSku: string, quantity: number) => void;
  applyCoupon: (coupon: AppliedCoupon | null) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getSubtotal: () => number;
  getFinalAmount: (shippingCost?: number) => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      coupon: null,

      addItem: (newItem) => {
        set((state) => {
          const existingIndex = state.items.findIndex(
            (i) =>
              i.productId === newItem.productId &&
              i.variantSku === newItem.variantSku
          );

          if (existingIndex > -1) {
            const updatedItems = [...state.items];
            const currentQty = updatedItems[existingIndex].quantity;
            const nextQty = Math.min(
              currentQty + newItem.quantity,
              newItem.maxStock
            );
            updatedItems[existingIndex] = {
              ...updatedItems[existingIndex],
              quantity: nextQty,
            };
            return { items: updatedItems };
          }

          return {
            items: [
              ...state.items,
              {
                ...newItem,
                quantity: Math.min(newItem.quantity, newItem.maxStock),
              },
            ],
          };
        });
      },

      removeItem: (productId, variantSku) => {
        set((state) => ({
          items: state.items.filter(
            (i) => !(i.productId === productId && i.variantSku === variantSku)
          ),
        }));
      },

      updateQuantity: (productId, variantSku, quantity) => {
        set((state) => ({
          items: state.items.map((i) => {
            if (i.productId === productId && i.variantSku === variantSku) {
              const validQty = Math.max(1, Math.min(quantity, i.maxStock));
              return { ...i, quantity: validQty };
            }
            return i;
          }),
        }));
      },

      applyCoupon: (coupon) => set({ coupon }),

      clearCart: () => set({ items: [], coupon: null }),

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getSubtotal: () => {
        return get().items.reduce(
          (sum, item) => sum + item.unitPrice * item.quantity,
          0
        );
      },

      getFinalAmount: (shippingCost = 0) => {
        const subtotal = get().getSubtotal();
        const discount = get().coupon?.discountAmount || 0;
        return Math.max(0, subtotal - discount + shippingCost);
      },
    }),
    {
      name: 'next-ecommerce-cart-storage',
    }
  )
);