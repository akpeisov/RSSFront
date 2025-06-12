import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ControllerListComponent } from './components/controller-list/controller-list.component';
import { ControllerDetailsComponent } from './components/controller-details/controller-details.component';
import { InputEditComponent } from "./components/input-edit/input-edit.component";
import { LinkControllerComponent } from "./components/link-controller/link-controller.component";
import { OutputEditComponent } from "./components/output-edit/output-edit.component";

export const routes: Routes = [
  { path: '', component: ControllerListComponent },
  //{ path: 'controller/:id', component: ControllerDetailsComponent },
  { path: 'controller/:mac', component: ControllerDetailsComponent },
  { path: 'input-edit/:uuid', component: InputEditComponent },
  { path: 'linkcontroller/:mac', component: LinkControllerComponent },
  { path: 'output-edit', component: OutputEditComponent },
];



// @NgModule({
//   imports: [RouterModule.forRoot(routes)],
//   exports: [RouterModule],
// })
// export class AppRoutingModule {}
