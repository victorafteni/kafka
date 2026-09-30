import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppButtonComponent } from '../app-button/app-button.component';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, AppButtonComponent],
  template: `
    <div class="empty-state">
      <div class="icon-circle">
        <span class="material-icons-outlined icon">{{ icon() }}</span>
      </div>
      <h3 class="title">{{ title() }}</h3>
      <p class="description">{{ description() }}</p>
      @if (actionLabel()) {
        <div class="action">
          <app-button variant="primary" (clicked)="actionClicked.emit()">
            {{ actionLabel() }}
          </app-button>
        </div>
      }
    </div>
  `,
  styles: [`
    @use 'styles/variables' as *;

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 60px 24px;
      max-width: 480px;
      margin: 0 auto;
    }

    .icon-circle {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      background-color: $gray-100;
      color: $gray-400;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 20px;

      .icon {
        font-size: 36px;
      }
    }

    .title {
      font-size: 1.25rem;
      font-weight: 700;
      color: $gray-900;
      margin-bottom: 8px;
    }

    .description {
      font-size: 0.9375rem;
      color: $gray-500;
      line-height: 1.5;
      margin-bottom: 24px;
    }

    .action {
      margin-top: 8px;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppEmptyStateComponent {
  icon = input<string>('inventory_2');
  title = input<string>('No products found');
  description = input<string>('Try adjusting your search or filters to find what you are looking for.');
  actionLabel = input<string>('');

  actionClicked = output<void>();
}
