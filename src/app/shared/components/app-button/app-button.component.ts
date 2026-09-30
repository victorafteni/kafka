import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      [type]="type()"
      [disabled]="disabled() || loading()"
      [class]="'btn btn-' + variant() + ' btn-' + size() + (fullWidth() ? ' btn-block' : '')"
      (click)="clicked.emit($event)">
      @if (loading()) {
        <span class="spinner"></span>
      } @else if (icon()) {
        <span class="material-icons-outlined icon">{{ icon() }}</span>
      }
      <ng-content></ng-content>
    </button>
  `,
  styles: [`
    @use 'styles/variables' as *;
    @use 'styles/mixins' as *;

    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      font-weight: 600;
      border-radius: $radius-md;
      transition: all $transition-base;
      cursor: pointer;
      user-select: none;
      white-space: nowrap;

      &:focus-visible {
        outline: 2px solid $primary-400;
        outline-offset: 2px;
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        box-shadow: none !important;
        transform: none !important;
      }
    }

    .btn-block {
      width: 100%;
    }

    .btn-sm {
      padding: 6px 12px;
      font-size: 0.8125rem;
      .icon { font-size: 16px; }
    }
    .btn-md {
      padding: 10px 18px;
      font-size: 0.875rem;
      .icon { font-size: 18px; }
    }
    .btn-lg {
      padding: 14px 24px;
      font-size: 1rem;
      .icon { font-size: 20px; }
    }

    .btn-primary {
      background: linear-gradient(135deg, $primary-600, $primary-700);
      color: #ffffff;
      box-shadow: 0 2px 4px rgba(79, 70, 229, 0.25);
      &:hover:not(:disabled) {
        background: linear-gradient(135deg, $primary-500, $primary-600);
        box-shadow: 0 4px 10px rgba(79, 70, 229, 0.35);
        transform: translateY(-1px);
      }
      &:active:not(:disabled) {
        transform: translateY(0);
      }
    }

    .btn-secondary {
      background-color: $gray-100;
      color: $gray-800;
      border: 1px solid $gray-200;
      &:hover:not(:disabled) {
        background-color: $gray-200;
        color: $gray-900;
      }
    }

    .btn-outline {
      background-color: transparent;
      color: $primary-600;
      border: 1.5px solid $primary-300;
      &:hover:not(:disabled) {
        background-color: $primary-50;
        border-color: $primary-500;
      }
    }

    .btn-danger {
      background-color: $danger;
      color: #ffffff;
      &:hover:not(:disabled) {
        background-color: #dc2626;
      }
    }

    .btn-ghost {
      background: transparent;
      color: $gray-600;
      &:hover:not(:disabled) {
        background-color: $gray-100;
        color: $gray-900;
      }
    }

    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      border-top-color: currentColor;
      animation: spin 0.6s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppButtonComponent {
  variant = input<ButtonVariant>('primary');
  size = input<ButtonSize>('md');
  type = input<'button' | 'submit' | 'reset'>('button');
  disabled = input<boolean>(false);
  loading = input<boolean>(false);
  fullWidth = input<boolean>(false);
  icon = input<string>('');

  clicked = output<MouseEvent>();
}

