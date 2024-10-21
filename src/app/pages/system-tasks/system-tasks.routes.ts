import { Routes } from '@angular/router';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { ConfigResetComponent } from 'app/pages/system-tasks/config-reset/config-reset.component';
import { FailoverComponent } from 'app/pages/system-tasks/failover/failover.component';
import { RestartComponent } from 'app/pages/system-tasks/restart/restart.component';
import { ShutdownComponent } from 'app/pages/system-tasks/shutdown/shutdown.component';

export const systemTasksRoutes: Routes = [
  {
    path: '',
    children: [{
      path: 'restart',
      component: RestartComponent,
      data: { title: T('Restart'), breadcrumb: T('Restart') },
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
