import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Observable, of, BehaviorSubject} from "rxjs";
import {IUpdateIOMsg} from "../model/update-io-msg";
import {map, tap} from "rxjs/operators";
import { IWSMsg } from '../model/ws-mgs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  public controllers: any[] = [];
  private apiUrl = environment.apiUrl + '/webapi/userDevices';
  private dataSubject = new BehaviorSubject<IWSMsg | null>(null);
  data$ = this.dataSubject.asObservable();

  constructor(private http: HttpClient) {}

  setControllers(data: any[]) {
    this.controllers = data;
  }

  getUserDevices(): Observable<any> {
    return this.http.get(this.apiUrl).pipe(
      tap((data: any) => {
        console.log('getUserDevices', data);
        this.setControllers(data);
      })
    );
  }

  getControllerByMac(mac: string): any | undefined {
    return this.controllers.find(controller => controller.mac === mac);
  }

  updateControllerIO(data: IUpdateIOMsg): void {
    console.log(this.controllers)
    const controller = this.controllers.find(ctrl => ctrl.mac === data.mac);
    if (controller) {
      const output = controller.io.outputs.find((outputItem: any) => outputItem.id === data.output && (outputItem.slaveId ?? 0) === (data.slaveId ?? 0));
      const input = controller.io.inputs.find((inputItem: any) => inputItem.id === data.input && (inputItem.slaveId ?? 0) === (data.slaveId ?? 0));
      if (output) {
        output.state = data.state;
        output.timer = data.timer;
        console.log(`Output updated: MAC=${data.mac}, Output=${data.output}, State=${data.state}, Timer=${data.timer}`);
      } else if (input) {
        input.state = data.state;        
        console.log(`Input updated: MAC=${data.mac}, Input=${data.input}, State=${data.state}`);
      } else {
        console.log(`Output or input not found: MAC=${data.mac}, Output=${data.output}, Input=${data.input}, SlaveId=${data.slaveId}`);
      }
    }
  }

  getControllerByMacWithFetch(mac: string): Observable<any> {
    const controller = this.getControllerByMac(mac);
    if (controller) {
      // Если контроллер уже есть, вернуть его
      return of(controller);
    } else {
      // Иначе запросить данные и найти контроллер
      return this.getUserDevices().pipe(
        map(() => this.getControllerByMac(mac))
      );
    }
  }

  getInputByUuid(uuid: string): Observable<any | null> {
    //console.log('getInputByUuid', uuid);
    if (this.controllers.length === 0) {
      //console.log('controllers is empty, fetching from API...');
      // Если контроллеры не загружены, загружаем их
      return this.getUserDevices().pipe(
        map(() => {
          return this.findInputByUuid(uuid);
        })
      );
    } else {
      // Если контроллеры уже есть, ищем вход сразу
      //console.log('controllers found in memory');
      return of(this.findInputByUuid(uuid));
    }
  }

  // Вспомогательный метод для поиска входа
  private findInputByUuid(uuid: string): any | null {
    // console.log('findInputByUuid', uuid, this.controllers)
    for (const controller of this.controllers) {
      if (controller && controller.io.inputs) {
        const input = controller.io.inputs.find((input: any) => input.uuid === uuid);
        if (input) {
          input.mac = controller.mac
          return input;
        }
      }
    }
    return null;
  }

  getOutputsByInputUuid(uuid: string): Observable<any | null> {
    //console.log('getInputByUuid', uuid);
    if (this.controllers.length === 0) {
      //console.log('controllers is empty, fetching from API...');
      // Если контроллеры не загружены, загружаем их
      return this.getUserDevices().pipe(
        map(() => {
          return this.findOutputsByInputUuid(uuid);
        })
      );
    } else {
      // Если контроллеры уже есть, ищем вход сразу
      //console.log('controllers found in memory');
      return of(this.findOutputsByInputUuid(uuid));
    }
  }

  private findOutputsByInputUuid(uuid: string): any | null {
    // console.log('findInputByUuid', uuid, this.controllers)
    for (const controller of this.controllers) {
      if (controller && controller.io.inputs) {
        const input = controller.io.inputs.find((input: any) => input.uuid === uuid);
        if (input) {
          return controller.io.outputs;
        }
      }
    }
    return null;
  }

  updateData(data: IWSMsg) {
    this.dataSubject.next(data);
  }
}




