import { Component, Input } from '@angular/core';
import { RouterLink } from "@angular/router";
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-controller-card',
  templateUrl: './controller-card.component.html',
  styleUrls: ['./controller-card.component.scss'],
  standalone: true,
  imports: [
    RouterLink,
    CommonModule
  ]
})
export class ControllerCardComponent {
  @Input() controller: any;
}
