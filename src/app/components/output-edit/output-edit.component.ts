import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AnimationService } from '../../services/animation.service';
import { WebsocketService } from '../../services/websocket.service';
import { debounceTime, Subject } from 'rxjs';

interface Output {
  name: string;
  type: 's' | 't';
  on?: number;
  off?: number;
  limit?: number;
  alice: boolean;
  room?: string;
  default: 'on' | 'off';
}

type NumberField = 'on' | 'off' | 'limit';

@Component({
  selector: 'app-output-edit',
  templateUrl: './output-edit.component.html',
  styleUrls: ['./output-edit.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class OutputEditComponent implements OnInit {
  public output: Output = {
    name: '',
    type: 's',
    alice: false,
    default: 'off'
  };
  public controllerMac: string = '';
  public outputTypes = [
    { value: 's', label: 'Обычный' },
    { value: 't', label: 'Тепличный таймер' }
  ];
  public defaultValues = [
    { value: 'on', label: 'Включено' },
    { value: 'off', label: 'Выключено' }
  ];
  public formError: string = '';

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

  public ngOnInit(): void {
    // Get output data from route state
    const state = history.state;
    if (state && state.output) {
      this.output = { ...state.output };
      this.controllerMac = state.controllerMac;
    } else {
      this.router.navigate(['/']);
    }
  }

  public onTypeChange(): void {
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

  public onAliceChange(): void {
    // Reset room when alice is false
    if (!this.output.alice) {
      this.output.room = undefined;
    }
  }

  public incrementValue(field: NumberField): void {
    const currentValue = this.output[field] ?? 0;
    this.output[field] = currentValue + 1;
  }

  public decrementValue(field: NumberField): void {
    const currentValue = this.output[field] ?? 0;
    if (currentValue > 0) {
      this.output[field] = currentValue - 1;
    }
  }

  public save(): void {
    this.formError = '';
    
    // Validate room name when Alice is enabled
    if (this.output.alice && (!this.output.room || this.output.room.trim() === '')) {
      this.formError = 'Room name is required when Alice is enabled';
      return;
    }

    console.log('Saving output:', this.output);
    this.updateSubject.next({ 
      payload: {
        ...this.output,
        mac: this.controllerMac
      }
    });
    this.animationService.triggerLeaveAnimation();
    setTimeout(() => {
      if (this.controllerMac) {
        this.router.navigate(['/controller', this.controllerMac]);
      } else {
        this.location.back();
      }
    }, 150); // Half the animation duration for smoother transition
  }

  public cancel(): void {
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
