import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ServiceNfsComponent } from 'app/pages/services/components/service-nfs/service-nfs.component';
import { ServiceSshComponent } from 'app/pages/services/components/service-ssh/service-ssh.component';
import { ServiceFtpComponent } from './components/service-ftp/service-ftp.component';
import { ServiceLldpComponent } from './components/service-lldp/service-lldp.component';
import { ServiceSmartComponent } from './components/service-smart/service-smart.component';
import { ServiceSmbComponent } from './components/service-smb/service-smb.component';
import { ServiceSnmpComponent } from './components/service-snmp/service-snmp.component';
import { ServiceUpsComponent } from './components/service-ups/service-ups.component';
import { ServicesComponent } from './services.component';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    component: ServicesComponent,
  },
  {
    data: { title: 'SSH', breadcrumb: 'SSH' },
    path: 'ssh',
    component: ServiceSshComponent,
  },
  {
    data: { title: 'FTP', breadcrumb: 'FTP' },
    path: 'ftp',
    component: ServiceFtpComponent,
  },
  {
    data: { title: 'LLDP', breadcrumb: 'LLDP' },
    path: 'lldp',
    component: ServiceLldpComponent,
  },
  {
    data: { title: 'S.M.A.R.T.', breadcrumb: 'S.M.A.R.T.' },
    path: 'smartd',
    component: ServiceSmartComponent,
  },
  {
    data: { title: 'NFS', breadcrumb: 'NFS' },
    path: 'nfs',
    component: ServiceNfsComponent,
  },
  {
    data: { title: 'UPS', breadcrumb: 'UPS' },
    path: 'ups',
    component: ServiceUpsComponent,
  },
  {
    data: { title: 'SMB', breadcrumb: 'SMB' },
    path: 'smb',
    component: ServiceSmbComponent,
  },
  {
    data: { title: 'SNMP', breadcrumb: 'SNMP' },
    path: 'snmp',
    component: ServiceSnmpComponent,
  },
];

export const routing: ModuleWithProviders<RouterModule> = RouterModule.forChild(routes);
