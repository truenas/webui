import { Routes } from '@angular/router';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { AllInstancesComponent } from 'app/pages/virtualization/components/all-instances/all-instances.component';
import { InstanceWizardComponent } from 'app/pages/virtualization/components/instance-wizard/instance-wizard.component';
import { VirtualizationConfigStore } from 'app/pages/virtualization/stores/virtualization-config.store';
import { VirtualizationInstancesStore } from 'app/pages/virtualization/stores/virtualization-instances.store';

export const virtualizationRoutes: Routes = [{
  path: '',
  data: { title: T('Containers') },
  providers: [
    VirtualizationConfigStore,
    VirtualizationInstancesStore,
  ],
  children: [
    {
      path: '',
      component: AllInstancesComponent,
    },
    {
      path: 'new',
      component: InstanceWizardComponent,
    },
    {
      path: 'view/:id',
      children: [
        {
          path: '',
          pathMatch: 'full',
          component: AllInstancesComponent,
        },
      ],
    },
    {
      path: 'edit/:id',
      children: [
        {
          path: '',
          pathMatch: 'full',
          component: InstanceWizardComponent,
        },
      ],
    },
  ],
}];
