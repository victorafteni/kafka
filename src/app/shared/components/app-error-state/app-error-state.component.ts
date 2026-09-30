import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppButtonComponent } from '../app-button/app-button.component';

@Component({
  selector: 'app-error-state',
  standalone: true,
  imports: [CommonModule, AppButtonComponent],
  template: `
    <div class="error-state">
      <div class="icon-circle">
        <span class="material-icons-outlined icon">error_outline</span>
      </div>
      <h3 class="title">{{ title() }}</h3>
      <p class="description">{{ message() }}</p>
      <div class="action">
        <app-button variant="outline" icon="refresh" (clicked)="retry.emit()">
          Try Again
        </app-button>
      </div>
    </div>
  `,
  styles: [`
    @use 'styles/variables' as *;

    .error-state {
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
      background-color: $danger-light;
      color: $danger;
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
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppErrorStateComponent {
  title = input<string>('Failed to load data');
  message = input<string>('There was an error communicating with the service. Please check your network and retry.');

  retry = output<void>();
}

