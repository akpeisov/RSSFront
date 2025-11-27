import { Component, OnInit, OnDestroy } from '@angular/core';
import {Router} from "@angular/router";
import { WebsocketService } from '../../services/websocket.service';
import { filter, Subscription } from 'rxjs';
import {ControllerCardComponent} from "../controller-card/controller-card.component";
import {HttpClientModule} from "@angular/common/http";
import {NgFor, NgIf} from "@angular/common";

@Component({
  selector: 'app-controller-list',
  templateUrl: './controller-list.component.html',
  styleUrls: ['./controller-list.component.scss'],
  standalone: true,
  imports: [ControllerCardComponent,
    HttpClientModule,
    NgFor, NgIf
  ]
})

export class ControllerListComponent implements OnInit, OnDestroy {  
  controllers: any[] = [];
  sortedControllers: any[] = [];
  isOnline: boolean = false;
  private connSub: Subscription | null = null;
  private msgSub: Subscription | null = null;
  
  constructor(private router: Router,
              private websocketService: WebsocketService) {}

  ngOnInit() {    
    // Subscribe to websocket connection status
    this.connSub = this.websocketService.isConnected$.subscribe((status: boolean) => {
      this.isOnline = status;      
    });

    this.websocketService.getUserDevices().subscribe((data: any) => {
      if (data != null) {        
        this.controllers = data;
        //console.log('data list', this.controllers)
        // maintain a separately sorted view to avoid sorting in template
        this.sortedControllers = [...this.controllers].sort((a: any, b: any) => {
          const an = (a && a.name) ? String(a.name) : '';
          const bn = (b && b.name) ? String(b.name) : '';
          return an.localeCompare(bn);
        });
        //console.log(this.sortedControllers);
      } 
    });

    // Subscribe to WebSocket messages to update controller status
    this.msgSub = this.websocketService.messages$.pipe(
      filter((message: any) => message && message.type === 'STATUS')
    ).subscribe((message: any) => {
      // STATUS прилетает по одному контроллеру (online/offline)
      
      const mac = message?.payload?.mac;
      const status = message?.payload?.status;
      if (!mac) return;

      // Find controller in controllers list by mac
      const idx = this.controllers.findIndex((c: any) => c && (c.mac === mac || c.deviceMac === mac));
      if (idx !== -1) {
        // Mutate the existing object so other references update automatically
        this.controllers[idx].status = status;
        // If we maintain a separate sorted view, ensure it reflects the change as well
        const sidx = this.sortedControllers.findIndex((c: any) => c && (c.mac === mac || c.deviceMac === mac));
        if (sidx !== -1) {
          this.sortedControllers[sidx].status = status;
        }
      }
    });      
  }
  
  ngOnDestroy() {
    if (this.connSub) this.connSub.unsubscribe();
    if (this.msgSub) this.msgSub.unsubscribe();
  }

  goToDetails(mac: string) {
    this.router.navigate(['/controller', mac]);
  }

}
