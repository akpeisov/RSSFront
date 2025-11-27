import { Component, Input } from '@angular/core';
import { Router } from "@angular/router";

@Component({
  selector: 'app-input-card',
  templateUrl: './input-card.component.html',
  styleUrls: ['./input-card.component.scss'],
  standalone: true
})
export class InputCardComponent {
  @Input() input: any;
  @Input() mac: any;
  constructor(private router: Router) {}

  onEdit(): void {
    this.router.navigate(['/input-edit', this.input.uuid], { state: { fromTab: 'inputs', controllerMac: this.mac } });
  }
}
