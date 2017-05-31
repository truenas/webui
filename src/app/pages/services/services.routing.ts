import { Routes, RouterModule }  from '@angular/router';

import { Services } from './services.component';
import { ModuleWithProviders } from '@angular/core';

import { ServiceSSHComponent } from './components/service-ssh/';
import { ServiceAFPComponent } from './components/service-afp/';
import { ServiceDCComponent } from './components/service-dc/';
import { ServiceFTPComponent } from './components/service-ftp/';
import { ServiceLLDPComponent } from './components/service-lldp/';

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
  }
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
