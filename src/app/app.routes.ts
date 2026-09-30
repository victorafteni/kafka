import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      {
        path: '',
        loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent),
        title: 'Commerce Hub — Home'
      },
      {
        path: 'products',
        loadComponent: () => import('./features/catalog/catalog.component').then(m => m.CatalogComponent),
        title: 'Commerce Hub — Product Catalog'
      },
      {
        path: 'products/:id',
        loadComponent: () => import('./features/product/product-detail.component').then(m => m.ProductDetailComponent),
        title: 'Commerce Hub — Product Details'
      },
      {
        path: 'search',
        loadComponent: () => import('./features/search/search.component').then(m => m.SearchComponent),
        title: 'Commerce Hub — Faceted Search'
      },
      {
        path: 'cart',
        loadComponent: () => import('./features/cart/cart.component').then(m => m.CartComponent),
        title: 'Commerce Hub — Shopping Cart'
      },
      {
        path: 'checkout',
        loadComponent: () => import('./features/checkout/checkout.component').then(m => m.CheckoutComponent),
        title: 'Commerce Hub — Checkout'
      },
      {
        path: 'orders',
        loadComponent: () => import('./features/orders/orders.component').then(m => m.OrdersComponent),
        title: 'Commerce Hub — Orders'
      },
      {
        path: 'monitoring',
        loadComponent: () => import('./features/monitoring/monitoring.component').then(m => m.MonitoringComponent),
        title: 'Commerce Hub — Ops Monitoring & Kafka Stream'
      },
      {
        path: '**',
        redirectTo: ''
      }
    ]
  }
];

