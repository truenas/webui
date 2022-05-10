import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { BackupCredentialsComponent } from 'app/pages/credentials/backup-credentials/backup-credentials.component';
import { CertificatesDashComponent } from 'app/pages/credentials/certificates-dash/certificates-dash.component';
import { KmipComponent } from 'app/pages/credentials/kmip/kmip.component';
import { DirectoryServicesComponent } from 'app/pages/directory-service/directory-services.component';
import { TwoFactorComponent } from 'app/pages/system/two-factor/two-factor.component';

// TODO: Move to credentials module
export const routes: Routes = [{
  path: '',
  data: { title: 'Accounts', breadcrumb: 'Accounts' },
  children: [
    {
      path: 'users',
      loadChildren: () => import('app/pages/account/users/users.module').then((module) => module.UsersModule),
      data: { title: 'Users', breadcrumb: 'Users', icon: 'group' },
    }, {
      path: 'groups',
      loadChildren: () => import('app/pages/account/groups/groups.module').then((module) => module.GroupsModule),
      data: { title: 'Groups', breadcrumb: 'Groups', icon: 'group_work' },
    },
    {
      path: 'two-factor',
      component: TwoFactorComponent,
      data: { title: ('Two-Factor Auth'), breadcrumb: ('Two-Factor Auth') },
    },

    // TODO: Temporary dashboards attached to accounts for now
    {
      path: 'directory-services',
      component: DirectoryServicesComponent,
      data: { title: ('Directory Services') },
    },
    {
      path: 'backup-credentials',
      component: BackupCredentialsComponent,
      data: { title: ('Backup Credentials'), breadcrumb: T('Backup Credentials') },
    },
    {
      path: 'certificates',
      component: CertificatesDashComponent,
      data: { title: ('Certificates'), breadcrumb: T('Certificates') },
    },
    {
      path: 'kmip',
      component: KmipComponent,
      data: { title: 'KMIP', breadcrumb: 'KMIP' },
    },
  ],
}];
export const routing: ModuleWithProviders<RouterModule> = RouterModule.forChild(routes);
