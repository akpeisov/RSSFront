import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { MyKeycloakService } from './app/services/keycloak.service';
import {platformBrowserDynamic} from "@angular/platform-browser-dynamic";
import { AppModule } from './app/app.module';

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));

const keycloakService= new MyKeycloakService();

keycloakService.init().then(() => {
  platformBrowserDynamic()
    .bootstrapModule(AppModule)
    //.then((obj) => console.error(obj))
    .catch((err) => console.error(err));
});
