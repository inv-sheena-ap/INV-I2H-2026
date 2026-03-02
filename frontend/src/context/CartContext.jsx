import { createContext, useContext, useState, useEffect } from 'react';

const CART_KEY = 'ecommerce_cart';

const CartContext = createContext(null);

function loadCart() {
  try {
    const s = localStorage.getItem(CART_KEY);
    return s ? JSON.parse(s) : [];
  } catch (_) {
    return [];
  }
}

function saveCart(items) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(loadCart);

  useEffect(() => {
    saveCart(items);
  }, [items]);

  const add = (productId, quantity = 1, product = null) => {
    setItems((prev) => {
      const i = prev.findIndex((x) => x.product_id === productId);
      let next;
      if (i >= 0) {
        next = [...prev];
        next[i] = { ...next[i], quantity: next[i].quantity + quantity, ...(product && { ...product }) };
      } else {
        next = [...prev, { product_id: productId, quantity, ...(product && { ...product }) };
      }
      return next;
    });
  };

  const updateQty = (productId, quantity) => {
    if (quantity <= 0) {
      remove(productId);
      return;
    }
    setItems((prev) =>
      prev.map((x) => (x.product_id === productId ? { ...x, quantity } : x))
    );
  };

  const remove = (productId) => {
    setItems((prev) => prev.filter((x) => x.product_id !== productId));
  };

  const clear = () => setItems([]);

  const count = items.reduce((acc, x) => acc + x.quantity, 0);

  return (
    <CartContext.Provider value={{ items, add, updateQty, remove, clear, count }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
