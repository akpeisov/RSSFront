import {Component, Input} from '@angular/core';
import {debounceTime, Subject} from "rxjs";
import {WebsocketService} from "../../services/websocket.service";
import {ActivatedRoute, Router} from "@angular/router";

@Component({
  selector: 'app-button-card',
  standalone: true,
  imports: [],
  templateUrl: './button-card.component.html',
  styleUrl: './button-card.component.scss'
})
export class ButtonCardComponent {
  @Input() input: any;
  @Input() mac: any;

  private toggleSubject = new Subject<{ input: number, action: string }>();

  constructor(private websocketService: WebsocketService,
              private router: Router, private route: ActivatedRoute) {
    this.toggleSubject.pipe(debounceTime(300)).subscribe(({ input, action }) => {
      this.websocketService.sendMessage({
        type: 'ACTION',
        payload: { mac: this.mac, input, action },
      });
    });
  }

  onClick(): void {
    //const newValue = ($event.target as HTMLInputElement).checked
    console.log("btn clicked ", this.input.id)
    //this.toggleSubject.next({ output: this.output.id, action: newValue ? "on" : "off" });
    this.toggleSubject.next({ input: this.input.id, action: "clicked" });
  }

  onEdit(): void {
    // Переход на экран редактирования с передачей input через state
    this.input.mac = this.mac
    console.log('bcard', this.mac)
    console.log(this.input)
    // this.router.navigate(['/input-edit'], {
    //   state: { input: this.input },
    // });
    this.router.navigate(['/input-edit', this.input.uuid]);

    //this.router.navigate(['/controller', mac]);
  }
}
