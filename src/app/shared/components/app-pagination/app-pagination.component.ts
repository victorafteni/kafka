import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  template: `
    <nav class="pagination-nav" aria-label="Pagination">
      <button
        class="page-btn nav-btn"
        [disabled]="page() <= 1"
        (click)="changePage(page() - 1)">
        <span class="material-icons-outlined">chevron_left</span>
        Previous
      </button>

      <div class="pages-list">
        @for (p of pagesArray(); track $index) {
          @if (p === -1) {
            <span class="dots">...</span>
          } @else {
            <button
              class="page-btn number-btn"
              [class.active]="p === page()"
              (click)="changePage(p)">
              {{ p }}
            </button>
          }
        }
      </div>

      <button
        class="page-btn nav-btn"
        [disabled]="page() >= totalPages()"
        (click)="changePage(page() + 1)">
        Next
        <span class="material-icons-outlined">chevron_right</span>
      </button>
    </nav>
  `,
  styles: [`
    @use 'styles/variables' as *;

    .pagination-nav {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-top: 32px;
      margin-bottom: 32px;
    }

    .pages-list {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .page-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 8px 14px;
      font-size: 0.875rem;
      font-weight: 600;
      border-radius: $radius-md;
      border: 1px solid $gray-200;
      background: #ffffff;
      color: $gray-700;
      transition: all $transition-fast;

      &:hover:not(:disabled) {
        border-color: $gray-300;
        background: $gray-50;
        color: $gray-900;
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      &.active {
        background: $primary-600;
        border-color: $primary-600;
        color: #ffffff;
      }
    }

    .number-btn {
      min-width: 40px;
      padding: 8px 0;
    }

    .nav-btn {
      gap: 4px;
    }

    .dots {
      padding: 0 8px;
      color: $gray-400;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppPaginationComponent {
  page = input.required<number>();
  totalPages = input.required<number>();

  pageChange = output<number>();

  pagesArray = computed(() => {
    const total = this.totalPages();
    const current = this.page();
    const pages: number[] = [];

    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      if (current > 3) pages.push(-1);

      const start = Math.max(2, current - 1);
      const end = Math.min(total - 1, current + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (current < total - 2) pages.push(-1);
      pages.push(total);
    }

    return pages;
  });

  changePage(p: number): void {
    if (p >= 1 && p <= this.totalPages() && p !== this.page()) {
      this.pageChange.emit(p);
    }
  }
}
