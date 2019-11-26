import {ModuleWithProviders} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

import {ServiceAFPComponent} from './components/service-afp/';
import {ServiceDDNSComponent} from './components/service-dynamicdns/';
import {ServiceFTPComponent} from './components/service-ftp/';
import {ServiceLLDPComponent} from './components/service-lldp/';
import {ServiceNFSComponent} from './components/service-nfs/';
import {ServiceRSYNCComponent} from './components/service-rsync/';
import {CconfigureRYSNCComponent} from './components/service-rsync/rsyncconfiguration/configure_rsync';
import {RSYNCconfigurationListComponent} from './components/service-rsync/rsyncconfiguration/rsyncconfiguration-list/';
import {RYSNCConfigurationFormComponent} from './components/service-rsync/rsyncconfiguration/rsyncmodule';
import {ServiceS3Component} from './components/service-s3/';
import {ServiceSMARTComponent} from './components/service-smart/';
import {ServiceSMBComponent} from './components/service-smb/';
import {ServiceSNMPComponent} from './components/service-snmp/';
import {ServiceSSHComponent} from './components/service-ssh/';
import {ServiceTFTPComponent} from './components/service-tftp/';
import {ServiceUPSComponent} from './components/service-ups/';
import {ServiceWebdavComponent} from './components/service-webdav/';
import {Services} from './services.component';

export const routes: Routes = [
  {
    path : '',
    pathMatch : 'full',
    component : Services,
  },
  {
    data: { title: 'SSH', breadcrumb: 'SSH'},
    path : 'ssh',
    component : ServiceSSHComponent,
  },
  {
    data: { title: 'AFP', breadcrumb: 'AFP'},
    path : 'afp',
    component : ServiceAFPComponent,
  },
  {
    data: { title: 'FTP', breadcrumb: 'FTP'},
    path : 'ftp',
    component : ServiceFTPComponent,
  },
  {
    data: { title: 'LLDP', breadcrumb: 'LLDP'},
    path : 'lldp',
    component : ServiceLLDPComponent,
  },
  {
    data: { title: 'Rsync', breadcrumb: 'Rsync'},
    path : 'rsync',
    component : ServiceRSYNCComponent,
    children: [
      {
        path: '',
        redirectTo: 'configure',
      },
      {
        path: 'configure',
        component: CconfigureRYSNCComponent,
        data: { title: 'Configure', breadcrumb: 'Configure' },
      },
      {
        path: 'rsync-module',
        component: RSYNCconfigurationListComponent,
        data: { title: 'RSYNCModule', breadcrumb: 'RSYNCModule' },
      },
      {
        path: 'rsync-module/add',
        component: RYSNCConfigurationFormComponent,
        data: { title: 'Add', breadcrumb: 'Add' },
      },
      {
        path : 'rsync-module/edit/:pk', component : RYSNCConfigurationFormComponent,
        data: {title: 'Edit', breadcrumb:'Edit' }
      },
    ]
  },
  {
    data: { title: 'S.M.A.R.T.', breadcrumb: 'S.M.A.R.T.'},
    path : 'smartd',
    component : ServiceSMARTComponent,
  },
  {
    data: { title: 'NFS', breadcrumb: 'NFS'},
    path : 'nfs',
    component : ServiceNFSComponent,
  },
  {
    data: { title: 'TFTP', breadcrumb: 'TFTP'},
    path : 'tftp',
    component : ServiceTFTPComponent,
  },
  {
    data: { title: 'UPS', breadcrumb: 'UPS'},
    path : 'ups',
    component : ServiceUPSComponent,
  },
  {
    data: { title: 'DynamicDNS', breadcrumb: 'DynamicDNS'},
    path : 'dynamicdns',
    component : ServiceDDNSComponent,
  },
  {
    data: { title: 'SMB', breadcrumb: 'SMB'},
    path : 'smb',
    component : ServiceSMBComponent,
  },
  {
    data: { title: 'SNMP', breadcrumb: 'SNMP'},
    path : 'snmp',
    component : ServiceSNMPComponent,
  },
  {
    data: { title: 'WebDAV', breadcrumb: 'WebDAV'},
    path : 'webdav',
    component : ServiceWebdavComponent,
  },
  {
    data: { title: 'S3', breadcrumb: 'S3'},
    path : 's3',
    component : ServiceS3Component,
  }
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
