import { Routes } from '@angular/router';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { AllInstancesComponent } from 'app/pages/virtualization/components/all-instances/all-instances.component';
import { InstanceShellComponent } from 'app/pages/virtualization/components/instance-shell/instance-shell.component';
import { InstanceWizardComponent } from 'app/pages/virtualization/components/instance-wizard/instance-wizard.component';
import { VirtualizationConfigStore } from 'app/pages/virtualization/stores/virtualization-config.store';
import { VirtualizationDevicesStore } from 'app/pages/virtualization/stores/virtualization-devices.store';
import { VirtualizationInstancesStore } from 'app/pages/virtualization/stores/virtualization-instances.store';

export const virtualizationRoutes: Routes = [{
  path: '',
  data: { title: T('Containers'), breadcrumb: T('Virtualization') },
  providers: [
    VirtualizationConfigStore,
    VirtualizationInstancesStore,
    VirtualizationDevicesStore,
  ],
  children: [
    {
      path: '',
      component: AllInstancesComponent,
    },
    {
      path: 'new',
      component: InstanceWizardComponent,
      data: { title: T('Add Container') },
    },
    {
      path: 'view/:id',
      data: { title: T('Containers'), breadcrumb: null },
      children: [
        {
          path: '',
          pathMatch: 'full',
          component: AllInstancesComponent,
        },
        {
          path: 'shell',
          component: InstanceShellComponent,
          data: { title: T('Instance Shell') },
        },
      ],
    },
  ],
}];
