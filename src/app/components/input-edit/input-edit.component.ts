import {Component, Input, OnInit} from '@angular/core';
import {ActivatedRoute, Data, Router} from '@angular/router';
import {FormsModule} from "@angular/forms";
import {NgForOf, NgIf} from "@angular/common";
import {debounceTime, Subject} from "rxjs";
import {WebsocketService} from "../../services/websocket.service";
import { Location } from '@angular/common';
import { AnimationService } from '../../services/animation.service';

@Component({
  selector: 'app-input-edit',
  templateUrl: './input-edit.component.html',
  styleUrls: ['./input-edit.component.scss'],
  standalone: true,
  imports: [FormsModule, NgForOf, NgIf]
})

export class InputEditComponent implements OnInit {
  input: any;
  outputs: any[] = [];
  controllerMac: string | null = null;
  deletingAction: { eventIndex: number, actionIndex: number } | null = null;
  addingAction: { eventIndex: number, actionIndex: number } | null = null;
  swappingActions: { eventIndex: number, from: number, to: number, direction: 'up' | 'down' } | null = null;
  isBtn: boolean = false;

  private toggleSubject = new Subject<{ payload:any }>();

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private websocketService: WebsocketService,
    private location: Location,
    private animationService: AnimationService
  ) {
    this.toggleSubject.pipe(debounceTime(300)).subscribe(({ payload }) => {
      this.websocketService.sendMessage({
        type: 'UPDATEINPUT',
        payload: payload,
      });
    });
  }

  ngOnInit(): void {
    const uuid = this.route.snapshot.paramMap.get('uuid');
    if (uuid) {
      this.websocketService.getUserDevices().subscribe((devices) => {
        if (devices == null)
          return;
        // get input and outputs        
        for (const device of devices) {          
          if (device && device.io.inputs) {
            this.input = device.io.inputs.find((input: any) => input.uuid === uuid);                       
            if (this.input) {
              this.outputs = device.io.outputs;              
              break;
            }
          }
        }      
      });
    }    
  }

  updateEvents(): void {
    // Для INVSW: только toggle
    if (this.input.type === 'INVSW') {
      const toggleActions = this.input.events?.find((e: { event: string }) => e.event === 'toggle')?.actions || [];
      this.input.events = [{ event: 'toggle', actions: toggleActions }];
    } else if (this.input.type === 'SW') {
      // Для SW: on и off
      let onActions = this.input.events?.find((e: { event: string }) => e.event === 'on')?.actions || [];
      let offActions = this.input.events?.find((e: { event: string }) => e.event === 'off')?.actions || [];
      this.input.events = [
        { event: 'on', actions: onActions },
        { event: 'off', actions: offActions }
      ];
    } else if (this.input.type === 'BTN') {
      // Для BTN: toggle и longpress
      let toggleActions = this.input.events?.find((e: { event: string }) => e.event === 'toggle')?.actions || [];
      let longpressActions = this.input.events?.find((e: { event: string }) => e.event === 'longpress')?.actions || [];
      this.input.events = [
        { event: 'toggle', actions: toggleActions },
        { event: 'longpress', actions: longpressActions }
      ];
    }
  }
  
  addAction(eventIndex: number): void {
    const actions = this.input.events[eventIndex].actions;
    const maxOrder = actions.reduce((max: number, action: any) => {
      return action.order > max ? action.order : max;
    }, -1);

    // Set default action based on input type and event
    let defaultAction = 'toggle';
    if (this.input.type === 'SW') {
      defaultAction = this.input.events[eventIndex].event === 'on' ? 'on' : 'off';
    }

    actions.push({
      outputID: null,
      action: defaultAction,
      duration: 0,
      slaveId: 0,
      output: 0,
      order: maxOrder + 1
    });

    // Set the adding animation state
    this.addingAction = { eventIndex, actionIndex: actions.length - 1 };
    setTimeout(() => {
      this.addingAction = null;
    }, 300); // Match this with the CSS animation duration
  }

  onOutputChange(action: any): void {
    const selectedOutput = this.outputs.find(o => o.outputID === action.outputID);
    action.output = selectedOutput?.id || null;
    action.slaveId = selectedOutput?.slaveId || 0;
  }

  removeAction(eventIndex: number, actionIndex: number): void {
    this.deletingAction = { eventIndex, actionIndex };
    setTimeout(() => {
      this.input.events[eventIndex].actions.splice(actionIndex, 1);
      this.deletingAction = null;
    }, 300); // Match this with the CSS animation duration
  }

  isDeleting(eventIndex: number, actionIndex: number): boolean {
    return this.deletingAction?.eventIndex === eventIndex && 
           this.deletingAction?.actionIndex === actionIndex;
  }

  isAdding(eventIndex: number, actionIndex: number): boolean {
    return this.addingAction?.eventIndex === eventIndex && 
           this.addingAction?.actionIndex === actionIndex;
  }

  moveActionUp(eventIndex: number, actionIndex: number): void {
    const actions = this.input.events[eventIndex].actions;
    if (actionIndex > 0) {
      this.swappingActions = { eventIndex, from: actionIndex, to: actionIndex - 1, direction: 'up' };
      setTimeout(() => {
        // Swap orders
        const currentOrder = actions[actionIndex].order;
        actions[actionIndex].order = actions[actionIndex - 1].order;
        actions[actionIndex - 1].order = currentOrder;
        // Swap positions in array
        [actions[actionIndex], actions[actionIndex - 1]] = [actions[actionIndex - 1], actions[actionIndex]];
        this.swappingActions = null;
      }, 300); // 10x slower
    }
  }

  moveActionDown(eventIndex: number, actionIndex: number): void {
    const actions = this.input.events[eventIndex].actions;
    if (actionIndex < actions.length - 1) {
      this.swappingActions = { eventIndex, from: actionIndex, to: actionIndex + 1, direction: 'down' };
      setTimeout(() => {
        // Swap orders
        const currentOrder = actions[actionIndex].order;
        actions[actionIndex].order = actions[actionIndex + 1].order;
        actions[actionIndex + 1].order = currentOrder;
        // Swap positions in array
        [actions[actionIndex], actions[actionIndex + 1]] = [actions[actionIndex + 1], actions[actionIndex]];
        this.swappingActions = null;
      }, 300); // 10x slower
    }
  }

  getSwapDirection(eventIndex: number, actionIndex: number): string | null {
    if (!this.swappingActions || this.swappingActions.eventIndex !== eventIndex) return null;
    if (this.swappingActions.from === actionIndex) return this.swappingActions.direction;
    if (this.swappingActions.to === actionIndex) return this.swappingActions.direction === 'up' ? 'down' : 'up';
    return null;
  }

  isSwapping(eventIndex: number, actionIndex: number): boolean {
    return !!(this.swappingActions && this.swappingActions.eventIndex === eventIndex &&
      (this.swappingActions.from === actionIndex || this.swappingActions.to === actionIndex));
  }

  canMoveUp(eventIndex: number, actionIndex: number): boolean {
    return actionIndex > 0;
  }

  canMoveDown(eventIndex: number, actionIndex: number): boolean {
    return actionIndex < this.input.events[eventIndex].actions.length - 1;
  }

  save(): void {
    console.log('Saving input:', this.input);
    this.toggleSubject.next({ payload: this.input });
    this.back();
  }

  back(): void {
    this.animationService.triggerLeaveAnimation();
    setTimeout(() => {
      const fromTab = (window.history && (window.history.state as any)?.fromTab) ? (window.history.state as any).fromTab : undefined;
      const mac = this.controllerMac || (window.history && (window.history.state as any)?.controllerMac);
      if (mac) {
        if (fromTab) {          
          this.router.navigate(['/controller', mac], { state: { activeTab: fromTab } });
        } else {
          this.router.navigate(['/controller', mac]);
        }
      } else {
        this.location.back();
      }
    }, 150); // Half the animation duration for smoother transition
  }
}
