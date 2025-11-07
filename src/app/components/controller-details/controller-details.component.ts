import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import {DataService} from "../../services/data.service";
import {OutputCardComponent} from "../output-card/output-card.component";
import {InputCardComponent} from "../input-card/input-card.component";
import {NgFor, NgClass, NgIf, KeyValuePipe} from "@angular/common";
import {FormsModule} from "@angular/forms";
import {ButtonCardComponent} from "../button-card/button-card.component";
import {debounceTime, Subject, Subscription} from "rxjs";
import {WebsocketService} from "../../services/websocket.service";
import {filter} from "rxjs/operators";
import { AnsiColorPipe } from '../shared/ansi-color/ansi-color.pipe';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-controller-details',
  templateUrl: './controller-details.component.html',
  styleUrls: ['./controller-details.component.scss'],
  standalone: true,
  imports: [OutputCardComponent,
    InputCardComponent,
    NgFor, 
    NgClass,
    NgIf,
    KeyValuePipe,
    FormsModule,
    ButtonCardComponent,
    AnsiColorPipe,
    RouterModule    
  ]
})
export class ControllerDetailsComponent implements OnInit, OnDestroy {
  private navigationSubscription: Subscription | null = null;
  controller: any;
  activeTab: 'outputs' | 'inputs' | 'buttons' = 'outputs';
  previousTab: 'outputs' | 'inputs' | 'buttons' = 'outputs';
  showInfoPopup: boolean = false;
  showServicePopup: boolean = false;
  showLogsPanel: boolean = false;
  logs: string[] = [];
  actionsMenuOpen = false;
  showRebootConfirm = false;
  showUpdateConfirm = false;
  showUploadConfirm = false;  
  private toggleSubject = new Subject<any>();
  private websocketSubscription: Subscription | null = null;
  public formError: string = '';

  constructor(private route: ActivatedRoute,
              private router: Router,
              private dataService: DataService,
              private websocketService: WebsocketService) {
    this.toggleSubject.pipe(debounceTime(300)).subscribe((command) => {
      if (this.controller?.mac) {
        this.websocketService.sendMessage({
          type: 'COMMAND',
          payload: {
            command: command,
            mac: this.controller.mac
          }
        });
      }
    });
  }
   
  setActiveTab(tab: 'outputs' | 'inputs' | 'buttons') {
    this.previousTab = this.activeTab;
    this.activeTab = tab;
  }

  getTabAnimationClass(tab: 'outputs' | 'inputs' | 'buttons'): string {
    if (tab === this.activeTab) {
      return 'active';
    }
    if (tab === this.previousTab) {
      const currentIndex = this.getTabIndex(tab);
      const newIndex = this.getTabIndex(this.activeTab);
      return newIndex > currentIndex ? 'slide-left' : 'slide-right';
    }
    return '';
  }

  private getTabIndex(tab: 'outputs' | 'inputs' | 'buttons'): number {
    switch(tab) {
      case 'outputs': return 0;
      case 'inputs': return 1;
      case 'buttons': return 2;
    }
    return 0;
  }

  compare( a: any, b: any ) {
    if ( a.id < b.id ){
      return -1;
    }
    if ( a.id > b.id ){
      return 1;
    }
    return 0;
  }

  findInputs(input: any[] | null | undefined): any[] {
    //return input?.filter(p => p.id <= 15).filter(p => p.slaveId == 0 || p.slaveId == null) || [];
    return input?.filter(p => p.id <= 15) || [];
  }

  findButtons(input: any[] | null | undefined): any[] {
    return input?.filter(p => p.id > 15) || [];
  }

  getOutputsBySlaveId(): { [key: string]: any[] } {
    if (!this.controller?.io.outputs) return {};
    
    const grouped: { [key: string]: any[] } = {};
    
    this.controller.io.outputs.forEach((output: any) => {
      const slaveId = output.slaveId === null || output.slaveId === undefined ? '0' : output.slaveId.toString();
      if (!grouped[slaveId]) {
        grouped[slaveId] = [];
      }
      grouped[slaveId].push(output);
    });
    
    return grouped;
  }

  getInputsBySlaveId(): { [key: string]: any[] } {
    if (!this.controller?.io.inputs) return {};
    
    const grouped: { [key: string]: any[] } = {};
    
    // Используем фильтрацию findInputs (id <= 15)
    const inputs = this.findInputs(this.controller.io.inputs);
    
    inputs.forEach((input: any) => {
      const slaveId = input.slaveId === null || input.slaveId === undefined ? '0' : input.slaveId.toString();
      if (!grouped[slaveId]) {
        grouped[slaveId] = [];
      }
      grouped[slaveId].push(input);
    });
    
    return grouped;
  }

  ngOnInit() {
    const mac = this.route.snapshot.paramMap.get('mac');
    if (mac) {
      this.loadController(mac);
      this.navigationSubscription = this.router.events.subscribe(event => {
        if (event instanceof NavigationEnd) {
          this.loadController(mac);
        }
      });
    }
  }

  private loadController(mac: string) {
    this.dataService.getControllerByMacWithFetch(mac).subscribe((controller) => {
      this.controller = controller;
      if (this.controller?.io.outputs) {
        this.controller.io.outputs.sort((a: any, b: any) => {
          if (a.slaveId !== b.slaveId) {
            return a.slaveId - b.slaveId;
          }
          return a.id - b.id;
        });
      }
      this.setupWebSocketSubscription();
    });
  }

  private setupWebSocketSubscription() {
    // Unsubscribe from previous subscription if exists
    if (this.websocketSubscription) {
      this.websocketSubscription.unsubscribe();
    }

    // Subscribe to WebSocket messages to update controller info
    this.websocketSubscription = this.websocketService.messages$.pipe(
      filter((message: any) =>
        (message.type === 'INFO' && message.payload?.mac === this.controller?.mac) ||
        (message.type === 'LOG') || (message.type === 'SUCCESS')
      )
    ).subscribe((message: any) => {
      console.log('Controller-details ', message);
      if (message.type === 'INFO' && this.controller && message.payload) {
        // Update controller info with new data
        this.controller = {
          ...this.controller,
          ...message.payload
        };
        console.log('Controller info updated:', message.payload);
      }
      if (message.type === 'LOG' && message.payload) {
        const newLines = Array.isArray(message.payload)
          ? "test"//message.payload
          : String(message.payload.replace('\n', '') ).split('\n');
        this.logs = [...this.logs, ...newLines];
      }
      if (message.type === 'SUCCESS') {
        if (this.showUploadConfirm)
          this.showUploadConfirm = false;        
      }
    });
  }

  ngOnDestroy() {
    if (this.websocketSubscription) {
      this.websocketSubscription.unsubscribe();
    }
    if (this.navigationSubscription) {
      this.navigationSubscription.unsubscribe();
    }
  }

  confirmUpload() {
    this.toggleSubject.next('UPLOADCONFIG');
  }

  showInfo(): void {
    this.showInfoPopup = true;
    this.toggleSubject.next('INFO');
  }
/*
  onEditOutput(output: any) {
    this.router.navigate(['/output-edit'], { 
      state: { output } 
    });
  }
*/
  showService() {
    this.showServicePopup = true;    
  }

  reboot() {
    this.toggleSubject.next('REBOOT');
  }

  showLogs() {
    this.showLogsPanel = true;    
  }
  
  enableSendLogs() {
    this.toggleSubject.next('ENABLESENDLOGS');
  }

  disableSendLogs() {
    this.toggleSubject.next('DISABLESENDLOGS');
  }

  startOTA() {
    this.toggleSubject.next('STARTOTA');
  }

  get logsText(): string {
    return Array.isArray(this.logs) ? this.logs.join('\n') : String(this.logs);
  }
  
  toggleActionsMenu(event: Event) {
    event.stopPropagation();
    this.actionsMenuOpen = !this.actionsMenuOpen;
  }

  onMenuInfo() {
    this.actionsMenuOpen = false;
    this.showInfo();
  }

  onMenuReboot() {
    this.actionsMenuOpen = false;
    this.showRebootConfirm = true;
  }

  onMenuUpdate() {
    this.actionsMenuOpen = false;
    this.showUpdateConfirm = true;
  }

  onMenuLogs() {
    this.actionsMenuOpen = false;
    this.showLogs();
  }

  confirmReboot() {
    this.showRebootConfirm = false;
    this.reboot();
  }

  confirmUpdate() {
    this.showUpdateConfirm = false;
    this.startOTA();
  }

  cancelDialog() {
    this.showRebootConfirm = false;
    this.showUpdateConfirm = false;
    this.showUploadConfirm = false;
  }
}
