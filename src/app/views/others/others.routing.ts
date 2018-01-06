import { Routes } from '@angular/router';
import { AppBlankComponent } from './app-blank/app-blank.component';
import { RebootComponent } from './reboot/reboot.component';
import { ShutdownComponent } from './shutdown/shutdown.component';

export const OthersRoutes: Routes = [
  {
    path: '',
    children: [{
      path: 'reboot',
      component: RebootComponent,
      data: { title: 'Reboot', breadcrumb: 'Reboot' }
    }, {
      path: 'shutdown',
      component: ShutdownComponent,
      data: { title: 'Shutdown', breadcrumb: 'Shutdown' }
    }]
  }
];