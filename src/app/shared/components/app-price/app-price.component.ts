import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-price',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="price-container" [class]="'size-' + size()">
      <span class="current-price">{{ formattedPrice() }}</span>
      @if (originalPrice() && originalPrice()! > price()) {
        <span class="original-price">{{ formattedOriginalPrice() }}</span>
        <span class="discount-percent">-{{ discountPercentage() }}%</span>
      }
    </div>
  `,
  styles: [`
    @use 'styles/variables' as *;

    .price-container {
      display: inline-flex;
      align-items: baseline;
      gap: 8px;
      font-family: inherit;
    }

    .current-price {
      font-weight: 700;
      color: $gray-900;
      letter-spacing: -0.02em;
    }

    .original-price {
      font-size: 0.875em;
      color: $gray-400;
      text-decoration: line-through;
    }

    .discount-percent {
      font-size: 0.75rem;
      font-weight: 700;
      color: $danger;
      background: $danger-light;
      padding: 1px 6px;
      border-radius: $radius-xs;
    }

    .size-sm {
      .current-price { font-size: 0.95rem; }
    }
    .size-md {
      .current-price { font-size: 1.25rem; }
    }
    .size-lg {
      .current-price { font-size: 1.75rem; font-weight: 800; }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppPriceComponent {
  price = input.required<number>();
  originalPrice = input<number | undefined>(undefined);
  currency = input<string>('EUR');
  size = input<'sm' | 'md' | 'lg'>('md');

  formattedPrice = computed(() => {
    return new Intl.NumberFormat('en-IE', {
      style: 'currency',
      currency: this.currency()
    }).format(this.price());
  });

  formattedOriginalPrice = computed(() => {
    if (!this.originalPrice()) return '';
    return new Intl.NumberFormat('en-IE', {
      style: 'currency',
      currency: this.currency()
    }).format(this.originalPrice()!);
  });

  discountPercentage = computed(() => {
    if (!this.originalPrice() || this.originalPrice()! <= this.price()) return 0;
    return Math.round(((this.originalPrice()! - this.price()) / this.originalPrice()!) * 100);
  });
}
