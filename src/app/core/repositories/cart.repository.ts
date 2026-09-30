import { Observable } from 'rxjs';
import { Cart, CartItem } from '../../shared/models/cart.model';

export abstract class CartRepository {
  abstract getCart(userId: string): Observable<Cart>;
  abstract addItem(userId: string, item: Omit<CartItem, 'totalPrice'>): Observable<Cart>;
  abstract updateItemQuantity(userId: string, productId: string, quantity: number): Observable<Cart>;
  abstract removeItem(userId: string, productId: string): Observable<Cart>;
  abstract clearCart(userId: string): Observable<Cart>;
}
