import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {WebsocketService} from "./services/websocket.service";
import {KeycloakService} from "keycloak-angular";
import {OutputCardComponent} from "./components/output-card/output-card.component";
import {HttpClientModule} from "@angular/common/http";
import {IWSMsg} from "./model/ws-mgs";
import {DataService} from "./services/data.service";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet,
    OutputCardComponent,
    HttpClientModule
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
   standalone: true
})
export class AppComponent {
  title = 'RSSFront';
  wsMgs : IWSMsg | undefined;

  constructor(private websocketService: WebsocketService,
              private keycloakService: KeycloakService,
              private dataService: DataService) {}

  ngOnInit(): void {
    console.log('appcomponent ngOnInit')

    const isLoggedIn = this.keycloakService.isLoggedIn();
    if (!isLoggedIn)
      this.keycloakService.login();

    if (isLoggedIn) {
      console.log("logged in")
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
  }

  processMessage(message: any): void {
    //this.wsMgs = message;
    const payload = message.payload;
    if (message.type === 'UPDATE') {
      this.dataService.updateControllerOutput(payload)
      this.updateControllerDetails(payload.mac);
    }

    console.log('processMessage', message);
  }

  updateControllerDetails(mac: string): void {
    const detailsComponent = (window as any).currentControllerDetails;
    if (detailsComponent?.controller?.controllerData?.mac === mac) {
      detailsComponent.refreshView();
    }
  }
}


