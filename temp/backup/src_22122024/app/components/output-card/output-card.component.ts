import { Component, Input } from '@angular/core';
import {FormsModule} from "@angular/forms";
import {debounceTime, Subject} from "rxjs";
import {WebsocketService} from "../../services/websocket.service";

@Component({
  selector: 'app-output-card',
  templateUrl: './output-card.component.html',
  styleUrls: ['./output-card.component.scss'],
  standalone: true,
  imports: [
    FormsModule
  ]
})
export class OutputCardComponent {
  @Input() output: any;
  @Input() mac: any;

  private toggleSubject = new Subject<{ output: number, action: string }>();

  constructor(private websocketService: WebsocketService) {
    this.toggleSubject.pipe(debounceTime(300)).subscribe(({ output, action }) => {
      this.websocketService.sendMessage({
        type: 'ACTION',
        payload: { mac: this.mac, output, action },
      });
    });
  }

  onChange($event: Event): void {
    const newValue = ($event.target as HTMLInputElement).checked
    //console.log("changed ", newValue)
    this.toggleSubject.next({ output: this.output.id, action: newValue ? "on" : "off" });
  }

}

