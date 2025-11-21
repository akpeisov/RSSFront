import { Component, Input } from '@angular/core';
import { RouterLink } from "@angular/router";
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

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
  adminRole: boolean = false;
  userProfile: any;

  constructor(private auth: AuthService) {}

  ngOnInit() {
    this.auth.isAdmin$.subscribe((data) => {      
      this.adminRole = data;
    });
    this.auth.getUserProfile$.subscribe((data) => {      
      this.userProfile = data;
    });

  }
}
