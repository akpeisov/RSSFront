import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import {OutputCardComponent} from "../output-card/output-card.component";
import {InputCardComponent} from "../input-card/input-card.component";
import {NgFor, NgClass, NgIf, KeyValuePipe, DatePipe} from "@angular/common";
import {FormsModule} from "@angular/forms";
import {ButtonCardComponent} from "../button-card/button-card.component";
import {debounceTime, Subject, Subscription} from "rxjs";
import {WebsocketService} from "../../services/websocket.service";
import {filter} from "rxjs/operators";
import { AnsiColorPipe } from '../shared/ansi-color/ansi-color.pipe';
import { RouterModule } from '@angular/router';
import { IUpdateIOMsg } from '../../model/update-io-msg';

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
    RouterModule,
    DatePipe
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
  showDeleteConfirm = false;
  private toggleSubject = new Subject<any>();
  private websocketSubscription: Subscription | null = null;
  public formError: string = '';
  outputsBySlaveGroups: { [key: string]: any[] } = {};

  constructor(private route: ActivatedRoute,
              private router: Router,
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
    // Restore active tab if navigation state provided (e.g., returning from edit)
    const navState: any = (window && (window.history && (window.history.state))) || {};
    if (navState && navState.activeTab) {
      this.activeTab = navState.activeTab;
      this.previousTab = navState.activeTab;
    }
    if (mac) {
      this.loadController(mac);
      this.setupWebSocketSubscription();
      this.navigationSubscription = this.router.events.subscribe(event => {
        if (event instanceof NavigationEnd) {
          this.loadController(mac);
        }
      });
    }    
  }

  private loadController(mac: string) {
    this.websocketService.getUserDevices().subscribe((devices) => {
      if (devices != null) {
        this.controller = devices.find((ctrl: { mac: string; }) => ctrl.mac === mac);        
        if (this.controller) {
          this.buildOutputsBySlaveId();
          if (this.controller?.io.outputs) {
            this.controller.io.outputs.sort((a: any, b: any) => {
              if (a.slaveId !== b.slaveId) {
                return a.slaveId - b.slaveId;
              }
              return a.id - b.id;
            });
          }
        }
      }
    });
  }

  private setupWebSocketSubscription() {
    // Unsubscribe from previous subscription if exists
    if (this.websocketSubscription) {
      this.websocketSubscription.unsubscribe();
    }

    this.websocketService.updateIO$.subscribe((update) => {
      console.log('cd update', update);
      if (this.controller == null || update == null)
        return;
      if (update.mac === this.controller.mac) {
        // io state changed
        this.updateControllerIO(update);
      }
    })

    // Subscribe to WebSocket messages to update controller info
    this.websocketSubscription = this.websocketService.messages$.pipe(
      filter((message: any) =>
        (message.type === 'INFO' && message.payload?.mac === this.controller?.mac) ||
        (message.type === 'LOG') || (message.type === 'SUCCESS') || (message.type === 'STATUS')
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
      } else if (message.type === 'LOG' && message.payload) {
        const newLines = Array.isArray(message.payload)
          ? "test"//message.payload
          : String(message.payload.replace('\n', '') ).split('\n');
        this.logs = [...this.logs, ...newLines];
      } else if (message.type === 'SUCCESS') {
        if (this.showUploadConfirm)
          this.showUploadConfirm = false;        
      } else if (message.type === 'STATUS') {        
        const mac = message?.payload?.mac;
        const status = message?.payload?.status;        
        if (mac == this.controller?.mac)
          this.controller.status = status;
          if (status === "offline") {
            this.controller.lastSeen = new Date();
          }
      }
    });
  }

  private updateControllerIO(data: IUpdateIOMsg | any): void {
    // If bulk arrays provided
    if (Array.isArray(data.outputs)) {
      // Update outputs
      if (Array.isArray(data.outputs) && this.controller.io && Array.isArray(this.controller.io.outputs)) {
        data.outputs.forEach((out: any) => {
          const o = this.controller.io.outputs.find((outputItem: any) => outputItem.id === out.id && (outputItem.slaveId ?? 0) === (out.slaveId ?? 0));
          if (o) {
            o.state = out.state;
            //if (out.timer !== undefined) 
            o.timer = out.timer;
          }
        });
      }
    }

    if (Array.isArray(data.inputs)) {
      // Update inputs
      if (Array.isArray(data.inputs) && this.controller.io && Array.isArray(this.controller.io.inputs)) {
        data.inputs.forEach((inp: any) => {
          const i = this.controller.io.inputs.find((inputItem: any) => inputItem.id === inp.id && (inputItem.slaveId ?? 0) === (inp.slaveId ?? 0));
          if (i) {
            i.state = inp.state;
          } 
        });
      }
    } else {
      // Backwards-compatible single update
      const output = this.controller.io.outputs.find((outputItem: any) => outputItem.id === data.output && (outputItem.slaveId ?? 0) === (data.slaveId ?? 0));
      const input = this.controller.io.inputs.find((inputItem: any) => inputItem.id === data.input && (inputItem.slaveId ?? 0) === (data.slaveId ?? 0));
      if (output) {
        output.state = data.state;
        if (data.timer !== undefined) output.timer = data.timer;
      } else if (input) {
        input.state = data.state;
      } else {
        console.log(`Output or input not found: MAC=${data.mac}, Output=${data.output}, Input=${data.input}, SlaveId=${data.slaveId}`);
      }
    }
  }

  ngOnDestroy() {
    console.log('cd destroy');
    if (this.websocketSubscription) {
      this.websocketSubscription.unsubscribe();
    }
    if (this.navigationSubscription) {
      this.navigationSubscription.unsubscribe();
    }
  }

  confirmUpload() {
    this.toggleSubject.next('UPLOADCONFIG');
    this.cancelDialog();
  }

  confirmDelete() {
    this.toggleSubject.next('DELETE');
    this.cancelDialog();
  }

  showInfo(): void {
    this.showInfoPopup = true;
    this.toggleSubject.next('INFO');
  }

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
    this.showDeleteConfirm = false;
  }

  onMenuDelete() {
    this.actionsMenuOpen = false;
    this.showDeleteConfirm = true;
  }

  private buildOutputsBySlaveId() {
    const map: { [k: string]: any[] } = {};
    const outputs = this.controller?.io?.outputs ?? [];
    for (const o of outputs) {
      const sid = String(o.slaveId ?? 0);
      if (!map[sid]) map[sid] = [];
      map[sid].push(o);
    }
    this.outputsBySlaveGroups = map;
  }

  trackByOutput(index: number, item: any) {
    return (item?.uuid ?? item?.id ?? index) + '_' + item.state + "_" + item.timer;
  }

  trackByGroupKey(index: number, item: { key: string, value: any[] }) {
    return item?.key ?? index;
  }
}
