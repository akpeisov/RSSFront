import { Component, Input, Output, EventEmitter } from '@angular/core';
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
export class OutputCardComponent {
  @Input() output: any;
  @Input() mac: any;
  //@Output() edit = new EventEmitter<any>();

  private toggleSubject = new Subject<{ output: number, action: string, slaveId: number }>();

  constructor(private websocketService: WebsocketService,
              private router: Router) {
    this.toggleSubject.pipe(debounceTime(300)).subscribe(({ output, action, slaveId }) => {
      this.websocketService.sendMessage({
        type: 'ACTION',
        payload: { mac: this.mac, output, action, slaveId },
      });
    });
  }

  onChange($event: Event): void {
    const newValue = ($event.target as HTMLInputElement).checked;
    //console.log("changed ", newValue)    
    this.toggleSubject.next({ output: this.output.id, action: newValue ? "on" : "off", slaveId: this.output.slaveId });
  }

  // onEdit(): void {
  //   this.edit.emit(this.output);
  // }
  onEdit(): void {
    console.log(this.output.uuid);
    this.router.navigate(['/output-edit', this.output.uuid]);
  }
}

