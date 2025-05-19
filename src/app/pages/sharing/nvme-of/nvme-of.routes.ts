import { Routes } from '@angular/router';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { NvmeOfHostsComponent } from 'app/pages/sharing/nvme-of/nvme-of-hosts/nvme-of-hosts.component';
import { NvmeOfPortsComponent } from 'app/pages/sharing/nvme-of/nvme-of-ports/nvme-of-ports.component';
import { NvmeOfSubsystemsComponent } from 'app/pages/sharing/nvme-of/nvme-of-subsystems/nvme-of-subsystems.component';
import { NvmeOfComponent } from 'app/pages/sharing/nvme-of/nvme-of.component';
import { NvmeOfStore } from 'app/pages/sharing/nvme-of/services/nvme-of.store';

export const nvmeOfRoutes: Routes = [
  {
    path: '',
    component: NvmeOfComponent,
    data: { title: 'NVMe-oF', breadcrumb: null },
    providers: [
      NvmeOfStore,
    ],
    children: [
      {
        path: '',
        redirectTo: 'subsystems',
        pathMatch: 'full',
      },
      {
        path: 'subsystems',
        data: { title: T('Subsystems'), breadcrumb: T('Subsystems') },
        component: NvmeOfSubsystemsComponent,
      },
      {
        path: 'hosts',
        data: { title: T('Hosts'), breadcrumb: T('Hosts') },
        component: NvmeOfHostsComponent,
      },
      {
        path: 'ports',
        data: { title: T('Ports'), breadcrumb: T('Ports') },
        component: NvmeOfPortsComponent,
      },
    ],
  },
];
