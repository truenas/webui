import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
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
import { JbofListComponent as OldJbofListComponent } from 'app/pages/system/old-view-enclosure/components/jbof-list/jbof-list.component';
import { ViewEnclosureComponent } from 'app/pages/system/old-view-enclosure/components/view-enclosure/view-enclosure.component';
import { ManualUpdateFormComponent } from 'app/pages/system/update/components/manual-update-form/manual-update-form.component';
import { AdvancedSettingsComponent } from './advanced/advanced-settings.component';
import { CronListComponent } from './advanced/cron/cron-list/cron-list.component';
import { TunableListComponent } from './advanced/sysctl/tunable-list/tunable-list.component';
import { BootEnvironmentListComponent } from './bootenv/bootenv-list/bootenv-list.component';
import { BootStatusListComponent } from './bootenv/bootenv-status/bootenv-status.component';
import { EulaComponent } from './general-settings/support/eula/eula.component';
import { UpdateComponent } from './update/update.component';

const routes: Routes = [
  {
    path: '',
    data: { title: T('System') },
    children: [{
      path: '',
      pathMatch: 'full',
      redirectTo: 'general',
    }, {
      path: 'general',
      data: { title: T('General Settings'), breadcrumb: null, icon: 'build' },
      children: [{
        path: '',
        component: GeneralSettingsComponent,
        data: { title: T('General Settings'), breadcrumb: null },
      }],
    }, {
      path: 'advanced',
      component: AdvancedSettingsComponent,
      data: { title: T('Advanced Settings'), breadcrumb: null, icon: 'settings' },
    }, {
      path: 'viewenclosure',
      data: {
        title: T('View Enclosure'),
        breadcrumb: null,
        icon: 'settings',
      },
      loadChildren: () => import('./enclosure/enclosure.module').then((module) => module.EnclosureModule),
    }, {
      path: 'oldviewenclosure',
      data: { title: T('View Enclosure'), breadcrumb: T('View Enclosure'), icon: 'settings' },
      children: [
        {
          path: '',
          component: ViewEnclosureComponent,
          data: { title: T('View Enclosure'), breadcrumb: null },
        },
        {
          path: 'jbof',
          component: OldJbofListComponent,
          data: { title: T('NVMe-oF Expansion Shelves'), breadcrumb: null },
        },
      ],
    }, {
      path: 'boot',
      data: { title: T('Boot'), breadcrumb: T('Boot'), icon: 'replay' },
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
      data: { title: T('Tunables'), breadcrumb: null, icon: 'settings_overscan' },
      children: [{
        path: '',
        component: TunableListComponent,
        data: { title: T('Tunables'), breadcrumb: null },
      }],
    }, {
      path: 'sysctl',
      data: { title: T('Sysctl'), breadcrumb: null, icon: 'settings_overscan' },
      children: [{
        path: '',
        component: TunableListComponent,
        data: { title: T('Sysctl'), breadcrumb: null },
      }],
    },
    {
      path: 'update',
      data: { title: T('Update'), breadcrumb: T('Update'), icon: 'update' },
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
      data: { title: T('Alert Settings'), breadcrumb: T('Alert Settings'), icon: 'notifications_active' },
      children: [
        {
          path: 'services',
          data: { title: T('Alert Services'), breadcrumb: null, icon: 'notifications_active' },
          component: AlertServiceListComponent,
        },
        {
          path: '',
          data: { title: T('Alert Settings'), breadcrumb: null, icon: 'notifications_active' },
          component: AlertSettingsComponent,
        },
      ],
    }, {
      path: 'failover',
      component: FailoverSettingsComponent,
      data: { title: T('Failover'), breadcrumb: null, icon: 'device_hub' },
    }, {
      path: 'support',
      data: { title: T('Support'), breadcrumb: T('Support'), icon: 'perm_phone_msg' },
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
      data: { title: T('Cron Jobs'), breadcrumb: null, icon: 'event_note' },
      component: CronListComponent,
    }, {
      path: 'initshutdown',
      data: { title: T('Init/Shutdown Scripts'), breadcrumb: null, icon: 'event_note' },
      component: InitShutdownListComponent,
    }],
  },
];
export const routing: ModuleWithProviders<RouterModule> = RouterModule.forChild(routes);
