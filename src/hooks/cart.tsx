import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const storageCartKey = '@GoMarketplace:cart';

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const cart = await AsyncStorage.getItem(storageCartKey);

      if (cart) {
        setProducts(JSON.parse(cart));
      }
    }

    loadProducts();
  }, []);

  const increment = useCallback(
    async (id: string) => {
      const cart = products.map(product =>
        product.id === id
          ? { ...product, quantity: product.quantity + 1 }
          : product,
      );

      setProducts(cart);

      await AsyncStorage.setItem(storageCartKey, JSON.stringify(cart));
    },
    [products],
  );

  const decrement = useCallback(
    async (id: string) => {
      const existingProduct = products.find(p => p.id === id && p.quantity > 1);

      const cart = existingProduct
        ? products.map(product =>
            product.id === existingProduct.id
              ? { ...existingProduct, quantity: existingProduct.quantity - 1 }
              : product,
          )
        : products.filter(p => p.id !== id);

      setProducts(cart);

      await AsyncStorage.setItem(storageCartKey, JSON.stringify(cart));
    },
    [products],
  );

  const addToCart = useCallback(
    async (product: Product) => {
      const alreadyExists = products.some(p => p.id === product.id);

      if (alreadyExists) {
        increment(product.id);
        return;
      }

      const cart = [...products, { ...product, quantity: 1 }];
      setProducts(cart);

      await AsyncStorage.setItem(storageCartKey, JSON.stringify(cart));
    },
    [products, increment],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
