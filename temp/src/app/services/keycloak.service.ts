import { KeycloakService } from "keycloak-angular";

export class MyKeycloakService {
  private keycloak: KeycloakService = new KeycloakService();

  init() {
    return this.keycloak.init({
      config: {
        url: 'https://keycloak.akpeisov.kz',
        realm: 'RelaySmartSystems',
        clientId: 'RelaySmartSystemsFront',
      },
      initOptions: {
        onLoad: 'check-sso',
        silentCheckSsoRedirectUri: window.location.origin
          + '/assets/silent-check-sso.html'
      },
    });
  }

  getToken() {
    console.log(this.keycloak.getKeycloakInstance())
    return this.keycloak.getKeycloakInstance().token;
  }

}

