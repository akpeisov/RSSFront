import { Component, OnInit } from '@angular/core';
import {DataService} from "../../services/data.service";
import {Router} from "@angular/router";
import {ControllerCardComponent} from "../controller-card/controller-card.component";
import {HttpClientModule} from "@angular/common/http";
import {NgFor, NgIf} from "@angular/common";
import {FormsModule} from "@angular/forms";

@Component({
  selector: 'app-controller-list',
  templateUrl: './controller-list.component.html',
  styleUrls: ['./controller-list.component.scss'],
  standalone: true,
  imports: [ControllerCardComponent,
    HttpClientModule,
    NgFor, NgIf
  ]
})
export class ControllerListComponent implements OnInit {
  controllers: any[] = [];

  constructor(private dataService: DataService,
              private router: Router) {}

  ngOnInit() {
    console.log('controller-list component init')
    this.dataService.getUserDevices().subscribe((data) => {
      this.controllers = data;
      console.log(this.controllers)
    });
  }

  goToDetails(mac: string) {
    this.router.navigate(['/controller', mac]);
  }

}
