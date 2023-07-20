import { Routes } from '@angular/router';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { ConfigResetComponent } from './config-reset/config-reset.component';
import { FailoverComponent } from './failover/failover.component';
import { RebootComponent } from './reboot/reboot.component';
import { ShutdownComponent } from './shutdown/shutdown.component';

export const othersRoutes: Routes = [
  {
    path: '',
    children: [{
      path: 'reboot',
      component: RebootComponent,
      data: { title: T('Reboot'), breadcrumb: T('Reboot') },
    }, {
      path: 'shutdown',
      component: ShutdownComponent,
      data: { title: T('Shutdown'), breadcrumb: T('Shutdown') },
    }, {
      path: 'failover',
      component: FailoverComponent,
      data: { title: T('Failover'), breadcrumb: T('Failover') },
    },
    {
      path: 'config-reset',
      component: ConfigResetComponent,
      data: { title: T('Config-Reset'), breadcrumb: T('Config-Reset') },
    }],
  },
];
