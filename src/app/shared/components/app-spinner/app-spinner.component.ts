import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="spinner-container" [class.inline]="inline()">
      <div class="spinner" [style.width.px]="size()" [style.height.px]="size()"></div>
      @if (label()) {
        <p class="spinner-label">{{ label() }}</p>
      }
    </div>
  `,
  styles: [`
    @use 'styles/variables' as *;

    .spinner-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 32px;

      &.inline {
        display: inline-flex;
        padding: 0;
        flex-direction: row;
      }
    }

    .spinner {
      border: 3px solid $gray-200;
      border-top-color: $primary-600;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    .spinner-label {
      font-size: 0.875rem;
      color: $gray-500;
      font-weight: 500;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppSpinnerComponent {
  size = input<number>(36);
  label = input<string>('Loading...');
  inline = input<boolean>(false);
}

