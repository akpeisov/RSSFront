import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-search-filter',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  template: `
    <div class="search-filter">
      <div class="search-box">
        <input 
          type="text" 
          [(ngModel)]="searchTerm" 
          (ngModelChange)="onSearch()"
          placeholder="Search controllers..."
          class="search-input"
        >
        <div class="filter-buttons">
          <button 
            *ngFor="let filter of filters" 
            [class.active]="filter.active"
            (click)="toggleFilter(filter)"
            class="filter-button"
          >
            {{ filter.label }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .search-filter {
      margin-bottom: 20px;
      
      .search-box {
        background: var(--bg-secondary);
        padding: 16px;
        border-radius: 8px;
        box-shadow: 0 2px 4px var(--shadow-color);
      }

      .search-input {
        width: 100%;
        padding: 8px 12px;
        border: 1px solid var(--border-color);
        border-radius: 4px;
        background-color: var(--bg-primary);
        color: var(--text-color);
        font-size: 1rem;
        transition: border-color 0.3s;

        &:focus {
          outline: none;
          border-color: var(--button-bg);
        }

        &::placeholder {
          color: var(--text-secondary);
        }
      }

      .filter-buttons {
        display: flex;
        gap: 8px;
        margin-top: 12px;
        flex-wrap: wrap;

        .filter-button {
          padding: 6px 12px;
          border: 1px solid var(--border-color);
          border-radius: 16px;
          background: var(--bg-primary);
          color: var(--text-color);
          cursor: pointer;
          transition: all 0.3s;
          font-size: 0.9rem;

          &:hover {
            background: var(--hover-color);
          }

          &.active {
            background: var(--button-bg);
            color: var(--button-text);
            border-color: var(--button-bg);
          }
        }
      }
    }

    @media (max-width: 767px) {
      .search-filter {
        margin-bottom: 16px;

        .search-box {
          padding: 12px;
        }

        .filter-buttons {
          margin-top: 8px;
          
          .filter-button {
            padding: 4px 10px;
            font-size: 0.85rem;
          }
        }
      }
    }
  `]
})
export class SearchFilterComponent {
  @Output() searchChange = new EventEmitter<string>();
  @Output() filterChange = new EventEmitter<string[]>();

  searchTerm: string = '';
  filters = [
    { label: 'All', value: 'all', active: true },
    { label: 'Online', value: 'online', active: false },
    { label: 'Offline', value: 'offline', active: false }
  ];

  onSearch() {
    this.searchChange.emit(this.searchTerm);
  }

  toggleFilter(filter: any) {
    if (filter.value === 'all') {
      this.filters.forEach(f => f.active = f === filter);
    } else {
      const allFilter = this.filters.find(f => f.value === 'all');
      if (allFilter) allFilter.active = false;
      filter.active = !filter.active;
      
      // If no filters are active, activate 'All'
      if (!this.filters.some(f => f.active)) {
        allFilter!.active = true;
      }
    }

    const activeFilters = this.filters
      .filter(f => f.active && f.value !== 'all')
      .map(f => f.value);
    this.filterChange.emit(activeFilters);
  }
} 