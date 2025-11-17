import { Component, Input, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { FormsModule } from "@angular/forms";
import { debounceTime, Subject } from "rxjs";
import { WebsocketService } from "../../services/websocket.service";
import { NgIf } from "@angular/common";
import { Router } from '@angular/router';

@Component({
  selector: 'app-output-card',
  templateUrl: './output-card.component.html',
  styleUrls: ['./output-card.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    NgIf
  ]
})
export class OutputCardComponent implements OnDestroy, OnChanges {
  @Input() output: any;
  @Input() mac: any;
  
  private toggleSubject = new Subject<{ output: number, action: string, slaveId: number }>();
  private toggleSub: any;
  outputChecked: boolean = false; 

  constructor(private websocketService: WebsocketService,
              private router: Router) {
    this.toggleSub = this.toggleSubject.pipe(debounceTime(100)).subscribe(({ output, action, slaveId }) => {
      this.websocketService.sendMessage({
        type: 'ACTION',
        payload: { mac: this.mac, output, action, slaveId },
      });
    });
  }

  ngOnInit(): void {
    this.outputChecked = this.output.state === 'on';    
  }
  
  ngOnChanges(changes: SimpleChanges): void {
    //console.log('changes', changes);
    const ch = changes['output'];
    if (!ch) return;
    
    //this.outputChecked = ch.currentValue.state === 'on';
    //console.log(this.output.id, this.outputChecked );        
  }

  onToggle(event: Event): void {
    event.stopPropagation();
    // берем новое значение из таргета
    const checked = (event.target as HTMLInputElement).checked;
    this.outputChecked = checked; // обновляем локально для UI

    if (!this.output) return;

    const newState = checked ? 'on' : 'off';
    const outputId = this.output.id;
    const slaveId = this.output.slaveId ?? 0;
//console.log({ output: outputId, action: newState, slaveId });
    // Отправляем действие на сервер — не мутируем входной объект
    this.toggleSubject.next({ output: outputId, action: newState, slaveId });
  }

  onEdit(): void {
    console.log(this.output.uuid);
    this.router.navigate(['/output-edit', this.output.uuid]);
  }

  ngOnDestroy(): void {
    this.toggleSub?.unsubscribe?.();
    this.toggleSubject.complete();
  }
}

