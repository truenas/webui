import { Routes } from '@angular/router';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { AllInstancesComponent } from 'app/pages/virtualization/components/all-instances/all-instances.component';
import { InstanceFormComponent } from 'app/pages/virtualization/components/instance-form/instance-form.component';

export const virtualizationRoutes: Routes = [{
  path: '',
  data: { title: T('Containers') },
  children: [
    {
      path: '',
      component: AllInstancesComponent,
    },
    {
      path: 'new',
      component: InstanceFormComponent,
    },
    {
      path: 'view/:id',
      children: [
        {
          path: '',
          pathMatch: 'full',
          component: AllInstancesComponent,
        },
        {
          path: 'edit',
          component: InstanceFormComponent,
        },
      ],
    },
  ],
}];
