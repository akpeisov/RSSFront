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
            <a routerLink="/" class="app-title">RSS Front</a>
            <div *ngIf="environment.test" class="test-indicator">TEST</div>
          </div>
          <div class="header-right">
            <app-theme-toggle></app-theme-toggle>
            <div class="user-info" (click)="navigateToAccount()">
              <app-icon name="user"></app-icon>
              <span class="username">{{ username }}</span>
            </div>
          </div>
        </div>
        <router-outlet></router-outlet>
      </div>
    </app-page-transition>
  `,
  styles: [`
    .test-indicator {
      background-color: #ff4444;
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: bold;
      margin-left: 12px;
    }

    .header-left {
      display: flex;
      align-items: center;
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
    if (await this.keycloakService.isLoggedIn()) {
      const userProfile = await this.keycloakService.loadUserProfile();
      this.username = userProfile.username;
    }

    this.websocketService.messages$.subscribe(
      msg => {
        this.wsMgs = msg;
        this.dataService.updateData(msg);
      },
      error => {
        this.toastr.error('WebSocket connection error');
      }
    );

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
}


