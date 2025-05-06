import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-output-card',
  templateUrl: './output-card.component.html',
  styleUrls: ['./output-card.component.scss'],
  // standalone: true
})
export class OutputCardComponent {
  @Input() output: any;
}
