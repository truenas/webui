import { Routes } from '@angular/router';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { NvmeOfSubsystemsComponent } from 'app/pages/sharing/nvme-of/nvme-of-subsystems/nvme-of-subsystems.component';
import { NvmeOfComponent } from 'app/pages/sharing/nvme-of/nvme-of.component';

export const nvmeOfRoutes: Routes = [
  {
    path: '',
    component: NvmeOfComponent,
    data: { title: 'NVMe-oF', breadcrumb: null },
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
    ],
  },
];
