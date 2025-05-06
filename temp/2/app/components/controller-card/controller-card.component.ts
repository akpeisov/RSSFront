import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-controller-card',
  templateUrl: './controller-card.component.html',
  styleUrls: ['./controller-card.component.scss'],
})
export class ControllerCardComponent {
  @Input() controller: any;
}
