import { Component } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import {WebsocketService} from "./services/websocket.service";
import {KeycloakService} from "keycloak-angular";
import {OutputCardComponent} from "./components/output-card/output-card.component";
import {HttpClientModule} from "@angular/common/http";
import {IWSMsg} from "./model/ws-mgs";
import {DataService} from "./services/data.service";
import {ToastrService} from "ngx-toastr";
import {take} from "rxjs";
import { CommonModule } from '@angular/common';
import { ThemeToggleComponent } from './components/theme-toggle/theme-toggle.component';
import { IconComponent } from './components/shared/icon/icon.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    OutputCardComponent,
    HttpClientModule,
    CommonModule,
    ThemeToggleComponent,
    IconComponent
  ],
  template: `
    <div class="app-container">
      <div class="app-header">
        <a routerLink="/" class="home-link">
          <h1>RSS Front</h1>
        </a>
        <div class="header-right">
          <div class="user-info" *ngIf="username">
            <button class="profile-button" (click)="openKeycloakProfile()">
              <app-icon name="user"></app-icon>
              <span class="username">{{ username }}</span>
            </button>
            <button class="logout-button" (click)="logout()" title="Logout">
              <app-icon name="logout"></app-icon>
            </button>
          </div>
          <app-theme-toggle></app-theme-toggle>
        </div>
      </div>
      <router-outlet></router-outlet>
    </div>
  `,
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'RSSFront';
  wsMgs : IWSMsg | undefined;
  username: string | undefined;

  constructor(private websocketService: WebsocketService,
              private keycloakService: KeycloakService,
              private dataService: DataService,
              private toastr: ToastrService) {}

  async ngOnInit(): Promise<void> {
    console.log('appcomponent ngOnInit')

    const isLoggedIn = this.keycloakService.isLoggedIn();
    if (!isLoggedIn) {
      this.keycloakService.login();
    }

    if (isLoggedIn) {
      console.log("logged in")
      // Get username from Keycloak
      try {
        const userProfile = await this.keycloakService.loadUserProfile();
        this.username = userProfile.username;
      } catch (error) {
        console.error('Error loading user profile:', error);
      }

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

  openKeycloakProfile(): void {
    const keycloakInstance = this.keycloakService.getKeycloakInstance();
    keycloakInstance.accountManagement();
  }

  logout(): void {
    this.keycloakService.logout(window.location.origin);
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


