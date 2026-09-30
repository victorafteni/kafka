import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FacetGroup } from '../../models/facet.model';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';

@Component({
  selector: 'app-filter-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  template: `
    <aside class="filter-panel">
      <div class="panel-header">
        <h3 class="panel-title">
          <span class="material-icons-outlined">tune</span>
          {{ 'CATALOG.FILTERS' | translate }}
        </h3>
        @if (hasActiveFilters()) {
          <button class="reset-link" (click)="resetAll.emit()">{{ 'COMMON.CLEAR_ALL' | translate }}</button>
        }
      </div>

      <div class="facets-container">
        @for (facet of facets(); track facet.id) {
          <div class="facet-group">
            <h4 class="facet-title">{{ facet.name }}</h4>

            <div class="facet-values">
              @for (val of facet.values; track val.value) {
                <label class="facet-item">
                  @if (facet.type === 'radio') {
                    <input
                      type="radio"
                      [name]="facet.id"
                      [value]="val.value"
                      [checked]="isFacetSelected(facet.id, val.value)"
                      (change)="toggleRadio(facet.id, val.value)"
                    />
                  } @else {
                    <input
                      type="checkbox"
                      [checked]="isFacetSelected(facet.id, val.value)"
                      (change)="toggleCheckbox(facet.id, val.value)"
                    />
                  }
                  <span class="facet-label">{{ val.label }}</span>
                  <span class="facet-count">{{ val.count }}</span>
                </label>
              }
            </div>
          </div>
        }
      </div>
    </aside>
  `,
  styles: [`
    @use 'styles/variables' as *;

    .filter-panel {
      background: #ffffff;
      border: 1px solid $gray-200;
      border-radius: $radius-lg;
      padding: 20px;
    }

    .panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
      padding-bottom: 12px;
      border-bottom: 1px solid $gray-100;
    }

    .panel-title {
      font-size: 1rem;
      font-weight: 700;
      color: $gray-900;
      display: flex;
      align-items: center;
      gap: 6px;

      .material-icons-outlined {
        font-size: 18px;
        color: $primary-600;
      }
    }

    .reset-link {
      font-size: 0.8125rem;
      color: $primary-600;
      font-weight: 600;
      background: none;
      border: none;
      cursor: pointer;
      &:hover {
        text-decoration: underline;
      }
    }

    .facet-group {
      margin-bottom: 24px;
      &:last-child {
        margin-bottom: 0;
      }
    }

    .facet-title {
      font-size: 0.875rem;
      font-weight: 700;
      color: $gray-800;
      margin-bottom: 12px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .facet-values {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .facet-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.875rem;
      color: $gray-700;
      cursor: pointer;
      user-select: none;

      input {
        accent-color: $primary-600;
        cursor: pointer;
      }

      &:hover .facet-label {
        color: $primary-600;
      }
    }

    .facet-label {
      flex: 1;
      transition: color $transition-fast;
    }

    .facet-count {
      font-size: 0.75rem;
      color: $gray-400;
      font-weight: 500;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppFilterPanelComponent {
  facets = input<FacetGroup[]>([]);
  activeFilters = input<Record<string, string[]>>({});
  hasActiveFilters = input<boolean>(false);

  filterChange = output<{ facetId: string; selectedValues: string[] }>();
  resetAll = output<void>();

  isFacetSelected(facetId: string, val: string | number): boolean {
    const active = this.activeFilters()[facetId] || [];
    return active.includes(String(val));
  }

  toggleCheckbox(facetId: string, val: string | number): void {
    const strVal = String(val);
    const current = [...(this.activeFilters()[facetId] || [])];
    const index = current.indexOf(strVal);

    if (index > -1) {
      current.splice(index, 1);
    } else {
      current.push(strVal);
    }

    this.filterChange.emit({ facetId, selectedValues: current });
  }

  toggleRadio(facetId: string, val: string | number): void {
    const strVal = String(val);
    const current = this.activeFilters()[facetId] || [];
    const isAlreadySelected = current.includes(strVal);

    this.filterChange.emit({
      facetId,
      selectedValues: isAlreadySelected ? [] : [strVal]
    });
  }
}

