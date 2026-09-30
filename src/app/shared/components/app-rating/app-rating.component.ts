import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-rating',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="rating-box" [attr.aria-label]="rating() + ' out of 5 stars'">
      <div class="stars">
        @for (star of starsArray(); track $index) {
          <span class="material-icons-outlined star" [class.filled]="star <= rating()">
            {{ star <= rating() ? 'star' : (star - 0.5 <= rating() ? 'star_half' : 'star_outline') }}
          </span>
        }
      </div>
      @if (showCount() && reviewCount() !== undefined) {
        <span class="review-count">({{ reviewCount() }})</span>
      }
      @if (showScore()) {
        <span class="score-badge">{{ rating().toFixed(1) }}</span>
      }
    </div>
  `,
  styles: [`
    @use 'styles/variables' as *;

    .rating-box {
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .stars {
      display: flex;
      align-items: center;
      gap: 1px;
    }

    .star {
      font-size: 16px;
      color: $gray-300;

      &.filled {
        color: #f59e0b;
      }
    }

    .review-count {
      font-size: 0.8125rem;
      color: $gray-500;
    }

    .score-badge {
      font-size: 0.75rem;
      font-weight: 700;
      background: $gray-100;
      color: $gray-800;
      padding: 1px 6px;
      border-radius: $radius-xs;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppRatingComponent {
  rating = input<number>(5);
  reviewCount = input<number | undefined>(undefined);
  showCount = input<boolean>(true);
  showScore = input<boolean>(false);

  starsArray = computed(() => [1, 2, 3, 4, 5]);
}
