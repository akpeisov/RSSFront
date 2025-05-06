import { Injectable } from '@angular/core';
import Keycloak from 'keycloak-js';

@Injectable({
  providedIn: 'root',
})
export class MyKeycloakService {
  private keycloak = new Keycloak({
    url: 'https://keycloaktest.akpeisov.kz',
    realm: 'RelaySmartSystems',
    clientId: 'RelaySmartSystemsFront',
  });

  init() {
    return this.keycloak.init({
      onLoad: 'login-required',
    });
  }

  getToken() {
    return this.keycloak.token;
  }

}
