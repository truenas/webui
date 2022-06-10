import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DatasetsManagementComponent } from 'app/pages/datasets/components/dataset-management/dataset-management.component';

export const routes: Routes = [
  {
    path: '',
    data: { title: 'Dataset Management' },
    children: [
      {
        path: '',
        component: DatasetsManagementComponent,
        data: { title: 'Datasets Management', breadcrumb: 'Datasets Management' },
      },
    ],
  },
];
export const routing: ModuleWithProviders<RouterModule> = RouterModule.forChild(routes);
