import { Component, Input } from '@angular/core';
import {Router} from "@angular/router";

@Component({
  selector: 'app-input-card',
  templateUrl: './input-card.component.html',
  styleUrls: ['./input-card.component.scss'],
  standalone: true
})
export class InputCardComponent {
  @Input() input: any;
  @Input() mac: any;

  constructor(private router: Router) { }

  onEdit(): void {
    // Переход на экран редактирования с передачей input через state
    //console.log(this.input)
    // this.router.navigate(['/input-edit'], {
    //   state: { input: this.input },
    // });
    //this.input.mac = this.mac
    //console.log('icard mac', this.mac)
    this.router.navigate(['/input-edit', this.input.uuid]);

    //this.router.navigate(['/controller', mac]);
  }

}
