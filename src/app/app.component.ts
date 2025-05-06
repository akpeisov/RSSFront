import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {WebsocketService} from "./services/websocket.service";
import {KeycloakService} from "keycloak-angular";
import {OutputCardComponent} from "./components/output-card/output-card.component";
import {HttpClientModule} from "@angular/common/http";
import {IWSMsg} from "./model/ws-mgs";
import {DataService} from "./services/data.service";
import {ToastrService} from "ngx-toastr";
import {take} from "rxjs";

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
              private dataService: DataService,
              private toastr: ToastrService) {}
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



  showSuccess() {

  }

  processMessage(message: any): void {
    //this.wsMgs = message;
    const payload = message.payload;
    if (message.type === 'UPDATE') {
      this.dataService.updateControllerOutput(payload)
      this.updateControllerDetails(payload.mac);
    } else if (message.type === 'SUCCESS') {
      this.toastr.success(payload.message);
    } else if (message.type === 'ERROR') {
      this.toastr.error(payload.message);
    } else if (message.type === 'LINKOK') {
      this.toastr.success('Controller linked successfully');
    } else if (message.type === 'LINK') {
      this.toastr.info('Please press long right service button on controller', '',{
        "timeOut": 60000,
        progressBar: true,
        closeButton: true
      }).onHidden
        .subscribe(()=>{
          //console.log(1)
          this.websocketService.sendMessage({
            type: 'REQUESTFORLINK',
            payload: { event: 'linkRequestTimeout' }
          });
        });
    }

    console.log('processMessage', message);
  }

  updateControllerDetails(mac: string): void {
    const detailsComponent = (window as any).currentControllerDetails;
    if (detailsComponent?.controller?.mac === mac) {
      detailsComponent.refreshView();
    }
  }


}


