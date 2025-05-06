import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-input-card',
  templateUrl: './input-card.component.html',
  styleUrls: ['./input-card.component.scss'],
  standalone: true
})
export class InputCardComponent {
  @Input() input: any;
}
