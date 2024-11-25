import { Routes } from '@angular/router';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { SharesDashboardComponent } from 'app/pages/sharing/components/shares-dashboard/shares-dashboard.component';
import { NfsListComponent } from 'app/pages/sharing/nfs/nfs-list/nfs-list.component';
import { NfsSessionListComponent } from 'app/pages/sharing/nfs/nfs-session-list/nfs-session-list.component';
import { SmbStatusComponent } from 'app/pages/sharing/smb/smb-status/smb-status.component';
import { SmbListComponent } from './smb/smb-list/smb-list.component';

export const sharingRoutes: Routes = [
  {
    path: '',
    data: { title: T('Shares') },
    children: [
      {
        path: '',
        component: SharesDashboardComponent,
        data: { title: T('Shares'), breadcrumb: null },
      },
      {
        path: 'nfs',
        data: { title: T('NFS'), breadcrumb: T('NFS') },
        children: [{
          path: '',
          component: NfsListComponent,
          data: { title: T('NFS'), breadcrumb: null },
        }, {
          path: 'sessions',
          component: NfsSessionListComponent,
          data: {
            title: T('NFS Sessions'),
            breadcrumb: null,
          },
        }],
      },
      {
        path: 'smb',
        data: { title: T('SMB'), breadcrumb: T('SMB') },
        children: [{
          path: '',
          component: SmbListComponent,
        }, {
          path: 'status',
          data: { title: T('SMB Status'), breadcrumb: null },
          children: [
            {
              path: '',
              redirectTo: 'sessions',
              pathMatch: 'full',
            },
            {
              path: ':activeTab',
              component: SmbStatusComponent,
              data: {
                title: T('SMB Status'),
                breadcrumb: null,
              },
            },
          ],
        }],
      },
      {
        path: 'iscsi',
        data: { title: T('iSCSI'), breadcrumb: null },
        loadChildren: () => import('./iscsi/iscsi.routes').then((module) => module.iscsiRoutes),
      },
    ],
  },
];
