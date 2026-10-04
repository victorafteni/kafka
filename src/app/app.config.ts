import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding, withViewTransitions } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import { routes } from './app.routes';
import { telemetryInterceptor } from './core/interceptors/telemetry.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { ProductRepository } from './core/repositories/product.repository';
import { MockProductRepository } from './core/repositories/mock-product.repository';
import { CartRepository } from './core/repositories/cart.repository';
import { MockCartRepository } from './core/repositories/mock-cart.repository';
import { SearchRepository } from './core/repositories/search.repository';
import { MockSearchRepository } from './core/repositories/mock-search.repository';
import { AnalyticsRepository } from './core/repositories/analytics.repository';
import { MockAnalyticsRepository } from './core/repositories/mock-analytics.repository';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding(), withViewTransitions()),
    provideHttpClient(withInterceptors([telemetryInterceptor, errorInterceptor])),
    provideAnimationsAsync(),
    // Clean Architecture Dependency Inversion tokens:
    { provide: ProductRepository, useClass: MockProductRepository },
    { provide: CartRepository, useClass: MockCartRepository },
    { provide: SearchRepository, useClass: MockSearchRepository },
    { provide: AnalyticsRepository, useClass: MockAnalyticsRepository }
  ]
};

