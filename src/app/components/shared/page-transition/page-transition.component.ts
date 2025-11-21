import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate, state } from '@angular/animations';
import { AnimationService } from '../../../services/animation.service';

@Component({
  selector: 'app-page-transition',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      [@pageTransition]="animationState$ | async"
      class="page-transition"
    >
      <ng-content></ng-content>
    </div>
  `,
  styles: [`
    .page-transition {
      width: 100%;
      height: 100%;
      position: relative;
      overflow-x: hidden;
      background: var(--bg-primary);
    }

    @media (max-width: 768px) {
      .page-transition {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        overflow-x: hidden;
        z-index: 1;
      }
    }
  `],
  animations: [
    trigger('pageTransition', [
      state('enter', style({
        transform: 'translateX(0)',
        opacity: 1
      })),
      state('leave', style({
        transform: 'translateX(100%)',
        opacity: 0
      })),
      transition('void => enter', [
        style({
          transform: 'translateX(-100%)',
          opacity: 0
        }),
        animate('300ms cubic-bezier(0.4, 0.0, 0.2, 1)')
      ]),
      transition('enter => leave', [
        animate('300ms cubic-bezier(0.4, 0.0, 0.2, 1)')
      ]),
      transition('leave => enter', [
        style({
          transform: 'translateX(-100%)',
          opacity: 0
        }),
        animate('300ms cubic-bezier(0.4, 0.0, 0.2, 1)')
      ])
    ])
  ]
})
export class PageTransitionComponent {
  animationState$ = this.animationService.animationState$;

  constructor(private animationService: AnimationService) {}
} 