import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {DataService} from "../../services/data.service";
import {OutputCardComponent} from "../output-card/output-card.component";
import {InputCardComponent} from "../input-card/input-card.component";
import {NgFor} from "@angular/common";
import {ButtonCardComponent} from "../button-card/button-card.component";
import {debounceTime, Subject} from "rxjs";
import {WebsocketService} from "../../services/websocket.service";

@Component({
  selector: 'app-controller-details',
  templateUrl: './controller-details.component.html',
  styleUrls: ['./controller-details.component.scss'],
  standalone: true,
  imports: [OutputCardComponent,
    InputCardComponent,
    NgFor, ButtonCardComponent
  ]
})
export class ControllerDetailsComponent implements OnInit {
  controller: any;

  private toggleSubject = new Subject<{ mac:string }>();

  constructor(private route: ActivatedRoute,
              private dataService: DataService,
              private websocketService: WebsocketService) {
    this.toggleSubject.pipe(debounceTime(300)).subscribe(({ mac }) => {
      this.websocketService.sendMessage({
        type: 'UPLOADCONFIG',
        payload: {mac: mac},
      });
    });
  }

  // ngOnInit() {
  //   //const controllerId = this.route.snapshot.paramMap.get('id');
  //   // Здесь получить контроллер из сервиса/данных.
  //   const uuid = this.route.snapshot.paramMap.get('uuid');
  //   if (uuid) {
  //     console.log("controller uuid", uuid)
  //     this.controller = this.dataService.getControllerByUuid(uuid); // Извлечь данные
  //   }
  // }

  compare( a: any, b: any ) {
    if ( a.id < b.id ){
      return -1;
    }
    if ( a.id > b.id ){
      return 1;
    }
    return 0;
  }

  findInputs(input: any[]): any[] {
    return input.filter(p => p.id <= 15);
  }

  findButtons(input: any[]): any[] {
    return input.filter(p => p.id > 15);
  }

  ngOnInit() {
    const mac = this.route.snapshot.paramMap.get('mac');
    if (mac) {
      this.dataService.getControllerByMacWithFetch(mac).subscribe((controller) => {
        this.controller = controller;
        if (this.controller?.outputs) {
          this.controller.outputs.sort(this.compare);
        }
      });
    }
  }

  upload() {
    console.log('upload')
    this.toggleSubject.next( {mac: this.controller.mac });
  }

  test() {
    this.toggleSubject.next( {mac: "test" });
  }

}
