import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ServiceDynamicDnsComponent } from 'app/pages/services/components/service-dynamic-dns/service-dynamic-dns.component';
import { ServiceNfsComponent } from 'app/pages/services/components/service-nfs/service-nfs.component';
import { RsyncModuleFormComponent } from 'app/pages/services/components/service-rsync/rsync-module-form/rsync-module-form.component';
import { ServiceSshComponent } from 'app/pages/services/components/service-ssh/service-ssh.component';
import { ServiceFTPComponent } from './components/service-ftp/service-ftp.component';
import { ServiceLldpComponent } from './components/service-lldp/service-lldp.component';
import { ServiceRSYNCComponent } from './components/service-rsync/service-rsync.component';
import { ServiceS3Component } from './components/service-s3/service-s3.component';
import { ServiceSmartComponent } from './components/service-smart/service-smart.component';
import { ServiceSMBComponent } from './components/service-smb/service-smb.component';
import { ServiceSNMPComponent } from './components/service-snmp/service-snmp.component';
import { ServiceTFTPComponent } from './components/service-tftp/service-tftp.component';
import { ServiceUPSComponent } from './components/service-ups/service-ups.component';
import { ServiceWebdavComponent } from './components/service-webdav/service-webdav.component';
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
    component: ServiceFTPComponent,
  },
  {
    data: { title: 'LLDP', breadcrumb: 'LLDP' },
    path: 'lldp',
    component: ServiceLldpComponent,
  },
  {
    data: { title: 'Rsync', breadcrumb: 'Rsync' },
    path: 'rsync',
    children: [
      {
        path: '',
        data: { title: 'Rsync', breadcrumb: 'Rsync' },
        children: [
          {
            path: '',
            redirectTo: 'configure',
          },
          {
            path: ':pk',
            component: ServiceRSYNCComponent,
            data: { title: 'Rsync', breadcrumb: 'Rsync' },
          },
          {
            path: 'rsync-module',
            data: { title: 'Rsync Module', breadcrumb: 'Rsync Module' },
            children: [{
              path: 'add',
              component: RsyncModuleFormComponent,
              data: { title: 'Add', breadcrumb: 'Add' },
            }, {
              path: 'edit/:pk',
              component: RsyncModuleFormComponent,
              data: { title: 'Edit', breadcrumb: 'Edit' },
            }],
          },
        ],
      },
    ],
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
    data: { title: 'TFTP', breadcrumb: 'TFTP' },
    path: 'tftp',
    component: ServiceTFTPComponent,
  },
  {
    data: { title: 'UPS', breadcrumb: 'UPS' },
    path: 'ups',
    component: ServiceUPSComponent,
  },
  {
    data: { title: 'DynamicDNS', breadcrumb: 'DynamicDNS' },
    path: 'dynamicdns',
    component: ServiceDynamicDnsComponent,
  },
  {
    data: { title: 'SMB', breadcrumb: 'SMB' },
    path: 'smb',
    component: ServiceSMBComponent,
  },
  {
    data: { title: 'SNMP', breadcrumb: 'SNMP' },
    path: 'snmp',
    component: ServiceSNMPComponent,
  },
  {
    data: { title: 'WebDAV', breadcrumb: 'WebDAV' },
    path: 'webdav',
    component: ServiceWebdavComponent,
  },
  {
    data: { title: 'S3', breadcrumb: 'S3' },
    path: 's3',
    component: ServiceS3Component,
  },
];

export const routing: ModuleWithProviders<RouterModule> = RouterModule.forChild(routes);
