import { Routes, RouterModule }  from '@angular/router';

import { Services } from './services.component';
import { ModuleWithProviders } from '@angular/core';

import { ServiceSSHComponent } from './components/service-ssh/';
import { ServiceAFPComponent } from './components/service-afp/';
import { ServiceDCComponent } from './components/service-dc/';
import { ServiceFTPComponent } from './components/service-ftp/';
import { ServiceLLDPComponent } from './components/service-lldp/';
import { ServiceRSYNCComponent } from './components/service-rsync/';
import { ServiceSMARTComponent } from './components/service-smart/';
import { ServiceNFSComponent } from './components/service-nfs/';
import { ServiceTFTPComponent } from './components/service-tftp/';
import { ServiceUPSComponent } from './components/service-ups/';
import { ServiceDDNSComponent } from './components/service-dynamicdns/';
import { ServiceCIFSComponent } from './components/service-cifs/';
import { ServiceSMBComponent } from './components/service-smb/';

export const routes: Routes = [
  {
    path: '', pathMatch: 'full',
    component: Services,
  },
  {
    path: 'ssh',
    component: ServiceSSHComponent,
  },
  {
    path: 'afp',
    component: ServiceAFPComponent,
  },
  {
    path: 'domaincontroller',
    component: ServiceDCComponent,
  },
  {
    path: 'ftp',
    component: ServiceFTPComponent,
  },
  {
    path: 'lldp',
    component: ServiceLLDPComponent,
  },
  {
    path: 'rsync',
    component: ServiceRSYNCComponent,
  },
  {
    path: 'smartd',
    component: ServiceSMARTComponent,
  },
  {
    path: 'nfs',
    component: ServiceNFSComponent,
  },
  {
    path: 'tftp',
    component: ServiceTFTPComponent,
  },
  {
    path: 'ups',
    component: ServiceUPSComponent,
  },
  {
    path: 'dynamicdns',
    component: ServiceDDNSComponent,
  },
  {
    path: 'cifs',
    component: ServiceSMBComponent,
  }
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
