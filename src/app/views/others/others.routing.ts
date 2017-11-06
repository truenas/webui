import { Routes } from '@angular/router';
import { AppBlankComponent } from './app-blank/app-blank.component';
import { RebootComponent } from './reboot/reboot.component';

export const OthersRoutes: Routes = [
  {
    path: '',
    component: RebootComponent
  }
];