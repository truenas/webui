import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AFPListComponent } from './afp/afp-list/';
import { AFPFormComponent } from './afp/afp-form/';
import { NFSListComponent } from './nfs/nfs-list/';
import { NFSFormComponent } from './nfs/nfs-form/';
import { WebdavListComponent } from './webdav/webdav-list/';
import { WebdavFormComponent } from './webdav/webdav-form/';
import { SMBListComponent } from './smb/smb-list/';
import { SMBFormComponent } from './smb/smb-form/';
import { ISCSI } from './iscsi/iscsi.component';
import { GlobalconfigurationComponent } from './iscsi/globalconfiguration/';
import { PortalListComponent } from './iscsi/portal/portal-list/';
import { PortalAddComponent } from './iscsi/portal/portal-add/';
import { PortalEditComponent } from './iscsi/portal/portal-edit/';
import { InitiatorListComponent } from './iscsi/initiator/initiator-list/';
import { InitiatorFormComponent } from './iscsi/initiator/initiator-form/';
import { AuthorizedAccessListComponent } from './iscsi/authorizedaccess/authorizedaccess-list/';
import { AuthorizedAccessFormComponent } from './iscsi/authorizedaccess/authorizedaccess-form/';
import { TargetListComponent} from './iscsi/target/target-list/';
import { TargetAddComponent } from './iscsi/target/target-add/';
import { TargetEditComponent} from './iscsi/target/target-edit/';
import { ExtentListComponent } from './iscsi/extent/extent-list/';
import { ExtentFormComponent } from './iscsi/extent/extent-form/';
import { AssociatedTargetListComponent } from './iscsi/associated-target/associated-target-list/';
import { AssociatedTargetFormComponent } from './iscsi/associated-target/associated-target-form/';

export const routes: Routes = [
  {
    path: '',
    data: { title: 'Sharing' },
    children: [{
      path: 'afp',
      data: { title: 'AFP', breadcrumb: 'AFP'},
      children: [{
        path: '',
        component: AFPListComponent,
        data: { title: 'AFP', breadcrumb: 'AFP'},
      },{
        path: 'add',
        component: AFPFormComponent,
        data: { title: 'Add', breadcrumb: 'Add' },
      },
      {
        path: 'edit/:pk',
        component: AFPFormComponent,
        data: { title: 'Edit', breadcrumb: 'Edit' },
      }]
    }, {
      path: 'nfs',
      data: { title: 'NFS', breadcrumb: 'NFS'},
      children: [{
        path: '',
        component: NFSListComponent,
        data: { title: 'NFS', breadcrumb: 'NFS'},
      },{
        path: 'add',
        component: NFSFormComponent,
        data: { title: 'Add', breadcrumb: 'Add' },
      },{
        path: 'edit/:pk',
        component: NFSFormComponent,
        data: { title: 'Edit', breadcrumb: 'Edit' },
      }]
    }, {
      path: 'webdav',
      data: { title: 'WebDAV', breadcrumb: 'WebDAV'},
      children: [{
        path: '',
        component: WebdavListComponent,
        data: { title: 'WebDAV', breadcrumb: 'WebDAV'},
      },{
        path: 'add',
        component: WebdavFormComponent,
        data: { title: 'Add', breadcrumb: 'Add' },
      },{
        path: 'edit/:pk',
        component: WebdavFormComponent,
        data: { title: 'Edit', breadcrumb: 'Edit' },
      }]
    }, {
      path: 'smb',
      data: { title: 'SMB', breadcrumb: 'SMB'},
      children: [{
        path: '',
        component: SMBListComponent,
        data: { title: 'SMB', breadcrumb: 'SMB'},
      },{
        path: 'add',
        component: SMBFormComponent,
        data: { title: 'Add', breadcrumb: 'Add' },
      },{
        path: 'edit/:pk',
        component: SMBFormComponent,
        data: { title: 'Edit', breadcrumb: 'Edit' },
      }]
    }, {
      path: 'iscsi',
      data: { title: 'ISCSI', breadcrumb: 'ISCSI'},
      children: [
      {
        path: '',
        data: { title: 'ISCSI', breadcrumb: 'ISCSI'},
        children: [
        {
          path: '',
          redirectTo: 'configuration',
        },
        {
          path: ':pk',
          component: ISCSI,
          data: { title: '', breadcrumb: ''},
        },
        {
          path: 'portals',
          data: { title: 'Portals', breadcrumb: 'Portals'},
          children: [{
            path: 'add',
            component: PortalAddComponent,
            data: { title: 'Add', breadcrumb: 'Add' },
          },{
            path: 'edit/:pk',
            component: PortalEditComponent,
            data: { title: 'Edit', breadcrumb: 'Edit' },
          }]
        }, {
          path: 'initiators',
          data: { title: 'Initiators', breadcrumb: 'Initiators'},
          children: [{
            path: 'add',
            component: InitiatorFormComponent,
            data: { title: 'Add', breadcrumb: 'Add' },
          },{
            path: 'edit/:pk',
            component: InitiatorFormComponent,
            data: { title: 'Edit', breadcrumb: 'Edit' },
          }]
        }, {
          path: 'auth',
          data: { title: 'Auth', breadcrumb: 'Auth'},
          children: [{
            path: 'add',
            component: AuthorizedAccessFormComponent,
            data: { title: 'Add', breadcrumb: 'Add' },
          },{
            path: 'edit/:pk',
            component: AuthorizedAccessFormComponent,
            data: { title: 'Edit', breadcrumb: 'Edit' },
          }]
        },
        {
          path: 'target',
          data: { title: 'Target', breadcrumb: 'Target'},
          children: [{
            path: 'add',
            component: TargetAddComponent,
            data: { title: 'Add', breadcrumb: 'Add' },
          },{
            path: 'edit/:pk',
            component: TargetEditComponent,
            data: { title: 'Edit', breadcrumb: 'Edit' },
          }]
        },
        {
          path: 'extent',
          data: { title: 'Extent', breadcrumb: 'Extent'},
          children: [{
            path: 'add',
            component: ExtentFormComponent,
            data: { title: 'Add', breadcrumb: 'Add' },
          },{
            path: 'edit/:pk',
            component: ExtentFormComponent,
            data: { title: 'Edit', breadcrumb: 'Edit' },
          }]
        },
        {
          path: 'associatedtarget',
          data: { title: 'Associate Target', breadcrumb: 'Associate Target'},
          children: [{
            path: 'add',
            component: AssociatedTargetFormComponent,
            data: { title: 'Add', breadcrumb: 'Add' },
          },{
            path: 'edit/:pk',
            component: AssociatedTargetFormComponent,
            data: { title: 'Edit', breadcrumb: 'Edit' },
          }]
        }]
      }]
    }]
  }
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
