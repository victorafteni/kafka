import { Component, ChangeDetectionStrategy, input, output, signal, inject, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, switchMap, of } from 'rxjs';
import { SearchRepository } from '../../../core/repositories/search.repository';
import { SearchSuggestion } from '../../models/facet.model';

@Component({
  selector: 'app-search-box',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="search-box-wrapper" [class.open]="showDropdown() && suggestions().length > 0">
      <div class="input-container">
        <span class="material-icons-outlined search-icon">search</span>
        <input
          #inputEl
          type="text"
          class="search-input"
          [placeholder]="placeholder()"
          [(ngModel)]="searchQuery"
          (ngModelChange)="onInputChange($event)"
          (focus)="onInputFocus()"
          (keydown.enter)="triggerSearch(searchQuery)"
          (keydown.escape)="closeDropdown()"
          autocomplete="off"
        />
        @if (searchQuery) {
          <button class="clear-btn" type="button" (click)="clear()">
            <span class="material-icons-outlined">close</span>
          </button>
        }
      </div>

      @if (showDropdown() && suggestions().length > 0) {
        <div class="suggestions-dropdown">
          <div class="dropdown-header">
            <span>Suggestions</span>
            <span class="powered-by">Powered by Redis Search Index</span>
          </div>

          <div class="suggestions-list">
            @for (item of suggestions(); track (item.id || item.query)) {
              <div class="suggestion-item" (click)="selectSuggestion(item)">
                <span class="material-icons-outlined item-icon">
                  {{ item.type === 'category' ? 'folder' : (item.type === 'product' ? 'inventory_2' : 'trending_up') }}
                </span>
                <div class="item-text">
                  <span class="query-text">{{ item.query }}</span>
                  @if (item.category && item.type === 'product') {
                    <span class="item-category">in {{ item.category }}</span>
                  } @else if (item.type === 'category' && item.productCount) {
                    <span class="item-category">{{ item.productCount }} products</span>
                  }
                </div>
                @if (item.price) {
                  <span class="item-price">{{ item.price | currency:'EUR':'symbol':'1.0-0' }}</span>
                }
                <span class="item-badge" [class.badge-cat]="item.type === 'category'" [class.badge-prod]="item.type === 'product'">
                  {{ item.type }}
                </span>
              </div>
            }

            <div class="suggestion-item full-search-action" (click)="triggerSearch(searchQuery)">
              <span class="material-icons-outlined item-icon">travel_explore</span>
              <div class="item-text">
                <span class="query-text">Search all results for <strong>"{{ searchQuery }}"</strong></span>
              </div>
              <span class="item-badge badge-enter">Press Enter ↵</span>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    @use 'styles/variables' as *;
    @use 'styles/mixins' as *;

    .search-box-wrapper {
      position: relative;
      width: 100%;
      max-width: 520px;
    }

    .input-container {
      display: flex;
      align-items: center;
      background: $gray-100;
      border: 1.5px solid transparent;
      border-radius: $radius-full;
      padding: 6px 14px;
      transition: all $transition-base;

      &:focus-within {
        background: #ffffff;
        border-color: $primary-500;
        box-shadow: 0 0 0 4px $primary-100;
      }
    }

    .search-icon {
      color: $gray-400;
      font-size: 20px;
      margin-right: 8px;
    }

    .search-input {
      flex: 1;
      border: none;
      background: transparent;
      outline: none;
      font-size: 0.9375rem;
      color: $gray-900;

      &::placeholder {
        color: $gray-400;
      }
    }

    .clear-btn {
      background: transparent;
      border: none;
      cursor: pointer;
      color: $gray-400;
      padding: 2px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: $radius-full;
      transition: color $transition-base;

      &:hover {
        color: $gray-600;
      }

      .material-icons-outlined {
        font-size: 16px;
      }
    }

    .suggestions-dropdown {
      position: absolute;
      top: calc(100% + 8px);
      left: 0;
      right: 0;
      background: #ffffff;
      border-radius: $radius-md;
      box-shadow: $shadow-xl;
      border: 1px solid $gray-200;
      z-index: 1050;
      overflow: hidden;
      animation: fadeIn 0.15s ease-out;
    }

    .dropdown-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 14px;
      background: $gray-50;
      border-bottom: 1px solid $gray-100;
      font-size: 0.75rem;
      font-weight: 600;
      color: $gray-500;
      text-transform: uppercase;
      letter-spacing: 0.05em;

      .powered-by {
        font-size: 0.6875rem;
        font-weight: 500;
        color: #10b981;
      }
    }

    .suggestions-list {
      max-height: 380px;
      overflow-y: auto;
      padding: 4px 0;
    }

    .suggestion-item {
      display: flex;
      align-items: center;
      padding: 10px 14px;
      cursor: pointer;
      transition: background $transition-base;
      gap: 10px;

      &:hover {
        background: $primary-50;

        .item-icon {
          color: $primary-600;
        }

        .query-text {
          color: $primary-700;
        }
      }

      &.full-search-action {
        border-top: 1px dashed $gray-200;
        background: #f8fafc;
        &:hover {
          background: #f1f5f9;
        }
      }
    }

    .item-icon {
      color: $gray-400;
      font-size: 18px;
      flex-shrink: 0;
    }

    .item-text {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
      overflow: hidden;
    }

    .query-text {
      font-size: 0.875rem;
      font-weight: 500;
      color: $gray-800;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .item-category {
      font-size: 0.75rem;
      color: $gray-400;
    }

    .item-price {
      font-size: 0.8125rem;
      font-weight: 600;
      color: $primary-600;
      margin-right: 4px;
    }

    .item-badge {
      font-size: 0.6875rem;
      font-weight: 600;
      text-transform: uppercase;
      padding: 2px 6px;
      border-radius: $radius-xs;
      background: $gray-100;
      color: $gray-600;

      &.badge-cat {
        background: #e0f2fe;
        color: #0369a1;
      }

      &.badge-prod {
        background: #f0fdf4;
        color: #15803d;
      }

      &.badge-enter {
        background: #ede9fe;
        color: #6d28d9;
      }
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppSearchBoxComponent {
  private searchRepo = inject(SearchRepository);
  private router = inject(Router);
  private elementRef = inject(ElementRef);
  private searchSubject = new Subject<string>();

  placeholder = input<string>('Search products, brands, categories...');
  search = output<string>();

  searchQuery = '';
  showDropdown = signal<boolean>(false);
  suggestions = signal<SearchSuggestion[]>([]);

  constructor() {
    this.searchSubject.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      switchMap(query => {
        if (!query || query.trim().length < 2) {
          return of([]);
        }
        return this.searchRepo.getSuggestions(query);
      })
    ).subscribe(results => {
      this.suggestions.set(results);
      this.showDropdown.set(results.length > 0);
    });
  }

  onInputChange(val: string): void {
    this.searchSubject.next(val);
  }

  onInputFocus(): void {
    if (this.suggestions().length > 0) {
      this.showDropdown.set(true);
    }
  }

  triggerSearch(query: string): void {
    this.closeDropdown();
    const cleanQ = (query || '').trim();
    if (cleanQ) {
      this.router.navigate(['/search'], { queryParams: { q: cleanQ } });
      this.search.emit(cleanQ);
    }
  }

  selectSuggestion(item: SearchSuggestion): void {
    this.closeDropdown();

    if (item.type === 'category') {
      const categoryId = item.id || (item.category ? item.category.toLowerCase() : '');
      if (categoryId) {
        this.router.navigate(['/products'], { queryParams: { category: categoryId } });
      } else {
        this.router.navigate(['/products'], { queryParams: { search: item.query } });
      }
    } else if (item.type === 'product') {
      if (item.id) {
        this.router.navigate(['/products', item.id]);
      } else {
        this.router.navigate(['/products'], { queryParams: { search: item.query } });
      }
    } else {
      this.searchQuery = item.query;
      this.router.navigate(['/search'], { queryParams: { q: item.query } });
    }

    this.search.emit(item.query);
  }

  clear(): void {
    this.searchQuery = '';
    this.suggestions.set([]);
    this.closeDropdown();
    this.search.emit('');
  }

  closeDropdown(): void {
    this.showDropdown.set(false);
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.closeDropdown();
    }
  }
}
