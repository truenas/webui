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
  },
  {
    path : 'afp',
    component : ServiceAFPComponent,
  },
  {
    path : 'domaincontroller',
    component : ServiceDCComponent,
  },
  {
    path : 'ftp',
    component : ServiceFTPComponent,
  },
  {
    path : 'lldp',
    component : ServiceLLDPComponent,
  },
  {
    path : 'rsync',
    component : ServiceRSYNCComponent,
  },
  {
    path : 'smartd',
    component : ServiceSMARTComponent,
  },
  {
    path : 'nfs',
    component : ServiceNFSComponent,
  },
  {
    path : 'tftp',
    component : ServiceTFTPComponent,
  },
  {
    path : 'ups',
    component : ServiceUPSComponent,
  },
  {
    path : 'dynamicdns',
    component : ServiceDDNSComponent,
  },
  {
    path : 'cifs',
    component : ServiceSMBComponent,
  },
  {
    path : 'snmp',
    component : ServiceSNMPComponent,
  },
  {
    path : 'webdav',
    component : ServiceWebdavComponent,
  },
  {
    path : 's3',
    component : ServiceS3Component,
  }
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
