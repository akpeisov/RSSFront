import { Injectable } from '@angular/core';
import { KeycloakService } from 'keycloak-angular';

@Injectable({ providedIn: 'root' })
export class TokenService {
  private ACCESS_KEY = 'access_token';

  constructor(private keycloak: KeycloakService) {}

  private decodeJwtPayload(token: string | null) {
    if (!token) return null;
    try {
      const payload = token.split('.')[1];
      return JSON.parse(atob(payload));
    } catch {
      return null;
    }
  }

  isTokenValid(token?: string | null, offsetSeconds = 10): boolean {
    const t = token ?? null;
    if (!t) return false;
    const p = this.decodeJwtPayload(t);
    if (!p || !p.exp) return false;
    const now = Math.floor(Date.now() / 1000);
    return (p.exp - offsetSeconds) > now;
  }

  /**
   * Return current access token.
   * Prefer token from Keycloak adapter; fallback to sessionStorage cache.
   */
  async getAccessToken(): Promise<string | null> {
    try {
      const logged = await this.keycloak.isLoggedIn();
      if (logged) {
        const kc = this.keycloak.getKeycloakInstance();
        if (kc && kc.token) {
          // cache in sessionStorage as fallback for the session
          sessionStorage.setItem(this.ACCESS_KEY, String(kc.token));
          return String(kc.token);
        }
      }
    } catch (e) {
      // ignore Keycloak errors and fallback
      console.warn('Keycloak check failed in getAccessToken', e);
    }

    return sessionStorage.getItem(this.ACCESS_KEY);
  }

  /** Save short-lived access token in sessionStorage as a fallback. */
  saveAccessToken(token: string) {
    sessionStorage.setItem(this.ACCESS_KEY, token);
  }

  /**
   * Try to refresh token via Keycloak adapter. Returns new token string or null.
   */
  async refreshAccessToken(): Promise<string | null> {
    try {
      const logged = await this.keycloak.isLoggedIn();
      if (logged) {
        const ok = await this.keycloak.updateToken(30); // refresh if token expires within 30s
        const kc = this.keycloak.getKeycloakInstance();
        if (ok && kc && kc.token) {
          this.saveAccessToken(String(kc.token));
          return String(kc.token);
        }
      }
    } catch (e) {
      console.warn('Keycloak refresh failed', e);
    }
    return null;
  }

  /** Ensure token is valid, refresh if needed, and return a usable token or null. */
  async ensureValidAccessToken(): Promise<string | null> {
    let token = await this.getAccessToken();
    if (this.isTokenValid(token)) return token;
    const refreshed = await this.refreshAccessToken();
    if (this.isTokenValid(refreshed)) return refreshed;
    return null;
  }
}