import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import {AppRoutingModule, routes} from './app.routes';
import {HttpClientModule} from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { ControllerListComponent } from './components/controller-list/controller-list.component';
import { ControllerDetailsComponent } from './components/controller-details/controller-details.component';
import { ControllerCardComponent } from './components/controller-card/controller-card.component';
import { OutputCardComponent } from './components/output-card/output-card.component';
import { InputCardComponent } from './components/input-card/input-card.component';

@NgModule({
  declarations: [
    AppComponent,
    ControllerListComponent,
    ControllerDetailsComponent,
    ControllerCardComponent,
    OutputCardComponent,
    InputCardComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    //RouterModule.forRoot(routes)
  ],
  providers: [
    // MyKeycloakService
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
