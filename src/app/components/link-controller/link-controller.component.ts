import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {FormsModule} from "@angular/forms";
import {WebsocketService} from "../../services/websocket.service";

@Component({
  selector: 'app-link-controller',
  standalone: true,
  imports: [
    FormsModule
  ],
  templateUrl: './link-controller.component.html',
  styleUrl: './link-controller.component.scss'
})
export class LinkControllerComponent implements OnInit {
  constructor(private route: ActivatedRoute,
              private websocketService: WebsocketService) {}
  mac : any

  ngOnInit() {
    this.mac = this.route.snapshot.paramMap.get('mac');
  }

  link() {
    console.log('link')
    this.sendRequest()
    // if (this.mac.length != 12) {
    //
    // }

  }



  sendRequest() {
    this.websocketService.sendMessage({
      type: 'REQUESTFORLINK',
      payload: { mac: this.mac,
                 event: 'linkRequested'
               },
    });
  }
}
