import { Component, ChangeDetectionStrategy, input, output, signal, inject, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
            <span class="powered-by">Powered by Algolia Engine</span>
          </div>

          <div class="suggestions-list">
            @for (item of suggestions(); track item.query) {
              <div class="suggestion-item" (click)="selectSuggestion(item)">
                <span class="material-icons-outlined item-icon">
                  {{ item.type === 'category' ? 'category' : (item.type === 'popular' ? 'trending_up' : 'search') }}
                </span>
                <div class="item-text">
                  <span class="query-text">{{ item.query }}</span>
                  @if (item.category) {
                    <span class="item-category">in {{ item.category }}</span>
                  }
                </div>
                <span class="item-badge">{{ item.type }}</span>
              </div>
            }
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
      color: $gray-400;
      display: flex;
      align-items: center;
      padding: 2px;
      &:hover {
        color: $gray-700;
      }
      .material-icons-outlined { font-size: 16px; }
    }

    .suggestions-dropdown {
      position: absolute;
      top: calc(100% + 6px);
      left: 0;
      right: 0;
      background: #ffffff;
      border-radius: $radius-md;
      border: 1px solid $gray-200;
      box-shadow: $shadow-xl;
      z-index: 100;
      overflow: hidden;
      animation: fadeIn 0.15s ease-out;
    }

    .dropdown-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 16px;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: $gray-400;
      background: $gray-50;
      border-bottom: 1px solid $gray-100;
    }

    .powered-by {
      font-size: 0.6875rem;
      color: $accent-600;
    }

    .suggestions-list {
      max-height: 320px;
      overflow-y: auto;
    }

    .suggestion-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 16px;
      cursor: pointer;
      transition: background $transition-fast;

      &:hover {
        background-color: $primary-50;
      }
    }

    .item-icon {
      font-size: 18px;
      color: $gray-400;
    }

    .item-text {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .query-text {
      font-size: 0.875rem;
      font-weight: 500;
      color: $gray-800;
    }

    .item-category {
      font-size: 0.75rem;
      color: $gray-400;
    }

    .item-badge {
      font-size: 0.6875rem;
      font-weight: 600;
      text-transform: uppercase;
      padding: 2px 6px;
      border-radius: $radius-xs;
      background: $gray-100;
      color: $gray-600;
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
    this.search.emit(query.trim());
  }

  selectSuggestion(item: SearchSuggestion): void {
    this.searchQuery = item.query;
    this.closeDropdown();
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

