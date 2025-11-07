import { Injectable } from '@angular/core';
import { EMPTY, ReplaySubject, OperatorFunction, timer, BehaviorSubject } from 'rxjs';
import { catchError, switchAll, tap, switchMap } from 'rxjs/operators';
import { ErrorService } from './error.service';
import { KeycloakService } from 'keycloak-angular';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { IHelloMsg } from '../model/hello-msg';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class WebsocketService {
  wsUrl = environment.wsUrl;
  private ws: WebSocketSubject<any> | any;
  private isConnecting: boolean = false;
  private myHello: IHelloMsg | any = {
    type: '',
    payload: {
      token: '',
      type: '',
    },
  };
  private tokenRefreshTimer: any;
  private readonly REFRESH_THRESHOLD = 70; // seconds before expiration to refresh

  private messagesSubject$ = new ReplaySubject();
  public messages$ = this.messagesSubject$.pipe(
    tap(msg => console.log('Message passed through messages$ stream:', msg)),
    switchAll() as OperatorFunction<any, any>,
    catchError((e) => {
      console.error('Error in messages$ stream:', e);
      throw e;
    })
  );

  // connection status: true = connected, false = disconnected
  private connectionStatusSubject$ = new BehaviorSubject<boolean>(false);
  public connectionStatus$ = this.connectionStatusSubject$.asObservable();

  constructor(
    private errorService: ErrorService,
    private keycloak: KeycloakService
  ) {
    this.setupTokenRefresh();
  }

  private setupTokenRefresh() {
    if (this.tokenRefreshTimer) {
      clearTimeout(this.tokenRefreshTimer);
    }
    this.scheduleTokenRefresh();
  }

  private scheduleTokenRefresh() {
    try {
      const token = this.keycloak.getKeycloakInstance().token;
      if (!token) return;

      const tokenData = JSON.parse(atob(token.split('.')[1]));
      const expirationTime = tokenData.exp * 1000;
      const currentTime = Date.now();
      const timeUntilExpiration = expirationTime - currentTime;
      const timeUntilRefresh = timeUntilExpiration - (this.REFRESH_THRESHOLD * 1000);

      if (timeUntilRefresh <= 0) {
        this.refreshToken();
      } else {
        console.log(`Scheduling token refresh in ${Math.floor(timeUntilRefresh / 1000)} seconds`);
        this.tokenRefreshTimer = setTimeout(() => {
          this.refreshToken();
        }, timeUntilRefresh);
      }
    } catch (error) {
      console.error('Error scheduling token refresh:', error);
      this.errorService.handle('Failed to schedule token refresh');
    }
  }

  private async refreshToken() {
    try {
      const isLoggedIn = await this.keycloak.isLoggedIn();
      if (isLoggedIn) {
        await this.keycloak.updateToken(this.REFRESH_THRESHOLD);
        console.log('Token refreshed successfully');
        
        if (this.ws) {
          this.sendHelloMessage();
        }
        this.scheduleTokenRefresh();
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
      this.errorService.handle('Failed to refresh token');
    }
  }

  private sendHelloMessage() {
    this.myHello.type = 'HELLO';
    this.myHello.payload.token = String(this.keycloak.getKeycloakInstance().token);
    this.myHello.payload.type = 'WEB';
    console.log('Sending HELLO message with refreshed token');
    this.ws.next(this.myHello);
  }

  public sendMessage(message: any): void {
    console.log('Sending message:', message);
    if (!this.ws) {
      console.error('WebSocket is not initialized');
      return;
    }
    this.ws.next(message);
  }

  public connect(): void {
    if (this.isConnecting) {
      console.log('Already connecting, skip.');
      return;
    }
    if (this.ws && !this.ws.closed) {
      console.log('WebSocket already connected.');
      return;
    }
    this.isConnecting = true;
    console.log('WS connecting to:', this.wsUrl);

    if (this.ws) {
      console.log('Closing existing WebSocket connection');
      this.ws.complete();
    }

    this.ws = webSocket({
      url: this.wsUrl,
      openObserver: {
        next: (event: Event) => {
          console.log('WebSocket connection opened:', event);
          this.isConnecting = false;
          this.connectionStatusSubject$.next(true);
          this.sendHelloMessage();
        },
      },
      closeObserver: {
        next: () => {
          console.log('WebSocket connection closed, attempting reconnect in 5s');
          this.isConnecting = false;
          this.connectionStatusSubject$.next(false);
          if (this.ws) {
            this.ws.complete();
            this.ws = null;
          }
          setTimeout(() => this.connect(), 5000);
        },
      }
    });

    const wsMessages$ = this.ws.pipe(
      tap(msg => console.log('Raw WebSocket message received:', msg)),
      catchError((e) => {
        console.error('Error in WebSocket stream:', e);
        return EMPTY;
      })
    );
    this.messagesSubject$.next(wsMessages$);
  }

  ngOnDestroy() {
    if (this.tokenRefreshTimer) {
      clearTimeout(this.tokenRefreshTimer);
    }
    if (this.ws) {
      this.ws.complete();
      this.ws = null;
    }
    this.isConnecting = false;
    this.connectionStatusSubject$.next(false);
  }
}
