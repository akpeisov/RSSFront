import { Component, Input } from '@angular/core';
import {RouterLink} from "@angular/router";

@Component({
  selector: 'app-controller-card',
  templateUrl: './controller-card.component.html',
  styleUrls: ['./controller-card.component.scss'],
  standalone: true,
  imports: [
    RouterLink
  ]
})
export class ControllerCardComponent {
  @Input() controller: any;
}
