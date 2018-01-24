import {ModuleWithProviders} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

import {ServiceAFPComponent} from './components/service-afp/';
import {ServiceCIFSComponent} from './components/service-cifs/';
import {ServiceDCComponent} from './components/service-dc/';
import {ServiceDDNSComponent} from './components/service-dynamicdns/';
import {ServiceFTPComponent} from './components/service-ftp/';
import {ServiceLLDPComponent} from './components/service-lldp/';
import {ServiceNFSComponent} from './components/service-nfs/';
import {ServiceRSYNCComponent} from './components/service-rsync/';
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
    data: { title: 'ssh', breadcrumb: 'SSH'},
    path : 'ssh',
    component : ServiceSSHComponent,
  },
  {
    data: { title: 'afp', breadcrumb: 'AFP'},
    path : 'afp',
    component : ServiceAFPComponent,
  },
  {
    data: { title: 'domaincontroller', breadcrumb: 'Domain Controller'},
    path : 'domaincontroller',
    component : ServiceDCComponent,
  },
  {
    data: { title: 'ftp', breadcrumb: 'FTP'},
    path : 'ftp',
    component : ServiceFTPComponent,
  },
  {
    data: { title: 'lldp', breadcrumb: 'LLDP'},
    path : 'lldp',
    component : ServiceLLDPComponent,
  },
  {
    data: { title: 'rsync', breadcrumb: 'Rsync'},
    path : 'rsync',
    component : ServiceRSYNCComponent,
  },
  {
    data: { title: 'smartd', breadcrumb: 'SMARTD'},
    path : 'smartd',
    component : ServiceSMARTComponent,
  },
  {
    data: { title: 'nfs', breadcrumb: 'NFS'},
    path : 'nfs',
    component : ServiceNFSComponent,
  },
  {
    data: { title: 'tftp', breadcrumb: 'TFTP'},
    path : 'tftp',
    component : ServiceTFTPComponent,
  },
  {
    data: { title: 'ups', breadcrumb: 'UPS'},
    path : 'ups',
    component : ServiceUPSComponent,
  },
  {
    data: { title: 'dynamicdns', breadcrumb: 'DynamicDNS'},
    path : 'dynamicdns',
    component : ServiceDDNSComponent,
  },
  {
    data: { title: 'smb', breadcrumb: 'SMB'},
    path : 'smb',
    component : ServiceSMBComponent,
  },
  {
    data: { title: 'snmp', breadcrumb: 'SNMP'},
    path : 'snmp',
    component : ServiceSNMPComponent,
  },
  {
    data: { title: 'webdav', breadcrumb: 'WebDAV'},
    path : 'webdav',
    component : ServiceWebdavComponent,
  },
  {
    data: { title: 's3', breadcrumb: 'S3'},
    path : 's3',
    component : ServiceS3Component,
  }
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
