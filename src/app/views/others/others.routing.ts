import { Routes } from '@angular/router';
import { AppBlankComponent } from './app-blank/app-blank.component';
import { FailoverComponent } from './failover/failover.component';
import { RebootComponent } from './reboot/reboot.component';
import { ShutdownComponent } from './shutdown/shutdown.component';
import { ConfigResetComponent } from './config-reset/config-reset.component';

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
    }, {
      path: 'failover',
      component: FailoverComponent,
      data: { title: 'Failover', breadcrumb: 'Failover' }
    },
    {
      path: 'config-reset',
      component: ConfigResetComponent,
      data: { title: 'Config-Reset', breadcrumb: 'Config-Reset' }
    }]
  }
];