import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="'app-card' + (hoverable() ? ' hoverable' : '') + (bordered() ? ' bordered' : '')">
      <ng-content></ng-content>
    </div>
  `,
  styles: [`
    @use 'styles/variables' as *;

    .app-card {
      background: #ffffff;
      border-radius: $radius-lg;
      box-shadow: $shadow-xs;
      transition: all $transition-base;
      overflow: hidden;

      &.bordered {
        border: 1px solid $gray-200;
      }

      &.hoverable:hover {
        transform: translateY(-3px);
        box-shadow: $shadow-lg;
        border-color: $gray-300;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppCardComponent {
  hoverable = input<boolean>(true);
  bordered = input<boolean>(true);
}

