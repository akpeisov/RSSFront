import {Component, Input} from '@angular/core';
import {debounceTime, Subject} from "rxjs";
import {WebsocketService} from "../../services/websocket.service";
import {ActivatedRoute, Router} from "@angular/router";
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-button-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './button-card.component.html',
  styleUrl: './button-card.component.scss'
})
export class ButtonCardComponent {
  @Input() input: any;
  @Input() mac: any;
  isActive = false;

  private toggleSubject = new Subject<{ input: number, action: string }>();

  // Long press/progress bar state
  isHolding = false;
  progress = 0; // 0 to 100
  private holdTimeout: any;
  private holdStart = 0;
  private progressInterval: any;

  constructor(
    private websocketService: WebsocketService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.toggleSubject.pipe(debounceTime(100)).subscribe(({ input, action }) => {
      this.websocketService.sendMessage({
        type: 'ACTION',
        payload: { mac: this.mac, input, action },
      });
    });
  }

  onButtonDown(): void {
    this.isHolding = true;
    this.progress = 0;
    this.holdStart = Date.now();
    this.progressInterval = setInterval(() => {
      const elapsed = Date.now() - this.holdStart;
      this.progress = Math.min(100, (elapsed / 1000) * 100);
      if (this.progress >= 100) {
        this.progress = 100;
        clearInterval(this.progressInterval);
      }
    }, 16);
    this.holdTimeout = setTimeout(() => {
      this.sendAction('longpress');
      this.isHolding = false;
      this.progress = 0;
      clearInterval(this.progressInterval);
    }, 1000);
  }

  onButtonUp(): void {
    if (this.isHolding) {
      clearTimeout(this.holdTimeout);
      clearInterval(this.progressInterval);
      if (this.progress < 100) {
        this.sendAction('toggle');
      }
      this.isHolding = false;
      this.progress = 0;
    }
  }

  sendAction(action: string): void {
    this.toggleSubject.next({
      input: this.input.id,      
      action
    });
  }

  onEdit(): void {
    this.input.mac = this.mac;
    this.input.isBtn = true;
    console.log('bcard', this.mac);
    console.log(this.input);
    //this.router.navigate(['/input-edit', this.input.uuid]);
    this.router.navigate(['/input-edit', this.input.uuid], { state: { fromTab: 'buttons', controllerMac: this.mac } });
  }
}
