import { Injectable } from '@angular/core';
import { EMPTY, ReplaySubject, OperatorFunction } from 'rxjs';
import { catchError, switchAll, tap } from 'rxjs/operators';
import { ErrorService } from './error.service';
import { KeycloakService } from 'keycloak-angular';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { IHelloMsg } from '../model/hello-msg';

@Injectable({
  providedIn: 'root',
})
export class WebsocketService {
  wsUrl = 'wss://api.akpeisov.kz/ws';
  private ws: WebSocketSubject<any> | any;
  private myHello: IHelloMsg | any = {
    type: '',
    payload: {
      token: '',
      type: '',
    },
  };

  private messagesSubject$ = new ReplaySubject();
  public messages$ = this.messagesSubject$.pipe(
    tap(msg => console.log('Message passed through messages$ stream:', msg)),
    switchAll() as OperatorFunction<any, any>,
    catchError((e) => {
      console.error('Error in messages$ stream:', e);
      throw e;
    })
  );

  constructor(
    private errorService: ErrorService,
    private keycloak: KeycloakService
  ) {}

  public sendMessage(message: any): void {
    console.log('Sending message:', message);
    if (!this.ws) {
      console.error('WebSocket is not initialized');
      return;
    }
    this.ws.next(message);
  }

  public connect(): void {
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

          this.myHello.type = 'HELLO';
          this.myHello.payload.token = String(this.keycloak.getKeycloakInstance().token);
          this.myHello.payload.type = 'WEB';
          console.log('Sending HELLO message:', this.myHello);
          this.ws.next(this.myHello);
        },
      },
      closeObserver: {
        next: () => {
          console.log('WebSocket connection closed, attempting reconnect in 5s');
          setTimeout(() => this.connect(), 5000);
        },
      }
    });

    const messages$ = this.ws.pipe(
      tap(msg => console.log('Raw WebSocket message received:', msg)),
      catchError((e) => {
        console.error('Error in WebSocket stream:', e);
        return EMPTY;
      })
    );
    
    this.messagesSubject$.next(messages$);
  }
}
