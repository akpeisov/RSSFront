import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AnimationService } from '../../services/animation.service';
import { WebsocketService } from '../../services/websocket.service';
import { Output } from '../../model/io-config';

type NumberField = 'on' | 'off' | 'limit';

@Component({
  selector: 'app-output-edit',
  templateUrl: './output-edit.component.html',
  styleUrls: ['./output-edit.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class OutputEditComponent implements OnInit {
  output: Output = {
    uuid: "",
    id: 0,
    name: '',
    type: 's',
    alice: false,
    default: 'off',
    state: 'off',
    slaveId: 0
  };  
  outputTypes = [
    { value: 's', label: 'Обычный' },
    { value: 't', label: 'Тепличный таймер' }
  ];
  defaultValues = [
    { value: 'on', label: 'Включено' },
    { value: 'off', label: 'Выключено' }
  ];
  formError: string = '';
  
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private location: Location,
    private animationService: AnimationService,
    private websocketService: WebsocketService
  ) {
  }

  public ngOnInit(): void {
    const uuid = this.route.snapshot.paramMap.get('uuid');
    // Get output data from route state
    if (uuid) {
      this.websocketService.getUserDevices().subscribe((devices) => {
        if (devices == null)
          return;
        //console.log('oe ', devices);
        this.output = devices.reduce((acc: any, c: { io: { outputs: any[]; }; }) => {
            if (acc) return acc;
            return c?.io?.outputs?.find((o: any) => o.uuid === uuid) || null;
          }, null as any);                  
      });
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

    this.websocketService.sendMessage({
        type: 'UPDATEOUTPUT',
        payload: this.output,
      });
    this.back();
  }

  public back(): void {
    this.animationService.triggerLeaveAnimation();
    setTimeout(() => {
      const fromTab = (window.history && (window.history.state as any)?.fromTab) ? (window.history.state as any).fromTab : undefined;
      const mac = this.output.mac || (window.history && (window.history.state as any)?.controllerMac);
      if (mac) {
        if (fromTab) {
          this.router.navigate(['/controller', mac], { state: { activeTab: fromTab } });
        } else {
          this.router.navigate(['/controller', mac]);
        }
      } else {
        this.location.back();
      }
    }, 150); // Half the animation duration for smoother transition
  }  
}
