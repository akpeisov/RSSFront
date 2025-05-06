import {Component, Input, OnInit} from '@angular/core';
import {ActivatedRoute, Data, Router} from '@angular/router';
import {FormsModule} from "@angular/forms";
import {DataService} from "../../services/data.service";
import {NgForOf, NgIf} from "@angular/common";
import {debounceTime, Subject} from "rxjs";
import {WebsocketService} from "../../services/websocket.service";

@Component({
  selector: 'app-input-edit',
  templateUrl: './input-edit.component.html',
  styleUrls: ['./input-edit.component.scss'],
  imports: [
    FormsModule,
    NgForOf,
    NgIf
  ],
  standalone: true
})

export class InputEditComponent implements OnInit {
  input: any;
  outputs: any[] = [];

  private toggleSubject= new Subject<{ payload:any }>();

  constructor(private router: Router, private route: ActivatedRoute, private dataService: DataService,
              private websocketService: WebsocketService) {
    this.toggleSubject.pipe(debounceTime(300)).subscribe(({ payload }) => {
      this.websocketService.sendMessage({
        type: 'UPDATEINPUT',
        payload: payload,
      });
    });
  }

  ngOnInit(): void {
    const uuid = this.route.snapshot.paramMap.get('uuid');
    console.log('uuid', uuid)
    if (uuid) {
      this.dataService.getInputByUuid(uuid).subscribe((input) => {
        this.input = input;
        console.log('input-edit', this.input)
      });

      this.dataService.getOutputsByInputUuid(uuid).subscribe((outputs) => {
        this.outputs = outputs;
        console.log('outputs', this.outputs)
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
    // Добавление нового действия в событие
    const actions = this.input.events[eventIndex].actions;

    // Найти максимальное значение order среди текущих действий
    const maxOrder = actions.reduce((max: number, action: any) => {
      return action.order > max ? action.order : max;
    }, -1); // -1 чтобы первый элемент получил order = 0

    actions.push({
      outputID: null,
      action: 'toggle',
      duration: 0,
      slaveId: 0,
      output: 0,
      order: maxOrder + 1
    });
  }

  onOutputChange(action: any): void {
    const selectedOutput = this.outputs.find(o => o.outputID === action.outputID);
    action.output = selectedOutput?.id || null;
  }

  removeAction(eventIndex: number, actionIndex: number): void {
    // Удаление действия из события
    this.input.events[eventIndex].actions.splice(actionIndex, 1);
  }

  save(): void {
    console.log('Сохранение данных:', this.input);
    // Сохранение данных через сервис
    //this.input.mac = this.mac
    this.toggleSubject.next( {payload: this.input });
    //this.router.navigate(['/controller-details']); // Возврат на предыдущую страницу
  }

  back(): void {
    this.router.navigate(['/controller-details']); // Возврат на предыдущую страницу
  }
}
