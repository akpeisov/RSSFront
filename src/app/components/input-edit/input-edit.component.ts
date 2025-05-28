import {Component, Input, OnInit} from '@angular/core';
import {ActivatedRoute, Data, Router} from '@angular/router';
import {FormsModule} from "@angular/forms";
import {DataService} from "../../services/data.service";
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
    private dataService: DataService,
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
      this.dataService.getInputByUuid(uuid).subscribe((input) => {
        this.input = input;
        this.controllerMac = input.mac;
        console.log('input-edit', this.input);
      });

      this.dataService.getOutputsByInputUuid(uuid).subscribe((outputs) => {
        this.outputs = outputs;
        console.log('outputs', this.outputs);
      });
    }
  }

  getActions(type: string): string[] {
    switch (type) {
      case 'SW':
        return ['on', 'off'];
      case 'INWSW':
      case 'BTN':
        return ['toggle'];
      default:
        return [];
    }
  }

  updateEvents(): void {
    // Обновление списка событий на основе типа входа
    const eventMap = {
      BTN: ['press', 'long press'],
      SW: ['on', 'off'],
      INVSW: ['toggle'],
    };

  }

  addAction(eventIndex: number): void {
    const actions = this.input.events[eventIndex].actions;
    const maxOrder = actions.reduce((max: number, action: any) => {
      return action.order > max ? action.order : max;
    }, -1);

    actions.push({
      outputID: null,
      action: 'toggle',
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
    console.log('Saving data:', this.input);
    this.toggleSubject.next({ payload: this.input });
    this.animationService.triggerLeaveAnimation();
    setTimeout(() => {
      if (this.controllerMac) {
        this.router.navigate(['/controller', this.controllerMac]);
      } else {
        this.location.back();
      }
    }, 150); // Half the animation duration for smoother transition
  }

  back(): void {
    this.animationService.triggerLeaveAnimation();
    setTimeout(() => {
      if (this.controllerMac) {
        this.router.navigate(['/controller', this.controllerMac]);
      } else {
        this.location.back();
      }
    }, 150); // Half the animation duration for smoother transition
  }
}
