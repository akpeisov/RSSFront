import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {MyKeycloakService} from "./keycloak.service";

@Injectable({
  providedIn: 'root',
})
export class DataService {
  private controllers: any[] = [];
  private apiUrl = 'http://192.168.4.120:8888/webapi/userDevices';

  constructor(private http: HttpClient,
              private keycloak: MyKeycloakService) {}

  setControllers(data: any[]) {
    this.controllers = data;
  }

  getControllers() {
    if (this.controllers.length > 0)
      return this.controllers;

    this.getUserDevices().subscribe((data) => {
      this.controllers = data.controllers;
      return this.controllers;
    });

    return this.controllers;
  }

  // getUserDevices(): Observable<any> {
  //   headers: {["Authorization"]: 'Bearer ' + String(this.keycloak.getToken()) }})
  //   return this.http.get<any>(this.apiUrl);
  // }

  getUserDevices(): Observable<any> {
    return this.http.get<any>(this.apiUrl, {
    headers: {["Authorization"]: 'Bearer ' + String(this.keycloak.getToken() ) }})
  }


getControllerByUuid(uuid: string): any | undefined {
    return this.controllers.find(controller => controller.uuid === uuid);
  }

  getControllerByMac(mac: string): any | undefined {
    return this.controllers.find(controller => controller.mac === mac);
  }


}




