import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AnimationService {
  private animationStateSubject = new BehaviorSubject<'enter' | 'leave'>('enter');
  animationState$ = this.animationStateSubject.asObservable();

  triggerEnterAnimation() {
    this.animationStateSubject.next('enter');
  }

  triggerLeaveAnimation() {
    this.animationStateSubject.next('leave');
  }
} 