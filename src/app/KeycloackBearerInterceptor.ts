import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest
} from '@angular/common/http';
import { Observable, from, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { KeycloakService } from 'keycloak-angular';

@Injectable()
export class KeycloakBearerInterceptor implements HttpInterceptor {

  constructor(private keycloak: KeycloakService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Перед каждым запросом пробуем обновить токен (если нужно)
    return from(this.keycloak.updateToken(60)) // обновит, если токен истекает менее чем через 60 сек
      .pipe(
        switchMap(() => {
          const token = this.keycloak.getKeycloakInstance().token;

          // Добавляем токен в заголовок Authorization
          const authReq = req.clone({
            setHeaders: {
              Authorization: `Bearer ${token}`
            }
          });

          return next.handle(authReq);
        }),
        catchError(err => {
          // Обработка ошибок обновления токена
          console.error('Token refresh failed', err);
          return throwError(() => err);
        })
      );
  }
}
