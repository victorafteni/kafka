import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type BadgeVariant = 'primary' | 'success' | 'warning' | 'danger' | 'neutral' | 'accent';

@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span [class]="'badge-component badge-' + variant()">
      @if (dot()) {
        <span class="badge-dot"></span>
      }
      <ng-content></ng-content>
    </span>
  `,
  styles: [`
    @use 'styles/variables' as *;

    .badge-component {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 3px 8px;
      border-radius: $radius-full;
      font-size: 0.75rem;
      font-weight: 600;
      line-height: 1;
      letter-spacing: 0.02em;
    }

    .badge-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background-color: currentColor;
    }

    .badge-primary {
      background-color: $primary-50;
      color: $primary-700;
      border: 1px solid $primary-200;
    }

    .badge-accent {
      background-color: #ecfeff;
      color: #0891b2;
      border: 1px solid #a5f3fc;
    }

    .badge-success {
      background-color: $success-light;
      color: #065f46;
      border: 1px solid #a7f3d0;
    }

    .badge-warning {
      background-color: $warning-light;
      color: #92400e;
      border: 1px solid #fde68a;
    }

    .badge-danger {
      background-color: $danger-light;
      color: #991b1b;
      border: 1px solid #fecaca;
    }

    .badge-neutral {
      background-color: $gray-100;
      color: $gray-700;
      border: 1px solid $gray-200;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppBadgeComponent {
  variant = input<BadgeVariant>('primary');
  dot = input<boolean>(false);
}
