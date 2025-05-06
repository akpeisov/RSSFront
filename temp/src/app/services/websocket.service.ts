import { Injectable } from '@angular/core';
import { EMPTY, ReplaySubject, OperatorFunction } from 'rxjs';
import { catchError, switchAll, tap, map, switchMap } from 'rxjs/operators';
import { ErrorService } from './error.service';
import { KeycloakService } from 'keycloak-angular';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { IHelloMsg } from '../model/hello-msg';
import {MyKeycloakService} from "./keycloak.service";

@Injectable({
  providedIn: 'root',
})
export class WebsocketService {

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
    private keycloak: MyKeycloakService
   // private keycloak: KeycloakService
) {
  }

  public connect(): void {
      console.log('Connecting...');
      //console.log('Requesting socket');
      this.ws = webSocket({
        url: 'wss://api.akpeisov.kz/ws',
        openObserver: {
          next: (event: Event) => {
            this.myHello.type = 'HELLO';
            this.myHello.payload.token = String(this.keycloak.getToken());
            //this.myHello.payload.token = String(this.keycloak.getKeycloakInstance().token);
            this.myHello.payload.type = 'WEB';
            console.log(JSON.stringify(this.myHello));
            this.ws.next(this.myHello);
          },
        },
        closeObserver: {
          next: () => {
            console.log('Closing socket...');
          },
        },
      });

    //this.ws.subscribe();

      const messages$ = this.ws.pipe(
        /*
        tap({
          next: (val) => console.log('AA: ', val),
          error: (error) => console.log(error),
        }),
        */
        catchError((e) => EMPTY)
      )
      this.messagesSubject$.next(messages$);


    }



  // private messagesSubject$ = new ReplaySubject();
  // public messages$ = this.messagesSubject$
  //   .pipe(
  //     switchAll() as OperatorFunction<any, any>,
  //     catchError((e) => {
  //       throw e;
  //     })
  //   );
  //
  // // Authorization message
  // //myHello: IHelloMsg | undefined;
  // myHello = new THelloMsg();
  //
  //
  // public connect(): void {
  //   console.log('Connecting...');
  //   this.myHello.type = 'HELLO';
  //   this.myHello.payload.type = 'WEB';
  //   //this.myHello.payload.token = this.keycloak.getToken();
  //
  //   if (
  //     (!this.socket$ || this.socket$.closed) &&
  //     !this.keycloak.isTokenExpired()
  //   ) {
  //     console.log('Requesting socket');
  //     this.socket$ = this.getNewWebSocket();
  //     console.log('Socket obtained');
  //
  //     // here one needs to subscribe
  //     // otherwise nothing works
  //
  //     const messages$ = this.socket$.pipe(
  //       /*
  //       tap({
  //         next: (val) => console.log('AA: ', val),
  //         error: (error) => console.log(error),
  //       }),
  //       */
  //       catchError((e) => EMPTY)
  //     )
  //     this.messagesSubject$.next(messages$);
  //   }
  // }
  //
  // private getNewWebSocket() {
  //   console.log('Opening a socket...');
  //   return webSocket({
  //     url: 'wss://api.akpeisov.kz/ws',
  //     openObserver: {
  //       next: (event: Event) => {
  //         console.log(JSON.stringify(this.myHello));
  //         this.myHello.payload.token = String(
  //           this.keycloak.getKeycloakInstance().token
  //         );
  //         this.socket$.next(this.myHello);
  //       },
  //     },
  //     closeObserver: {
  //       next: () => {
  //         console.log('Closing socket...');
  //       },
  //     },
  //   });
  // }
  //
  // public sendMessage(message: any): void {
  //   this.socket$.next(message);
  // }
  //
  // public close(): void {
  //   this.socket$.complete();
  // }
}
