import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { ServicesComponent } from 'app/pages/services/services.component';
import { ShellComponent } from 'app/pages/shell/shell.component';
import { AlertServiceListComponent } from 'app/pages/system/alert-service/alert-service-list/alert-service-list.component';
import { FailoverSettingsComponent } from 'app/pages/system/failover-settings/failover-settings.component';
import { GeneralSettingsComponent } from 'app/pages/system/general-settings/general-settings.component';
import { ManualUpdateFormComponent } from 'app/pages/system/update/manual-update-form/manual-update-form.component';
import { ViewEnclosureComponent } from 'app/pages/system/view-enclosure/components/view-enclosure/view-enclosure.component';
import { AdvancedSettingsComponent } from './advanced/advanced-settings.component';
import { CronListComponent } from './advanced/cron/cron-list/cron-list.component';
import { InitshutdownListComponent } from './advanced/initshutdown/initshutdown-list/initshutdown-list.component';
import { AlertConfigFormComponent } from './alert-config-form/alert-config-form.component';
import { BootEnvironmentListComponent } from './bootenv/bootenv-list/bootenv-list.component';
import { BootStatusListComponent } from './bootenv/bootenv-status/bootenv-status.component';
import { EmailComponent } from './email/email.component';
import { EulaComponent } from './general-settings/support/eula/eula.component';
import { SupportComponent } from './general-settings/support/support.component';
import { TunableListComponent } from './tunable/tunable-list/tunable-list.component';
import { TwoFactorComponent } from './two-factor/two-factor.component';
import { UpdateComponent } from './update/update.component';

export const routes: Routes = [
  {
    path: '',
    data: { title: T('System') },
    children: [{
      path: 'general',
      data: { title: T('General'), breadcrumb: T('General'), icon: 'build' },
      children: [{
        path: '',
        component: GeneralSettingsComponent,
        data: { title: T('General'), breadcrumb: T('General') },
      }],
    }, {
      path: 'advanced',
      component: AdvancedSettingsComponent,
      data: { title: T('Advanced'), breadcrumb: T('Advanced'), icon: 'settings' },
    }, {
      path: 'viewenclosure',
      component: ViewEnclosureComponent,
      data: { title: T('View Enclosure'), breadcrumb: T('View Enclosure'), icon: 'settings' },
    }, {
      path: 'boot',
      data: { title: T('Boot'), breadcrumb: T('Boot'), icon: 'replay' },
      children: [{
        path: '',
        component: BootEnvironmentListComponent,
        data: { title: T('Boot Environments'), breadcrumb: T('Boot Environments') },
      }, {
        path: 'status',
        component: BootStatusListComponent,
        data: { title: T('Boot Pool Status'), breadcrumb: T('Status') },
      },
      ],
    }, {
      path: 'tunable',
      data: { title: T('Tunables'), breadcrumb: T('Tunables'), icon: 'settings_overscan' },
      children: [{
        path: '',
        component: TunableListComponent,
        data: { title: T('Tunables'), breadcrumb: T('Tunables') },
      }],
    }, {
      path: 'sysctl',
      data: { title: T('Sysctl'), breadcrumb: T('Sysctl'), icon: 'settings_overscan' },
      children: [{
        path: '',
        component: TunableListComponent,
        data: { title: T('Sysctl'), breadcrumb: T('Sysctl') },
      }],
    },
    {
      path: 'update',
      data: { title: T('Update'), breadcrumb: T('Update'), icon: 'update' },
      children: [
        {
          path: '',
          component: UpdateComponent,
          data: { title: T('Update'), breadcrumb: T('Update') },
        }, {
          path: 'manualupdate',
          data: { title: T('Manual Update'), breadcrumb: T('Manual Update') },
          children: [
            {
              path: '',
              component: ManualUpdateFormComponent,
              data: { title: T('Manual Update'), breadcrumb: T('Manual Update') },
            },
          ],
        },
      ],
    },
    {
      path: 'email',
      component: EmailComponent,
      data: { title: T('Email'), breadcrumb: T('Email'), icon: 'email' },
    }, {
      path: 'alertsettings',
      component: AlertConfigFormComponent,
      data: { title: T('Alert Settings'), breadcrumb: T('Alert Settings'), icon: 'notifications_active' },
    }, {
      path: 'alertservice',
      data: { title: T('Alert Services'), breadcrumb: T('Alert Services'), icon: 'notifications' },
      component: AlertServiceListComponent,
    }, {
      path: 'failover',
      component: FailoverSettingsComponent,
      data: { title: T('Failover'), breadcrumb: T('Failover'), icon: 'device_hub' },
    }, {
      path: 'support',
      data: { title: T('Support'), breadcrumb: T('Support'), icon: 'perm_phone_msg' },
      children: [
        {
          path: '',
          component: SupportComponent,
          data: { title: T('Support'), breadcrumb: T('Support') },
        }, {
          path: 'eula',
          component: EulaComponent,
          data: { title: T('EULA'), breadcrumb: T('EULA') },
        },
      ],
    }, {
      path: 'two-factor',
      component: TwoFactorComponent,
      data: { title: T('Two-Factor Auth'), breadcrumb: T('Two-Factor Auth') },
    }, {
      path: 'services',
      component: ServicesComponent,
      data: { title: T('Services'), breadcrumb: T('Services') },
    }, {
      path: 'shell',
      component: ShellComponent,
      data: { title: T('Shell'), breadcrumb: T('Shell') },
    }, {
      path: 'cron',
      data: { title: 'Cron Jobs', breadcrumb: 'Cron Jobs', icon: 'event_note' },
      children: [{
        path: '',
        component: CronListComponent,
        data: { title: 'Cron Jobs', breadcrumb: 'Cron Jobs' },
      }],
    }, {
      path: 'initshutdown',
      data: { title: 'Init/Shutdown Scripts', breadcrumb: 'Init/Shutdown Scripts', icon: 'event_note' },
      children: [{
        path: '',
        component: InitshutdownListComponent,
        data: { title: 'Init/Shutdown Scripts', breadcrumb: 'Init/Shutdown Scripts' },
      }],
    }],
  },
];
export const routing: ModuleWithProviders<RouterModule> = RouterModule.forChild(routes);
