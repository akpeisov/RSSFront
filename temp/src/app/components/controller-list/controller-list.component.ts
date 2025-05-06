import { Component, OnInit } from '@angular/core';
import {DataService} from "../../services/data.service";
import {Router} from "@angular/router";


@Component({
  selector: 'app-controller-list',
  templateUrl: './controller-list.component.html',
  styleUrls: ['./controller-list.component.scss'],
  // standalone: true
})
export class ControllerListComponent implements OnInit {
  controllers: any[] = [];

  constructor(private dataService: DataService,
              private router: Router) {}

  ngOnInit() {
    this.dataService.getUserDevices().subscribe((data) => {
      this.controllers = data.controllers;
    });
  }

  goToDetails(mac: string) {
    this.router.navigate(['/controller', mac]);
  }

}
