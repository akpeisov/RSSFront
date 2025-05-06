import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {DataService} from "../../services/data.service";

@Component({
  selector: 'app-controller-details',
  templateUrl: './controller-details.component.html',
  styleUrls: ['./controller-details.component.scss'],
  // standalone: true
})
export class ControllerDetailsComponent implements OnInit {
  controller: any;

  constructor(private route: ActivatedRoute,
              private dataService: DataService) {}

  // ngOnInit() {
  //   //const controllerId = this.route.snapshot.paramMap.get('id');
  //   // Здесь получить контроллер из сервиса/данных.
  //   const uuid = this.route.snapshot.paramMap.get('uuid');
  //   if (uuid) {
  //     console.log("controller uuid", uuid)
  //     this.controller = this.dataService.getControllerByUuid(uuid); // Извлечь данные
  //   }
  // }

  ngOnInit() {
    const mac = this.route.snapshot.paramMap.get('mac');
    if (mac) {
      this.controller = this.dataService.getControllerByMac(mac);

      if (!this.controller) {
        // Запросить данные только для одного контроллера
        this.dataService.getUserDevices().subscribe((data: any) => {
          this.dataService.setControllers(data.controllers);
          this.controller = this.dataService.getControllerByMac(mac);
        });
      }
    }
  }

}
