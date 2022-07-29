import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ServiceDynamicDnsComponent } from 'app/pages/services/components/service-dynamic-dns/service-dynamic-dns.component';
import { ServiceNfsComponent } from 'app/pages/services/components/service-nfs/service-nfs.component';
import { ServiceSshComponent } from 'app/pages/services/components/service-ssh/service-ssh.component';
import { ServiceFtpComponent } from './components/service-ftp/service-ftp.component';
import { ServiceLldpComponent } from './components/service-lldp/service-lldp.component';
import { ServiceRsyncComponent } from './components/service-rsync/service-rsync.component';
import { ServiceS3Component } from './components/service-s3/service-s3.component';
import { ServiceSmartComponent } from './components/service-smart/service-smart.component';
import { ServiceSmbComponent } from './components/service-smb/service-smb.component';
import { ServiceSnmpComponent } from './components/service-snmp/service-snmp.component';
import { ServiceTftpComponent } from './components/service-tftp/service-tftp.component';
import { ServiceUpsComponent } from './components/service-ups/service-ups.component';
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
    component: ServiceFtpComponent,
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
        redirectTo: 'configure',
        pathMatch: 'full',
      },
      {
        path: ':pk',
        component: ServiceRsyncComponent,
        data: { title: 'Rsync', breadcrumb: 'Rsync' },
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
    component: ServiceTftpComponent,
  },
  {
    data: { title: 'UPS', breadcrumb: 'UPS' },
    path: 'ups',
    component: ServiceUpsComponent,
  },
  {
    data: { title: 'DynamicDNS', breadcrumb: 'DynamicDNS' },
    path: 'dynamicdns',
    component: ServiceDynamicDnsComponent,
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
