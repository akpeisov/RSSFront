import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AnimationService } from '../../services/animation.service';
import { WebsocketService } from '../../services/websocket.service';
import { debounceTime, Subject } from 'rxjs';
import { Output } from '../../model/io-config';
import { DataService } from '../../services/data.service';

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
  
  private toggleSubject = new Subject<{ payload:any }>();
  
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private location: Location,
    private animationService: AnimationService,
    private websocketService: WebsocketService,
    private dataService: DataService
  ) {
    this.toggleSubject.pipe(debounceTime(300)).subscribe(({ payload }) => {
      this.websocketService.sendMessage({
        type: 'UPDATEOUTPUT',
        payload: payload,
      });
    });
  }

  public ngOnInit(): void {
    const uuid = this.route.snapshot.paramMap.get('uuid');
    // Get output data from route state
    if (uuid) {
      this.dataService.getOutputByUuid(uuid).subscribe((output: Output) => {
        this.output = output;        
        // console.log('output-edit', this.output);
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

    console.log('Saving output:', this.output);
    this.toggleSubject.next({ payload: this.output });    
    this.back();
  }

  public back(): void {
    this.animationService.triggerLeaveAnimation();
    setTimeout(() => {
      if (this.output.mac) {
        this.router.navigate(['/controller', this.output.mac]);
      } else {
        this.location.back();
      }
    }, 150); // Half the animation duration for smoother transition
  }  
}
