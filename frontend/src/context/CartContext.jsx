import { createContext, useContext, useState, useCallback } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);

  const addToCart = useCallback((medicine, quantity = 1) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === medicine.id);
      if (existing) {
        return prev.map(i => i.id === medicine.id
          ? { ...i, quantity: Math.min(i.quantity + quantity, i.stock) }
          : i);
      }
      return [...prev, { ...medicine, quantity }];
    });
  }, []);

  const removeFromCart = useCallback((id) => setCart(prev => prev.filter(i => i.id !== id)), []);

  const updateQuantity = useCallback((id, quantity) => {
    if (quantity <= 0) { removeFromCart(id); return; }
    setCart(prev => prev.map(i => i.id === id ? { ...i, quantity: Math.min(quantity, i.stock) } : i));
  }, [removeFromCart]);

  const clearCart = useCallback(() => setCart([]), []);

  const totalItems = cart.reduce((sum, i) => sum + i.quantity, 0);
  const totalAmount = cart.reduce((sum, i) => sum + parseFloat(i.price) * i.quantity, 0);
  const hasObatResep = cart.some(i => i.category === 'Obat Resep');

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, totalAmount, hasObatResep }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
