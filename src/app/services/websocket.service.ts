import { Injectable } from '@angular/core';
import { EMPTY, ReplaySubject, OperatorFunction } from 'rxjs';
import { catchError, switchAll, tap, map, switchMap } from 'rxjs/operators';
import { ErrorService } from './error.service';
import { KeycloakService } from 'keycloak-angular';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { IHelloMsg } from '../model/hello-msg';

@Injectable({
  providedIn: 'root',
})
export class WebsocketService {
  wsUrl = 'wss://api.akpeisov.kz/ws'
  //private ws = webSocket("");
  private ws: WebSocketSubject<any> | any;
  private myHello: IHelloMsg | any = {
    type: '',
    payload: {
      token: '',
      type: '',
    },
  };

  private messagesSubject$ = new ReplaySubject();
  public messages$ = this.messagesSubject$
    .pipe(
      switchAll() as OperatorFunction<any, any>,
      catchError((e) => {
        throw e;
      })
    );


  constructor(
    private errorService: ErrorService,
    private keycloak: KeycloakService) {
  }

  public sendMessage(message: any): void {
    this.ws.next(message);
  }

  // public init(): void {
  //   this.connect()
  // }

  public connect(): void {
      console.log('WS connecting...');

    this.ws = webSocket({
      url: this.wsUrl,
      openObserver: {
        next: (event: Event) => {
          console.log('ws event ', event)

          this.myHello.type = 'HELLO';
          this.myHello.payload.token = String(this.keycloak.getKeycloakInstance().token);
          this.myHello.payload.type = 'WEB';
          console.log(JSON.stringify(this.myHello));
          this.ws.next(this.myHello);
        },
      },
      closeObserver: {
        next: () => {
          console.log('Closing socket...');
          //setTimeout(this.connect, 5000)
          setTimeout(() => this.connect(), 5000);
        },
      }
    });

    const messages$ = this.ws.pipe(
      catchError((e) => EMPTY)
    )
    this.messagesSubject$.next(messages$);

  }
}
