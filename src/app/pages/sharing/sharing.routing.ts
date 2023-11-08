import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { SharesDashboardComponent } from 'app/pages/sharing/components/shares-dashboard/shares-dashboard.component';
import { NfsListComponent } from 'app/pages/sharing/nfs/nfs-list/nfs-list.component';
import { SmbSessionListComponent } from 'app/pages/sharing/smb/smb-session-list/smb-session-list.component';
import { InitiatorFormComponent } from './iscsi/initiator/initiator-form/initiator-form.component';
import { IscsiComponent } from './iscsi/iscsi.component';
import { SmbFormComponent } from './smb/smb-form/smb-form.component';
import { SmbListComponent } from './smb/smb-list/smb-list.component';

export const routes: Routes = [
  {
    path: '',
    data: { title: T('Sharing') },
    children: [
      {
        path: '',
        component: SharesDashboardComponent,
        data: { title: T('Sharing'), breadcrumb: null },
      },
      {
        path: 'nfs',
        data: { title: T('NFS'), breadcrumb: null, icon: 'share' },
        children: [{
          path: '',
          component: NfsListComponent,
          data: { title: T('NFS'), breadcrumb: null },
        }],
      },
      {
        path: 'smb',
        data: { title: T('SMB'), breadcrumb: T('SMB'), icon: 'share' },
        children: [{
          path: '',
          component: SmbListComponent,
        }, {
          path: 'sessions',
          component: SmbSessionListComponent,
          data: { title: T('SMB Sessions'), breadcrumb: null },
        }, {
          path: 'add',
          component: SmbFormComponent,
          data: { title: T('Add'), breadcrumb: null },
        }, {
          path: 'edit/:pk',
          component: SmbFormComponent,
          data: { title: T('Edit'), breadcrumb: null },
        }],
      }, {
        path: 'iscsi',
        data: { title: T('iSCSI'), breadcrumb: null, icon: 'share' },
        children: [
          {
            path: '',
            data: { title: T('iSCSI'), breadcrumb: null },
            children: [
              {
                path: '',
                redirectTo: 'configuration',
                pathMatch: 'full',
              },
              {
                path: ':pk',
                component: IscsiComponent,
                data: { breadcrumb: null },
              },
              {
                path: 'initiators',
                data: { title: T('Initiators'), breadcrumb: T('Initiators') },
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
