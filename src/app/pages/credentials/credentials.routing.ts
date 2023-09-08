import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { BackupCredentialsComponent } from 'app/pages/credentials/backup-credentials/backup-credentials.component';
import { CertificatesDashComponent } from 'app/pages/credentials/certificates-dash/certificates-dash.component';
import { KmipComponent } from 'app/pages/credentials/kmip/kmip.component';
import { DirectoryServicesComponent } from 'app/pages/directory-service/directory-services.component';

export const routes: Routes = [{
  path: '',
  data: { title: T('Credentials'), breadcrumb: T('Credentials') },
  children: [
    {
      path: '',
      pathMatch: 'full',
      redirectTo: 'users',
    },
    {
      path: 'users',
      loadChildren: () => import('app/pages/account/users/users.module').then((module) => module.UsersModule),
      data: { title: T('Users'), breadcrumb: T('Users'), icon: 'group' },
    }, {
      path: 'groups',
      loadChildren: () => import('app/pages/account/groups/groups.module').then((module) => module.GroupsModule),
      data: { title: T('Groups'), breadcrumb: T('Groups'), icon: 'group_work' },
    },
    // TODO: Temporary dashboards attached to accounts for now
    {
      path: 'directory-services',
      component: DirectoryServicesComponent,
      data: { title: T('Directory Services') },
    },
    {
      path: 'backup-credentials',
      component: BackupCredentialsComponent,
      data: { title: T('Backup Credentials'), breadcrumb: T('Backup Credentials') },
    },
    {
      path: 'certificates',
      component: CertificatesDashComponent,
      data: { title: T('Certificates') },
    },
    {
      path: 'two-factor',
      loadChildren: () => import('app/pages/two-factor-auth/two-factor-auth.module').then((module) => module.default),
      data: { title: T('Two Factor Auth'), breadcrumb: T('Two Factor Auth') },
    },
    {
      path: 'kmip',
      component: KmipComponent,
      data: { title: T('KMIP'), breadcrumb: T('KMIP') },
    },
  ],
}];
export const routing: ModuleWithProviders<RouterModule> = RouterModule.forChild(routes);
