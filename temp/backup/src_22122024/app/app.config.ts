import {APP_INITIALIZER, ApplicationConfig, isDevMode, Provider} from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideServiceWorker } from '@angular/service-worker';
import {HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi} from "@angular/common/http";
import {KeycloakBearerInterceptor, KeycloakService} from "keycloak-angular";

// export const appConfig: ApplicationConfig = {
//   providers: [provideRouter(routes), provideServiceWorker('ngsw-worker.js', {
//         enabled: !isDevMode(),
//         registrationStrategy: 'registerWhenStable:30000'
//     })]
// };

const KeycloakBearerInterceptorProvider: Provider = {
  provide: HTTP_INTERCEPTORS,
  useClass: KeycloakBearerInterceptor,
  multi: true
};

// Provider for Keycloak Initialization
const KeycloakInitializerProvider: Provider = {
  provide: APP_INITIALIZER,
  useFactory: initializeKeycloak,
  multi: true,
  deps: [KeycloakService]
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes), provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000'
    }),
    provideHttpClient(withInterceptorsFromDi()), // Provides HttpClient with interceptors
    KeycloakInitializerProvider, // Initializes Keycloak
    KeycloakBearerInterceptorProvider, // Provides Keycloak Bearer Interceptor
    KeycloakService, // Service for Keycloak
    // provideRouter(routes,withViewTransitions(),withComponentInputBinding()),
    // provideClientHydration(),
    // // provideHttpClient(withFetch()),
    // provideAnimations(),
    // { provide: Document, useExisting: DOCUMENT },
    // TranslateModule.forRoot({
    //   defaultLanguage: 'ar',
    //   loader: {
    //     provide: TranslateLoader,
    //     useFactory: HttpLoaderFactory,
    //     deps: [HttpClient]
    //   }
    // }).providers!
  ]
}



function initializeKeycloak(keycloak: KeycloakService) {
  return () =>
    keycloak.init({
      // Configuration details for Keycloak
      config: {
        url: 'https://keycloak.akpeisov.kz',
        realm: 'RelaySmartSystems',
        clientId: 'RelaySmartSystemsFront',
      },
      // Options for Keycloak initialization
      initOptions: {
        onLoad: 'login-required', // Action to take on load
        silentCheckSsoRedirectUri:
          window.location.origin + '/assets/silent-check-sso.html' // URI for silent SSO checks
      },
      // Enables Bearer interceptor
      enableBearerInterceptor: true,
      // Prefix for the Bearer token
      bearerPrefix: 'Bearer',
      // URLs excluded from Bearer token addition (empty by default)
      //bearerExcludedUrls: []
    });
}
