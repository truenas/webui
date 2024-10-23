import { Routes } from '@angular/router';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { InstanceViewComponent } from 'app/pages/virtualization/components/instance-view/instance-view.component';
import { InstanceFormComponent } from 'app/pages/virtualization/components/new-instance-form/instance-form.component';
import {
  VirtualizationDashboardComponent,
} from 'app/pages/virtualization/components/virtualization-dashboard/virtualization-dashboard.component';

export const virtualizationRoutes: Routes = [{
  path: '',
  data: { title: T('Containers') },
  children: [
    {
      path: '',
      component: VirtualizationDashboardComponent,
    },
    {
      path: ':id',
      children: [
        {
          path: '',
          pathMatch: 'full',
          component: InstanceViewComponent,
        },
        {
          path: 'edit',
          component: InstanceFormComponent,
        },
      ],
    },
    {
      path: 'new',
      component: InstanceFormComponent,
    },
  ],
}];
