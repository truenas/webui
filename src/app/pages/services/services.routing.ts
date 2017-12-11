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
    path : 'ssh',
    component : ServiceSSHComponent,
    data: {title: 'SSH', breadcrumb: 'SSH'}
  },
  {
    path : 'afp',
    component : ServiceAFPComponent,
    data: {title: 'AFP', breadcrumb: 'AFP'}
  },
  {
    path : 'domaincontroller',
    component : ServiceDCComponent,
    data: {title: 'Domain Controller', breadcrumb: 'DC'}
  },
  {
    path : 'ftp',
    component : ServiceFTPComponent,
    data: {title: 'FTP', breadcrumb: 'FTP'}
  },
  {
    path : 'lldp',
    component : ServiceLLDPComponent,
    data: {title: 'LLDP', breadcrumb: 'LLDP'}
  },
  {
    path : 'rsync',
    component : ServiceRSYNCComponent,
    data: {title: 'Rsync', breadcrumb: 'RSync'}
  },
  {
    path : 'smartd',
    component : ServiceSMARTComponent,
    data: {title: 'SMART', breadcrumb: 'SMART'}
  },
  {
    path : 'nfs',
    component : ServiceNFSComponent,
    data: {title: 'NFS', breadcrumb: 'NFS'}
  },
  {
    path : 'tftp',
    component : ServiceTFTPComponent,
    data: {title: 'TFTP', breadcrumb: 'TFTP'}
  },
  {
    path : 'ups',
    component : ServiceUPSComponent,
    data: {title: 'UPS', breadcrumb: 'UPS'}
  },
  {
    path : 'dynamicdns',
    component : ServiceDDNSComponent,
    data: {title: 'Dynamic CDN', breadcrumb: 'Dynamic CDN'}
  },
  {
    path : 'cifs',
    component : ServiceSMBComponent,
    data: {title: 'CIFS', breadcrumb: 'CIFS'}
  },
  {
    path : 'snmp',
    component : ServiceSNMPComponent,
    data: {title: 'SNMP', breadcrumb: 'SNMP'}
  },
  {
    path : 'webdav',
    component : ServiceWebdavComponent,
    data: {title: 'Webdav', breadcrumb: 'Webdav'}
  },
  {
    path : 's3',
    component : ServiceS3Component,
    data: {title: 'S3', breadcrumb: 'S3'}
  }
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
