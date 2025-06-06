import { Routes } from '@angular/router';
import { NvmeOfComponent } from 'app/pages/sharing/nvme-of/nvme-of.component';

export const nvmeOfRoutes: Routes = [
  {
    path: '',
    component: NvmeOfComponent,
    data: { title: 'NVMe-oF', breadcrumb: null },
  },
  {
    path: ':name',
    component: NvmeOfComponent,
    data: { title: 'NVMe-oF', breadcrumb: null },
  },
];
