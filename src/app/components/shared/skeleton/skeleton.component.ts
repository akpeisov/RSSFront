import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      class="skeleton" 
      [style.width]="width" 
      [style.height]="height"
      [class.rounded]="rounded"
      [class.circle]="circle"
    ></div>
  `,
  styles: [`
    .skeleton {
      background: linear-gradient(
        90deg,
        var(--bg-secondary) 25%,
        var(--hover-color) 50%,
        var(--bg-secondary) 75%
      );
      background-size: 200% 100%;
      animation: loading 1.5s infinite;
      
      &.rounded {
        border-radius: 8px;
      }
      
      &.circle {
        border-radius: 50%;
      }
    }

    @keyframes loading {
      0% {
        background-position: 200% 0;
      }
      100% {
        background-position: -200% 0;
      }
    }
  `]
})
export class SkeletonComponent {
  @Input() width: string = '100%';
  @Input() height: string = '20px';
  @Input() rounded: boolean = false;
  @Input() circle: boolean = false;
} 