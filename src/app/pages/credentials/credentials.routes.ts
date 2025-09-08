import { Routes } from '@angular/router';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { BackupCredentialsComponent } from 'app/pages/credentials/backup-credentials/backup-credentials.component';
import { CertificatesDashComponent } from 'app/pages/credentials/certificates-dash/certificates-dash.component';
import { KmipComponent } from 'app/pages/credentials/kmip/kmip.component';
import { DirectoryServicesComponent } from 'app/pages/directory-service/directory-services.component';

export const credentialsRoutes: Routes = [{
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
      data: { title: T('Users'), breadcrumb: T('Users') },
      loadChildren: () => import('app/pages/credentials/users/user.routes').then((module) => module.userRoutes),
    },
    {
      path: 'groups',
      data: { title: T('Groups'), breadcrumb: T('Groups') },
      loadChildren: () => import('app/pages/credentials/groups/group.routes').then((module) => module.groupRoutes),
    },
    // TODO: Temporary dashboards attached to accounts for now
    {
      path: 'directory-services',
      component: DirectoryServicesComponent,
      data: { title: T('Directory Services'), breadcrumb: T('Directory Services') },
    },
    {
      path: 'backup-credentials',
      component: BackupCredentialsComponent,
      data: { title: T('Backup Credentials'), breadcrumb: T('Backup Credentials') },
    },
    {
      path: 'certificates',
      component: CertificatesDashComponent,
      data: { title: T('Certificates'), breadcrumb: T('Certificates') },
    },
    {
      path: 'two-factor',
      loadComponent: () => import('app/pages/two-factor-auth/two-factor.component').then((module) => module.TwoFactorComponent),
      data: { title: T('Two Factor Auth'), breadcrumb: T('Two Factor Auth') },
    },
    {
      path: 'kmip',
      component: KmipComponent,
      data: { title: T('KMIP'), breadcrumb: T('KMIP') },
    },
  ],
}];
