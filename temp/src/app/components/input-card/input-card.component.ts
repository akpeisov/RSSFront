import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-input-card',
  templateUrl: './input-card.component.html',
  styleUrls: ['./input-card.component.scss'],
})
export class InputCardComponent {
  @Input() input: any;
}
