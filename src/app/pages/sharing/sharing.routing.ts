import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharesDashboardComponent } from 'app/pages/sharing/components/shares-dashboard/shares-dashboard.component';
import { InitiatorFormComponent } from './iscsi/initiator/initiator-form/initiator-form.component';
import { IscsiWizardComponent } from './iscsi/iscsi-wizard/iscsi-wizard.component';
import { IscsiComponent } from './iscsi/iscsi.component';
import { NfsListComponent } from './nfs/nfs-list/nfs-list.component';
import { SmbFormComponent } from './smb/smb-form/smb-form.component';
import { SmbListComponent } from './smb/smb-list/smb-list.component';
import { WebdavFormComponent } from './webdav/webdav-form/webdav-form.component';
import { WebdavListComponent } from './webdav/webdav-list/webdav-list.component';

export const routes: Routes = [
  {
    path: '',
    data: { title: 'Sharing' },
    children: [
      {
        path: '',
        component: SharesDashboardComponent,
        data: { title: 'Sharing', breadcrumb: 'Dashboard' },
      },
      {
        path: 'nfs',
        data: { title: 'NFS', breadcrumb: 'NFS', icon: 'share' },
        children: [{
          path: '',
          component: NfsListComponent,
          data: { title: 'NFS', breadcrumb: 'NFS' },
        }],
      },
      {
        path: 'webdav',
        data: { title: 'WebDAV', breadcrumb: 'WebDAV', icon: 'share' },
        children: [{
          path: '',
          component: WebdavListComponent,
          data: { title: 'WebDAV', breadcrumb: 'WebDAV' },
        }, {
          path: 'add',
          component: WebdavFormComponent,
          data: { title: 'Add', breadcrumb: 'Add' },
        }, {
          path: 'edit/:pk',
          component: WebdavFormComponent,
          data: { title: 'Edit', breadcrumb: 'Edit' },
        }],
      }, {
        path: 'smb',
        data: { title: 'SMB', breadcrumb: 'SMB', icon: 'share' },
        children: [{
          path: '',
          component: SmbListComponent,
          data: { title: 'SMB', breadcrumb: 'SMB' },
        }, {
          path: 'add',
          component: SmbFormComponent,
          data: { title: 'Add', breadcrumb: 'Add' },
        }, {
          path: 'edit/:pk',
          component: SmbFormComponent,
          data: { title: 'Edit', breadcrumb: 'Edit' },
        }],
      }, {
        path: 'iscsi',
        data: { title: 'iSCSI', breadcrumb: 'iSCSI', icon: 'share' },
        children: [
          {
            path: '',
            data: { title: 'iSCSI', breadcrumb: 'iSCSI' },
            children: [
              {
                path: '',
                redirectTo: 'configuration',
              },
              {
                path: 'wizard',
                data: { title: 'Wizard', breadcrumb: 'Wizard' },
                component: IscsiWizardComponent,
              },
              {
                path: ':pk',
                component: IscsiComponent,
                data: { title: '', breadcrumb: '' },
              },
              {
                path: 'portals',
                data: { title: 'Portals', breadcrumb: 'Portals' },
              }, {
                path: 'initiators',
                data: { title: 'Initiators', breadcrumb: 'Initiators' },
                children: [{
                  path: 'add',
                  component: InitiatorFormComponent,
                  data: { title: 'Add', breadcrumb: 'Add' },
                }, {
                  path: 'edit/:pk',
                  component: InitiatorFormComponent,
                  data: { title: 'Edit', breadcrumb: 'Edit' },
                }],
              }, {
                path: 'auth',
                data: { title: 'Authorized Access', breadcrumb: 'Authorized Access' },
              },
              {
                path: 'target',
                data: { title: 'Targets', breadcrumb: 'Targets' },
              },
              {
                path: 'extent',
                data: { title: 'Extents', breadcrumb: 'Extents' },
              },
              {
                path: 'associatedtarget',
                data: { title: 'Associated Targets', breadcrumb: 'Associated Targets' },
              }],
          }],
      },
    ],
  },
];

export const routing: ModuleWithProviders<RouterModule> = RouterModule.forChild(routes);
