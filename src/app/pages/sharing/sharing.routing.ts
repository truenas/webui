import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { SharesDashboardComponent } from 'app/pages/sharing/components/shares-dashboard/shares-dashboard.component';
import { NfsListComponent } from 'app/pages/sharing/nfs/nfs-list/nfs-list.component';
import { SmbStatusComponent } from 'app/pages/sharing/smb/smb-status/smb-status.component';
import { InitiatorFormComponent } from './iscsi/initiator/initiator-form/initiator-form.component';
import { IscsiComponent } from './iscsi/iscsi.component';
import { SmbListComponent } from './smb/smb-list/smb-list.component';

export const routes: Routes = [
  {
    path: '',
    data: { title: T('Sharing') },
    children: [
      {
        path: '',
        component: SharesDashboardComponent,
        data: { title: T('Sharing'), breadcrumb: T('Dashboard') },
      },
      {
        path: 'nfs',
        data: { title: T('NFS'), breadcrumb: T('NFS'), icon: 'share' },
        children: [{
          path: '',
          component: NfsListComponent,
          data: { title: T('NFS'), breadcrumb: T('NFS') },
        }],
      },
      {
        path: 'smb',
        data: { title: T('SMB'), breadcrumb: T('SMB'), icon: 'share' },
        children: [{
          path: '',
          component: SmbListComponent,
          data: { title: T('SMB'), breadcrumb: T('SMB') },
        }, {
          path: 'status',
          data: { title: T('Smb Status'), breadcrumb: T('Smb Status') },
          children: [
            {
              path: '',
              redirectTo: 'sessions',
              pathMatch: 'full',
            },
            {
              path: ':activeTab',
              component: SmbStatusComponent,
              data: { title: T('Smb Status') },
            },
          ],
        }],
      }, {
        path: 'iscsi',
        data: { title: T('iSCSI'), breadcrumb: T('iSCSI'), icon: 'share' },
        children: [
          {
            path: '',
            data: { title: T('iSCSI'), breadcrumb: 'iSCSI' },
            children: [
              {
                path: '',
                redirectTo: 'configuration',
                pathMatch: 'full',
              },
              {
                path: ':pk',
                component: IscsiComponent,
                data: { title: '', breadcrumb: '' },
              },
              {
                path: 'initiators',
                data: { title: 'Initiators', breadcrumb: 'Initiators' },
                children: [{
                  path: 'add',
                  component: InitiatorFormComponent,
                  data: { title: T('Add'), breadcrumb: T('Add') },
                }, {
                  path: 'edit/:pk',
                  component: InitiatorFormComponent,
                  data: { title: T('Edit'), breadcrumb: T('Edit') },
                }],
              }],
          }],
      },
    ],
  },
];

export const routing: ModuleWithProviders<RouterModule> = RouterModule.forChild(routes);
