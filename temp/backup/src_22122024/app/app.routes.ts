import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ControllerListComponent } from './components/controller-list/controller-list.component';
import { ControllerDetailsComponent } from './components/controller-details/controller-details.component';

export const routes: Routes = [
  { path: '', component: ControllerListComponent },
  //{ path: 'controller/:id', component: ControllerDetailsComponent },
  { path: 'controller/:mac', component: ControllerDetailsComponent },
];

// @NgModule({
//   imports: [RouterModule.forRoot(routes)],
//   exports: [RouterModule],
// })
// export class AppRoutingModule {}
