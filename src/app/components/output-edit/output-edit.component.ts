import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AnimationService } from '../../services/animation.service';
import { WebsocketService } from '../../services/websocket.service';
import { debounceTime, Subject } from 'rxjs';

@Component({
  selector: 'app-output-edit',
  templateUrl: './output-edit.component.html',
  styleUrls: ['./output-edit.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class OutputEditComponent implements OnInit {
  output: any;
  controllerMac: string = '';
  outputTypes = [
    { value: 's', label: 'Обычный' },
    { value: 't', label: 'Тепличный таймер' }
  ];
  defaultValues = [
    { value: 'on', label: 'Включено' },
    { value: 'off', label: 'Выключено' }
  ];

  private updateSubject = new Subject<{ payload: any }>();

  constructor(
    private router: Router,
    private location: Location,
    private animationService: AnimationService,
    private websocketService: WebsocketService
  ) {
    this.updateSubject.pipe(debounceTime(300)).subscribe(({ payload }) => {
      this.websocketService.sendMessage({
        type: 'UPDATEOUTPUT',
        payload: payload,
      });
    });
  }

  ngOnInit() {
    // Get output data from route state
    const state = history.state;
    if (state && state.output) {
      this.output = { ...state.output };
      this.controllerMac = state.controllerMac;
    } else {
      this.router.navigate(['/']);
    }
  }

  onTypeChange() {
    // Reset timer-specific fields when type changes
    if (this.output.type !== 't') {
      this.output.on = undefined;
      this.output.off = undefined;
    }
    // Reset limit when type is not 's'
    if (this.output.type !== 's') {
      this.output.limit = undefined;
    }
  }

  onAliceChange() {
    // Reset room when alice is false
    if (!this.output.alice) {
      this.output.room = undefined;
    }
  }

  save() {
    console.log('Saving output:', this.output);
    this.updateSubject.next({ payload: this.output });
    this.animationService.triggerLeaveAnimation();
    setTimeout(() => {
      if (this.controllerMac) {
        this.router.navigate(['/controller', this.controllerMac]);
      } else {
        this.location.back();
      }
    }, 150); // Half the animation duration for smoother transition
  }

  cancel() {
    this.animationService.triggerLeaveAnimation();
    setTimeout(() => {
      if (this.controllerMac) {
        this.router.navigate(['/controller', this.controllerMac]);
      } else {
        this.location.back();
      }
    }, 150); // Half the animation duration for smoother transition
  }
}
