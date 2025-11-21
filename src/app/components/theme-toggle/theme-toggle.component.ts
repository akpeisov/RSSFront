import { Component } from '@angular/core';
import { ThemeService } from '../../services/theme.service';
import { AsyncPipe, CommonModule, NgIf } from '@angular/common';
import { IconComponent } from '../shared/icon/icon.component';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [AsyncPipe, NgIf, CommonModule, IconComponent],
  template: `
    <button class="theme-toggle" (click)="themeService.toggleTheme()" [attr.aria-label]="(themeService.darkMode$ | async) ? 'Switch to light mode' : 'Switch to dark mode'">
      <app-icon *ngIf="!(themeService.darkMode$ | async)" name="sun"></app-icon>
      <app-icon *ngIf="themeService.darkMode$ | async" name="moon"></app-icon>
    </button>
  `,
  styles: [`
    .theme-toggle {
      background: none;
      border: none;
      padding: 8px;
      cursor: pointer;
      border-radius: 50%;
      transition: background-color 0.3s;
      color: var(--text-color);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .theme-toggle:hover {
      background-color: var(--hover-color);
    }
  `]
})
export class ThemeToggleComponent {
  constructor(public themeService: ThemeService) {}
} 