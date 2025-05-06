import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {WebsocketService} from "./services/websocket.service";
import {KeycloakService} from "keycloak-angular";


@Component({
  selector: 'app-root',
  // imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
   standalone: true
})
export class AppComponent {
  title = 'RSSFront';

  constructor(private websocketService: WebsocketService) {}

  ngOnInit(): void {
    console.log('appcomponent ngOnInit')

    this.websocketService.connect()
    this.websocketService.messages$.subscribe(
      (message: any) => {
        this.processMessage(message);
      },
      (error) =>{
        console.error('Error:', error);
      },
      () => {
        console.log('WebSocket connection closed');
      },
    );
  }

  processMessage(message: any): void {
    console.log('processMessage', message);
  }
}


