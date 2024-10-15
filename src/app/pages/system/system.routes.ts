import { Routes } from '@angular/router';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { ServicesComponent } from 'app/pages/services/services.component';
import { ShellComponent } from 'app/pages/shell/shell.component';
import {
  InitShutdownListComponent,
} from 'app/pages/system/advanced/init-shutdown/init-shutdown-list/init-shutdown-list.component';
import { AlertServiceListComponent } from 'app/pages/system/alert-service/alert-service-list/alert-service-list.component';
import { AlertSettingsComponent } from 'app/pages/system/alert-settings/alert-settings.component';
import { FailoverSettingsComponent } from 'app/pages/system/failover-settings/failover-settings.component';
import { GeneralSettingsComponent } from 'app/pages/system/general-settings/general-settings.component';
import { SupportCardComponent } from 'app/pages/system/general-settings/support/support-card/support-card.component';
import { ManualUpdateFormComponent } from 'app/pages/system/update/components/manual-update-form/manual-update-form.component';
import { AdvancedSettingsComponent } from './advanced/advanced-settings.component';
import { CronListComponent } from './advanced/cron/cron-list/cron-list.component';
import { TunableListComponent } from './advanced/sysctl/tunable-list/tunable-list.component';
import { BootEnvironmentListComponent } from './bootenv/bootenv-list/bootenv-list.component';
import { BootStatusListComponent } from './bootenv/bootenv-status/bootenv-status.component';
import { EulaComponent } from './general-settings/support/eula/eula.component';
import { UpdateComponent } from './update/update.component';

export const systemRoutes: Routes = [
  {
    path: '',
    data: { title: T('System') },
    children: [{
      path: '',
      pathMatch: 'full',
      redirectTo: 'general',
    }, {
      path: 'general',
      data: { title: T('General Settings'), breadcrumb: null },
      children: [{
        path: '',
        component: GeneralSettingsComponent,
        data: { title: T('General Settings'), breadcrumb: null },
      }],
    }, {
      path: 'advanced',
      component: AdvancedSettingsComponent,
      data: { title: T('Advanced Settings'), breadcrumb: null },
    }, {
      path: 'viewenclosure',
      data: {
        title: T('View Enclosure'),
        breadcrumb: null,
      },
      loadChildren: () => import('./enclosure/enclosure.routes').then((module) => module.enclosureRoutes),
    }, {
      path: 'boot',
      data: { title: T('Boot'), breadcrumb: T('Boot') },
      children: [{
        path: '',
        component: BootEnvironmentListComponent,
        data: { title: T('Boot Environments'), breadcrumb: null },
      }, {
        path: 'status',
        component: BootStatusListComponent,
        data: { title: T('Boot Pool Status'), breadcrumb: null },
      },
      ],
    }, {
      path: 'tunable',
      data: { title: T('Tunables'), breadcrumb: null },
      children: [{
        path: '',
        component: TunableListComponent,
        data: { title: T('Tunables'), breadcrumb: null },
      }],
    }, {
      path: 'sysctl',
      data: { title: T('Sysctl'), breadcrumb: null },
      children: [{
        path: '',
        component: TunableListComponent,
        data: { title: T('Sysctl'), breadcrumb: null },
      }],
    },
    {
      path: 'update',
      data: { title: T('Update'), breadcrumb: T('Update') },
      children: [
        {
          path: '',
          component: UpdateComponent,
          data: { title: T('Update'), breadcrumb: null },
        }, {
          path: 'manualupdate',
          data: { title: T('Manual Update'), breadcrumb: null },
          children: [
            {
              path: '',
              component: ManualUpdateFormComponent,
              data: { title: T('Manual Update'), breadcrumb: null },
            },
          ],
        },
      ],
    }, {
      path: 'alert-settings',
      data: { title: T('Alert Settings'), breadcrumb: T('Alert Settings') },
      children: [
        {
          path: 'services',
          data: { title: T('Alert Services'), breadcrumb: null },
          component: AlertServiceListComponent,
        },
        {
          path: '',
          data: { title: T('Alert Settings'), breadcrumb: null },
          component: AlertSettingsComponent,
        },
      ],
    }, {
      path: 'failover',
      component: FailoverSettingsComponent,
      data: { title: T('Failover'), breadcrumb: null },
    }, {
      path: 'support',
      data: { title: T('Support'), breadcrumb: T('Support') },
      children: [
        {
          path: '',
          component: SupportCardComponent,
          data: { title: T('Support'), breadcrumb: null },
        }, {
          path: 'eula',
          component: EulaComponent,
          data: { title: T('EULA'), breadcrumb: null },
        },
      ],
    }, {
      path: 'services',
      component: ServicesComponent,
      data: { title: T('Services'), breadcrumb: null },
    }, {
      path: 'shell',
      component: ShellComponent,
      data: { title: T('Shell'), breadcrumb: null },
    }, {
      path: 'cron',
      data: { title: T('Cron Jobs'), breadcrumb: null },
      component: CronListComponent,
    }, {
      path: 'initshutdown',
      data: { title: T('Init/Shutdown Scripts'), breadcrumb: null },
      component: InitShutdownListComponent,
    }],
  },
];
