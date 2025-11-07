import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ControllerListComponent } from './components/controller-list/controller-list.component';
import { ControllerDetailsComponent } from './components/controller-details/controller-details.component';
import { InputEditComponent } from "./components/input-edit/input-edit.component";
import { LinkControllerComponent } from "./components/link-controller/link-controller.component";
import { OutputEditComponent } from "./components/output-edit/output-edit.component";
import { SettingsComponent } from './components/settings/settings.component';

export const routes: Routes = [
  { path: '', component: ControllerListComponent },
  //{ path: 'controller/:id', component: ControllerDetailsComponent },
  { path: 'controller/:mac', component: ControllerDetailsComponent },
  { path: 'controller/:mac/settings', component: SettingsComponent },
  { path: 'input-edit/:uuid', component: InputEditComponent },  
  { path: 'output-edit/:uuid', component: OutputEditComponent },
  { path: 'linkcontroller/:mac', component: LinkControllerComponent },
];
