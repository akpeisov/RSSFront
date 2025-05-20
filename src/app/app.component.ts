import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd, RouterModule } from '@angular/router';
import { filter } from 'rxjs/operators';
import { WebsocketService } from "./services/websocket.service";
import { KeycloakService } from "keycloak-angular";
import { DataService } from "./services/data.service";
import { ToastrService } from "ngx-toastr";
import { ThemeToggleComponent } from './components/theme-toggle/theme-toggle.component';
import { IconComponent } from './components/shared/icon/icon.component';
import { PageTransitionComponent } from './components/shared/page-transition/page-transition.component';
import { AnimationService } from './services/animation.service';
import { IWSMsg } from "./model/ws-mgs";
import { Location } from '@angular/common';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterModule,
    ThemeToggleComponent,
    IconComponent,
    PageTransitionComponent
  ],
  template: `
    <app-page-transition>
      <div class="app-container">
        <div class="app-header">
          <div class="header-left">
            <a routerLink="/" class="home-link">
              <h1>RSS Front</h1>
            </a>
            <div *ngIf="environment.test" class="test-indicator">TEST</div>
          </div>
          <div class="header-right">
            <app-theme-toggle></app-theme-toggle>
            <div class="user-info">
              <button class="profile-button" (click)="navigateToAccount()">
                <app-icon name="user"></app-icon>
                <span class="username">{{ username }}</span>
              </button>
            </div>
          </div>
        </div>
        <router-outlet></router-outlet>
      </div>
    </app-page-transition>
  `,
  styles: [`
    .app-container {
      min-height: 100vh;
      background-color: var(--bg-primary);
    }

    .app-header {
      background-color: var(--bg-secondary);
      padding: 1rem;
      box-shadow: 0 2px 4px var(--shadow-color);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .home-link {
      text-decoration: none;
      color: var(--text-color);
      transition: opacity 0.3s;

      &:hover {
        opacity: 0.8;
      }

      h1 {
        margin: 0;
        font-size: 1.5rem;
      }
    }

    .test-indicator {
      background-color: #ff4444;
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: bold;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .profile-button {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: none;
      border: none;
      padding: 8px;
      cursor: pointer;
      color: var(--text-color);
      border-radius: 4px;
      transition: background-color 0.3s;

      &:hover {
        background-color: var(--hover-color);
      }

      .username {
        font-size: 0.9rem;
      }
    }
  `]
})
export class AppComponent implements OnInit {
  title = 'RSSFront';
  wsMgs: IWSMsg | undefined;
  username: string | undefined;
  environment = environment;
  private previousUrl: string = '';

  constructor(
    private websocketService: WebsocketService,
    private keycloakService: KeycloakService,
    private dataService: DataService,
    private toastr: ToastrService,
    private router: Router,
    private location: Location,
    private animationService: AnimationService
  ) {
    // Handle back button
    this.location.subscribe(() => {
      this.animationService.triggerLeaveAnimation();
      setTimeout(() => {
        this.animationService.triggerEnterAnimation();
      }, 300); // Match the animation duration
    });
  }

  async ngOnInit(): Promise<void> {
    console.log('App Component initializing...');
    
    if (await this.keycloakService.isLoggedIn()) {
      console.log('User is logged in');
      const userProfile = await this.keycloakService.loadUserProfile();
      this.username = userProfile.username;
      
      // Connect websocket after confirming login
      console.log('Initializing WebSocket connection...');
      this.websocketService.connect();
      
      this.websocketService.messages$.subscribe(
        msg => {
          // console.log('WebSocket message received:', msg);
          this.wsMgs = msg;
          this.dataService.updateData(msg);
          this.processMessage(msg);
        },
        error => {
          console.error('WebSocket error:', error);
          this.toastr.error('WebSocket connection error');
        },
        () => {
          console.log('WebSocket connection completed/closed');
        }
      );
    } else {
      console.log('User is not logged in');
    }

    // Handle navigation events
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      // Determine navigation direction
      const isForward = !this.previousUrl || this.previousUrl.length < event.url.length;
      
      // Trigger appropriate animation
      if (isForward) {
        this.animationService.triggerEnterAnimation();
      } else {
        this.animationService.triggerLeaveAnimation();
        setTimeout(() => {
          this.animationService.triggerEnterAnimation();
        }, 300);
      }
      
      // Store current URL for next navigation
      this.previousUrl = event.url;
    });
  }

  async navigateToAccount() {
    await this.keycloakService.getKeycloakInstance().accountManagement();
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
      this.toastr.info('Please press long right service button on controller', '', {
        "timeOut": 60000,
        progressBar: true,
        closeButton: true
      }).onHidden
        .subscribe(() => {
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


