import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
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
              private router: Router,
              private websocketService: WebsocketService) {}
  mac: any

  ngOnInit() {
    this.mac = this.route.snapshot.paramMap.get('mac');
    console.log('linkcontroller init', this.mac)
  }

  back() {
    //window.history.back();
    this.router.navigate(['/']);
  }

  link() {
    console.log('link request for ', this.mac);
    this.sendRequest();
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
