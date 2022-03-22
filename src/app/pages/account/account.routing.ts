import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { GroupListComponent } from 'app/pages/account/groups/group-list/group-list.component';
import { DirectoryServicesComponent } from 'app/pages/directory-service/directory-services.component';
import { BackupCredentialsComponent } from '../credentials/backup-credentials/backup-credentials.component';
import { CertificatesDashComponent } from '../credentials/certificates-dash/certificates-dash.component';
import { TwoFactorComponent } from '../system/two-factor/two-factor.component';
import { MembersComponent } from './groups/members/members.component';

export const routes: Routes = [{
  path: '',
  data: { title: 'Accounts' },
  children: [
    {
      path: 'users',
      loadChildren: () => import('app/pages/account/users/users.module').then((module) => module.UsersModule),
      data: { title: 'Users', breadcrumb: 'Users', icon: 'group' },
    }, {
      path: 'groups',
      data: { title: 'Groups', breadcrumb: 'Groups', icon: 'group_work' },
      children: [{
        path: '',
        component: GroupListComponent,
        data: { title: 'Groups', breadcrumb: 'Groups' },
      },
      {
        path: 'members/:pk',
        component: MembersComponent,
        data: { title: 'Update Members', breadcrumb: 'Members' },
      },
      ],
    },
    {
      path: 'two-factor',
      component: TwoFactorComponent,
      data: { title: ('Two-Factor Auth'), breadcrumb: ('Two-Factor Auth') },
    },

    // Temporary dashboards attached to accounts for now
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
  ],
}];
export const routing: ModuleWithProviders<RouterModule> = RouterModule.forChild(routes);
