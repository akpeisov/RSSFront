import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, ReplaySubject, Subscription, EMPTY } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { ToastrService } from 'ngx-toastr';
import { ErrorService } from './error.service';
import { TokenService } from './token.service';
import { IHelloMsg } from '../model/hello-msg';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class WebsocketService implements OnDestroy {
  private wsUrl = environment.wsUrl;
  private ws: WebSocketSubject<any> | null = null;
  private isConnecting = false;
  private connectionStatusSubject = new BehaviorSubject<boolean>(false);
  public readonly isConnected$: Observable<boolean> = this.connectionStatusSubject.asObservable();
  private inboundSubject = new ReplaySubject<any>();
  public readonly messages$: Observable<any> = this.inboundSubject.asObservable();
  private wsSubscription: Subscription | null = null;

  private myHello: IHelloMsg = {
    type: 'HELLO',
    payload: {
      token: '',
      type: '',
    },
  };

  constructor(
    private tokenService: TokenService,
    private errorService: ErrorService,
    private toastr: ToastrService
  ) {}

  /**
   * Ensure websocket is connected. Public so components can request a connection.
   */
  public async connect(): Promise<void> {
    if (this.isConnecting) {
      return;
    }
    if (this.ws && !this.ws.closed) {
      // already connected
      return;
    }

    this.isConnecting = true;

    // ensure token is valid before opening socket (best-effort)
    try {
      await this.tokenService.ensureValidAccessToken();
    } catch (e) {
      console.warn('Token ensure failed before WS connect', e);
    }

    // Clean up any previous socket
    if (this.ws) {
      try {
        this.ws.complete();
      } catch {}
      this.ws = null;
    }

    this.ws = webSocket({
      url: this.wsUrl,
      openObserver: {
        next: (ev: Event) => {
          console.log('WebSocket opened', ev);
          this.isConnecting = false;
          this.connectionStatusSubject.next(true);
          this.sendHelloMessage();
        },
      },
      closeObserver: {
        next: (ev: any) => {
          console.log('WebSocket closed', ev);
          this.isConnecting = false;
          this.connectionStatusSubject.next(false);
          this.toastr.error('WebSocket connection closed', 'WebSocket');
          // teardown
          this.teardownAndReconnect();
        },
      },
      // Let errors flow into the observable error channel
    });

    // subscribe to messages and forward to inboundSubject
    try {
      this.wsSubscription = this.ws.pipe(
        tap(msg => console.log('WS raw message', msg)),
        catchError((err) => {
          //console.error('WebSocket stream error', err);
          this.errorService.handle('WebSocket stream error');
          this.toastr.error('WebSocket stream error', 'WebSocket');
          return EMPTY;
        })
      ).subscribe(msg => this.inboundSubject.next(msg));
    } catch (e) {
      console.error('Failed to subscribe to websocket messages', e);
    }
  }

  private teardownAndReconnect(): void {
    // unsubscribe from messages
    if (this.wsSubscription) {
      try {
        this.wsSubscription.unsubscribe();
      } catch {}
      this.wsSubscription = null;
    }

    // close ws if still present
    if (this.ws) {
      try {
        this.ws.complete();
      } catch {}
      this.ws = null;
    }

    // schedule reconnect
    setTimeout(() => {
      this.connect().catch(err => console.warn('Reconnect failed', err));
    }, 5000);
  }

  public sendMessage(message: any): void {
    if (this.ws && !this.ws.closed) {
      try {
        this.ws.next(message);
      } catch (e) {
        console.error('Failed to send message over WS', e);
        this.toastr.error('Unable to send WebSocket message', 'WebSocket');
      }
    } else {
      console.error('WebSocket is not connected');
      this.toastr.error('Unable to send message: WebSocket is not connected', 'WebSocket');
    }
  }

  public closeConnection(): void {
    if (this.wsSubscription) {
      try { this.wsSubscription.unsubscribe(); } catch {}
      this.wsSubscription = null;
    }
    if (this.ws) {
      try { this.ws.complete(); } catch {}
      this.ws = null;
    }
    this.isConnecting = false;
    this.connectionStatusSubject.next(false);
  }

  private async sendHelloMessage(): Promise<void> {
    this.myHello.type = 'HELLO';
    this.myHello.payload.type = 'WEB';
    try {
      const token = await this.tokenService.getAccessToken();
      this.myHello.payload.token = token ? String(token) : '';
    } catch (e) {
      console.warn('Failed to get token for HELLO', e);
      this.myHello.payload.token = '';
    }

    console.log('Sending HELLO message with token');
    try {
      this.sendMessage(this.myHello);
    } catch (e) {
      console.error('Failed to send HELLO over WebSocket', e);
    }
  }

  ngOnDestroy(): void {
    this.closeConnection();
  }
}

