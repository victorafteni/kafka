export interface CartItem {
  productId: string;
  productSku: string;
  productName: string;
  image: string;
  brand: string;

  quantity: number;
  unitPrice: number;
  totalPrice: number;
  availableStock: number;
}

export interface Cart {
  id: string;
  userId: string;
  items: CartItem[];

  subtotal: number;
  discount: number;
  shipping: number;
  total: number;

  currency: string;
  updatedAt: string;
}

